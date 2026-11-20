import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { BALANCE } from '@data/balance';

/** Placement decides: melee robots hold their cell, shooters step at most UNIT_LEASH tiles off it. */

function place(defId: string, col: number, row: number, rng: PRNG, tough = true) {
  const u = UnitFactory.createUnit(defId, rng);
  u.deployedSlot = { col, row };
  if (tough) u.maxHp = u.currentHp = 1_000_000;
  return u;
}

/** an enemy that stands still where it was put, so only the robots move */
function parkedEnemy(state: CombatSimulationState, defId: string, x: number, row: number, seq: number) {
  const e = CombatEngine.spawnEnemy(state, defId, row, seq);
  e.x = x;
  e.moveSpeed = 0;
  return e;
}

function expectInsideField(state: CombatSimulationState): void {
  for (const u of state.units) {
    expect(u.x).toBeGreaterThanOrEqual(0.5);
    expect(u.x).toBeLessThanOrEqual(BALANCE.GRID_COLS - 0.5);
    expect(u.y).toBeGreaterThanOrEqual(0.5);
    expect(u.y).toBeLessThanOrEqual(BALANCE.GRID_ROWS - 0.5);
  }
}

describe('Robots fight where they were placed', () => {
  it('a knight holds its cell while an enemy passes in another lane', () => {
    const rng = PRNG.fromSeed('KNIGHT_HOLDS_SEED');
    const state = CombatEngine.initCombatState([place('unit_cog_knight', 3, 2, rng)], 10);
    const drone = parkedEnemy(state, 'en_shield_drone', 4.5, 0, 1);
    drone.hp = drone.maxHp = 1_000_000;
    drone.damage = 0;
    for (let i = 0; i < 20 * 10; i++) CombatEngine.step(state, 0.05, rng);
    expect(state.units[0].x).toBe(3.5);
    expect(state.units[0].y).toBe(2.5);
    expect(drone.hp).toBe(drone.maxHp);
  });

  it('a knight hits an enemy that walks into it in its own lane', () => {
    const rng = PRNG.fromSeed('KNIGHT_BLOCKS_SEED');
    const state = CombatEngine.initCombatState([place('unit_cog_knight', 3, 2, rng)], 10);
    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    enemy.hp = enemy.maxHp = 1_000_000;
    enemy.damage = 0;
    for (let i = 0; i < 20 * 15; i++) CombatEngine.step(state, 0.05, rng);
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
    expect(enemy.x).toBeGreaterThan(3.5); // stopped at the knight, did not walk through
    // the knight met it with a short step at most
    expect(Math.abs(state.units[0].x - 3.5)).toBeLessThanOrEqual(BALANCE.MELEE_LEASH + 1e-6);
  });

  it('a shooter steps toward an enemy just out of range, no further than its leash', () => {
    const rng = PRNG.fromSeed('ARCHER_LEASH_SEED');
    const archerDef = place('unit_spring_archer', 0, 4, rng);
    const state = CombatEngine.initCombatState([archerDef], 10);
    const archer = state.units[0];
    const home = { x: 0.5, y: 4.5 };
    // out of range from the cell, but within range + leash
    const target = parkedEnemy(state, 'en_scrapper', home.x + archer.attackRange + 1, 4, 1);
    target.hp = target.maxHp = 1_000_000;
    target.damage = 0;
    for (let i = 0; i < 20 * 5; i++) {
      CombatEngine.step(state, 0.05, rng);
      expectInsideField(state);
      expect(Math.hypot(archer.x - home.x, archer.y - home.y)).toBeLessThanOrEqual(BALANCE.UNIT_LEASH + 1e-6);
    }
    expect(Math.hypot(target.x - archer.x, target.y - archer.y)).toBeLessThanOrEqual(archer.attackRange);
    expect(target.hp).toBeLessThan(target.maxHp);
  });

  it('a shooter does not chase an enemy beyond range + leash', () => {
    const rng = PRNG.fromSeed('ARCHER_STAYS_SEED');
    const state = CombatEngine.initCombatState([place('unit_spring_archer', 0, 4, rng)], 10);
    const far = parkedEnemy(state, 'en_scrapper', 7.8, 0, 1);
    far.hp = far.maxHp = 1_000_000;
    far.damage = 0;
    for (let i = 0; i < 20 * 5; i++) CombatEngine.step(state, 0.05, rng);
    expect(state.units[0].x).toBe(0.5);
    expect(state.units[0].y).toBe(4.5);
  });

  it('a shooter walks back to its cell when nothing is left in reach', () => {
    const rng = PRNG.fromSeed('ARCHER_BACK_SEED');
    const state = CombatEngine.initCombatState([place('unit_spring_archer', 0, 4, rng)], 10);
    const archer = state.units[0];
    archer.x = 1.5; // pushed off its cell
    for (let i = 0; i < 20 * 3; i++) CombatEngine.step(state, 0.05, rng);
    expect(archer.x).toBeCloseTo(0.5, 5);
    expect(archer.y).toBeCloseTo(4.5, 5);
  });

  it('a robot that already has an enemy in range stays where it is', () => {
    const rng = PRNG.fromSeed('STAY_PUT_SEED');
    const state = CombatEngine.initCombatState([place('unit_spring_archer', 1, 2, rng)], 10);
    const target = parkedEnemy(state, 'en_scrapper', 4, 2, 1);
    target.hp = target.maxHp = 1_000_000;
    target.damage = 0;
    for (let i = 0; i < 20 * 5; i++) CombatEngine.step(state, 0.05, rng);
    expect(state.units[0].x).toBe(1.5);
    expect(state.units[0].y).toBe(2.5);
  });

  it('an uncovered lane lets enemies walk to the boiler; a covered one does not', () => {
    const run = (row: number): number => {
      const rng = PRNG.fromSeed('LANE_SEED');
      const state = CombatEngine.initCombatState([place('unit_cog_knight', 1, row, rng)], 10);
      const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
      e.damage = 0;
      state.allEnemiesSpawned = true;
      for (let i = 0; i < 20 * 40 && !state.isVictory && !state.isDefeat; i++) CombatEngine.step(state, 0.05, rng);
      return state.boilerHp;
    };
    expect(run(2)).toBe(10);
    expect(run(0)).toBe(9);
  });

  it('knockback cannot hold an unkillable enemy away forever', () => {
    const rng = PRNG.fromSeed('KNOCK_LOCK_SEED');
    const state = CombatEngine.initCombatState([place('unit_fuse_blast_dynamo', 5, 0, rng)], 10);
    const tank = CombatEngine.spawnEnemy(state, 'en_dreadnought', 0, 1);
    tank.hp = tank.maxHp = 1_000_000;
    tank.armor = 1_000_000; // every hit deals 1
    tank.damage = 0;
    tank.leapsLeft = 1; // the stalled case found by the simulator: a leaper that never got close enough to jump
    state.allEnemiesSpawned = true;
    let ticks = 0;
    while (!state.isVictory && !state.isDefeat && ticks < 20 * 120) {
      CombatEngine.step(state, 0.05, rng);
      ticks++;
    }
    // the enemy gets through to the boiler instead of being pushed back for ever
    expect(state.isVictory).toBe(true);
    expect(state.boilerHp).toBe(9);
  });

  it('a battle with moving enemies always ends', () => {
    const rng = PRNG.fromSeed('NO_STALL_SEED');
    const state = CombatEngine.initCombatState(
      [place('unit_cog_knight', 1, 2, rng), place('unit_spring_archer', 0, 0, rng)],
      10
    );
    CombatEngine.spawnEnemy(state, 'en_shield_drone', 0, 1);
    CombatEngine.spawnEnemy(state, 'en_scrapper', 4, 2);
    CombatEngine.spawnEnemy(state, 'en_scrap_sniper', 2, 3);
    state.allEnemiesSpawned = true;

    let ticks = 0;
    while (!state.isVictory && !state.isDefeat && ticks < 20 * 120) {
      CombatEngine.step(state, 0.05, rng);
      ticks++;
    }
    expect(state.isVictory || state.isDefeat).toBe(true);
  });
});
