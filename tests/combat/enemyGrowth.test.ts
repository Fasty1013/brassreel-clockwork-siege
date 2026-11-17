import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { WaveController } from '@core/waves/waveController';
import { enemyGrowth } from '@core/waves/enemyGrowth';
import { PRNG } from '@core/prng/sfc32';
import { BALANCE } from '@data/balance';
import { ENEMIES_DATA } from '@data/enemies';
import { WAVES_DATA } from '@data/waves';

describe('Enemy growth by wave', () => {
  it('leaves base stats alone at power 1 and scales HP faster than damage', () => {
    expect(enemyGrowth(1)).toEqual({ hp: 1, damage: 1 });
    const g = enemyGrowth(5);
    expect(g.hp).toBe(5);
    expect(g.damage).toBeCloseTo(1 + 4 * BALANCE.ENEMY_DMG_GROWTH_SHARE);
  });

  it('spawns tougher enemies when the wave has a higher enemyPower', () => {
    const state = CombatEngine.initCombatState([], 10);
    const base = CombatEngine.spawnEnemy(state, 'en_scrapper', 0, 1);
    const tough = CombatEngine.spawnEnemy(state, 'en_scrapper', 1, 2, 6);
    const def = ENEMIES_DATA.en_scrapper;

    expect(base.hp).toBe(def.hp);
    expect(base.damage).toBe(def.damage);
    expect(tough.maxHp).toBe(Math.round(def.hp * enemyGrowth(6).hp));
    expect(tough.hp).toBe(tough.maxHp);
    expect(tough.damage).toBe(Math.round(def.damage * enemyGrowth(6).damage));
  });

  it('gives the first wave base stats and makes later acts tougher', () => {
    expect(WAVES_DATA[0].enemyPower).toBe(1);
    const actAverage = (act: number): number => {
      const waves = WAVES_DATA.filter((w) => w.actNumber === act);
      return waves.reduce((sum, w) => sum + (w.enemyPower ?? 1), 0) / waves.length;
    };
    expect(actAverage(2)).toBeGreaterThan(actAverage(1));
    expect(actAverage(3)).toBeGreaterThan(actAverage(2));
  });

  it('applies the wave enemyPower to the enemies the wave controller spawns', () => {
    const rng = PRNG.fromSeed('WAVE_POWER_SEED');
    const controller = new WaveController(8);
    const state = CombatEngine.initCombatState([], 10);
    controller.initWaveSpawns(rng);
    for (let i = 0; i < 20 && state.enemies.length === 0; i++) controller.update(state, 0.05, rng);

    const enemy = state.enemies[0];
    const power = WAVES_DATA[7].enemyPower ?? 1;
    expect(power).toBeGreaterThan(1);
    expect(enemy.maxHp).toBe(Math.round(enemy.def.hp * enemyGrowth(power).hp));
  });
});

describe('Armor floor', () => {
  it('subtracts armor but always lets a share of the hit through', () => {
    expect(CombatEngine.damageAfterArmor(100, 30)).toBe(70);
    expect(CombatEngine.damageAfterArmor(100, 500)).toBe(Math.round(100 * BALANCE.MIN_DAMAGE_RATIO));
    expect(CombatEngine.damageAfterArmor(2, 500)).toBe(1);
  });
});

describe('Shooters close in while firing', () => {
  it('a ranged enemy keeps advancing on its target and stops next to it', () => {
    const rng = PRNG.fromSeed('SNIPER_ADVANCE_SEED');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    knight.deployedSlot = { col: 2, row: 2 };
    knight.maxHp = knight.currentHp = 1_000_000; // must outlive the test
    knight.damage = 0;

    const state = CombatEngine.initCombatState([knight], 10);
    const sniper = CombatEngine.spawnEnemy(state, 'en_scrap_sniper', 2, 1);
    sniper.hp = sniper.maxHp = 1_000_000;

    for (let i = 0; i < 20 * 10; i++) CombatEngine.step(state, 0.05, rng);
    const afterTenSeconds = sniper.x;
    // it is in range from the start (range 6), yet it has moved closer
    expect(afterTenSeconds).toBeLessThan(7.0);

    for (let i = 0; i < 20 * 60; i++) CombatEngine.step(state, 0.05, rng);
    // they meet: the knight walks out to it, the sniper stops next to the knight, in melee reach
    const k = state.units[0];
    expect(k.x).toBeGreaterThan(2.5);
    expect(sniper.x).toBeGreaterThan(k.x);
    expect(Math.hypot(sniper.x - k.x, sniper.y - k.y)).toBeLessThanOrEqual(k.attackRange);
    expect(state.boilerHp).toBe(10);
  });

  it('enemies shoot the nearest robot in their lane, so the front line covers the back line', () => {
    const rng = PRNG.fromSeed('FRONT_LINE_SEED');
    const archer = UnitFactory.createUnit('unit_spring_archer', rng);
    archer.deployedSlot = { col: 0, row: 2 };
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    knight.deployedSlot = { col: 3, row: 2 };
    for (const u of [archer, knight]) {
      u.maxHp = u.currentHp = 100_000;
      u.damage = 0;
    }

    // the archer is listed first: target choice must not depend on deployment order
    const state = CombatEngine.initCombatState([archer, knight], 10);
    const sniper = CombatEngine.spawnEnemy(state, 'en_scrap_sniper', 2, 1);
    sniper.hp = sniper.maxHp = 1_000_000;

    for (let i = 0; i < 20 * 5; i++) CombatEngine.step(state, 0.05, rng);

    const archerUnit = state.units.find((u) => u.id === archer.instanceId)!;
    const knightUnit = state.units.find((u) => u.id === knight.instanceId)!;
    expect(archerUnit.hp).toBe(archerUnit.maxHp);
    expect(knightUnit.hp).toBeLessThan(knightUnit.maxHp);
  });
});
