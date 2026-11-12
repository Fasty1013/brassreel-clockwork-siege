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

  // Combo Multipliers for Payline Hits
  COMBO_BONUS: {
    1: { statMult: 1.0, bonusXp: 0, bonusCogs: 0 },
    2: { statMult: 1.15, bonusXp: 0, bonusCogs: 0 },
    3: { statMult: 1.30, bonusXp: 1, bonusCogs: 0 },
    4: { statMult: 1.50, bonusXp: 1, bonusCogs: 10 }
  },

  // Emergency Valve
  VALVE_SLOW_DURATION_S: 5,
  VALVE_SLOW_RATIO: 0.6,
  VALVE_HEAL_BOILER_HP: 3
} as const;

