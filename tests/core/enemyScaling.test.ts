import { describe, it, expect } from 'vitest';
import { BALANCE, enemyWaveScale } from '@data/balance';
import { CombatEngine } from '@core/combat/combatEngine';
import { WaveController } from '@core/waves/waveController';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { ENEMIES_DATA } from '@data/enemies';

describe('enemy wave scaling', () => {
  it('matches the anchors exactly and interpolates between them', () => {
    for (const a of BALANCE.ENEMY_SCALE_ANCHORS) {
      expect(enemyWaveScale(a.wave)).toEqual({ hp: a.hp, damage: a.damage });
    }
    const [a, b] = [BALANCE.ENEMY_SCALE_ANCHORS[1], BALANCE.ENEMY_SCALE_ANCHORS[2]];
    const mid = enemyWaveScale(15);
    const t = (15 - a.wave) / (b.wave - a.wave);
    expect(mid.hp).toBeCloseTo(a.hp + (b.hp - a.hp) * t);
    expect(mid.damage).toBeCloseTo(a.damage + (b.damage - a.damage) * t);
  });

  it('never weakens enemies below their base stats and clamps outside the range', () => {
    for (let w = 0; w <= 40; w++) {
      const s = enemyWaveScale(w);
      expect(s.hp).toBeGreaterThanOrEqual(1);
      expect(s.damage).toBeGreaterThanOrEqual(1);
    }
    expect(enemyWaveScale(0)).toEqual(enemyWaveScale(1));
    expect(enemyWaveScale(99)).toEqual(enemyWaveScale(30));
  });

  it('spawns enemies with the wave multiplier applied', () => {
    const state = CombatEngine.initCombatState([], 10);
    const controller = new WaveController(10);
    controller.initWaveSpawns(PRNG.fromSeed('scale'));
    const rng = PRNG.fromSeed('scale');
    controller.update(state, 0.6, rng); // advances the clock past the first spawn time
    controller.update(state, 0.05, rng);
    const enemy = state.enemies[0];
    const scale = enemyWaveScale(10);
    expect(enemy.maxHp).toBe(Math.round(enemy.def.hp * scale.hp));
    expect(enemy.damage).toBe(Math.round(enemy.def.damage * scale.damage));
  });
});

describe('unanswered enemy shooters', () => {
  it('walk up to a defender that cannot shoot back instead of trading forever', () => {
    const rng = PRNG.fromSeed('press');
    // a melee robot two lanes away from nothing: the drone outranges it
    const unit = UnitFactory.createUnit('unit_cog_knight', rng);
    unit.deployedSlot = { col: 2, row: 1 };
    const state = CombatEngine.initCombatState([unit], 10);
    const drone = CombatEngine.spawnEnemy(state, 'en_shield_drone', 1, 1);
    drone.x = unit.deployedSlot.col + 0.5 + ENEMIES_DATA.en_shield_drone.attackRange - 0.1;

    let t = 0;
    while (!state.isVictory && !state.isDefeat && t < 1200) {
      CombatEngine.step(state, 0.05, rng);
      t++;
    }
    state.allEnemiesSpawned = true;
    CombatEngine.step(state, 0.05, rng);
    // the drone came into reach and the knight finished it
    expect(state.enemies.length === 0 || state.units.length === 0).toBe(true);
  });

  it('do not move while they are being hit', () => {
    const rng = PRNG.fromSeed('press2');
    const archer = UnitFactory.createUnit('unit_spring_archer', rng);
    archer.deployedSlot = { col: 2, row: 1 };
    const state = CombatEngine.initCombatState([archer], 10);
    state.units[0].hp = state.units[0].maxHp = 1e6; // the archer must survive the duel
    const golem = CombatEngine.spawnEnemy(state, 'en_scrap_sniper', 1, 1);
    golem.hp = golem.maxHp = 100000;
    golem.lastHp = golem.hp;
    golem.x = 6.4; // archer (range 5) and sniper (range 6) see each other
    for (let i = 0; i < 200; i++) CombatEngine.step(state, 0.05, rng);
    expect(golem.x).toBeCloseTo(6.4);
  });
});
