/**
 * Enemy mutations: enemies evolve as the run goes on. Each mutation punishes a placement
 * mistake, so a good formation is what beats them. Tier 1–3 follows the act.
 * Numbers per tier are [tier 1, tier 2, tier 3].
 */

export type MutationId = 'armored' | 'shielded' | 'leaper' | 'bomber' | 'flanker' | 'sniper';

export interface MutationDefinition {
  id: MutationId;
  nameKey: string;
  descKey: string;
  /** short badge drawn over the enemy */
  badge: string;
  /** what the mutation punishes, for the scouting line before the wave */
  counterKey: string;
  params: Record<string, [number, number, number]>;
}

export const MUTATIONS_DATA: Record<MutationId, MutationDefinition> = {
  armored: {
    id: 'armored',
    nameKey: 'mutation.armored.name',
    descKey: 'mutation.armored.desc',
    badge: '▣',
    counterKey: 'mutation.armored.counter',
    params: { damageReductionPct: [0.2, 0.3, 0.4] }
  },
  shielded: {
    id: 'shielded',
    nameKey: 'mutation.shielded.name',
    descKey: 'mutation.shielded.desc',
    badge: '◈',
    counterKey: 'mutation.shielded.counter',
    params: { shieldPctOfHp: [0.25, 0.4, 0.6] }
  },
  leaper: {
    id: 'leaper',
    nameKey: 'mutation.leaper.name',
    descKey: 'mutation.leaper.desc',
    badge: '⤼',
    counterKey: 'mutation.leaper.counter',
    params: { leaps: [1, 1, 2], landingTiles: [1, 1, 1] }
  },
  bomber: {
    id: 'bomber',
    nameKey: 'mutation.bomber.name',
    descKey: 'mutation.bomber.desc',
    badge: '✹',
    counterKey: 'mutation.bomber.counter',
    params: { blastDamageMult: [1.5, 2.5, 3.5], radiusTiles: [1.2, 1.2, 1.2] }
  },
  flanker: {
    id: 'flanker',
    nameKey: 'mutation.flanker.name',
    descKey: 'mutation.flanker.desc',
    badge: '⇅',
    counterKey: 'mutation.flanker.counter',
    params: { speedPct: [0.1, 0.2, 0.3] }
  },
  sniper: {
    id: 'sniper',
    nameKey: 'mutation.sniper.name',
    descKey: 'mutation.sniper.desc',
    badge: '⌖',
    counterKey: 'mutation.sniper.counter',
    params: { bonusRange: [2, 2, 3], damagePct: [0, 0.15, 0.3] }
  }
};

export const MUTATION_IDS = Object.keys(MUTATIONS_DATA) as MutationId[];

/** Mutations a boss may carry (the moving ones would make it skip the whole line). */
export const BOSS_MUTATIONS: MutationId[] = ['armored', 'shielded', 'bomber'];
