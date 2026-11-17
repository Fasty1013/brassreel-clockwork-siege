/**
 * Idle-robot probe: plays runs with HumanBot and counts robot-ticks where a robot has
 * no enemy in its attack range, enemies are on the field, and yet the robot did not move.
 * Such a robot is "standing around" — it should be walking toward an enemy.
 *
 *   npx tsx tools/sim/idleUnits.ts [--runs 30] [--waves 15]
 */
import { RunStateManager } from '../../src/core/state/RunState';
import { RunReducer } from '../../src/core/state/reducer';
import { PrngManager } from '../../src/core/prng/prngManager';
import { UnitFactory } from '../../src/core/units/unitFactory';
import { HumanBot } from './bots/HumanBot';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const RUNS = parseInt(arg('runs', '30'), 10);
const WAVES = parseInt(arg('waves', '15'), 10);
const bot = new HumanBot();

let outOfReach = 0;
let idle = 0;
let longestIdle = 0;
const samples: string[] = [];

for (let run = 1; run <= RUNS; run++) {
  const seed = `IDLE_${run}`;
  const rng = PrngManager.createStreams(seed);
  UnitFactory.resetSequence();
  const state = RunStateManager.createInitialState(seed);
  for (let wave = 1; wave <= WAVES; wave++) {
    for (const cmd of bot.decidePrepActions(state, rng)) RunReducer.dispatch(state, cmd, rng);
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    const streak = new Map<string, number>();
    let ticks = 0;
    while (state.phase === 'BATTLE' && ticks < 20 * 240) {
      const c = state.combatState!;
      const before = new Map(c.units.map((u) => [u.id, { x: u.x, y: u.y }]));
      for (const cmd of bot.decideBattleActions(state, rng)) RunReducer.dispatch(state, cmd, rng);
      RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
      ticks++;
      const cs = state.combatState;
      if (!cs) break;
      const alive = cs.enemies.filter((e) => !e.isDead);
      if (alive.length === 0) continue;
      for (const u of cs.units) {
        if (u.statuses.stunDuration > 0) continue;
        const reach = alive.some((e) => Math.hypot(e.x - u.x, e.y - u.y) <= u.attackRange);
        if (reach) { streak.delete(u.id); continue; }
        outOfReach++;
        const b = before.get(u.id);
        if (b && b.x === u.x && b.y === u.y) {
          idle++;
          const s = (streak.get(u.id) ?? 0) + 1;
          streak.set(u.id, s);
          if (s > longestIdle) longestIdle = s;
          if (s === 40 && samples.length < 8) {
            const near = alive
              .map((e) => `${e.defId}@(${e.x.toFixed(2)},${e.y.toFixed(1)})`)
              .slice(0, 3).join(' ');
            const others = cs.units.filter((o) => o !== u).map((o) => `(${o.x.toFixed(2)},${o.y.toFixed(2)})`).join(' ');
            samples.push(`run ${run} wave ${wave}: ${u.sourceUnit.defId} r${u.attackRange} @(${u.x.toFixed(2)},${u.y.toFixed(2)}) | enemies ${near} | robots ${others}`);
          }
        } else streak.delete(u.id);
      }
    }
    if (state.phase !== 'RESULT') break;
    RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
  }
}

console.log(`robot-ticks with no enemy in reach: ${outOfReach}`);
console.log(`  of them standing still: ${idle} (${((idle / Math.max(1, outOfReach)) * 100).toFixed(1)}%)`);
console.log(`longest stand-still streak: ${longestIdle} ticks (${(longestIdle * 0.05).toFixed(1)} s)`);
for (const s of samples) console.log('  ' + s);
