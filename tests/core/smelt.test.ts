import { describe, it, expect } from 'vitest';
import { UnitFactory } from '@core/units/unitFactory';
import { SmeltManager } from '@core/smelt/smelt';
import { PRNG } from '@core/prng/sfc32';

describe('Merge levels (same line + same level -> level + 1) and Evolution', () => {
  it('new units always start at level 1', () => {
    const rng = PRNG.fromSeed('LEVEL_START');
    expect(UnitFactory.createUnit('unit_cog_knight', rng).starRank).toBe(1);
    expect(UnitFactory.createUnit('unit_cog_bulwark', rng).starRank).toBe(1);
  });

  it('merges two level-1 units of the same line into level 2 with stronger stats', () => {
    const rng = PRNG.fromSeed('MERGE_1_1');
    const target = UnitFactory.createUnit('unit_cog_knight', rng);
    const sacrifice = UnitFactory.createUnit('unit_cog_knight', rng);
    const hpBefore = target.maxHp;

    const result = SmeltManager.smelt(target, sacrifice);
    expect(result.merged).toBe(true);
    expect(target.starRank).toBe(2);
    expect(target.maxHp).toBeGreaterThan(hpBefore);
    expect(target.currentHp).toBe(target.maxHp);
  });

  it('chains 1+1=2, 2+2=3, 3+3=4, 4+4=5 and stops at 5', () => {
    const rng = PRNG.fromSeed('MERGE_CHAIN');
    const make = (level: 1 | 2 | 3 | 4 | 5) =>
      UnitFactory.createUnit('unit_spring_archer', rng, { customStarRank: level });

    for (const lvl of [1, 2, 3, 4] as const) {
      const a = make(lvl);
      const res = SmeltManager.smelt(a, make(lvl));
      expect(res.merged).toBe(true);
      expect(a.starRank).toBe(lvl + 1);
    }

    const max = make(5);
    const res = SmeltManager.smelt(max, make(5));
    expect(res.merged).toBe(false);
    expect(res.rejectReason).toBe('max_level');
    expect(max.starRank).toBe(5);
  });

  it('refuses to merge different lines', () => {
    const rng = PRNG.fromSeed('MERGE_DIFF_LINE');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    const archer = UnitFactory.createUnit('unit_spring_archer', rng);
    const res = SmeltManager.smelt(knight, archer);
    expect(res.merged).toBe(false);
    expect(res.rejectReason).toBe('different_archetype');
    expect(knight.starRank).toBe(1);
  });

  it('refuses to merge different levels', () => {
    const rng = PRNG.fromSeed('MERGE_DIFF_LEVEL');
    const a = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 2 });
    const b = UnitFactory.createUnit('unit_cog_knight', rng);
    const res = SmeltManager.smelt(a, b);
    expect(res.merged).toBe(false);
    expect(res.rejectReason).toBe('different_level');
  });

  it('evolved units of the same line still merge (knight line = cog)', () => {
    const rng = PRNG.fromSeed('MERGE_SAME_LINE');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 3 });
    const bulwark = UnitFactory.createUnit('unit_cog_bulwark', rng, { customStarRank: 3 });
    expect(SmeltManager.canMerge(bulwark, knight)).toBeNull();
  });

  it('offers an evolution choice on reaching level 3', () => {
    const rng = PRNG.fromSeed('MERGE_EVO');
    const a = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 2 });
    const res = SmeltManager.smelt(a, UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 2 }));
    expect(res.evolutionAvailable).toBe(true);
    expect(res.evolutionBranchA).toBe('unit_cog_bulwark');
    expect(res.evolutionBranchB).toBe('unit_cog_ramhead');
  });

  it('evolution changes archetype but keeps the level', () => {
    const rng = PRNG.fromSeed('EVOLVE_SEED');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 3 });
    const bulwark = SmeltManager.evolveUnit(knight, 'unit_cog_bulwark');

    expect(bulwark.defId).toBe('unit_cog_bulwark');
    expect(bulwark.tier).toBe(2);
    expect(bulwark.starRank).toBe(3);
    expect(bulwark.maxHp).toBeGreaterThan(420);
    expect(bulwark.armor).toBeGreaterThanOrEqual(14);
  });

  it('evolution with an rng teaches one extra mod (more versatile)', () => {
    const rng = PRNG.fromSeed('EVOLVE_MOD');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 3 });
    const before = knight.mods.length;
    SmeltManager.evolveUnit(knight, 'unit_cog_ramhead', rng);
    expect(knight.mods.length).toBe(before + 1);
    expect(new Set(knight.mods.map((m) => m.id)).size).toBe(knight.mods.length);
  });

  it('transfers chosen rolled mod from sacrifice to target', () => {
    const rng = PRNG.fromSeed('TRANSFER_MOD_SEED');
    const target = UnitFactory.createUnit('unit_cog_knight', rng);
    const sacrifice = UnitFactory.createUnit('unit_cog_knight', rng);

    const transferredMod = sacrifice.mods[0];
    SmeltManager.smelt(target, sacrifice, {
      sacrificeModIndex: 0,
      targetModIndexToReplace: 0
    });

    expect(target.mods[0].id).toBe(transferredMod.id);
  });
});
