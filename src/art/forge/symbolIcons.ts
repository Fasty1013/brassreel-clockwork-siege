import type Phaser from 'phaser';
import { OUTLINE, PixelCanvas } from './PixelCanvas';
import { C, R } from './ramps';

/**
 * Slot-machine symbol icons, 24×24 native (shown ×3 on the reels).
 * Each also gets a `<key>_gilded` variant with a golden contour.
 */

export const SYMBOL_SIZE = 24;

type Draw = (g: PixelCanvas) => void;

function gear(g: PixelCanvas): void {
  const cx = 11.5;
  const cy = 11.5;
  // teeth
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const tx = Math.round(cx + Math.cos(a) * 8 - 1.5);
    const ty = Math.round(cy + Math.sin(a) * 8 - 1.5);
    g.box(tx, ty, 4, 4, R.brass, false);
    g.px(tx + 1, ty + 1, R.brass[3]);
  }
  g.oval(5, 5, 14, 14, R.brass);
  g.oval(7, 7, 10, 10, R.bronze);
  g.oval(8, 8, 8, 8, R.brass);
  g.oval(10, 10, 4, 4, OUTLINE);
  g.px(7, 8, R.brass[3]);
  g.px(8, 7, R.brass[3]);
}

function spring(g: PixelCanvas): void {
  // open coil: 5 turns with visible gaps, back strands darker
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 4;
    g.line(6, y + 3, 17, y + 1, R.green[0]);
  }
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 4;
    g.line(6, y, 17, y + 3, R.green[2]);
    g.line(6, y + 1, 17, y + 4, R.green[1]);
    g.px(8, y + 1, R.green[3]);
  }
  g.box(4, 1, 16, 3, R.brass, false);
  g.box(4, 20, 16, 3, R.brass, false);
}

function fuse(g: PixelCanvas): void {
  // two dynamite sticks bound together
  for (const [x, ramp] of [[5, R.red], [11, R.red]] as const) {
    g.box(x, 8, 7, 14, ramp, false);
    g.vl(x + 1, 9, 12, ramp[2]);
  }
  g.hl(5, 12, 13, R.wood[1]);
  g.hl(5, 18, 13, R.wood[1]);
  g.hl(5, 13, 13, R.wood[0]);
  g.hl(5, 19, 13, R.wood[0]);
  // fuse wire + spark
  g.line(14, 7, 16, 4, R.bone[1]);
  g.px(17, 3, R.bone[1]);
  g.px(18, 2, C.fire2);
  g.px(19, 1, C.fire1);
  g.px(18, 1, C.white);
  g.px(20, 2, C.fire2);
  g.px(19, 3, C.fire1);
}

function coil(g: PixelCanvas): void {
  // lightning bolt
  const bolt: Array<[number, number, number]> = [
    [13, 1, 6], [12, 2, 6], [11, 3, 6], [10, 4, 6], [9, 5, 6], [8, 6, 6], [7, 7, 6], [6, 8, 6],
    [6, 9, 12], [6, 10, 12], [11, 11, 6], [10, 12, 6], [9, 13, 6], [8, 14, 6], [7, 15, 5],
    [7, 16, 4], [6, 17, 4], [6, 18, 3], [5, 19, 3], [5, 20, 2], [4, 21, 2], [4, 22, 1]
  ];
  for (const [x, y, w] of bolt) {
    for (let i = 0; i < w; i++) {
      const c = i === 0 ? R.cyan[3] : i < 2 ? R.cyan[2] : i < w - 1 ? R.blue[2] : R.blue[1];
      g.px(x + i + 1, y, c);
    }
  }
  g.px(4, 4, C.arc);
  g.px(19, 15, C.arc);
  g.px(20, 14, R.cyan[2]);
}

function wild(g: PixelCanvas): void {
  // faceted violet gem
  const top = 4;
  for (let j = 0; j < 6; j++) {
    const half = 4 + j;
    for (let i = -half; i <= half; i++) {
      const c = i < -half / 3 ? R.violet[2] : i > half / 3 ? R.violet[0] : R.violet[1];
      g.px(12 + i, top + j, j === 0 ? R.violet[3] : c);
    }
  }
  for (let j = 0; j < 11; j++) {
    const half = 9 - Math.round(j * 0.9);
    for (let i = -half; i <= half; i++) {
      const c = i < -1 ? R.violet[1] : i > 1 ? R.violet[0] : R.violet[2];
      g.px(12 + i, top + 6 + j, c);
    }
  }
  g.hl(4, top + 6, 17, R.violet[3]);
  g.px(8, top + 2, C.white);
  g.px(9, top + 3, C.white);
  // sparkle
  g.px(20, 2, C.white);
  g.px(19, 2, R.violet[3]);
  g.px(21, 2, R.violet[3]);
  g.px(20, 1, R.violet[3]);
  g.px(20, 3, R.violet[3]);
}

function crown(g: PixelCanvas): void {
  const gd = R.gold;
  g.box(3, 15, 18, 6, gd, false);
  g.hl(3, 17, 18, gd[0]);
  // points
  const pts: Array<[number, number]> = [[3, 6], [8, 9], [12, 4], [16, 9], [20, 6]];
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k];
    const [x1, y1] = pts[k + 1];
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / Math.max(1, x1 - x0);
      const y = Math.round(y0 + (y1 - y0) * t);
      g.vl(x, y, 15 - y, x < 12 ? gd[2] : gd[1]);
    }
  }
  for (const [x, y] of [[3, 6], [12, 4], [20, 6]]) {
    g.oval(x - 1, y - 2, 3, 3, gd);
    g.px(x, y - 2, gd[3]);
  }
  g.rect(11, 17, 3, 2, R.red[2]);
  g.px(11, 17, R.red[3]);
  g.rect(6, 17, 2, 2, R.blue[2]);
  g.rect(17, 17, 2, 2, R.green[2]);
}

const ICONS: Record<string, Draw> = {
  sym_cog: gear,
  sym_spring: spring,
  sym_fuse: fuse,
  sym_coil: coil,
  sym_wild: wild,
  sym_crown: crown
};

export function renderSymbol(key: string, gilded: boolean): PixelCanvas | null {
  const draw = ICONS[key];
  if (!draw) return null;
  const g = new PixelCanvas(SYMBOL_SIZE, SYMBOL_SIZE);
  g.begin();
  draw(g);
  g.end(gilded ? R.gold[2] : OUTLINE);
  if (gilded) g.outline(R.gold[0]);
  return g;
}

export const SYMBOL_KEYS = Object.keys(ICONS);

/** Register `sym_*` and `sym_*_gilded` textures (replacing older placeholders). */
export function registerSymbolIcons(tm: Phaser.Textures.TextureManager): void {
  for (const key of SYMBOL_KEYS) {
    for (const gilded of [false, true]) {
      const texKey = gilded ? `${key}_gilded` : key;
      const g = renderSymbol(key, gilded);
      if (!g) continue;
      const canvas = document.createElement('canvas');
      canvas.width = SYMBOL_SIZE;
      canvas.height = SYMBOL_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      g.drawTo(ctx);
      if (tm.exists(texKey)) tm.remove(texKey);
      tm.addCanvas(texKey, canvas);
    }
  }
}
