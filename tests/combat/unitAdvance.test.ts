import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { BALANCE } from '@data/balance';

/** Robots with nobody in range walk to the nearest enemy, then fight. */

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

function closestPair(state: CombatSimulationState): number {
  let min = Infinity;
  for (let i = 0; i < state.units.length; i++) {
    for (let j = i + 1; j < state.units.length; j++) {
      const a = state.units[i];
      const b = state.units[j];
      min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return min;
}

describe('Robots walk to enemies they cannot reach', () => {
  it('a knight in the middle goes to a drone in another lane and hits it', () => {
    const rng = PRNG.fromSeed('KNIGHT_WALKS_SEED');
    const state = CombatEngine.initCombatState([place('unit_cog_knight', 3, 2, rng)], 10);
    const drone = parkedEnemy(state, 'en_shield_drone', 6.5, 0, 1);
    drone.hp = drone.maxHp = 1_000_000;
    drone.damage = 0;

    for (let i = 0; i < 20 * 10; i++) {
      CombatEngine.step(state, 0.05, rng);
      expectInsideField(state);
    }
    const knight = state.units[0];
    expect(Math.hypot(drone.x - knight.x, drone.y - knight.y)).toBeLessThanOrEqual(knight.attackRange);
    expect(drone.hp).toBeLessThan(drone.maxHp);
  });

  it('a shooter walks only until the enemy is in range, not up to it', () => {
    const rng = PRNG.fromSeed('ARCHER_RANGE_SEED');
    const state = CombatEngine.initCombatState([place('unit_spring_archer', 0, 4, rng)], 10);
    const target = parkedEnemy(state, 'en_scrapper', 7.8, 0, 1);
    target.hp = target.maxHp = 1_000_000;
    target.damage = 0;
    const archer = state.units[0];
    const startDist = Math.hypot(target.x - archer.x, target.y - archer.y);
    expect(startDist).toBeGreaterThan(archer.attackRange);

    for (let i = 0; i < 20 * 15; i++) CombatEngine.step(state, 0.05, rng);
    const dist = Math.hypot(target.x - archer.x, target.y - archer.y);
    expect(dist).toBeLessThanOrEqual(archer.attackRange);
    expect(dist).toBeGreaterThan(archer.attackRange - 0.2);
    expect(target.hp).toBeLessThan(target.maxHp);
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

  it('a crowd heading for one enemy stays on the field, gets through and ends up spread out', () => {
    const rng = PRNG.fromSeed('CROWD_SEED');
    const units = [
      place('unit_cog_knight', 0, 0, rng),
      place('unit_cog_knight', 0, 1, rng),
      place('unit_cog_bulwark', 0, 2, rng),
      place('unit_cog_ramhead', 0, 3, rng),
      place('unit_scrap_bot', 0, 4, rng),
      place('unit_cog_knight', 1, 2, rng),
      place('unit_spring_archer', 1, 0, rng)
    ];
    const state = CombatEngine.initCombatState(units, 10);
    const target = parkedEnemy(state, 'en_spire_golem', 7.8, 4, 1);
    target.hp = target.maxHp = 1_000_000;
    target.damage = 0;

    for (let i = 0; i < 20 * 20; i++) {
      CombatEngine.step(state, 0.05, rng);
      expectInsideField(state);
      // squeezing past an ally is allowed, standing on top of it is not
      expect(closestPair(state)).toBeGreaterThan(0.1);
    }
    // once fighting, robots step apart again
    expect(closestPair(state)).toBeGreaterThanOrEqual(BALANCE.UNIT_SEPARATION - 1e-6);
    // with room around the golem, at least the front spots get filled and everyone is busy or waiting nearby
    const reaching = state.units.filter(
      (u) => Math.hypot(target.x - u.x, target.y - u.y) <= u.attackRange
    );
    expect(reaching.length).toBeGreaterThanOrEqual(3);
  });

  it('a shooter behind a solid wall of allies squeezes through instead of standing', () => {
    const rng = PRNG.fromSeed('WALL_SEED');
    const wall = [0, 1, 2, 3, 4].map((row) => place('unit_cog_bulwark', 2, row, rng));
    const archerDef = place('unit_spring_archer', 1, 2, rng);
    const state = CombatEngine.initCombatState([...wall, archerDef], 10);
    // the wall cannot move: it stands stunned for the whole test
    for (const u of state.units) if (u.id !== archerDef.instanceId) u.statuses.stunDuration = 1000;
    const target = parkedEnemy(state, 'en_scrapper', 7.8, 2, 1);
    target.hp = target.maxHp = 1_000_000;
    target.damage = 0;
    const archer = state.units.find((u) => u.id === archerDef.instanceId)!;
    expect(Math.hypot(target.x - archer.x, target.y - archer.y)).toBeGreaterThan(archer.attackRange);

    for (let i = 0; i < 20 * 8; i++) {
      CombatEngine.step(state, 0.05, rng);
      expectInsideField(state);
    }
    expect(Math.hypot(target.x - archer.x, target.y - archer.y)).toBeLessThanOrEqual(archer.attackRange);
    expect(target.hp).toBeLessThan(target.maxHp);
  });

  it('a battle with enemies parked out of reach still ends in victory', () => {
    const rng = PRNG.fromSeed('NO_STALL_SEED');
    const state = CombatEngine.initCombatState(
      [place('unit_cog_knight', 1, 2, rng), place('unit_spring_archer', 0, 0, rng)],
      10
    );
    parkedEnemy(state, 'en_shield_drone', 7.8, 0, 1);
    parkedEnemy(state, 'en_scrapper', 7.8, 4, 2);
    state.allEnemiesSpawned = true;

    let ticks = 0;
    while (!state.isVictory && !state.isDefeat && ticks < 20 * 120) {
      CombatEngine.step(state, 0.05, rng);
      ticks++;
    }
    expect(state.isVictory).toBe(true);
    expect(state.boilerHp).toBe(10);
  });
});
