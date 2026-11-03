import { z } from 'zod';

export const MetaCodexSchema = z.object({
  seenUnits: z.array(z.string()).default([]),
  seenMods: z.array(z.string()).default([]),
  seenEnemies: z.array(z.string()).default([]),
  seenCores: z.array(z.string()).default([])
});

export const MetaStateSchema = z.object({
  version: z.number().default(1),
  refinedCogs: z.number().nonnegative().default(0),
  lifetimeCogsEarned: z.number().nonnegative().default(0),
  totalRuns: z.number().nonnegative().default(0),
  totalVictories: z.number().nonnegative().default(0),
  highestWaveReached: z.number().nonnegative().default(0),
  unlockedUpgrades: z.record(z.string(), z.number()).default({}),
  codex: MetaCodexSchema.default({
    seenUnits: [],
    seenMods: [],
    seenEnemies: [],
    seenCores: []
  })
});

export type MetaState = z.infer<typeof MetaStateSchema>;

