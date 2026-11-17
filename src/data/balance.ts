export const BALANCE = {
  // Grid and Battlefield
  GRID_COLS: 8,
  GRID_ROWS: 5,
  PLAYER_DEPLOY_COLS: 4,
  MAX_FIELD_UNITS: 12,
  TICK_DELTA_MS: 50, // 20 ticks per second

  // Base Resources
  INITIAL_BOILER_HP: 10,
  INITIAL_STEAM: 3,
  STEAM_PER_WAVE: 2,
  MAX_STEAM_CAP: 5,
  INITIAL_COGS: 25,

  // Slot Machine
  FREE_SPINS_PER_WAVE: 3,
  EXTRA_SPIN_STEAM_COST: 1,
  EXTRA_SPIN_HEAT_ADD: 20,
  WAVE_HEAT_COOLDOWN: 30,
  HEAT_JAM_THRESHOLD: 60,
  MAX_HEAT_BASE: 100,
  JAM_SLOPE: 0.00875, // 0.875% per point above 60 -> 35% at 100

  // Hold & Nudge
  BASE_HOLD_CHARGES: 2,
  BASE_NUDGE_CHARGES: 1,

  // Smelt & Evolution
  SMELT_BASE_XP: 1,
  SMELT_SAME_FACTION_XP: 2,
  XP_FOR_STAR_2: 3,
  XP_FOR_STAR_3: 6,
  // Merge levels: same archetype line + same level -> level + 1
  MAX_UNIT_LEVEL: 5,
  /** reserve bench slots; a summon into a full bench melts the weakest robot */
  BENCH_CAP: 10,
  /** cogs for a melted level-1 robot (doubles per level) */
  BENCH_MELT_COGS: 3,
  /** robots allowed on the field before skill-tree upgrades */
  BASE_UNIT_CAP: 5,
  /** +50% HP and damage per level above 1 */
  LEVEL_STAT_BONUS: 0.5,
  /** reaching these levels offers an evolution branch choice */
  EVOLUTION_LEVELS: [3, 5] as readonly number[],

  // Starter Deck (10 symbols per reel)
  STARTER_REEL_1: ['cog', 'cog', 'cog', 'spring', 'spring', 'fuse', 'fuse', 'coil', 'wild', 'crown'] as const,
  STARTER_REEL_2: ['cog', 'cog', 'spring', 'spring', 'spring', 'fuse', 'coil', 'coil', 'wild', 'crown'] as const,
  STARTER_REEL_3: ['cog', 'cog', 'spring', 'fuse', 'fuse', 'fuse', 'coil', 'coil', 'wild', 'crown'] as const,

  // Shop Costs (in Cogs)
  COST_ADD_SYMBOL: 15,
  COST_REMOVE_SYMBOL_BASE: 20,
  COST_REMOVE_SYMBOL_INCREMENT: 5,
  COST_GILD_SYMBOL: 25,
  COST_SHOP_REROLL: 5,
  /** reel strip length limits for workshop edits */
  MIN_STRIP_LENGTH: 6,
  MAX_STRIP_LENGTH: 16,

  // Workshop gadgets
  SHOP_GADGET_OFFERS: 3,
  /** every passive gadget already owned makes the next one this much dearer (+50%) */
  GADGET_PASSIVE_PRICE_STEP: 0.5,
  /** consumables get dearer by this much per wave */
  GADGET_CONSUMABLE_PRICE_PER_WAVE: 0.15,

  // Combo Multipliers for Payline Hits
  COMBO_BONUS: {
    1: { statMult: 1.0, bonusXp: 0, bonusCogs: 0 },
    2: { statMult: 1.15, bonusXp: 0, bonusCogs: 0 },
    3: { statMult: 1.30, bonusXp: 1, bonusCogs: 0 },
    4: { statMult: 1.50, bonusXp: 1, bonusCogs: 10 }
  },

  // Enemy shooters: after this long without being hit they walk towards their
  // target, stopping at melee distance (in tiles)
  ENEMY_PRESS_AFTER_S: 3,
  ENEMY_PRESS_MIN_GAP: 1,
  /** campaign threat level: enemy hp and damage +30% per level */
  THREAT_ENEMY_STEP: 0.3,
  /** campaign threat level: refined cogs +50% per level */
  THREAT_REWARD_STEP: 0.5,
  /** after a stun, a boss ignores new stuns for this long (no stun-lock) */
  BOSS_STUN_IMMUNITY_S: 3,
  /**
   * Robots with no enemy in their attack range walk toward the nearest one (at their own
   * moveSpeed) until it is in range: shooters stop at their range, melee robots step in front of it.
   * While walking they keep at least this many tiles from each other.
   */
  UNIT_SEPARATION: 0.6,

  // Enemy growth. Robots get many times stronger over a run (levels,
  // evolutions, skill tree), so enemy stats are multiplied per wave. The
  // multipliers are given for these waves and interpolated in between.
  // Act 3 enemies already have much higher base stats, hence the drop at 21.
  // Tuned with tools/sim (VeteranBot): see docs/BALANCE.md. Raised ×1.25 hp / ×1.12 damage
  // when robots started walking to enemies out of reach (the run got far easier: 65% → 97% wins).
  // Raised again ×1.125 hp / ×1.06 damage when all 20 engine cores and the heat bonus started working
  // (VeteranBot 86% → 66% wins).
  ENEMY_SCALE_ANCHORS: [
    { wave: 1, hp: 1, damage: 1 },
    { wave: 10, hp: 19.7, damage: 5.9 },
    { wave: 20, hp: 84.4, damage: 19 },
    { wave: 21, hp: 56.3, damage: 14.2 },
    { wave: 30, hp: 87.2, damage: 21.3 }
  ] as ReadonlyArray<{ wave: number; hp: number; damage: number }>,

  // Emergency Valve
  VALVE_SLOW_DURATION_S: 5,
  VALVE_SLOW_RATIO: 0.6,
  VALVE_HEAL_BOILER_HP: 3
} as const;

/** Stat multipliers for enemies spawned on the given wave (1-based). */
export function enemyWaveScale(waveNumber: number): { hp: number; damage: number } {
  const anchors = BALANCE.ENEMY_SCALE_ANCHORS;
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (waveNumber <= first.wave) return { hp: first.hp, damage: first.damage };
  if (waveNumber >= last.wave) return { hp: last.hp, damage: last.damage };
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (waveNumber <= b.wave) {
      const t = (waveNumber - a.wave) / (b.wave - a.wave);
      return { hp: a.hp + (b.hp - a.hp) * t, damage: a.damage + (b.damage - a.damage) * t };
    }
  }
  return { hp: last.hp, damage: last.damage };
}
