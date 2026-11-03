/**
 * Official BRASSREEL 32-Color System Palette
 * Derived from 16-bit arcade palettes with bespoke steampunk brass/copper additions.
 * Referenced in docs/ART_BIBLE.md
 */

export const PALETTE = {
  // --- Outer Shell & Contours ---
  VOID_BLACK: '#0b090f',       // 0: Deepest contour, pupil dots
  IRON_CHARCOAL: '#15121b',    // 1: Frame backdrops, dark chassis
  SLATE_PURPLE: '#231d2c',     // 2: Machine chassis bevels, shelf base
  MUTED_VIOLET: '#393047',     // 3: UI borders, speech bubbles
  LILAC_GREY: '#534764',       // 4: Button outlines, metal reflections
  LAVENDER_SMOKE: '#7b6b8d',   // 5: Cold steam clouds, metal specular
  PALE_MIST: '#b8a9c9',        // 6: Light reflections, dialogue prompts
  PARCHMENT_SILK: '#e7e0ef',   // 7: Reel paper surface, whiteout flash

  // --- Steampunk Brass, Bronze & Gold ---
  DARK_IRON: '#3a2215',        // 8: Machinery gears, gun barrels
  TARNISHED_BRONZE: '#5c381e', // 9: Secondary armor, leather grips
  ANTIQUE_BRASS: '#8c5836',    // A: Cog faction base, chassis brackets
  POLISHED_BRASS: '#b57647',   // B: Primary armor, gear teeth
  GILDED_GOLD: '#d4a373',      // C: Weapon edges, button borders, stars
  RADIANT_SPARK: '#ffd166',    // D: Spark centers, jackpot coins, glints

  // --- Lush Nature & Faction Spring ---
  FOREST_SHADOW: '#1b4332',    // E: Tree trunk shadow, deep foliage
  DEEP_GREEN: '#2d6a4f',       // F: Tree leaves mid-tone, grass border
  MEADOW_GRASS: '#40916c',     // G: Primary meadow lawn
  SPRING_LEAF: '#52b788',      // H: Faction Spring base, fletchings
  EMERALD_LIME: '#74c69d',     // I: Spring crit flashes, summon glow
  PALE_SPROUT: '#b5e48c',      // J: Summon cell highlight surface

  // --- Pyrite, Fire & Faction Fuse ---
  DRIED_BLOOD: '#4a0e17',      // K: Explosive shadows, eye cores
  RUST_BURGUNDY: '#780000',    // L: Fuse faction secondary, straps
  PYRITE_RED: '#c1121f',       // M: Lever red ball, bomb casing
  BLAZING_EMBER: '#e63946',    // N: Explosion flashes, breach alert
  FURNACE_FLAME: '#f77f00',    // O: Heat gauge high, burning fuses
  CORE_FIRE: '#fcbf49',        // P: Heat gauge mid, flame core

  // --- Cobalt, Arc & Faction Coil ---
  DEEP_ABYSS: '#03045e',       // Q: Coil dark shading, deep shadows
  MIDNIGHT_COBALT: '#023e8a',  // R: Leyden jar body, robot eyes
  ELECTRIC_BLUE: '#0077b6',    // S: Faction Coil primary armor
  ARC_CYAN: '#00b4d8',         // T: Lightning bolts, Tesla plasma
  PLASMA_WHITE: '#90e0ef',     // U: Coil attack core, electric sparks
  PURE_STARLIGHT: '#caf0f8',   // V: Projectile trails, critical glints

  // --- Sky & Parchment Accents ---
  SKY_CYAN: '#70c4e8',         // W: Act 1 summer sky
  SKY_LIGHT: '#a0d8ef',        // X: Sky horizon gradient
  SUN_CREAM: '#fed053',        // Y: Golden cream sun
  PARCHMENT_BEIGE: '#f4ecd8',  // Z: Battle window parchment frame
  TRANSPARENT: 'transparent'   // .: Empty alpha 0
} as const;

export type PaletteKey = keyof typeof PALETTE;

