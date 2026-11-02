import { z } from 'zod';

export const ModRarityEnum = z.enum(['common', 'rare', 'epic']);
export type ModRarity = z.infer<typeof ModRarityEnum>;

export const ModTriggerEffectEnum = z.enum([
  'burn',
  'shock',
  'stun',
  'cleave',
  'reflect',
  'ricochet',
  'knockback',
  'lifesteal',
  'coin_drop'
]);

export const ModSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descKey: z.string().min(1),
  rarity: ModRarityEnum,
  statModifiers: z.object({
    damagePct: z.number().optional(),
    hpPct: z.number().optional(),
    attackSpeedPct: z.number().optional(),
    critChancePct: z.number().optional(),
    critDamagePct: z.number().optional(),
    flatArmor: z.number().optional(),
    rangeTiles: z.number().optional(),
    knockbackTiles: z.number().optional(),
    lifestealPct: z.number().optional(),
    dodgePct: z.number().optional()
  }).optional().default({}),
  triggerEffect: ModTriggerEffectEnum.optional(),
  triggerParam: z.number().optional()
});

export type ModDefinition = z.input<typeof ModSchema>;
