import { RunStateManager } from '../../src/core/state/RunState';
import { RunReducer } from '../../src/core/state/reducer';
import { PrngManager } from '../../src/core/prng/prngManager';
import { EventBus } from '../../src/core/events/events';
import { BotPolicy } from './bots/BotPolicy';
import { RandomBot } from './bots/RandomBot';
import { GreedyBot } from './bots/GreedyBot';
import { SmartBot } from './bots/SmartBot';
import { TelemetryAggregator, SimulationRunMetrics } from './telemetry';
import * as fs from 'fs';
import * as path from 'path';

function parseArgs(): { runs: number; botName: 'random' | 'greedy' | 'smart'; seed: string; output?: string; waves: number } {
  const args = process.argv.slice(2);
  let runs = 1000;
  let botName: 'random' | 'greedy' | 'smart' = 'smart';
  let seed = 'BRASS_SIM_SEED';
  let output: string | undefined;
  let waves = 10;

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
    }
  }

  return { runs, botName, seed, output, waves };
}

function getBot(botName: string): BotPolicy {
  switch (botName) {
    case 'random':
      return new RandomBot();
    case 'greedy':
      return new GreedyBot();
    case 'smart':
    default:
      return new SmartBot();
  }
}

export function runSimulationRun(runId: number, masterSeed: string, bot: BotPolicy, maxWaves = 10): SimulationRunMetrics {
  const runSeed = `${masterSeed}_run_${runId}`;
  const rng = PrngManager.createStreams(runSeed);
  const state = RunStateManager.createInitialState(runSeed);
  const bus = new EventBus();

  let totalSpins = 0;
  let totalLineHits = 0;
  let totalJackpots = 0;
  let totalJams = 0;
  let totalBattleSeconds = 0;

  bus.on('spin_start', () => totalSpins++);
  bus.on('line_hit', () => totalLineHits++);
  bus.on('jackpot', () => totalJackpots++);
  bus.on('jam_triggered', () => totalJams++);

  // Waves 1 to maxWaves
  for (let wave = 1; wave <= maxWaves; wave++) {
    if (state.phase === 'GAME_OVER') break;

    // 1. PREP Phase
    const prepCommands = bot.decidePrepActions(state, rng);
    for (const cmd of prepCommands) {
      RunReducer.dispatch(state, cmd, rng, bus);
    }

    // 2. BATTLE Phase
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng, bus);

    let waveTicks = 0;
    while (state.phase === 'BATTLE' && waveTicks < 1200) {
      // 1200 ticks = 60s max per wave
      const battleCommands = bot.decideBattleActions(state, rng);
      for (const cmd of battleCommands) {
        RunReducer.dispatch(state, cmd, rng, bus);
      }
      RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng, bus);
      waveTicks++;
    }

    totalBattleSeconds += waveTicks * 0.05;

    // 3. RESULT & SHOP
    if (state.phase === 'RESULT') {
      RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng, bus);
      const shopCommands = bot.decideShopActions(state, rng);
      for (const cmd of shopCommands) {
        RunReducer.dispatch(state, cmd, rng, bus);
      }
    } else if ((state.phase as any) === 'VICTORY') {
      break;
    } else if ((state.phase as any) === 'GAME_OVER') {
      break;
    }
  }

  const clearedFinalWave =
    (state.phase as any) === 'VICTORY' ||
    state.waveNumber > maxWaves ||
    (state.waveNumber === maxWaves && state.boilerHp > 0 && (state.phase as any) !== 'GAME_OVER');
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
    averageBattleSeconds: Number(totalBattleSeconds.toFixed(1))
  };
}

export function runHeadlessBatch(runs: number, botName: 'random' | 'greedy' | 'smart', masterSeed: string, maxWaves = 10) {
  const bot = getBot(botName);
  const aggregator = new TelemetryAggregator();

  const startTime = Date.now();
  console.log(`Starting headless simulation: ${runs} runs | Bot: ${bot.name} | Waves: ${maxWaves} | Seed: ${masterSeed}`);

  for (let i = 1; i <= runs; i++) {
    const runMetric = runSimulationRun(i, masterSeed, bot, maxWaves);
    aggregator.recordRun(runMetric);
  }

  const durationMs = Date.now() - startTime;
  const summary = aggregator.getSummary(bot.name);

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
  console.log('Death Distribution By Wave:');
  for (let w = 1; w <= maxWaves; w++) {
    const deaths = summary.deathsByWave[w] ?? 0;
    if (deaths > 0 || w <= 10) {
      const pct = ((deaths / summary.totalRuns) * 100).toFixed(1);
      console.log(`  Wave ${w.toString().padStart(2)}: ${deaths.toString().padStart(4)} deaths (${pct}%)`);
    }
  }
  console.log('----------------------------------------------------');

  return summary;
}

// If executed directly from Node CLI
if (process.argv[1] && process.argv[1].includes('runner')) {
  const config = parseArgs();
  const summary = runHeadlessBatch(config.runs, config.botName, config.seed, config.waves);

  if (config.output) {
    const outDir = path.dirname(config.output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(config.output, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`Saved report to ${config.output}`);
  }
}

