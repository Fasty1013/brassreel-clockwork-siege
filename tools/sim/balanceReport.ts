/**
 * Balance report: plays full runs with the human-like bots and prints, wave by
 * wave, how many runs die there, how much boiler HP a wave costs, how many
 * robots fall and how long the fight lasts.
 *
 *   npx tsx tools/sim/balanceReport.ts [--runs 300] [--waves 30] [--seed X] [--bot human|casual]
 *                                      [--set ENEMY_HP_GROWTH_PER_WAVE=0.2,...]
 */
import { RunStateManager } from '../../src/core/state/RunState';
import { RunReducer } from '../../src/core/state/reducer';
import { PrngManager } from '../../src/core/prng/prngManager';
import { UnitFactory } from '../../src/core/units/unitFactory';
import { BALANCE } from '../../src/data/balance';
import { BotPolicy } from './bots/BotPolicy';
import { HumanBot } from './bots/HumanBot';

/** a battle that lasts longer than this is counted as a stalemate (a loss) */
const MAX_BATTLE_TICKS = 20 * 240;

interface WaveStat {
  reached: number;
  died: number;
  hpLost: number;
  unitsLost: number;
  unitsFielded: number;
  seconds: number;
  stalls: number;
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function playRuns(bot: BotPolicy, runs: number, waves: number, seed: string): { wins: number; stats: WaveStat[] } {
  const stats: WaveStat[] = Array.from({ length: waves + 1 }, () => ({
    reached: 0, died: 0, hpLost: 0, unitsLost: 0, unitsFielded: 0, seconds: 0, stalls: 0
  }));
  let wins = 0;

  for (let run = 1; run <= runs; run++) {
    const runSeed = `${seed}_run_${run}`;
    const rng = PrngManager.createStreams(runSeed);
    UnitFactory.resetSequence();
    const state = RunStateManager.createInitialState(runSeed);
    let alive = true;

    for (let wave = 1; wave <= waves && alive; wave++) {
      const s = stats[wave];
      s.reached++;
      for (const cmd of bot.decidePrepActions(state, rng)) RunReducer.dispatch(state, cmd, rng);

      const hpBefore = state.boilerHp;
      const fielded = state.deployedUnits.length;
      RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
      let ticks = 0;
      while (state.phase === 'BATTLE' && ticks < MAX_BATTLE_TICKS) {
        for (const cmd of bot.decideBattleActions(state, rng)) RunReducer.dispatch(state, cmd, rng);
        RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
        ticks++;
      }
      s.seconds += ticks * 0.05;
      s.unitsFielded += fielded;
      s.unitsLost += fielded - (state.combatState?.units.length ?? 0);
      s.hpLost += hpBefore - state.boilerHp;

      const phase = state.phase as string;
      if (phase === 'BATTLE') {
        s.stalls++;
        s.died++;
        alive = false;
      } else if (phase === 'GAME_OVER') {
        s.died++;
        alive = false;
      } else if (phase === 'VICTORY') {
        break;
      } else {
        RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
        for (const cmd of bot.decideShopActions(state, rng)) RunReducer.dispatch(state, cmd, rng);
      }
    }
    if (alive) wins++;
  }
  return { wins, stats };
}

function report(bot: BotPolicy, runs: number, waves: number, seed: string): void {
  const { wins, stats } = playRuns(bot, runs, waves, seed);
  const pct = (n: number, d: number): string => (d === 0 ? '   -' : `${((n / d) * 100).toFixed(0).padStart(3)}%`);
  console.log(`\n=== ${bot.name}: ${runs} runs, ${waves} waves — cleared ${pct(wins, runs).trim()} ===`);
  console.log('wave  alive  die%  hpLost  robots  lost%   sec  stalls');
  for (let w = 1; w <= waves; w++) {
    const s = stats[w];
    if (s.reached === 0) continue;
    console.log(
      `${String(w).padStart(4)}  ${pct(s.reached, runs)}  ${pct(s.died, s.reached)}  ${(s.hpLost / s.reached).toFixed(1).padStart(6)}  ` +
        `${(s.unitsFielded / s.reached).toFixed(1).padStart(6)}  ${pct(s.unitsLost, s.unitsFielded)}  ${(s.seconds / s.reached).toFixed(0).padStart(4)}  ${String(s.stalls).padStart(6)}`
    );
  }
}

// --set KEY=VALUE,KEY=VALUE overrides balance constants for this run (for tuning)
for (const pair of arg('set', '').split(',').filter(Boolean)) {
  const [key, value] = pair.split('=');
  (BALANCE as unknown as Record<string, number>)[key] = Number(value);
}

const runs = parseInt(arg('runs', '300'), 10);
const waves = parseInt(arg('waves', '30'), 10);
const seed = arg('seed', 'BALANCE');
const only = arg('bot', 'both');

if (only !== 'casual') report(new HumanBot(), runs, waves, seed);
if (only !== 'human') report(new HumanBot({ sloppiness: 0.5 }), runs, waves, seed);
