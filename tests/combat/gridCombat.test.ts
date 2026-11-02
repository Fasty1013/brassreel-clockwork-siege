import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';

describe('Discrete 8x5 Spatial Combat Simulation Suite', () => {
  it('initializes defenders at their deployed grid coordinates', () => {
    const rng = PRNG.fromSeed('COMBAT_INIT_SEED');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    knight.deployedSlot = { col: 1, row: 2 };

    const state = CombatEngine.initCombatState([knight], 10);
    expect(state.units.length).toBe(1);
    expect(state.units[0].col).toBe(1);
    expect(state.units[0].row).toBe(2);
    expect(state.units[0].x).toBe(1.5);
    expect(state.units[0].y).toBe(2.5);
  });

  it('spawns enemies on right edge and advances them leftward', () => {
    const rng = PRNG.fromSeed('ADVANCE_SEED');
    const state = CombatEngine.initCombatState([], 10);
    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);

    expect(enemy.x).toBeCloseTo(7.8, 1);

    // Run 20 ticks (1.0 second)
    for (let i = 0; i < 20; i++) {
      CombatEngine.step(state, 0.05, rng);
    }

    // Scrapper moveSpeed is 1.0, so x should decrease by ~1.0 tile
    expect(enemy.x).toBeLessThan(7.0);
  });

  it('inflicts Boiler damage when enemy breaches column 0 border', () => {
    const rng = PRNG.fromSeed('BREACH_SEED');
    const state = CombatEngine.initCombatState([], 10);
    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 1, 1);
    enemy.x = 0.15; // Just about to cross

    CombatEngine.step(state, 0.1, rng);

    expect(state.boilerHp).toBe(9); // 10 - 1 = 9
    expect(state.enemies.length).toBe(0); // Breach enemy is consumed
  });

  it('triggers Emergency Valve Slow to reduce enemy speed', () => {
    const rng = PRNG.fromSeed('VALVE_SEED');
    const state = CombatEngine.initCombatState([], 10);
    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 0, 1);

    CombatEngine.triggerEmergencyValve(state, 'slow');
    expect(state.valveUsed).toBe(true);
    expect(state.valveSlowRemaining).toBe(5);

    const initialX = enemy.x;
    CombatEngine.step(state, 1.0, rng); // 1 second under 60% slow

    // Normal move speed = 1.0. With 60% slow, moved distance is 0.4
    const moved = initialX - enemy.x;
    expect(moved).toBeCloseTo(0.4, 1);
  });
});

