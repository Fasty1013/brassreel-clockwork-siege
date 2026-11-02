import { z } from 'zod';

export const FactionEnum = z.enum(['cog', 'spring', 'fuse', 'coil', 'scrap', 'legendary']);
export type Faction = z.infer<typeof FactionEnum>;

export const UnitTierEnum = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export type UnitTier = z.infer<typeof UnitTierEnum>;

export const UnitSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descKey: z.string().min(1),
  faction: FactionEnum,
  tier: UnitTierEnum,
  baseHp: z.number().positive(),
  baseDamage: z.number().nonnegative(),
  attackSpeed: z.number().positive(), // Attacks per second
  attackRange: z.number().int().min(1).max(8), // In grid tiles
  armor: z.number().nonnegative().default(0),
  moveSpeed: z.number().nonnegative().default(1.0),
  quirkId: z.string().min(1),
  evolutionBranchA: z.string().optional(),
  evolutionBranchB: z.string().optional(),
  spriteKey: z.string().min(1)
});

export type UnitDefinition = z.infer<typeof UnitSchema>;

