/** Render resolution presets (16:9). No Phaser here, so the choice can be tested in Node. */

export interface Resolution {
  id: string;
  w: number;
  h: number;
}

export const RESOLUTIONS: Resolution[] = [
  { id: '960x540', w: 960, h: 540 },
  { id: '1280x720', w: 1280, h: 720 },
  { id: '1600x900', w: 1600, h: 900 },
  { id: '1920x1080', w: 1920, h: 1080 },
  { id: '2560x1440', w: 2560, h: 1440 }
];

/**
 * Largest preset not taller than the screen area (`heightPx` real pixels);
 * the smallest preset on tiny screens. 2 px of slack absorb rounding (1079 → 1080).
 */
export function pickResolution(heightPx: number): Resolution {
  let pick = RESOLUTIONS[0];
  for (const r of RESOLUTIONS) if (r.h <= heightPx + 2) pick = r;
  return pick;
}

/** The game world is always 1080 tall; its width follows the screen between 16:9 and 21:9. */
export const WORLD_H = 1080;
export const MIN_WORLD_W = 1920;
export const MAX_WORLD_W = 2560;

/**
 * World width for a screen area of this shape: wide phones (20:9) and ultrawide
 * monitors get a wider world instead of bars at the sides; narrower screens
 * (4:3 tablets) keep 1920 and get bars above and below. A multiple of 8, so the
 * ×4 battlefield art stays pixel-exact on both sides.
 */
export function worldWidthFor(areaW: number, areaH: number): number {
  if (!(areaW > 0 && areaH > 0)) return MIN_WORLD_W;
  const w = Math.round((WORLD_H * areaW) / areaH / 8) * 8;
  return Math.min(MAX_WORLD_W, Math.max(MIN_WORLD_W, w));
}

/** Canvas size for a preset (its height) and a world width: same shape as the world. */
export function canvasSize(preset: Resolution, worldW: number): { w: number; h: number } {
  return { w: Math.round((preset.h * worldW) / WORLD_H / 2) * 2, h: preset.h };
}
