import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';

describe('Deep Combat Mechanics, Quirks, and Boss Phases Suite', () => {
  it('triggers Boss Phase 2 when The Steam Baron drops below 50% HP', () => {
    const rng = PRNG.fromSeed('BOSS_PHASE_TEST');
    const state = CombatEngine.initCombatState([], 10);
    const boss = CombatEngine.spawnEnemy(state, 'boss_steam_baron', 2, 1);

    expect(boss.bossPhase).toBe(1);
    const initialSpeed = boss.moveSpeed;

    // Deal damage directly to drop below 50% (3200 maxHp -> below 1600)
    boss.hp = 1500;

    // Step combat simulation
    const events = CombatEngine.step(state, 0.05, rng);

    expect(boss.bossPhase).toBe(2);
    expect(boss.moveSpeed).toBeGreaterThan(initialSpeed); // 40% speed boost in Phase 2
    expect(events.some((e) => e.type === 'boss_phase')).toBe(true);
  });

  it('triggers unit death and Fuse Sapper death explosion', () => {
    const rng = PRNG.fromSeed('EXPLOSION_TEST');
    const sapper = UnitFactory.createUnit('unit_fuse_sapper', rng);
    sapper.deployedSlot = { col: 1, row: 2 };
    sapper.currentHp = 5; // Very low HP

    const state = CombatEngine.initCombatState([sapper], 10);
    state.units[0].hp = 5;
    state.units[0].attackCooldown = 999; // Don't let sapper attack first

    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    enemy.x = 1.8; // Adjacent
    enemy.attackCooldown = 0; // Strike immediately

    // Step combat: enemy strikes and kills sapper
    CombatEngine.step(state, 0.1, rng);

    expect(state.units.length).toBe(0);
    // Sapper death explosion should have damaged the enemy (120 blast dmg against 110 hp kills it)
    expect(enemy.hp <= 0 || state.enemies.length === 0).toBe(true);
  });

  it('triggers Aegis Bastion damage reflection upon being struck', () => {
    const rng = PRNG.fromSeed('REFLECT_TEST');
    const bastion = UnitFactory.createUnit('unit_cog_aegis_bastion', rng);
    bastion.deployedSlot = { col: 1, row: 2 };

    const state = CombatEngine.initCombatState([bastion], 10);
    state.units[0].attackCooldown = 999; // Don't let bastion attack first

    // Rover damage = 20, Bastion armor = 18 -> net dmg = 2 -> reflect 30% of 2 = 1
    const enemy = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
    enemy.x = 1.8;
    enemy.attackCooldown = 0; // Strike immediately
    const initialEnemyHp = enemy.hp;

    CombatEngine.step(state, 0.1, rng);

    // Enemy struck bastion, received reflected damage
    expect(enemy.hp).toBeLessThan(initialEnemyHp);
  });

  it('applies mod trigger effects: burn, shock, and stun on enemies', () => {
    const rng = PRNG.fromSeed('MOD_STATUS_TEST');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    knight.deployedSlot = { col: 1, row: 2 };

    // Attach burn, shock, stun, lifesteal mods directly
    knight.mods = [
      { id: 'mod_oil_flask', nameKey: 'test', descKey: 'test', rarity: 'common', triggerEffect: 'burn', triggerParam: 25 },
      { id: 'mod_spark_plug', nameKey: 'test', descKey: 'test', rarity: 'common', triggerEffect: 'shock', triggerParam: 0.3 },
      { id: 'mod_hydraulic_ram', nameKey: 'test', descKey: 'test', rarity: 'rare', triggerEffect: 'stun', triggerParam: 1.5 },
      { id: 'mod_boiler_siphon', nameKey: 'test', descKey: 'test', rarity: 'rare', statModifiers: { lifestealPct: 0.2 } }
    ];

    const state = CombatEngine.initCombatState([knight], 10);
    state.units[0].attackCooldown = 0; // Ready to attack immediately!

    const beetle = CombatEngine.spawnEnemy(state, 'en_clockwork_beetle', 2, 1);
    beetle.x = 2.0;

    CombatEngine.step(state, 0.1, rng);

    expect(beetle.statuses.burnDuration).toBeGreaterThan(0);
    expect(beetle.statuses.shockDuration).toBeGreaterThan(0);
    expect(beetle.statuses.stunDuration).toBeGreaterThan(0);
  });

  it('triggers defeat when boiler HP drops to 0', () => {
    const rng = PRNG.fromSeed('DEFEAT_TEST');
    const state = CombatEngine.initCombatState([], 1); // Only 1 Boiler HP
    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 1, 1);
    enemy.x = 0.05; // Crossing border

    CombatEngine.step(state, 0.1, rng);

    expect(state.boilerHp).toBe(0);
    expect(state.isDefeat).toBe(true);
  });
});
