import { RunStateManager } from '../../src/core/state/RunState';
import { RunReducer } from '../../src/core/state/reducer';
import { PrngManager } from '../../src/core/prng/prngManager';
import { EventBus } from '../../src/core/events/events';
import { BotPolicy } from './bots/BotPolicy';
import { RandomBot } from './bots/RandomBot';
import { GreedyBot } from './bots/GreedyBot';
import { SmartBot } from './bots/SmartBot';
import { VeteranBot } from './bots/VeteranBot';
import { TelemetryAggregator, SimulationRunMetrics, WaveSnapshot } from './telemetry';
import * as fs from 'fs';
import * as path from 'path';

import { MetaManager } from '../../src/core/meta/metaManager';
import { MetaState } from '../../src/core/meta/metaSchema';

export type BotName = 'random' | 'greedy' | 'smart' | 'veteran' | 'veteran-noskills' | 'veteran-noholds' | 'veteran-symbols' | 'veteran-nogadgets';

/** A battle that is still running after this many ticks (5 minutes) is counted as stalled. */
const MAX_BATTLE_TICKS = 6000;
/** Safety net for interactive bots that never stop issuing commands. */
const MAX_BOT_ROUNDS = 400;

function parseArgs(): { runs: number; botName: BotName; seed: string; output?: string; waves: number; metaLevel: 'none' | 'mid' | 'max' } {
  const args = process.argv.slice(2);
  let runs = 1000;
  let botName: BotName = 'veteran';
  let seed = 'BRASS_SIM_SEED';
  let output: string | undefined;
  let waves = 10;
  let metaLevel: 'none' | 'mid' | 'max' = 'none';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs' && args[i + 1]) {
      runs = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--bot' && args[i + 1]) {
      botName = args[i + 1].toLowerCase() as any;
      i++;
    } else if (args[i] === '--seed' && args[i + 1]) {
      seed = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    } else if (args[i] === '--waves' && args[i + 1]) {
      waves = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--meta' && args[i + 1]) {
      metaLevel = args[i + 1].toLowerCase() as any;
      i++;
    }
  }

  return { runs, botName, seed, output, waves, metaLevel };
}

function getBot(botName: string): BotPolicy {
  switch (botName) {
    case 'random':
      return new RandomBot();
    case 'greedy':
      return new GreedyBot();
    case 'smart':
      return new SmartBot();
    case 'veteran-noskills':
      return new VeteranBot('VeteranBot (no skill tree)', { skills: false });
    case 'veteran-noholds':
      return new VeteranBot('VeteranBot (no holds)', { holds: false });
    case 'veteran-nogadgets':
      return new VeteranBot('VeteranBot (no gadgets)', { gadgets: false });
    case 'veteran-symbols':
      return new VeteranBot('VeteranBot (+symbols)', { symbols: true });
    case 'veteran':
    default:
      return new VeteranBot();
  }
}

export function runSimulationRun(
  runId: number,
  masterSeed: string,
  bot: BotPolicy,
  maxWaves = 10,
  metaLevel: 'none' | 'mid' | 'max' = 'none'
): SimulationRunMetrics {
  const runSeed = `${masterSeed}_run_${runId}`;
  const rng = PrngManager.createStreams(runSeed);
  const state = RunStateManager.createInitialState(runSeed);

  if (metaLevel !== 'none') {
    const meta: MetaState = MetaManager.createDefaultState();
    if (metaLevel === 'mid') {
      meta.unlockedUpgrades = {
        boiler_reinforcement: 2,
        steam_manifold: 1,
        gear_calibration: 1,
        precision_escapement: 1,
        gilded_starter: 1
      };
    } else if (metaLevel === 'max') {
      meta.unlockedUpgrades = {
        boiler_reinforcement: 3,
        steam_manifold: 3,
        gear_calibration: 2,
        precision_escapement: 2,
        gilded_starter: 1
      };
    }
    MetaManager.applyMetaToRun(state, meta);
  }

  const bus = new EventBus();

  let totalSpins = 0;
  let totalLineHits = 0;
  let totalJackpots = 0;
  let totalJams = 0;
  let totalBattleSeconds = 0;
  let battlesFought = 0;

  bus.on('spin_start', () => totalSpins++);
  bus.on('line_hit', () => totalLineHits++);
  bus.on('jackpot', () => totalJackpots++);
  bus.on('jam_triggered', () => totalJams++);

  bus.on('core_draft_ready', (data) => {
    const coreId = bot.chooseCore?.(data.choices, state);
    if (coreId) RunReducer.dispatch(state, { type: 'EQUIP_CORE', coreId }, rng, bus);
  });

  const snapshots: WaveSnapshot[] = [];
  let stalled = false;
  // the reducer mutates the state, so the phase has to be re-read without narrowing
  const phaseOf = (): string => state.phase;

  // Waves 1 to maxWaves
  for (let wave = 1; wave <= maxWaves; wave++) {
    if (state.phase !== 'PREP') break;

    // 1. PREP Phase
    if (bot.interactive) {
      for (let round = 0; round < MAX_BOT_ROUNDS; round++) {
        const commands = bot.decidePrepActions(state, rng);
        if (commands.length === 0) break;
        for (const cmd of commands) RunReducer.dispatch(state, cmd, rng, bus);
      }
    } else {
      for (const cmd of bot.decidePrepActions(state, rng)) {
        RunReducer.dispatch(state, cmd, rng, bus);
      }
    }

    snapshots.push({
      wave: state.waveNumber,
      boilerHp: state.boilerHp,
      fieldUnits: state.deployedUnits.length,
      fieldLevels: state.deployedUnits.reduce((sum, u) => sum + u.starRank, 0),
      benchUnits: state.reserveBench.length,
      cogs: state.economy.cogs,
      skillRanks: Object.values(state.skills).reduce((sum, r) => sum + r, 0)
    });

    // 2. BATTLE Phase
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng, bus);

    let waveTicks = 0;
    while (phaseOf() === 'BATTLE' && waveTicks < MAX_BATTLE_TICKS) {
      const battleCommands = bot.decideBattleActions(state, rng);
      for (const cmd of battleCommands) {
        RunReducer.dispatch(state, cmd, rng, bus);
      }
      RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng, bus);
      waveTicks++;
    }

    totalBattleSeconds += waveTicks * 0.05;
    battlesFought++;

    if (phaseOf() === 'BATTLE') {
      stalled = true;
      break;
    }

    // 3. RESULT & SHOP
    if (phaseOf() === 'RESULT') {
      RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng, bus);
      if (bot.interactive) {
        for (let round = 0; round < MAX_BOT_ROUNDS && phaseOf() === 'SHOP'; round++) {
          for (const cmd of bot.decideShopActions(state, rng)) RunReducer.dispatch(state, cmd, rng, bus);
        }
      } else {
        for (const cmd of bot.decideShopActions(state, rng)) {
          RunReducer.dispatch(state, cmd, rng, bus);
        }
      }
    }
  }

  const phase = phaseOf();
  const clearedFinalWave =
    !stalled &&
    (phase === 'VICTORY' ||
      state.waveNumber > maxWaves ||
      (state.waveNumber === maxWaves && state.boilerHp > 0 && phase !== 'GAME_OVER'));
  const wavesCleared = clearedFinalWave ? maxWaves : Math.max(0, state.waveNumber - 1);

  return {
    runId,
    seed: runSeed,
    botName: bot.name,
    clearedWave10: clearedFinalWave,
    wavesCleared,
    finalCogs: state.economy.cogs,
    totalSpins,
    totalLineHits,
    totalJackpots,
    totalJams,
    averageBattleSeconds: battlesFought > 0 ? Number((totalBattleSeconds / battlesFought).toFixed(1)) : 0,
    stalled,
    snapshots
  };
}

export function runHeadlessBatch(
  runs: number,
  botName: BotName,
  masterSeed: string,
  maxWaves = 10,
  metaLevel: 'none' | 'mid' | 'max' = 'none'
) {
  const bot = getBot(botName);
  const aggregator = new TelemetryAggregator();

  const startTime = Date.now();
  console.log(`Starting headless simulation: ${runs} runs | Bot: ${bot.name} | Waves: ${maxWaves} | Meta: ${metaLevel} | Seed: ${masterSeed}`);

  for (let i = 1; i <= runs; i++) {
    const runMetric = runSimulationRun(i, masterSeed, bot, maxWaves, metaLevel);
    aggregator.recordRun(runMetric);
  }

  const durationMs = Date.now() - startTime;
  const summary = aggregator.getSummary(bot.name, maxWaves);

  console.log('----------------------------------------------------');
  console.log(`[SIMULATION COMPLETED in ${(durationMs / 1000).toFixed(2)}s]`);
  console.log(`Bot Policy:          ${summary.botName}`);
  console.log(`Total Runs:          ${summary.totalRuns}`);
  console.log(`Victories:           ${summary.victories} (${summary.winRatePct}%)`);
  console.log(`Average Wave:        ${summary.averageWaveReached} / ${maxWaves}`);
  console.log(`Total Spins:         ${summary.totalSpins}`);
  console.log(`Line Hits:           ${summary.totalLineHits} (Hit Rate: ${summary.hitRatePct}%)`);
  console.log(`Jackpots:            ${summary.jackpotCount}`);
  console.log(`Jams Triggered:      ${summary.totalJams}`);
  console.log(`Avg Wave Duration:   ${summary.avgDurationPerWaveS}s`);
  console.log(`Stalled Battles:     ${summary.stalledRuns}`);
  console.log(`Reached Act 2 / 3:   ${summary.reachedWavePct[11] ?? 0}% / ${summary.reachedWavePct[21] ?? 0}%`);
  console.log('Wave | reached | died here | boiler | field | lvl sum | bench | cogs | skills');
  for (let w = 1; w <= maxWaves; w++) {
    const deaths = summary.deathsByWave[w] ?? 0;
    const avg = summary.waveAverages[w];
    const cell = (v: number | undefined, width: number): string => (v === undefined ? '-' : v.toFixed(1)).padStart(width);
    console.log(
      `${w.toString().padStart(4)} | ${`${summary.reachedWavePct[w] ?? 0}%`.padStart(7)} | ${`${((deaths / summary.totalRuns) * 100).toFixed(1)}%`.padStart(9)} | ` +
        `${cell(avg?.boilerHp, 6)} | ${cell(avg?.fieldUnits, 5)} | ${cell(avg?.fieldLevels, 7)} | ${cell(avg?.benchUnits, 5)} | ${cell(avg?.cogs, 4)} | ${cell(avg?.skillRanks, 6)}`
    );
  }
  console.log('----------------------------------------------------');

  return summary;
}

// If executed directly from Node CLI
if (process.argv[1] && process.argv[1].includes('runner')) {
  const config = parseArgs();
  const summary = runHeadlessBatch(config.runs, config.botName, config.seed, config.waves, config.metaLevel);

  if (config.output) {
    const outDir = path.dirname(config.output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(config.output, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`Saved report to ${config.output}`);
  }
}

