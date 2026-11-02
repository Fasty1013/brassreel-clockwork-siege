import { describe, it, expect } from 'vitest';
import { UnitSchema } from '@data/schemas/unitSchema';

describe('UnitSchema Validation Smoke Test', () => {
  it('validates a correct unit structure', () => {
    const validUnit = {
      id: 'unit_cog_knight',
      nameKey: 'unit.cog_knight.name',
      descKey: 'unit.cog_knight.desc',
      faction: 'cog',
      tier: 1,
      baseHp: 200,
      baseDamage: 25,
      attackSpeed: 1.0,
      attackRange: 1,
      armor: 5,
      moveSpeed: 1.0,
      quirkId: 'quirk_iron_plating',
      spriteKey: 'tex_cog_knight'
    };

    const parsed = UnitSchema.safeParse(validUnit);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid tier numbers', () => {
    const invalidUnit = {
      id: 'unit_broken',
      nameKey: 'test',
      descKey: 'test',
      faction: 'cog',
      tier: 99,
      baseHp: 100,
      baseDamage: 10,
      attackSpeed: 1,
      attackRange: 1,
      quirkId: 'test',
      spriteKey: 'test'
    };

    const parsed = UnitSchema.safeParse(invalidUnit);
    expect(parsed.success).toBe(false);
  });
});

