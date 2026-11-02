import { describe, it, expect } from 'vitest';
import { UnitFactory } from '@core/units/unitFactory';
import { SmeltManager } from '@core/smelt/smelt';
import { PRNG } from '@core/prng/sfc32';

describe('Smelt Crucible, XP, and Evolution Suite', () => {
  it('grants 2x XP for smelting same faction units', () => {
    const rng = PRNG.fromSeed('SMELT_SEED_1');
    const target = UnitFactory.createUnit('unit_cog_knight', rng);
    const sacrifice = UnitFactory.createUnit('unit_cog_knight', rng);

    const result = SmeltManager.smelt(target, sacrifice);
    expect(result.xpGained).toBe(2);
    expect(target.smeltXp).toBe(2);
  });

  it('grants 1x base XP for smelting different faction units', () => {
    const rng = PRNG.fromSeed('SMELT_SEED_2');
    const target = UnitFactory.createUnit('unit_cog_knight', rng);
    const sacrifice = UnitFactory.createUnit('unit_spring_archer', rng);

    const result = SmeltManager.smelt(target, sacrifice);
    expect(result.xpGained).toBe(1);
    expect(target.smeltXp).toBe(1);
  });

  it('triggers Star 2 evolution choice when reaching 3 XP', () => {
    const rng = PRNG.fromSeed('SMELT_SEED_3');
    const target = UnitFactory.createUnit('unit_cog_knight', rng); // Star 1
    const sac1 = UnitFactory.createUnit('unit_cog_knight', rng); // +2 XP
    const sac2 = UnitFactory.createUnit('unit_cog_knight', rng); // +2 XP -> Total 4 XP

    SmeltManager.smelt(target, sac1);
    const result = SmeltManager.smelt(target, sac2);

    expect(result.evolutionAvailable).toBe(true);
    expect(result.evolutionBranchA).toBe('unit_cog_bulwark');
    expect(result.evolutionBranchB).toBe('unit_cog_ramhead');
  });

  it('evolves unit into chosen branch and applies archetype stats', () => {
    const rng = PRNG.fromSeed('EVOLVE_SEED');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    const bulwark = SmeltManager.evolveUnit(knight, 'unit_cog_bulwark');

    expect(bulwark.defId).toBe('unit_cog_bulwark');
    expect(bulwark.tier).toBe(2);
    expect(bulwark.starRank).toBe(2);
    expect(bulwark.maxHp).toBeGreaterThan(350); // Bulwark base HP is 420
    expect(bulwark.armor).toBeGreaterThanOrEqual(14);
  });

  it('transfers chosen rolled mod from sacrifice to target', () => {
    const rng = PRNG.fromSeed('TRANSFER_MOD_SEED');
    const target = UnitFactory.createUnit('unit_cog_knight', rng);
    const sacrifice = UnitFactory.createUnit('unit_spring_archer', rng);

    const transferredMod = sacrifice.mods[0];
    SmeltManager.smelt(target, sacrifice, {
      sacrificeModIndex: 0,
      targetModIndexToReplace: 0
    });

    expect(target.mods[0].id).toBe(transferredMod.id);
  });
});

