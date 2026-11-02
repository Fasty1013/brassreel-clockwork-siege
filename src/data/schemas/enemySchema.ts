import { z } from 'zod';

export const BossPhaseSchema = z.object({
  thresholdHpPct: z.number().min(0).max(1),
  nameKey: z.string().min(1),
  abilities: z.array(z.string())
});

export const EnemySchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descKey: z.string().min(1),
  hp: z.number().positive(),
  damage: z.number().positive(),
  attackSpeed: z.number().positive(),
  moveSpeed: z.number().positive(),
  attackRange: z.number().int().min(1).max(8),
  armor: z.number().nonnegative().optional().default(0),
  bountyCogs: z.number().int().nonnegative().optional().default(1),
  isBoss: z.boolean().optional().default(false),
  bossPhases: z.array(BossPhaseSchema).optional(),
  spriteKey: z.string().min(1)
});

export type EnemyDefinition = z.input<typeof EnemySchema>;
