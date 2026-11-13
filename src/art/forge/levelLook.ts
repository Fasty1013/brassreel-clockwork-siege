import { OUTLINE, PixelCanvas } from './PixelCanvas';
import { Pose } from './automaton';

/** Phaser-free so offline tools can preview it too. */
// ---------------------------------------------------------------- level looks
const RIM: Record<number, string> = { 2: '#e8905a', 3: '#e4e2f0', 4: '#ffd166', 5: '#ffe98a' };
const RIM_DARK: Record<number, string> = { 2: '#7a3320', 3: '#6a6280', 4: '#a8641f', 5: '#6d3fa8' };
const AURA = '#a071e0';

export function applyLevelLook(g: PixelCanvas, level: number, p: Pose): void {
  const W = g.w;
  const H = g.h;
  const solid = (x: number, y: number): boolean => {
    const c = g.at(x, y);
    return c !== null && c !== OUTLINE;
  };
  const empty = (x: number, y: number): boolean => g.at(x, y) === null;

  // 1) recolour the outer contour: lit side (top/left) bright, shade side darker metal
  const lit: Array<[number, number]> = [];
  const shade: Array<[number, number]> = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g.at(x, y) !== OUTLINE) continue;
      const outer = empty(x - 1, y) || empty(x, y - 1) || empty(x + 1, y) || empty(x, y + 1);
      if (!outer) continue;
      if ((empty(x, y - 1) && solid(x, y + 1)) || (empty(x - 1, y) && solid(x + 1, y))) lit.push([x, y]);
      else if (level >= 2) shade.push([x, y]);
    }
  }
  for (const [x, y] of lit) g.px(x, y, RIM[level]);
  for (const [x, y] of shade) g.px(x, y, RIM_DARK[level]);

  // 1b) rank insignia that read at a glance on the battlefield:
  //     2★/3★ — a plume on the head, 4★/5★ — a crown; a medal on the chest from 2★
  drawInsignia(g, level);

  // 2) level-5 aura: a second violet halo outside the contour + orbiting sparks
  if (level >= 5) {
    const halo: Array<[number, number]> = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!empty(x, y)) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const c = g.at(x + dx, y + dy);
          return c === RIM[5] || c === RIM_DARK[5];
        });
        if (near && (x + y + p.t) % 2 === 0) halo.push([x, y]);
      }
    }
    for (const [x, y] of halo) g.px(x, y, AURA);
  }

  // 3) shiny rivets scattered on the body grow with level (2 → 8)
  let placed = 0;
  const want = level * 2 - 2;
  for (let y = 2; y < H - 4 && placed < want; y += 5) {
    for (let x = 3 + (y % 3); x < W - 3 && placed < want; x += 7) {
      if (solid(x, y) && solid(x - 1, y) && solid(x + 1, y) && solid(x, y + 1) && solid(x, y - 1)) {
        g.px(x, y, RIM[level]);
        placed++;
      }
    }
  }

  // 4) sparkles that twinkle around high-level units
  if (level >= 4) {
    // hug the figure's bounding box so sparks sit right next to the robot
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.at(x, y) === null) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const spots: Array<[number, number]> = [
      [x0 - 1, y0 + 2], [x1 + 1, y0 + 4], [x0, y1 - 5], [x1, y1 - 8]
    ];
    const [sx, sy] = spots[p.t & 3];
    g.px(sx, sy, '#ffffff');
    g.px(sx - 1, sy, RIM[level]);
    g.px(sx + 1, sy, RIM[level]);
    g.px(sx, sy - 1, RIM[level]);
    g.px(sx, sy + 1, RIM[level]);
  }
}

// ---------------------------------------------------------------- insignia
const MEDAL: Record<number, [string, string]> = {
  2: ['#c8693a', '#ffb27a'],
  3: ['#8d88a8', '#ffffff'],
  4: ['#c98a1c', '#fff3b0'],
  5: ['#c98a1c', '#fff3b0']
};

/** Plume (2★, 3★) or crown (4★, 5★) on the head, medal on the chest. */
function drawInsignia(g: PixelCanvas, level: number): void {
  const W = g.w;
  const H = g.h;
  const filled = (x: number, y: number): boolean => g.at(x, y) !== null;
  const body = (x: number, y: number): boolean => {
    const c = g.at(x, y);
    return c !== null && c !== OUTLINE;
  };

  // body centre = centroid of all pixels; weapons stick out, the body mass does not
  let sx = 0, n = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!filled(x, y)) continue;
    sx += x; n++; y1 = Math.max(y1, y);
  }
  if (!n) return;
  const cx = Math.round(sx / n);

  // head top: first row with pixels near the centre column
  let top = -1;
  for (let y = 0; y < H && top < 0; y++) {
    for (let x = cx - 3; x <= cx + 3; x++) if (filled(x, y)) { top = y; break; }
  }
  if (top < 0) return;
  // centre of the pixel run on that row closest to cx
  let best = cx, bestD = Infinity;
  for (let x = cx - 3; x <= cx + 3; x++) if (filled(x, top) && Math.abs(x - cx) < bestD) { best = x; bestD = Math.abs(x - cx); }
  let l = best, r = best;
  while (filled(l - 1, top)) l--;
  while (filled(r + 1, top)) r++;
  const hx = Math.round((l + r) / 2);

  const [metal, shine] = MEDAL[level];
  if (level <= 3) {
    // plume: a 2-px wide feather leaning back, bright tip
    const hgt = level === 2 ? 4 : 5;
    for (let i = 1; i <= hgt; i++) {
      const x = hx - Math.floor(i / 2);
      g.px(x, top - i, i === hgt ? shine : metal);
      g.px(x + 1, top - i, i >= hgt - 1 ? shine : metal);
    }
    for (let i = 1; i <= hgt + 1; i++) {
      const x = hx - Math.floor(i / 2);
      if (!filled(x - 1, top - i)) g.px(x - 1, top - i, OUTLINE);
      if (!filled(x + 2, top - i)) g.px(x + 2, top - i, OUTLINE);
    }
    g.px(hx - Math.floor((hgt + 1) / 2), top - hgt - 1, OUTLINE);
    g.px(hx - Math.floor((hgt + 1) / 2) + 1, top - hgt - 1, OUTLINE);
  } else {
    // crown: 7 px band with three spikes and a gem
    const by = top - 1;
    for (let x = hx - 3; x <= hx + 3; x++) {
      g.px(x, by, metal);
      g.px(x, by - 1, shine);
    }
    for (const dx of [-3, 0, 3]) {
      g.px(hx + dx, by - 2, metal);
      g.px(hx + dx, by - 3, shine);
    }
    g.px(hx, by, level === 5 ? '#a071e0' : '#e63946');
    // outline around the crown
    const crown = (x: number, y: number): boolean =>
      (y === by || y === by - 1) ? Math.abs(x - hx) <= 3 : (y === by - 2 || y === by - 3) && [-3, 0, 3].includes(x - hx);
    for (let y = by - 4; y <= by; y++) for (let x = hx - 4; x <= hx + 4; x++) {
      if (crown(x, y) || filled(x, y)) continue;
      if (crown(x + 1, y) || crown(x - 1, y) || crown(x, y + 1) || crown(x, y - 1)) g.px(x, y, OUTLINE);
    }
  }

  // medal on the chest: find a 3×3 patch of body near 55% of the height
  const ty = Math.round(top + (y1 - top) * 0.5);
  for (let d = 0; d <= 4; d++) {
    for (const [mx, my] of [[cx, ty + d], [cx - d, ty], [cx + d, ty], [cx, ty - d], [cx - d, ty + d], [cx + d, ty + d]]) {
      let ok = true;
      for (let yy = -1; yy <= 1 && ok; yy++) for (let xx = -1; xx <= 1 && ok; xx++) ok = body(mx + xx, my + yy);
      if (!ok) continue;
      // star-shaped medal: bright core, metal arms, dark corners for contrast
      g.px(mx - 1, my - 1, OUTLINE); g.px(mx + 1, my - 1, OUTLINE);
      g.px(mx - 1, my + 1, OUTLINE); g.px(mx + 1, my + 1, OUTLINE);
      g.px(mx, my - 1, metal); g.px(mx - 1, my, metal); g.px(mx + 1, my, metal); g.px(mx, my + 1, metal);
      g.px(mx, my, shine);
      return;
    }
  }
}
