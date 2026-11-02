import { z } from 'zod';

export const CoreTagEnum = z.enum([
  'reel',
  'heat',
  'smelt',
  'wild',
  'combo',
  'economy',
  'defense',
  'overclock',
  'faction',
  'skill',
  'fodder'
]);
export type CoreTag = z.infer<typeof CoreTagEnum>;

export const EngineCoreSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descKey: z.string().min(1),
  tags: z.array(CoreTagEnum).min(1).max(3),
  actTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ruleModifier: z.string().min(1),
  params: z.record(z.string(), z.number()).default({})
});

export type EngineCoreDefinition = z.infer<typeof EngineCoreSchema>;

