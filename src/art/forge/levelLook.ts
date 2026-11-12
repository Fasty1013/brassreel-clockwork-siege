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
      else if (level >= 3) shade.push([x, y]);
    }
  }
  for (const [x, y] of lit) g.px(x, y, RIM[level]);
  for (const [x, y] of shade) g.px(x, y, RIM_DARK[level]);

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
