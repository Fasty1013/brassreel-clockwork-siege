import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { UNITS_DATA } from '@data/units';
import { QUIRKS_DATA } from '@data/quirks';

function battle(unitId: string, col = 1, row = 2, seed = 'ABILITY'): { state: CombatSimulationState; rng: PRNG } {
  const rng = PRNG.fromSeed(seed);
  const u = UnitFactory.createUnit(unitId, rng);
  u.mods = []; // isolate the class ability from rolled mods
  u.deployedSlot = { col, row };
  return { state: CombatEngine.initCombatState([u], 10), rng };
}

describe('Class abilities', () => {
  it('gives the two evolution branches of every class different abilities', () => {
    for (const def of Object.values(UNITS_DATA)) {
      if (!def.evolutionBranchA || !def.evolutionBranchB) continue;
      const a = UNITS_DATA[def.evolutionBranchA];
      const b = UNITS_DATA[def.evolutionBranchB];
      expect(a.quirkId, `${a.id} vs ${b.id}`).not.toBe(b.quirkId);
      expect(QUIRKS_DATA[a.quirkId]).toBeDefined();
      expect(QUIRKS_DATA[b.quirkId]).toBeDefined();
    }
  });

  it('Tower Shield starts the battle with a shield', () => {
    const { state } = battle('unit_cog_bulwark');
    const u = state.units[0];
    expect(u.shield).toBe(Math.round(u.maxHp * 0.35));
  });

  it('Iron Plating takes less damage than a robot without it', () => {
    const plated = battle('unit_cog_knight');
    const bare = battle('unit_spring_archer');
    for (const b of [plated, bare]) {
      b.state.units[0].armor = 0;
      b.state.units[0].attackCooldown = 999;
      const e = CombatEngine.spawnEnemy(b.state, 'en_scrapper', 2, 1);
      e.x = 1.8;
      e.attackCooldown = 0;
      CombatEngine.step(b.state, 0.05, b.rng);
    }
    const lostPlated = plated.state.units[0].maxHp - plated.state.units[0].hp;
    const lostBare = bare.state.units[0].maxHp - bare.state.units[0].hp;
    expect(lostPlated).toBeLessThan(lostBare);
  });

  it('Armor Piercer ignores most of the target armor', () => {
    const { state, rng } = battle('unit_spring_sharpshooter');
    const u = state.units[0];
    u.attackCooldown = 0;
    const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    e.x = 3;
    e.armor = 20;
    e.attackCooldown = 999;
    CombatEngine.step(state, 0.05, rng);
    const dealt = state.events.find((ev) => ev.type === 'damage' && ev.sourceId === u.id)!.amount!;
    expect(dealt).toBeGreaterThanOrEqual(Math.round(u.damage - 20 * 0.4));
  });

  it('Incendiary sets the target on fire', () => {
    const { state, rng } = battle('unit_fuse_pyromancer');
    state.units[0].attackCooldown = 0;
    const e = CombatEngine.spawnEnemy(state, 'en_steam_rover', 2, 1);
    e.x = 3;
    e.attackCooldown = 999;
    CombatEngine.step(state, 0.05, rng);
    expect(e.statuses.burnDuration).toBeGreaterThan(0);
  });

  it('Twin Arc chains lightning to two more enemies', () => {
    const { state, rng } = battle('unit_coil_conduit');
    const u = state.units[0];
    u.attackCooldown = 0;
    const foes = [0, 1, 2].map((i) => {
      const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, i);
      e.x = 3 + i * 0.5;
      e.attackCooldown = 999;
      return e;
    });
    CombatEngine.step(state, 0.05, rng);
    const hit = new Set(state.events.filter((ev) => ev.type === 'damage' && ev.sourceId === u.id).map((ev) => ev.targetId));
    expect(hit.size).toBe(3);
    expect(foes.every((f) => f.hp < f.maxHp)).toBe(true);
  });

  it('Static Field shields itself and its neighbours', () => {
    const rng = PRNG.fromSeed('AURA');
    const dynamo = UnitFactory.createUnit('unit_coil_dynamo', rng);
    const friend = UnitFactory.createUnit('unit_cog_knight', rng);
    dynamo.deployedSlot = { col: 1, row: 2 };
    friend.deployedSlot = { col: 2, row: 2 };
    const state = CombatEngine.initCombatState([dynamo, friend], 10);
    for (let i = 0; i < 125; i++) CombatEngine.step(state, 0.05, rng); // ~6.25 s, no enemies
    expect(state.units.every((u) => u.shield >= 60)).toBe(true);
  });

  it('Time Dilation slows every enemy while the robot lives', () => {
    const slow = battle('unit_legendary_chrono_warden', 0, 0);
    const none = battle('unit_spring_archer', 0, 0);
    const xs = [slow, none].map((b) => {
      b.state.units[0].attackCooldown = 999;
      const e = CombatEngine.spawnEnemy(b.state, 'en_scrapper', 4, 1);
      CombatEngine.step(b.state, 0.5, b.rng);
      return e.x;
    });
    expect(7.8 - xs[0]).toBeCloseTo((7.8 - xs[1]) * 0.6, 5);
  });

  it('bosses are immune to ability stuns', () => {
    const { state, rng } = battle('unit_cog_ramhead');
    const u = state.units[0];
    const boss = CombatEngine.spawnEnemy(state, 'boss_steam_baron', 2, 1);
    boss.x = 1.9;
    boss.attackCooldown = 999;
    for (let i = 0; i < 3; i++) {
      u.attackCooldown = 0;
      CombatEngine.step(state, 0.05, rng);
    }
    expect(boss.statuses.stunDuration).toBe(0);
  });
});
