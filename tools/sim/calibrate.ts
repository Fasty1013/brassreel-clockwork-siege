/**
 * Fits `enemyPower` for every wave (src/data/waves.ts).
 *
 * Plays runs with the human-like bot and, wave by wave, searches for the enemy
 * toughness at which the wave lets a target number of enemies through to the
 * boiler. Prints the fitted numbers; copy them into waves.ts.
 *
 *   npm run sim:calibrate                 fit all 30 waves
 *   npm run sim:calibrate -- --check      only measure the numbers already in waves.ts
 *   options: --runs 300  --leaks 1.15  --boss-leaks 1.8  --seed CAL
 *
 * Re-run it after changing robots, skills, merge bonuses or wave line-ups.
 */
import { RunStateManager, RunState } from '../../src/core/state/RunState';
import { RunReducer } from '../../src/core/state/reducer';
import { PrngManager, RngStreams } from '../../src/core/prng/prngManager';
import { WAVES_DATA } from '../../src/data/waves';
import { HumanBot } from './bots/HumanBot';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const RUNS = parseInt(arg('runs', '300'), 10);
const LEAKS = parseFloat(arg('leaks', '1.15'));
const BOSS_LEAKS = parseFloat(arg('boss-leaks', '1.8'));
const SEED = arg('seed', 'CAL');
const CHECK_ONLY = process.argv.includes('--check');
const MAX_BATTLE_TICKS = 20 * 240;

const bot = new HumanBot();
/** the first waves stay gentle, bosses bite harder */
const targetLeaks = (wave: number): number => (wave <= 3 ? 0.5 : WAVES_DATA[wave - 1].isBoss ? BOSS_LEAKS : LEAKS);

/** A run frozen right before a battle, so the same battle can be replayed at different toughness. */
interface Snapshot {
  state: RunState;
  rng: Record<string, [number, number, number, number]>;
}

interface Fight {
  state: RunState;
  rng: RngStreams;
  leaks: number;
  dead: boolean;
  lost: number;
  fielded: number;
  seconds: number;
}

function fight(snap: Snapshot): Fight {
  const state = structuredClone(snap.state);
  const rng = PrngManager.deserializeStreams(snap.rng);
  const fielded = state.deployedUnits.length;
  RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
  let leaks = 0;
  let ticks = 0;
  while (state.phase === 'BATTLE' && ticks < MAX_BATTLE_TICKS) {
    for (const cmd of bot.decideBattleActions(state, rng)) RunReducer.dispatch(state, cmd, rng);
    RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
    for (const e of state.combatState?.events ?? []) if (e.type === 'breach') leaks += e.amount ?? 1;
    ticks++;
  }
  const phase = state.phase as string;
  return {
    state,
    rng,
    leaks,
    dead: phase !== 'RESULT' && phase !== 'VICTORY',
    lost: fielded - (state.combatState?.units.length ?? 0),
    fielded,
    seconds: ticks * 0.05
  };
}

function measure(snaps: Snapshot[], wave: number, power: number): { leaks: number; die: number; lost: number; seconds: number } {
  WAVES_DATA[wave - 1].enemyPower = power;
  let leaks = 0;
  let dead = 0;
  let lost = 0;
  let fielded = 0;
  let seconds = 0;
  for (const snap of snaps) {
    const r = fight(snap);
    leaks += r.leaks;
    dead += r.dead ? 1 : 0;
    lost += r.lost;
    fielded += r.fielded;
    seconds += r.seconds;
  }
  return { leaks: leaks / snaps.length, die: dead / snaps.length, lost: lost / Math.max(1, fielded), seconds: seconds / snaps.length };
}

let snaps: Snapshot[] = [];
for (let i = 1; i <= RUNS; i++) {
  const seed = `${SEED}_${i}`;
  const rng = PrngManager.createStreams(seed);
  const state = RunStateManager.createInitialState(seed);
  bot.decidePrepActions(state, rng);
  snaps.push({ state, rng: PrngManager.serializeStreams(rng) });
}

console.log(`${CHECK_ONLY ? 'Checking' : 'Fitting'} enemyPower: ${RUNS} runs, target leaks ${LEAKS} (boss ${BOSS_LEAKS})`);
console.log('wave  power  alive  leaks  die%  robots lost  sec');
const fitted: number[] = [];
for (let wave = 1; wave <= WAVES_DATA.length && snaps.length >= 20; wave++) {
  let power = WAVES_DATA[wave - 1].enemyPower ?? 1;
  if (!CHECK_ONLY && wave > 1) {
    let lo = 1;
    let hi = 80;
    for (let step = 0; step < 10; step++) {
      const mid = Math.sqrt(lo * hi);
      if (measure(snaps, wave, mid).leaks > targetLeaks(wave)) hi = mid;
      else lo = mid;
    }
    power = Math.sqrt(lo * hi);
    power = power < 10 ? Math.round(power * 10) / 10 : Math.round(power * 2) / 2;
  }
  const r = measure(snaps, wave, power);
  fitted.push(power);
  console.log(
    `${String(wave).padStart(4)}  ${power.toFixed(1).padStart(5)}  ${String(snaps.length).padStart(5)}  ${r.leaks.toFixed(2).padStart(5)}  ` +
      `${(r.die * 100).toFixed(0).padStart(3)}%  ${(r.lost * 100).toFixed(0).padStart(10)}%  ${r.seconds.toFixed(0).padStart(3)}`
  );

  // carry the survivors over to the next wave
  const next: Snapshot[] = [];
  for (const snap of snaps) {
    const res = fight(snap);
    if (res.dead || (res.state.phase as string) === 'VICTORY') continue;
    RunReducer.dispatch(res.state, { type: 'ADVANCE_TO_SHOP' }, res.rng);
    RunReducer.dispatch(res.state, { type: 'START_NEXT_WAVE' }, res.rng);
    bot.decidePrepActions(res.state, res.rng);
    next.push({ state: res.state, rng: PrngManager.serializeStreams(res.rng) });
  }
  snaps = next;
}
console.log(`\nenemyPower by wave: ${fitted.join(', ')}`);
