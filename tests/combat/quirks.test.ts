import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';

function field(units: Array<[string, number, number]>, seed = 'quirks'): { state: CombatSimulationState; rng: PRNG } {
  const rng = PRNG.fromSeed(seed);
  const list = units.map(([defId, col, row]) => {
    const u = UnitFactory.createUnit(defId, rng);
    u.mods = []; // no random mods: only the quirk acts
    u.deployedSlot = { col, row };
    return u;
  });
  return { state: CombatEngine.initCombatState(list, 10), rng };
}

const run = (state: CombatSimulationState, rng: PRNG, seconds: number): void => {
  for (let i = 0; i < seconds * 20; i++) CombatEngine.step(state, 0.05, rng);
};

describe('robot quirks in battle', () => {
  it('shield auras cover the caster and its neighbours', () => {
    const { state, rng } = field([['unit_cog_fortress_golem', 3, 2], ['unit_spring_archer', 2, 2], ['unit_spring_archer', 2, 4]]);
    run(state, rng, 8.1);
    const [golem, near, far] = state.units;
    expect(golem.shield).toBe(Math.round(golem.maxHp * 0.25));
    expect(near.shield).toBe(golem.shield);
    expect(far.shield).toBe(0);
  });

  it('piercing bolts hit enemies behind the target in the lane', () => {
    const { state, rng } = field([['unit_spring_clockwork_ballista', 1, 2]]);
    const front = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
    const back = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 2);
    const other = CombatEngine.spawnEnemy(state, 'en_spire_golem', 0, 3);
    front.x = 5; back.x = 6; other.x = 6;
    for (const e of [front, back, other]) e.moveSpeed = 0;
    run(state, rng, 2);
    expect(back.hp).toBeLessThan(back.maxHp);
    expect(other.hp).toBe(other.maxHp);
  });

  it('the five-fold chain reaches several enemies', () => {
    const { state, rng } = field([['unit_coil_tesla_titan', 2, 2]]);
    const enemies = [0, 1, 2, 3].map((i) => {
      const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, i + 1);
      e.x = 4 + i * 0.5;
      e.moveSpeed = 0;
      return e;
    });
    run(state, rng, 1.5);
    expect(enemies.filter((e) => e.hp < e.maxHp).length).toBeGreaterThanOrEqual(4);
  });

  it('the overclock field speeds up neighbours, not the caster', () => {
    const { state } = field([['unit_coil_overload_core', 2, 2], ['unit_spring_archer', 2, 3], ['unit_spring_archer', 6, 0]]);
    const before = state.units.map((u) => u.attackSpeed);
    CombatEngine.applyStartQuirks(state);
    expect(state.units[0].attackSpeed).toBe(before[0]);
    expect(state.units[1].attackSpeed).toBeGreaterThan(before[1]);
    expect(state.units[2].attackSpeed).toBe(before[2]);
  });

  it('the chrono warden slows every enemy while alive', () => {
    const plain = field([['unit_spring_archer', 0, 0]]);
    const warden = field([['unit_legendary_chrono_warden', 0, 0]]);
    const xs = [plain, warden].map(({ state, rng }) => {
      const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 4, 1);
      e.hp = e.maxHp = 1e6;
      run(state, rng, 1);
      return 7.8 - e.x;
    });
    expect(xs[1]).toBeCloseTo(xs[0] * 0.6, 1);
  });

  it('iron plating lowers the damage taken', () => {
    const plated = field([['unit_cog_knight', 4, 2]]);
    const bare = field([['unit_spring_archer', 4, 2]]);
    const taken = [plated, bare].map(({ state, rng }) => {
      const u = state.units[0];
      u.armor = 0;
      u.hp = u.maxHp = 1e6;
      const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
      e.x = 4.6;
      e.hp = e.maxHp = 1e9;
      run(state, rng, 3);
      return u.maxHp - u.hp;
    });
    expect(taken[0]).toBeLessThan(taken[1]);
  });

  it('the thunderbolt stuns ordinary enemies on every 4th hit', () => {
    const { state, rng } = field([['unit_coil_storm_conductor', 2, 2]]);
    const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
    e.x = 5;
    e.hp = e.maxHp = 1e9;
    let stunned = false;
    for (let i = 0; i < 120 && !stunned; i++) {
      CombatEngine.step(state, 0.05, rng);
      stunned = e.statuses.stunDuration > 1;
    }
    expect(stunned).toBe(true);
  });
});
