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
