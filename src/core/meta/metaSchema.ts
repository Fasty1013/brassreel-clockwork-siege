import { z } from 'zod';

export const MetaCodexSchema = z.object({
  seenUnits: z.array(z.string()).default([]),
  seenMods: z.array(z.string()).default([]),
  seenEnemies: z.array(z.string()).default([]),
  seenCores: z.array(z.string()).default([])
});

/** Campaign «Великий Регулятор»: progress kept between runs. */
export const MetaCampaignSchema = z.object({
  /** Regulator parts ever recovered (flywheel, spiral, heart) */
  parts: z.array(z.string()).default([]),
  /** story scenes already shown (they play once, then live in the chronicle) */
  scenesSeen: z.array(z.string()).default([]),
  /** highest threat level unlocked for new runs */
  threatUnlocked: z.number().int().min(0).default(0),
  /** threat level picked for the next run */
  selectedThreat: z.number().int().min(0).default(0),
  /** highest threat level on which the whole campaign was finished (-1 = never) */
  bestThreatCleared: z.number().int().default(-1),
  /** furthest wave reached per threat level */
  bestWaveByThreat: z.record(z.string(), z.number()).default({})
});

export type MetaCampaign = z.infer<typeof MetaCampaignSchema>;

export const MetaStateSchema = z.object({
  version: z.number().default(1),
  refinedCogs: z.number().nonnegative().default(0),
  lifetimeCogsEarned: z.number().nonnegative().default(0),
  totalRuns: z.number().nonnegative().default(0),
  totalVictories: z.number().nonnegative().default(0),
  highestWaveReached: z.number().nonnegative().default(0),
  unlockedUpgrades: z.record(z.string(), z.number()).default({}),
  campaign: MetaCampaignSchema.default({
    parts: [],
    scenesSeen: [],
    threatUnlocked: 0,
    selectedThreat: 0,
    bestThreatCleared: -1,
    bestWaveByThreat: {}
  }),
  codex: MetaCodexSchema.default({
    seenUnits: [],
    seenMods: [],
    seenEnemies: [],
    seenCores: []
  })
});

export type MetaState = z.infer<typeof MetaStateSchema>;

