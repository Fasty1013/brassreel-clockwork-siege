import { z } from 'zod';

export const GadgetTypeEnum = z.enum(['passive', 'consumable']);
export type GadgetType = z.infer<typeof GadgetTypeEnum>;

export const GadgetSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  descKey: z.string().min(1),
  type: GadgetTypeEnum,
  cost: z.number().int().positive(),
  effectType: z.string().min(1),
  params: z.record(z.string(), z.number()).default({})
});

export type GadgetDefinition = z.infer<typeof GadgetSchema>;

