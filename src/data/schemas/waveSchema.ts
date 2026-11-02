import { z } from 'zod';

export const WaveSpawnGroupSchema = z.object({
  enemyId: z.string().min(1),
  count: z.number().int().positive(),
  spawnDelaySeconds: z.number().nonnegative(),
  rowLane: z.number().int().min(0).max(4).optional()
});

export const InspectionChallengeSchema = z.object({
  type: z.enum([
    'speed_trial',
    'iron_perimeter',
    'full_assembly',
    'manual_labor',
    'monofaction'
  ]),
  targetParam: z.number(),
  bonusCogs: z.number().int().positive(),
  bonusCore: z.boolean().default(true),
  penaltyBoilerDmg: z.number().int().positive().default(1)
});

export const WaveDefinitionSchema = z.object({
  waveNumber: z.number().int().min(1).max(30),
  actNumber: z.number().int().min(1).max(3),
  titleKey: z.string().min(1),
  rewardCogs: z.number().int().positive(),
  spawns: z.array(WaveSpawnGroupSchema).min(1),
  isInspection: z.boolean().optional().default(false),
  inspectionChallenge: InspectionChallengeSchema.optional(),
  isBoss: z.boolean().optional().default(false)
});

export type WaveDefinition = z.input<typeof WaveDefinitionSchema>;
