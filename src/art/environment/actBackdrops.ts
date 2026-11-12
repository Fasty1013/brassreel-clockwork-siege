import type Phaser from 'phaser';

/**
 * Battlefield backdrops for the three acts, painted at native 342×219 and shown
 * at an exact ×4 inside the battle window (1368×876), so every art pixel is a
 * crisp 4×4 block. The ground is laid out on the 8×5 grid (tile = 35×18 native)
 * with a soft checker so lanes stay readable under the units.
 *
 *   bg_act1 — Brass Meadow (day)       bg_act2 — Rust Marsh (haze)
 *   bg_act3 — Baron's Citadel (dusk)   bg_meadow_day — alias of act 1
 */

export const BG_W = 342;
export const BG_H = 219;
export const BG_SCALE = 4;

/** Ground layout in native px (matches GridView at x=560,y=580 on screen). */
const GRID_X = 17;
const GRID_Y = 119;
const TILE_W = 35;
const TILE_H = 18;
const GRID_BOTTOM = GRID_Y + TILE_H * 5;
const HORIZON = 112;

type Ctx = CanvasRenderingContext2D;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Filled pixel ellipse. */
function blob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    r(ctx, cx - half, cy + y, half * 2 + 1, 1, c);
  }
}

function skyBands(ctx: Ctx, colors: string[], bottom: number): void {
  const h = Math.ceil(bottom / colors.length);
  colors.forEach((c, i) => r(ctx, 0, i * h, BG_W, h + 1, c));
  // dithered seams between bands
  for (let i = 1; i < colors.length; i++) {
    const y = i * h;
    for (let x = 0; x < BG_W; x += 2) r(ctx, x + ((y >> 1) & 1), y - 1, 1, 1, colors[i]);
    for (let x = 1; x < BG_W; x += 2) r(ctx, x, y, 1, 1, colors[i - 1]);
  }
}

/** Puffy cloud: three stacked blobs with a lit top and a shaded belly. */
function cloud(ctx: Ctx, x: number, y: number, s: number, lit: string, mid: string, shade: string): void {
  blob(ctx, x, y + 2, 9 * s, 4 * s, shade);
  blob(ctx, x - 6 * s, y, 6 * s, 4 * s, mid);
  blob(ctx, x + 5 * s, y - 1, 7 * s, 5 * s, mid);
  blob(ctx, x, y - 3 * s, 6 * s, 5 * s, mid);
  blob(ctx, x - 1 * s, y - 4 * s, 4 * s, 3 * s, lit);
  blob(ctx, x + 6 * s, y - 2 * s, 4 * s, 3 * s, lit);
  r(ctx, x - 14 * s, y + 3 * s, 28 * s, 2, shade);
}

/** Rolling ridge line from `base` with sin-noise amplitude. */
function ridge(ctx: Ctx, base: number, amp: number, freq: number, phase: number, c: string, rand?: () => number): void {
  for (let x = 0; x < BG_W; x++) {
    const n = Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase * 1.3) * amp * 0.35;
    const top = Math.round(base - n - (rand ? rand() * 0.8 : 0));
    r(ctx, x, top, 1, HORIZON + 4 - top, c);
  }
}

/** Grid checker ground with a front lip and a far-edge strip. */
function ground(ctx: Ctx, a: string, b: string, edge: string, edgeDark: string, lip: string): void {
  r(ctx, 0, HORIZON, BG_W, BG_H - HORIZON, a);
  // far meadow strip between horizon and the grid
  r(ctx, 0, HORIZON, BG_W, GRID_Y - HORIZON, edge);
  r(ctx, 0, HORIZON, BG_W, 1, edgeDark);
  for (let y = GRID_Y; y < GRID_BOTTOM; y++) {
    for (let x = 0; x < BG_W; x++) {
      const col = Math.floor((x - GRID_X) / TILE_W);
      const row = Math.floor((y - GRID_Y) / TILE_H);
      if (((col + row) & 1) === 0) continue;
      r(ctx, x, y, 1, 1, b);
    }
  }
  r(ctx, 0, GRID_BOTTOM, BG_W, BG_H - GRID_BOTTOM, lip);
}

function tufts(ctx: Ctx, rand: () => number, n: number, c1: string, c2: string, y0 = GRID_Y, y1 = GRID_BOTTOM): void {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * BG_W);
    const y = Math.floor(y0 + rand() * (y1 - y0));
    r(ctx, x, y, 1, 2, c1);
    r(ctx, x + 1, y + 1, 1, 1, c2);
    r(ctx, x - 1, y + 1, 1, 1, c2);
  }
}

function factory(ctx: Ctx, x: number, base: number, w: number, h: number, c: string, win: string | null, rand: () => number, puff?: string): void {
  r(ctx, x, base - h, w, h, c);
  // saw-tooth roof
  for (let i = 0; i < w; i += 6) {
    for (let j = 0; j < 4; j++) r(ctx, x + i + j, base - h - j, 6 - j, 1, c);
  }
  // chimney
  const cx = x + Math.floor(w * 0.7);
  const ch = 10 + Math.floor(rand() * 10);
  r(ctx, cx, base - h - ch, 3, ch, c);
  r(ctx, cx - 1, base - h - ch, 5, 1, c);
  if (puff) {
    // short smoke trail leaning with the wind
    for (let i = 0; i < 4; i++) blob(ctx, cx + 1 + i * 2, base - h - ch - 2 - i * 3, 1 + (i >> 1), 1 + (i >> 1), puff);
  }
  if (win) {
    for (let i = 3; i < w - 3; i += 5) {
      if (rand() < 0.55) r(ctx, x + i, base - h + 4, 2, 2, win);
    }
  }
}

function smoke(ctx: Ctx, x: number, y: number, colors: string[], len: number, drift: number): void {
  for (let i = 0; i < len; i++) {
    const c = colors[Math.min(colors.length - 1, Math.floor((i / len) * colors.length))];
    blob(ctx, x + i * drift, y - i * 4, 2 + (i >> 1), 2 + (i >> 2), c);
  }
}

function fence(ctx: Ctx, post: string, postLit: string, rail: string, railDark: string): void {
  const y = GRID_BOTTOM + 1;
  r(ctx, 0, y + 3, BG_W, 2, rail);
  r(ctx, 0, y + 5, BG_W, 1, railDark);
  r(ctx, 0, y + 9, BG_W, 2, rail);
  r(ctx, 0, y + 11, BG_W, 1, railDark);
  for (let x = 4; x < BG_W; x += 15) {
    r(ctx, x, y, 3, 14, post);
    r(ctx, x, y, 1, 14, postLit);
    r(ctx, x, y - 1, 3, 1, postLit);
  }
}

// =====================================================================
// ACT 1 — Brass Meadow
// =====================================================================
function paintAct1(ctx: Ctx): void {
  const rand = rng(1101);
  skyBands(ctx, ['#4f9fd6', '#5eb0e0', '#72c1e8', '#8fd0ee', '#addcf2'], HORIZON);
  // sun
  blob(ctx, 250, 46, 22, 22, '#ffe6a6');
  blob(ctx, 250, 46, 18, 18, '#fff1c4');
  blob(ctx, 247, 43, 10, 10, '#fffbe8');
  // clouds
  cloud(ctx, 60, 30, 1.6, '#ffffff', '#eef6fb', '#c9dfee');
  cloud(ctx, 170, 52, 1.1, '#ffffff', '#eef6fb', '#c9dfee');
  cloud(ctx, 305, 22, 1.3, '#ffffff', '#eef6fb', '#c9dfee');
  // far hills
  ridge(ctx, 92, 6, 0.035, 0.4, '#8cb9c9');
  // town skyline
  const skyline = '#6f8fa8';
  for (let x = 6; x < BG_W - 10; x += 22 + Math.floor(rand() * 18)) {
    factory(ctx, x, 100, 14 + Math.floor(rand() * 10), 8 + Math.floor(rand() * 10), skyline, null, rand, '#d2e2ec');
  }
  // clock tower
  r(ctx, 134, 64, 9, 40, '#5e7a92');
  r(ctx, 132, 62, 13, 3, '#5e7a92');
  for (let j = 0; j < 6; j++) r(ctx, 138 - (j >> 1), 56 + j, 1 + (j >> 1) * 2, 1, '#5e7a92');
  blob(ctx, 138, 72, 3, 3, '#f6e6b8');
  r(ctx, 138, 70, 1, 3, '#5e7a92');
  // near hills + tree line
  ridge(ctx, 104, 4, 0.05, 2.0, '#5f9a62');
  for (let x = -4; x < BG_W; x += 7 + Math.floor(rand() * 6)) {
    const h = 6 + Math.floor(rand() * 7);
    blob(ctx, x, HORIZON - h + 2, 4 + Math.floor(rand() * 3), h, '#3f7a4f');
    blob(ctx, x - 1, HORIZON - h, 2, 2, '#4f8f5c');
  }
  ground(ctx, '#62a64c', '#5a9b46', '#4f8f42', '#3a6f36', '#46803c');
  tufts(ctx, rand, 140, '#78bd5a', '#4f8f42');
  // flowers
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * BG_W);
    const y = Math.floor(GRID_Y + rand() * (GRID_BOTTOM - GRID_Y));
    r(ctx, x, y, 1, 1, ['#ffe066', '#ffffff', '#ff9ec1'][i % 3]);
  }
  // dirt road on the far strip
  for (let x = 0; x < BG_W; x++) {
    if ((x * 7) % 11 < 3) r(ctx, x, HORIZON + 3, 1, 1, '#8a7a4a');
  }
  fence(ctx, '#7a4a28', '#a8683a', '#8c5a32', '#5c3820');
}

// =====================================================================
// ACT 2 — Rust Marsh
// =====================================================================
function paintAct2(ctx: Ctx): void {
  const rand = rng(2202);
  skyBands(ctx, ['#2f4a46', '#3d5c52', '#4f6e5c', '#647f64', '#7b906c'], HORIZON);
  // sickly sun behind haze
  blob(ctx, 90, 50, 16, 16, '#9fb27a');
  blob(ctx, 90, 50, 12, 12, '#c8d690');
  r(ctx, 70, 47, 42, 2, '#7b906c');
  r(ctx, 66, 55, 50, 1, '#7b906c');
  // far rusted refinery
  const far = '#425a4e';
  for (let x = 150; x < BG_W; x += 26 + Math.floor(rand() * 12)) {
    factory(ctx, x, 104, 16 + Math.floor(rand() * 8), 10 + Math.floor(rand() * 14), far, '#b4ff3a', rand, '#5f7258');
  }
  // giant broken pipe arcing across the sky
  for (let a = 0; a <= 40; a++) {
    const t = a / 40;
    const x = 10 + t * 120;
    const y = 104 - Math.sin(t * Math.PI) * 52;
    blob(ctx, x, y, 3, 3, '#6b3b2a');
    r(ctx, x - 1, y - 2, 2, 1, '#a85a3a');
  }
  // rusted flange where the pipe sinks into the mud
  r(ctx, 126, 104, 8, 3, '#3d1f1c');
  r(ctx, 126, 104, 8, 1, '#a85a3a');
  // fog band
  for (let x = 0; x < BG_W; x += 2) r(ctx, x, 96 + ((x >> 3) & 1), 2, 3, '#8a9c7a');
  // dead trees
  const dead = '#26322a';
  for (const tx of [26, 140, 232, 318]) {
    const th = 18 + Math.floor(rand() * 10);
    r(ctx, tx, HORIZON - th, 2, th, dead);
    for (let k = 0; k < 3; k++) {
      const by = HORIZON - th + 3 + k * 5;
      const dir = k % 2 === 0 ? 1 : -1;
      for (let i = 0; i < 5; i++) r(ctx, tx + (dir > 0 ? 2 + i : -1 - i), by - (i >> 1), 1, 1, dead);
    }
  }
  ridge(ctx, 108, 3, 0.07, 1.2, '#3a4a34', rand);
  ground(ctx, '#56603a', '#4f5934', '#454e2e', '#2f3620', '#3c4528');
  // murky water pools on the far strip and the lip
  for (const [x, w] of [[30, 24], [120, 30], [230, 20], [300, 26]] as const) {
    blob(ctx, x, HORIZON + 3, Math.floor(w / 2), 2, '#2c4a3a');
    r(ctx, x - (w >> 2), HORIZON + 2, w >> 1, 1, '#8fd12e');
  }
  tufts(ctx, rand, 110, '#6f7a44', '#3c4528');
  // toxic bubbles
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rand() * BG_W);
    const y = Math.floor(GRID_Y + rand() * (GRID_BOTTOM - GRID_Y));
    r(ctx, x, y, 1, 1, '#8fd12e');
  }
  // reeds along the bottom
  for (let x = 0; x < BG_W; x += 3) {
    const h = 4 + Math.floor(rand() * 6);
    r(ctx, x, BG_H - h, 1, h, '#4e5a2e');
    if (rand() < 0.3) r(ctx, x, BG_H - h - 2, 1, 2, '#7a3b2a');
  }
  fence(ctx, '#5a3a2a', '#8a5a3a', '#6b3b2a', '#3d1f1c');
}

// =====================================================================
// ACT 3 — Baron's Citadel
// =====================================================================
function paintAct3(ctx: Ctx): void {
  const rand = rng(3303);
  skyBands(ctx, ['#1d0f1e', '#341424', '#5a1c28', '#8a2e2c', '#c25a32', '#e0873e'], HORIZON);
  // stars in the dark top
  for (let i = 0; i < 30; i++) r(ctx, Math.floor(rand() * BG_W), Math.floor(rand() * 30), 1, 1, '#f4d6c8');
  // blood moon
  blob(ctx, 60, 34, 12, 12, '#ff9a6a');
  blob(ctx, 62, 32, 9, 9, '#ffc49a');
  // citadel
  const c1 = '#2a1620';
  const c2 = '#1d0f17';
  r(ctx, 120, 60, 110, 52, c1);
  for (let i = 0; i < 110; i += 6) r(ctx, 120 + i, 57, 3, 3, c1);
  const towers: Array<[number, number, number]> = [[112, 30, 14], [150, 18, 12], [182, 8, 16], [218, 26, 14], [240, 40, 10]];
  for (const [x, top, w] of towers) {
    r(ctx, x, top, w, 112 - top, c2);
    for (let j = 0; j < Math.ceil(w / 2); j++) r(ctx, x + j, top - 1 - j, w - j * 2, 1, c2);
    for (let wy = top + 6; wy < 100; wy += 9) {
      if (rand() < 0.75) r(ctx, x + (w >> 1) - 1, wy, 2, 3, '#ffb347');
    }
  }
  // great furnace gate
  blob(ctx, 175, 104, 14, 12, '#3a1a20');
  blob(ctx, 175, 106, 10, 8, '#ff7a2e');
  blob(ctx, 175, 108, 6, 4, '#ffd166');
  // smoke columns
  smoke(ctx, 156, 14, ['#3a2228', '#2e1c22', '#24161b'], 10, 3);
  smoke(ctx, 190, 4, ['#3a2228', '#2e1c22', '#24161b'], 8, 4);
  // flanking slag heaps
  ridge(ctx, 108, 5, 0.06, 0.7, '#2e1a1e', rand);
  ground(ctx, '#423d52', '#3a3648', '#2f2b3c', '#1c1a26', '#2b2733');
  // iron plate seams + rivets on the grid
  for (let row = 0; row <= 5; row++) r(ctx, 0, GRID_Y + row * TILE_H, BG_W, 1, '#2b2733');
  for (let col = 0; col <= 9; col++) r(ctx, GRID_X + col * TILE_W, GRID_Y, 1, TILE_H * 5, '#2b2733');
  for (let row = 0; row < 5; row++) {
    for (let col = -1; col < 9; col++) {
      const x = GRID_X + col * TILE_W;
      const y = GRID_Y + row * TILE_H;
      r(ctx, x + 2, y + 2, 1, 1, '#5a556e');
      r(ctx, x + TILE_W - 3, y + 2, 1, 1, '#5a556e');
      r(ctx, x + 2, y + TILE_H - 3, 1, 1, '#24212e');
      r(ctx, x + TILE_W - 3, y + TILE_H - 3, 1, 1, '#24212e');
    }
  }
  // glowing cracks
  for (let i = 0; i < 9; i++) {
    let x = Math.floor(rand() * BG_W);
    let y = Math.floor(GRID_Y + 3 + rand() * (GRID_BOTTOM - GRID_Y - 6));
    for (let k = 0; k < 6; k++) {
      r(ctx, x, y, 1, 1, k % 3 === 0 ? '#ffd166' : '#e2581a');
      x += 1;
      y += rand() < 0.5 ? 0 : rand() < 0.5 ? 1 : -1;
    }
  }
  // ember sparks in the air
  for (let i = 0; i < 26; i++) r(ctx, Math.floor(rand() * BG_W), Math.floor(40 + rand() * 70), 1, 1, '#ffb347');
  fence(ctx, '#3a3648', '#5a556e', '#4a4658', '#1c1a26');
  for (let x = 4; x < BG_W; x += 15) r(ctx, x + 1, GRID_BOTTOM - 1, 1, 1, '#c9283a');
}

export const PAINTERS: Record<string, (ctx: Ctx) => void> = {
  bg_act1: paintAct1,
  bg_act2: paintAct2,
  bg_act3: paintAct3
};

export function registerActBackdrops(tm: Phaser.Textures.TextureManager): void {
  for (const [key, paint] of Object.entries(PAINTERS)) {
    if (tm.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = BG_W;
    canvas.height = BG_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    tm.addCanvas(key, canvas);
  }
}

export function actBackdropKey(act: number): string {
  return `bg_act${Math.min(3, Math.max(1, act))}`;
}
