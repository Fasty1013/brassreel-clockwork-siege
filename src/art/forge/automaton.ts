import { PixelCanvas, Ramp } from './PixelCanvas';
import { C, Palette, R } from './ramps';

/**
 * Automaton kit — a paper-doll library of steampunk robot parts.
 * A character is a config (torso + head + legs + weapon + extras); the same
 * config is re-drawn for every animation frame with a different Pose, which is
 * how idle / walk / attack frames are produced without hand-drawing each one.
 */

export type ArmPhase = 'rest' | 'windup' | 'strike' | 'follow';

export interface Pose {
  /** body bob in px (positive = lower) */
  by: number;
  /** upper-body lean in px (positive = toward the enemy) */
  lean: number;
  /** foot lift of the far / near leg */
  legA: number;
  legB: number;
  arm: ArmPhase;
  /** ambient ticker 0..3 (steam, sparks, spinning gears) */
  t: number;
}

export type HeadType =
  | 'helm' | 'dome' | 'bucket' | 'hood' | 'bomb' | 'coil' | 'glass' | 'goggles'
  | 'mask' | 'spike' | 'cyclops' | 'horns' | 'eagle' | 'furnace';
export type LegType = 'stub' | 'spring' | 'tread' | 'wheel' | 'hover' | 'spider' | 'base';
export type WeaponType =
  | 'sword' | 'hammer' | 'mace' | 'axe' | 'lance' | 'drill' | 'claw' | 'saw'
  | 'bow' | 'crossbow' | 'rifle' | 'cannon' | 'gatling' | 'mortar' | 'flamer'
  | 'bomb' | 'flask' | 'staff' | 'fork' | 'prod' | 'cleaver';
export type ShieldType = 'round' | 'tower' | 'kite' | 'energy' | 'spiked';
export type BackType =
  | 'chimney' | 'chimney2' | 'tank' | 'quiver' | 'coilpack' | 'gear' | 'wings'
  | 'banner' | 'antenna' | 'key' | 'cape' | 'halo' | 'spikes';
export type ChestType = 'gauge' | 'core' | 'grill' | 'gear' | 'plate' | 'clock' | 'belt' | 'none';

export interface Anchors {
  cx: number;
  ground: number;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  hx: number;
  hy: number;
  hw: number;
  hh: number;
  handX: number;
  handY: number;
}

export interface HumanoidCfg {
  size: number;
  pal: Palette;
  torso: { w: number; h: number; shape?: 'barrel' | 'box' | 'round'; chest?: ChestType };
  head: { type: HeadType; w: number; h: number; crest?: boolean; crown?: boolean; dx?: number };
  legs: { type: LegType; h: number; w?: number };
  weapon?: { type: WeaponType; len?: number; mat?: Ramp };
  shield?: ShieldType;
  back?: BackType[];
  /** shift the whole figure horizontally inside the frame */
  shiftX?: number;
  /** skip the generated near arm (e.g. for emplacements) */
  noArm?: boolean;
  deco?: (g: PixelCanvas, a: Anchors, p: Pose) => void;
}

const spark = (t: number): string => [C.fire1, C.fire2, C.white, C.fire2][t & 3];

// =====================================================================
// HEADS
// =====================================================================
function drawHead(g: PixelCanvas, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const { hx: x, hy: y, hw: w, hh: h } = a;
  const pal = c.pal;
  const eye = pal.eye;
  const vy = y + Math.floor(h * 0.45);
  const mid = x + (w >> 1);

  const visor = (): void => {
    g.hl(x + 2, vy, w - 2, C.dark);
    g.px(x + w - 2, vy, eye);
    if (w >= 7) g.px(x + w - 4, vy, eye);
  };

  switch (c.head.type) {
    case 'helm':
    case 'spike':
    case 'horns':
    case 'eagle': {
      g.box(x, y, w, h, pal.body);
      g.hl(x + 1, vy - 1, w - 2, pal.trim[1]);
      visor();
      if (h >= 7) g.px(x + w - 2, vy + 2, C.dark);
      if (c.head.type === 'spike') {
        g.vl(mid, y - 3, 3, R.steel[2]);
        g.px(mid, y - 4, R.steel[3]);
      }
      if (c.head.type === 'horns') {
        const b = R.bone;
        g.px(x, y + 1, b[1]);
        g.px(x - 1, y, b[1]);
        g.px(x - 1, y - 1, b[2]);
        g.px(x, y - 2, b[2]);
        g.px(x + 1, y - 3, b[3]);
        g.px(x + w - 1, y + 1, b[1]);
        g.px(x + w, y, b[2]);
        g.px(x + w + 1, y - 1, b[3]);
      }
      if (c.head.type === 'eagle') {
        g.px(x + w, vy + 1, R.gold[2]);
        g.px(x + w + 1, vy + 2, R.gold[1]);
        g.px(x + w, vy + 2, R.gold[1]);
        g.px(x + 1, y - 1, R.gold[2]);
        g.px(x, y - 2, R.gold[2]);
        g.px(x + 2, y - 1, R.gold[1]);
      }
      break;
    }
    case 'dome': {
      const half = Math.ceil(h / 2);
      g.oval(x, y, w, h + 1, pal.body);
      g.rect(x, y + half, w, h - half, pal.body[1]);
      g.vl(x + w - 1, y + half, h - half, pal.body[0]);
      g.vl(x, y + half, h - half, pal.body[2]);
      g.box(x, y + h - 2, w, 2, pal.trim, false);
      visor();
      break;
    }
    case 'bucket': {
      g.box(x, y, w, h, pal.body, false);
      g.hl(x, y, w, pal.trim[2]);
      g.hl(x, y + h - 1, w, pal.trim[0]);
      const ex = x + w - 5;
      const ey = y + 2;
      g.rect(ex, ey, 4, Math.min(3, h - 3), C.dark);
      g.px(ex + 2, ey + 1, eye);
      g.px(ex + 1, ey + 1, eye);
      g.px(ex + 2, ey, C.white);
      g.px(x + 1, y + h - 2, pal.trim[2]);
      break;
    }
    case 'hood': {
      const acc = pal.accent;
      g.oval(x, y, w, h + 1, acc);
      g.px(x + 1, y, acc[2]);
      g.px(x, y - 1, acc[2]);
      g.px(x - 1, y - 1, acc[1]);
      g.rect(x + w - 5, y + Math.floor(h / 2) - 1, 4, 3, C.dark);
      g.px(x + w - 2, y + Math.floor(h / 2), eye);
      g.px(x + w - 4, y + Math.floor(h / 2), eye);
      g.hl(x + 1, y + h - 1, w - 2, pal.trim[1]);
      break;
    }
    case 'bomb': {
      g.oval(x, y, w, h, pal.body);
      g.hl(mid - 1, y, 3, pal.trim[1]);
      g.px(mid, y - 1, R.wood[2]);
      g.px(mid + 1, y - 2, R.wood[2]);
      g.px(mid + 1, y - 3, spark(p.t));
      if ((p.t & 1) === 0) g.px(mid + 2, y - 4, C.fire2);
      const ey = y + Math.floor(h / 2);
      g.px(x + w - 2, ey, eye);
      g.px(x + w - 4, ey, eye);
      break;
    }
    case 'coil': {
      g.box(x, y + h - 3, w, 3, pal.body, false);
      g.px(x + w - 2, y + h - 2, eye);
      if (w >= 7) g.px(x + w - 4, y + h - 2, eye);
      const cw = Math.max(3, w - 4);
      const cxx = x + ((w - cw) >> 1);
      for (let j = y + 2; j < y + h - 3; j++) {
        g.hl(cxx, j, cw, (j & 1) === 0 ? pal.trim[2] : pal.trim[0]);
      }
      g.oval(mid - 2, y - 2, 5, 4, pal.accent);
      if (p.t & 1) {
        g.px(mid - 4, y - 1, C.arc);
        g.px(mid + 4, y - 2, C.arc);
      } else {
        g.px(mid + 3, y, C.arc);
        g.px(mid - 3, y - 3, C.arc);
      }
      break;
    }
    case 'glass': {
      g.oval(x, y, w, h, R.glass);
      const cy = y + Math.floor(h / 2) - 1;
      g.rect(mid - 1, cy, 2, 2, (p.t & 1) === 0 ? pal.accent[2] : pal.accent[3]);
      g.px(mid + 1, cy, pal.accent[1]);
      g.box(x + 1, y + h - 2, w - 2, 2, pal.trim, false);
      break;
    }
    case 'goggles': {
      g.box(x, y, w, h, pal.body);
      g.hl(x + 1, y, w - 2, pal.trim[2]);
      const gy = y + Math.max(1, Math.floor(h / 2) - 2);
      g.hl(x, gy + 1, w, C.dark);
      g.rect(x + w - 4, gy, 3, 3, R.glass[1]);
      g.px(x + w - 3, gy, R.glass[3]);
      if (w >= 9) {
        g.rect(x + w - 8, gy, 3, 3, R.glass[1]);
        g.px(x + w - 7, gy, R.glass[3]);
      }
      break;
    }
    case 'mask': {
      g.box(x, y, w, h, pal.body);
      g.hl(x + 1, y + 2, w - 1, pal.body[0]);
      g.px(x + w - 2, y + 3, eye);
      g.px(x + w - 5, y + 3, eye);
      for (let i = x + 2; i < x + w; i++) {
        g.px(i, y + h - 2, (i & 1) === 0 ? R.bone[2] : C.dark);
      }
      g.px(x + 1, y - 1, pal.trim[1]);
      g.px(x + w - 3, y - 1, pal.trim[1]);
      g.px(x + w - 3, y - 2, pal.trim[2]);
      break;
    }
    case 'cyclops': {
      g.oval(x, y, w, h, pal.body);
      const es = Math.min(5, h - 2);
      const ex = x + w - es - 1;
      const ey = y + ((h - es) >> 1);
      g.oval(ex, ey, es, es, C.dark);
      g.rect(ex + 1, ey + 1, es - 2, es - 2, eye);
      g.px(ex + 1, ey + 1, C.white);
      break;
    }
    case 'furnace': {
      g.box(x, y, w, h, pal.body, false);
      g.hl(x, y, w, pal.trim[2]);
      const my = y + 2;
      const mh = h - 4;
      g.rect(x + 2, my, w - 3, mh, C.dark);
      for (let i = 0; i < w - 4; i++) {
        const fh = 1 + ((i + p.t) % 3);
        g.vl(x + 2 + i, my + mh - fh, fh, i % 2 === 0 ? C.fire2 : C.fire1);
      }
      g.px(x + w - 2, my, C.fire3);
      break;
    }
  }

  if (c.head.crest) {
    const acc = pal.accent;
    g.hl(x + 1, y - 1, w - 3, acc[1]);
    g.hl(x, y - 2, Math.max(2, w - 5), acc[2]);
    g.px(x - 1, y - 1, acc[0]);
    g.px(x - 1, y, acc[0]);
  }
  if (c.head.crown) {
    const gd = R.gold;
    g.hl(x + 1, y - 1, w - 2, gd[1]);
    g.px(x + 1, y - 2, gd[2]);
    g.px(mid, y - 2, gd[2]);
    g.px(mid, y - 3, gd[3]);
    g.px(x + w - 2, y - 2, gd[2]);
  }
}

// =====================================================================
// LEGS
// =====================================================================
function drawLegs(g: PixelCanvas, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const { cx, ground } = a;
  const h = c.legs.h;
  const top = ground - h + 1;
  const tw = c.torso.w;
  const pal = c.pal;
  const spread = Math.max(2, (tw >> 2) + 1);

  const lw = c.legs.w ?? (c.size >= 56 ? 4 : c.size >= 44 ? 3 : 2);
  const stub = (x: number, lift: number, ramp: Ramp): void => {
    g.begin();
    const ox = lift > 0 ? 1 : 0;
    const len = Math.max(1, h - lift);
    g.rect(x + ox, top, lw, len, ramp[1]);
    g.vl(x + ox, top, len, ramp[2]);
    g.vl(x + ox + lw - 1, top, len, ramp[0]);
    // boot
    const bh = lw >= 4 ? 3 : lw >= 3 ? 2 : 1;
    g.rect(x + ox - (lw >= 3 ? 1 : 0), top + len - bh, lw + 1 + (lw >= 3 ? 1 : 0), bh, ramp[0]);
    g.hl(x + ox - (lw >= 3 ? 1 : 0), top + len - bh, lw + (lw >= 3 ? 1 : 0), ramp[1]);
    if (lw >= 3 && len > bh + 2) g.hl(x + ox, top + ((len - bh) >> 1), lw, pal.trim[1]);
    g.end();
  };

  switch (c.legs.type) {
    case 'stub':
      stub(cx - spread - (lw >> 1) + 1, p.legA, R.iron);
      stub(cx + spread - lw, p.legB, pal.body);
      break;
    case 'spring': {
      const leg = (x: number, lift: number): void => {
        g.begin();
        const len = Math.max(2, h - lift);
        for (let j = 0; j < len - 1; j++) g.px(x + (j & 1), top + j, (j & 1) === 0 ? R.steel[2] : R.steel[1]);
        g.hl(x - 1 + (lift > 0 ? 1 : 0), top + len - 1, 3, pal.trim[1]);
        g.end();
      };
      leg(cx - spread + 1, p.legA);
      leg(cx + spread - 1, p.legB);
      break;
    }
    case 'tread': {
      g.begin();
      const x = cx - (tw >> 1) - 1;
      const w = tw + 3;
      g.box(x, top, w, h, R.iron);
      for (let i = 1; i < w - 1; i++) {
        g.px(x + i, top + h - 1, (i + p.t) % 3 === 0 ? R.steel[2] : R.iron[0]);
        g.px(x + i, top, (i - p.t + 9) % 3 === 0 ? R.steel[2] : R.iron[1]);
      }
      if (h >= 4) {
        for (let i = 2; i < w - 2; i += 3) g.px(x + i, top + (h >> 1), pal.trim[2]);
      }
      g.end();
      break;
    }
    case 'wheel': {
      const d = h + 1;
      const wheel = (x: number): void => {
        g.begin();
        g.oval(x, ground - d + 1, d, d, R.iron);
        const mx = x + (d >> 1);
        const my = ground - (d >> 1);
        g.px(mx, my, pal.trim[2]);
        const dir = [[1, 0], [0, 1], [-1, 0], [0, -1]][p.t & 3];
        g.px(mx + dir[0], my + dir[1], pal.trim[1]);
        g.end();
      };
      wheel(cx - (tw >> 1) - 1);
      wheel(cx + (tw >> 1) - d + 2);
      break;
    }
    case 'hover': {
      g.begin();
      g.box(cx - 2, top - 1, 5, 2, pal.trim, false);
      g.end();
      const big = c.size >= 44;
      g.begin();
      g.box(cx - (big ? 4 : 3), top - 1, big ? 9 : 7, 2, R.iron, false);
      g.px(cx, top, pal.trim[2]);
      g.end();
      const fh = Math.max(3, Math.min(h - 1, big ? 6 : 4));
      for (let j = 0; j < fh; j++) {
        const taper = Math.round((j / fh) * (big ? 3 : 2));
        const flick = j > 0 && ((p.t + j) & 1) === 0 ? 1 : 0;
        const half = Math.max(0, (big ? 3 : 2) - taper - flick);
        const col = j === 0 ? C.white : j < fh / 2 ? C.fire1 : j < fh - 1 ? C.fire2 : C.fire3;
        g.hl(cx - half, top + 1 + j, half * 2 + 1, col);
      }
      g.px(cx + ((p.t & 1) === 0 ? -2 : 2), top + fh + 1, C.fire3);
      break;
    }
    case 'spider': {
      for (let k = 0; k < 2; k++) {
        for (const s of [-1, 1]) {
          const lift = (k + (s > 0 ? 1 : 0)) % 2 === 0 ? p.legA : p.legB;
          g.begin();
          const kx = cx + s * (3 + k * 2);
          const fx = cx + s * (5 + k * 3);
          g.line(cx + s * 2, top + 1, kx, top - 1, R.iron[2]);
          g.line(kx, top - 1, fx, ground - lift, R.iron[1]);
          g.px(fx, ground - lift, pal.trim[1]);
          g.end();
        }
      }
      break;
    }
    case 'base': {
      g.begin();
      const x = cx - (tw >> 1) - 2;
      g.box(x, top, tw + 4, h, R.iron, false);
      g.px(x + 1, top + 1, pal.trim[2]);
      g.px(x + tw + 2, top + 1, pal.trim[2]);
      g.end();
      break;
    }
  }
}

// =====================================================================
// TORSO
// =====================================================================
function drawTorso(g: PixelCanvas, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const { tx: x, ty: y, tw: w, th: h } = a;
  const pal = c.pal;
  const shape = c.torso.shape ?? 'barrel';
  if (shape === 'round') {
    g.oval(x, y, w, h, pal.body);
  } else {
    g.box(x, y, w, h, pal.body, shape === 'barrel');
  }
  if (shape === 'barrel' && h >= 6) {
    g.hl(x + 1, y + h - 3, w - 2, pal.trim[1]);
    g.px(x + 1, y + h - 3, pal.trim[2]);
    g.px(x + w - 2, y + h - 3, pal.trim[0]);
  }
  if (shape === 'box') {
    g.px(x + 1, y + h - 2, pal.trim[2]);
    g.px(x + w - 2, y + 1, pal.trim[2]);
  }

  const mx = x + (w >> 1);
  const my = y + Math.max(1, (h >> 1) - 1);
  switch (c.torso.chest ?? 'none') {
    case 'gauge':
      g.rect(mx, my - 1, 3, 3, R.bone[2]);
      g.px(mx + 1, my, C.dark);
      g.px(mx + ((p.t & 1) === 0 ? 2 : 1), my - 1, R.red[1]);
      break;
    case 'core':
      g.rect(mx - 1, my - 1, 4, 4, C.dark);
      g.rect(mx, my, 2, 2, (p.t & 1) === 0 ? pal.accent[2] : pal.accent[3]);
      break;
    case 'grill':
      for (let j = 0; j < Math.min(3, h - 3); j++) g.hl(mx - 1, y + 2 + j * 2, Math.max(3, w - 6), C.dark);
      break;
    case 'gear': {
      const gd = pal.trim;
      g.rect(mx, my, 3, 3, gd[1]);
      g.px(mx + 1, my + 1, C.dark);
      const tk = (p.t & 1) === 0;
      g.px(mx + 1, my - 1, tk ? gd[2] : gd[0]);
      g.px(mx + 3, my + 1, tk ? gd[2] : gd[0]);
      g.px(mx + 1, my + 3, tk ? gd[0] : gd[2]);
      g.px(mx - 1, my + 1, tk ? gd[0] : gd[2]);
      break;
    }
    case 'plate':
      g.box(mx - 1, y + 1, Math.min(5, w - 3), Math.max(3, h - 4), pal.trim, false);
      break;
    case 'clock': {
      g.oval(mx - 2, my - 2, 6, 6, R.bone);
      g.px(mx + 1, my + 1, C.dark);
      const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.t & 3];
      g.px(mx + 1 + d[0], my + 1 + d[1], C.dark);
      g.px(mx, my, R.red[1]);
      break;
    }
    case 'belt':
      g.hl(x, y + h - 2, w, R.wood[1]);
      g.px(mx + 1, y + h - 2, R.gold[2]);
      break;
    case 'none':
      break;
  }
}

// =====================================================================
// BACK ITEMS
// =====================================================================
function drawBack(g: PixelCanvas, type: BackType, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const { tx, ty, tw, th, hx, hy, hw } = a;
  const pal = c.pal;
  const puff = (x: number, y: number): void => {
    const o = p.t & 3;
    g.px(x, y - 1 - o, C.steam);
    if (o > 0) g.px(x - 1, y - 2 - o, C.steamDim);
    if (o > 1) g.px(x + 1, y - 3 - o, C.steamDim);
  };
  switch (type) {
    case 'chimney':
    case 'chimney2': {
      const hgt = Math.max(4, (th >> 1) + 3);
      const cw = c.size >= 56 ? 4 : c.size >= 44 ? 3 : 2;
      g.begin();
      g.rect(tx, ty - hgt + 2, cw, hgt, R.iron[1]);
      g.vl(tx, ty - hgt + 2, hgt, R.iron[2]);
      g.vl(tx + cw - 1, ty - hgt + 2, hgt, R.iron[0]);
      g.hl(tx - 1, ty - hgt + 2, cw + 2, pal.trim[1]);
      g.px(tx - 1, ty - hgt + 2, pal.trim[2]);
      if (type === 'chimney2') {
        g.rect(tx + cw + 1, ty - hgt + 4, cw, hgt - 2, R.iron[1]);
        g.vl(tx + cw + 1, ty - hgt + 4, hgt - 2, R.iron[2]);
        g.hl(tx + cw, ty - hgt + 4, cw + 2, pal.trim[1]);
      }
      g.end();
      puff(tx + (cw >> 1), ty - hgt + 1);
      if (type === 'chimney2') puff(tx + cw + 1 + (cw >> 1), ty - hgt + 3);
      break;
    }
    case 'tank':
      g.begin();
      g.oval(tx - 3, ty, 5, Math.max(5, th - 1), pal.accent);
      g.px(tx - 1, ty - 1, pal.trim[1]);
      g.end();
      break;
    case 'quiver':
      g.begin();
      g.rect(tx - 2, ty - 1, 3, Math.max(4, th - 2), R.wood[1]);
      g.vl(tx - 2, ty - 1, Math.max(4, th - 2), R.wood[2]);
      g.px(tx - 2, ty - 2, pal.accent[2]);
      g.px(tx - 1, ty - 3, pal.accent[2]);
      g.px(tx, ty - 2, pal.accent[1]);
      g.end();
      break;
    case 'coilpack':
      g.begin();
      for (const ox of [-2, 1]) {
        g.vl(tx + ox, ty - 4, 5, pal.trim[1]);
        g.px(tx + ox, ty - 5, pal.accent[2]);
      }
      g.end();
      if (p.t & 1) g.hl(tx - 1, ty - 5, 2, C.arc);
      break;
    case 'gear': {
      g.begin();
      const gx = tx - 3;
      const gy = ty - 2;
      g.oval(gx, gy, 7, 7, pal.trim);
      g.px(gx + 3, gy + 3, C.dark);
      const tk = (p.t & 1) === 0;
      const teeth = tk
        ? [[3, -1], [7, 3], [3, 7], [-1, 3]]
        : [[0, 0], [6, 0], [0, 6], [6, 6]];
      for (const [ox, oy] of teeth) g.px(gx + ox, gy + oy, pal.trim[1]);
      g.end();
      break;
    }
    case 'wings': {
      g.begin();
      const flap = p.t & 1;
      for (let i = 0; i < 3; i++) {
        g.line(tx + 1, ty + 1 + i, tx - 5 - i, ty - 3 + i * 2 - flap, i === 0 ? pal.trim[2] : pal.trim[1]);
      }
      g.end();
      break;
    }
    case 'banner':
      g.begin();
      g.vl(tx, hy - 5, ty - hy + 6, R.wood[2]);
      g.rect(tx - 4, hy - 5, 4, 4, pal.accent[1]);
      g.hl(tx - 4, hy - 5, 4, pal.accent[2]);
      g.px(tx - 4, hy - 2 + (p.t & 1), pal.accent[1]);
      g.end();
      break;
    case 'antenna':
      g.begin();
      g.vl(hx + 1, hy - 4, 4, R.steel[1]);
      g.px(hx + 1, hy - 5, (p.t & 1) === 0 ? pal.accent[2] : pal.accent[3]);
      g.end();
      break;
    case 'key': {
      g.begin();
      const kx = tx - 1;
      const ky = ty + (th >> 1) - 1;
      g.hl(kx - 2, ky, 3, R.gold[1]);
      if ((p.t & 1) === 0) {
        g.vl(kx - 3, ky - 2, 5, R.gold[2]);
      } else {
        g.vl(kx - 3, ky - 1, 3, R.gold[2]);
        g.px(kx - 4, ky, R.gold[1]);
      }
      g.end();
      break;
    }
    case 'cape':
      g.begin();
      for (let j = 0; j < th + 2; j++) {
        const wj = 2 + (j >> 1) + ((p.t + j) & 1 && j > th - 2 ? 1 : 0);
        g.hl(tx - wj + 2, ty + j, wj, j === 0 ? pal.accent[2] : pal.accent[1]);
      }
      g.end();
      break;
    case 'halo': {
      const cxh = hx + (hw >> 1);
      const cyh = hy + 2;
      const rad = (hw >> 1) + 5;
      g.begin();
      for (let ang = 0; ang < 48; ang++) {
        const th2 = (ang / 48) * Math.PI * 2;
        const rx = Math.round(Math.cos(th2) * rad);
        const ry = Math.round(Math.sin(th2) * rad);
        g.px(cxh + rx, cyh + ry, rx + ry < 0 ? R.gold[2] : R.gold[1]);
        g.px(cxh + Math.round(Math.cos(th2) * (rad - 1)), cyh + Math.round(Math.sin(th2) * (rad - 1)), R.gold[3]);
      }
      const spin = (p.t & 1) === 0 ? 0 : Math.PI / 8;
      for (let k = 0; k < 8; k++) {
        const th2 = spin + (k / 8) * Math.PI * 2;
        g.px(cxh + Math.round(Math.cos(th2) * (rad + 2)), cyh + Math.round(Math.sin(th2) * (rad + 2)), R.gold[2]);
        g.px(cxh + Math.round(Math.cos(th2) * (rad + 3)), cyh + Math.round(Math.sin(th2) * (rad + 3)), R.gold[3]);
      }
      g.end();
      break;
    }
    case 'spikes':
      g.begin();
      for (let i = 0; i < 3; i++) {
        g.line(tx + 1, ty + 1 + i * 2, tx - 2, ty - 1 + i * 2, R.steel[2]);
      }
      g.end();
      break;
  }
  void tw;
}

// =====================================================================
// SHIELDS
// =====================================================================
function drawShield(g: PixelCanvas, type: ShieldType, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const pal = c.pal;
  const big = c.size >= 44;
  const x = a.tx - 2 + (p.arm === 'strike' ? 1 : 0);
  const y = a.ty + 1;
  g.begin();
  switch (type) {
    case 'round': {
      const d = big ? 10 : 7;
      g.oval(x, y, d, d, pal.trim);
      g.oval(x + 2, y + 2, d - 4, d - 4, pal.accent);
      break;
    }
    case 'spiked': {
      const d = big ? 10 : 7;
      g.oval(x, y, d, d, R.iron);
      g.px(x + (d >> 1), y + (d >> 1), R.steel[3]);
      g.px(x - 1, y + (d >> 1), R.steel[2]);
      g.px(x + (d >> 1), y - 1, R.steel[2]);
      g.px(x + (d >> 1), y + d, R.steel[2]);
      break;
    }
    case 'tower': {
      const w = big ? 9 : 6;
      const h = big ? 15 : 10;
      g.box(x, y - 2, w, h, pal.trim);
      g.rect(x + 2, y, w - 4, h - 4, pal.accent[1]);
      g.vl(x + (w >> 1), y, h - 4, pal.trim[2]);
      g.hl(x + 2, y + ((h - 4) >> 1), w - 4, pal.trim[2]);
      break;
    }
    case 'kite': {
      const w = big ? 9 : 7;
      const h = big ? 13 : 9;
      g.box(x, y - 1, w, h - 3, pal.trim, false);
      for (let j = 0; j < 3; j++) g.hl(x + 1 + j, y - 1 + h - 3 + j, Math.max(1, w - 2 - j * 2), pal.trim[0]);
      g.rect(x + 2, y + 1, w - 4, h - 6, pal.accent[1]);
      g.px(x + 2, y + 1, pal.accent[3]);
      break;
    }
    case 'energy': {
      const w = big ? 8 : 6;
      const h = big ? 14 : 10;
      g.oval(x - 1, y - 2, w, h, R.cyan);
      g.oval(x + 1, y, w - 4, h - 4, (p.t & 1) === 0 ? R.cyan[2] : R.cyan[3]);
      break;
    }
  }
  g.end(type === 'energy' ? R.cyan[0] : undefined);
}

// =====================================================================
// WEAPONS
// =====================================================================
const MELEE: Record<ArmPhase, [number, number, number, number]> = {
  // dirX, dirY, handDx, handDy
  rest: [1, -1, 0, 0],
  windup: [-1, -1, -1, -2],
  strike: [1, 0, 2, 0],
  follow: [1, 1, 1, 1]
};

function blade(g: PixelCanvas, x: number, y: number, dx: number, dy: number, len: number, r: Ramp): void {
  const ox = dy !== 0 && dx === 0 ? 1 : 0;
  const oy = ox === 0 ? 1 : 0;
  for (let i = 0; i < len; i++) {
    g.px(x + dx * i, y + dy * i, r[2]);
    if (i < len - 1) g.px(x + dx * i + ox, y + dy * i + oy, r[1]);
  }
  g.px(x + dx * (len - 1), y + dy * (len - 1), r[3]);
}

function muzzle(g: PixelCanvas, x: number, y: number, big = false): void {
  g.px(x, y, C.white);
  g.px(x + 1, y, C.fire1);
  g.px(x + 2, y, C.fire2);
  g.px(x, y - 1, C.fire1);
  g.px(x, y + 1, C.fire1);
  if (big) {
    g.px(x + 1, y - 1, C.fire2);
    g.px(x + 1, y + 1, C.fire2);
    g.px(x + 3, y, C.fire3);
    g.px(x, y - 2, C.fire2);
    g.px(x, y + 2, C.fire2);
  }
}

function drawWeapon(g: PixelCanvas, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const wpn = c.weapon;
  if (!wpn) return;
  const pal = c.pal;
  const len = wpn.len ?? 7;
  const mat = wpn.mat ?? R.steel;
  const [dx, dy, hdx, hdy] = MELEE[p.arm];
  let hx = a.handX;
  let hy = a.handY;
  const firing = p.arm === 'strike';
  const recoil = firing ? -1 : 0;

  g.begin();
  switch (wpn.type) {
    // ----------------------------------------------------------- melee
    case 'sword':
    case 'cleaver': {
      hx += hdx;
      hy += hdy;
      g.px(hx, hy, R.wood[1]);
      g.px(hx + dx, hy + dy, R.gold[2]);
      g.px(hx + dx - dy, hy + dy + dx, R.gold[1]);
      g.px(hx + dx + dy, hy + dy - dx, R.gold[1]);
      blade(g, hx + dx * 2, hy + dy * 2, dx, dy, len, mat);
      if (wpn.type === 'cleaver') {
        for (let i = 2; i < len; i++) g.px(hx + dx * (i + 1) - (dy === 0 ? 0 : 0), hy + dy * (i + 1) - 1, mat[1]);
      }
      break;
    }
    case 'hammer':
    case 'mace':
    case 'axe': {
      hx += hdx;
      hy += hdy;
      g.ray(hx, hy, dx, dy, len, R.wood[2]);
      const tx = hx + dx * len;
      const ty = hy + dy * len;
      if (wpn.type === 'hammer') {
        const s = c.size >= 44 ? 7 : 5;
        g.box(tx - (s >> 1), ty - (s >> 1), s, s, mat, false);
        g.hl(tx - (s >> 1), ty, s, pal.trim[1]);
      } else if (wpn.type === 'mace') {
        const s = c.size >= 44 ? 6 : 5;
        g.oval(tx - (s >> 1), ty - (s >> 1), s, s, R.iron);
        g.px(tx - (s >> 1) - 1, ty, mat[3]);
        g.px(tx + (s >> 1) + 1, ty, mat[3]);
        g.px(tx, ty - (s >> 1) - 1, mat[3]);
        g.px(tx, ty + (s >> 1) + 1, mat[3]);
      } else {
        const s = c.size >= 44 ? 9 : 7;
        const half = s >> 1;
        // crescent blade facing forward, bolted on a collar
        for (let j = -half; j <= half; j++) {
          const reach = Math.round(Math.sqrt(Math.max(0, half * half - j * j)) * 0.9) + 1;
          const notch = Math.abs(j) <= 1 ? 0 : Math.abs(j) - 1;
          for (let i = Math.min(notch, reach - 1); i <= reach; i++) {
            const edge = i === reach;
            g.px(tx + i, ty + j, edge ? mat[3] : j < 0 ? mat[2] : mat[1]);
          }
        }
        g.rect(tx - 1, ty - 1, 2, 3, pal.trim[1]);
        g.px(tx - 1, ty - 1, pal.trim[2]);
      }
      break;
    }
    case 'lance': {
      const d: [number, number] = p.arm === 'strike' || p.arm === 'follow' ? [1, 0] : [1, -1];
      hx += p.arm === 'strike' ? 3 : p.arm === 'windup' ? -2 : 0;
      g.ray(hx - d[0] * 2, hy - d[1] * 2, d[0], d[1], len, pal.trim[1]);
      const tx = hx + d[0] * (len - 2);
      const ty = hy + d[1] * (len - 2);
      blade(g, tx, ty, d[0], d[1], 4, mat);
      g.px(tx - d[0], ty - d[1] + 1, pal.accent[1]);
      g.px(tx - d[0] * 2, ty - d[1] * 2 + 1, pal.accent[2]);
      break;
    }
    case 'drill': {
      const ext = firing ? 2 : p.arm === 'windup' ? -1 : 0;
      g.box(hx + ext, hy - 2, 3, 5, R.iron, false);
      for (let i = 0; i < len; i++) {
        const hh = Math.max(1, 5 - Math.floor((i * 5) / len));
        const col = (i + p.t) % 2 === 0 ? mat[2] : mat[0];
        g.vl(hx + 3 + i + ext, hy - (hh >> 1), hh, col);
      }
      break;
    }
    case 'claw': {
      const ext = firing ? 2 : p.arm === 'windup' ? -1 : 0;
      g.rect(hx + ext, hy - 1, 2, 3, R.iron[1]);
      const open = firing ? 0 : 1;
      g.hl(hx + 2 + ext, hy - 1 - open, 3, mat[2]);
      g.hl(hx + 2 + ext, hy + 1 + open, 3, mat[1]);
      g.px(hx + 5 + ext, hy - open, mat[3]);
      g.px(hx + 5 + ext, hy + open, mat[2]);
      break;
    }
    case 'saw': {
      const ext = firing ? 2 : 0;
      g.hl(hx, hy, 2 + ext, R.iron[1]);
      const sx = hx + 1 + ext;
      g.oval(sx, hy - 3, 7, 7, mat);
      g.px(sx + 3, hy, C.dark);
      const tk = (p.t & 1) === 0;
      const teeth = tk ? [[3, -1], [7, 3], [3, 7], [-1, 3]] : [[0, 0], [6, 0], [0, 6], [6, 6]];
      for (const [ox, oy] of teeth) g.px(sx + ox, hy - 3 + oy, mat[3]);
      break;
    }
    // ----------------------------------------------------------- ranged
    case 'bow': {
      const w = R.wood;
      const hh = Math.max(4, len - 2);
      g.px(hx + 1, hy - hh, w[2]);
      g.px(hx + 2, hy - hh + 1, w[2]);
      g.vl(hx + 3, hy - hh + 2, hh * 2 - 3, w[1]);
      g.px(hx + 2, hy + hh - 1, w[1]);
      g.px(hx + 1, hy + hh, w[0]);
      g.px(hx + 3, hy, pal.trim[2]);
      const pull = p.arm === 'windup' ? -2 : 0;
      g.line(hx + 1, hy - hh, hx + 1 + pull, hy, C.steamDim);
      g.line(hx + 1 + pull, hy, hx + 1, hy + hh, C.steamDim);
      if (p.arm === 'rest' || p.arm === 'windup') {
        g.hl(hx + 1 + pull, hy, 5, R.wood[3]);
        g.px(hx + 6 + pull, hy, R.steel[3]);
      }
      break;
    }
    case 'crossbow': {
      hx += recoil;
      const arm = Math.max(3, Math.ceil(len / 2));
      g.hl(hx - 1, hy, len, R.wood[2]);
      g.hl(hx - 1, hy + 1, len - 2, R.wood[0]);
      g.vl(hx + len - 2, hy - arm + 1, arm * 2 - 1, mat[1]);
      g.px(hx + len - 3, hy - arm, mat[2]);
      g.px(hx + len - 4, hy - arm - (arm > 3 ? 1 : 0), mat[2]);
      g.px(hx + len - 3, hy + arm, mat[0]);
      g.px(hx + len - 4, hy + arm + (arm > 3 ? 1 : 0), mat[0]);
      if (!firing) {
        g.line(hx + len - 4, hy - arm, hx + 1, hy - 1, C.steamDim);
        g.line(hx + len - 4, hy + arm, hx + 1, hy + 1, C.steamDim);
        g.hl(hx + 1, hy - 1, len, R.steel[3]);
      } else {
        g.vl(hx + len - 4, hy - arm, arm * 2 + 1, C.steamDim);
      }
      break;
    }
    case 'rifle': {
      hx += recoil;
      g.rect(hx - 2, hy, 3, 2, R.wood[1]);
      g.px(hx - 2, hy + 2, R.wood[0]);
      g.hl(hx + 1, hy, len, R.iron[2]);
      g.hl(hx + 1, hy + 1, 3, R.iron[0]);
      g.px(hx + 2, hy - 1, pal.trim[2]);
      g.px(hx + 3, hy - 1, R.glass[1]);
      if (firing) muzzle(g, hx + len + 1, hy);
      break;
    }
    case 'cannon': {
      hx += recoil * 2;
      g.box(hx - 1, hy - 2, len, 5, R.iron, false);
      g.vl(hx + len - 1, hy - 3, 7, pal.trim[1]);
      g.px(hx + len - 1, hy - 3, pal.trim[2]);
      g.vl(hx + 1, hy - 2, 5, pal.trim[1]);
      if (firing) muzzle(g, hx + len + 1, hy, true);
      break;
    }
    case 'gatling': {
      hx += recoil;
      g.box(hx - 2, hy - 2, 4, 5, pal.trim, false);
      for (let j = -1; j <= 1; j++) {
        g.hl(hx + 2, hy + j, len, (j + p.t + 4) % 2 === 0 ? R.iron[2] : R.iron[0]);
      }
      g.vl(hx + len + 1, hy - 1, 3, R.steel[2]);
      if (firing || p.arm === 'follow') muzzle(g, hx + len + 2, hy + ((p.t & 1) === 0 ? -1 : 1));
      break;
    }
    case 'mortar': {
      const bx = hx - 3;
      const by = hy - 1;
      for (let i = 0; i < len; i++) {
        g.rect(bx + i, by - i - 1, 3, 3, i === len - 1 ? pal.trim[1] : R.iron[1]);
        g.px(bx + i, by - i - 1, i === len - 1 ? pal.trim[2] : R.iron[2]);
      }
      if (firing) muzzle(g, bx + len + 2, by - len - 2, true);
      break;
    }
    case 'flamer': {
      g.hl(hx, hy, 5, R.iron[2]);
      g.hl(hx, hy + 1, 4, R.iron[0]);
      g.px(hx + 5, hy, pal.trim[2]);
      g.px(hx + 6, hy, C.fire2);
      if (firing || p.arm === 'follow') {
        const fl = firing ? len : len - 2;
        for (let i = 0; i < fl; i++) {
          const hh = 1 + Math.min(3, i >> 1) * 2 - ((i + p.t) & 1 ? 0 : 0);
          const col = i < 2 ? C.white : i < fl - 2 ? C.fire1 : C.fire2;
          g.vl(hx + 6 + i, hy - (hh >> 1), hh, col);
        }
        g.px(hx + 6 + fl, hy - 1, C.fire3);
        g.px(hx + 7 + fl, hy + 1, C.fire3);
      }
      break;
    }
    // ----------------------------------------------------------- thrown
    case 'bomb':
    case 'flask': {
      if (p.arm === 'strike' || p.arm === 'follow') {
        g.rect(hx + 1, hy - 1, 2, 2, pal.body[1]);
        break;
      }
      const bx = p.arm === 'windup' ? hx - 3 : hx;
      const by = p.arm === 'windup' ? hy - 7 : hy - 1;
      if (wpn.type === 'bomb') {
        g.oval(bx, by, 5, 5, R.iron);
        g.px(bx + 3, by - 1, R.wood[2]);
        g.px(bx + 4, by - 2, spark(p.t));
      } else {
        g.oval(bx, by + 1, 5, 4, R.acid);
        g.rect(bx + 2, by - 1, 1, 2, R.glass[2]);
      }
      break;
    }
    // ----------------------------------------------------------- casters
    case 'staff': {
      const sx = hx + 1 + (firing ? 1 : 0);
      g.vl(sx, hy - len, len + 4, pal.trim[1]);
      const hot = firing || p.arm === 'windup';
      const glow: Ramp = [pal.accent[1], pal.accent[2], pal.accent[3], C.white];
      g.oval(sx - 2, hy - len - 4, 5, 5, hot ? glow : pal.accent);
      if (hot) g.px(sx, hy - len - 2, C.white);
      if (firing) {
        g.px(sx + 4, hy - len - 2, C.arc);
        g.px(sx + 5, hy - len - 1, C.arc);
        g.px(sx - 4, hy - len - 3, C.arc);
        g.px(sx, hy - len - 6, C.arc);
        g.px(sx + 6, hy - len - 3, C.white);
      }
      break;
    }
    case 'fork': {
      hx += recoil;
      g.hl(hx, hy, 3, pal.trim[1]);
      g.hl(hx + 3, hy - 2, len - 3, mat[2]);
      g.hl(hx + 3, hy + 2, len - 3, mat[1]);
      g.vl(hx + 3, hy - 2, 5, mat[1]);
      const ex = hx + len;
      if ((p.t & 1) === 0 || firing) {
        g.px(ex - 1, hy - 1, C.arc);
        g.px(ex - 2, hy, C.arc);
        g.px(ex - 1, hy + 1, C.arc);
      }
      if (firing) {
        g.px(ex + 1, hy, C.white);
        g.px(ex + 2, hy - 1, C.arc);
        g.px(ex + 3, hy, C.arc);
        g.px(ex + 4, hy + 1, C.arc);
      }
      break;
    }
    case 'prod': {
      hx += hdx;
      hy += hdy;
      g.ray(hx, hy, dx, dy, len, R.iron[2]);
      const tx = hx + dx * len;
      const ty = hy + dy * len;
      g.rect(tx - 1, ty - 1, 2, 2, (p.t & 1) === 0 || firing ? C.arc : pal.accent[2]);
      if (firing) {
        g.px(tx + 2, ty - 1, C.arc);
        g.px(tx + 3, ty + 1, C.arc);
        g.px(tx + 1, ty + 2, C.white);
      }
      break;
    }
  }
  g.end();
}

// =====================================================================
// ASSEMBLY
// =====================================================================
const SWING: ReadonlySet<WeaponType> = new Set<WeaponType>(['sword', 'cleaver', 'hammer', 'mace', 'axe', 'prod']);

/** Near arm: shoulder pauldron + forearm + fist gripping the weapon. */
function drawArm(g: PixelCanvas, c: HumanoidCfg, a: Anchors, p: Pose): void {
  const pal = c.pal;
  const big = c.size >= 44;
  const swing = c.weapon ? SWING.has(c.weapon.type) : false;
  const [, , hdx, hdy] = MELEE[p.arm];
  const hx = a.handX + (swing ? hdx : p.arm === 'strike' ? -1 : 0);
  const hy = a.handY + (swing ? hdy : 0);
  const sx = a.tx + a.tw - (big ? 4 : 3);
  const sy = a.ty + 1;
  g.begin();
  g.line(sx + 1, sy + 2, hx - 1, hy, pal.body[1]);
  if (big) g.line(sx + 1, sy + 3, hx - 1, hy + 1, pal.body[0]);
  const ps = big ? 5 : 3;
  g.oval(sx, sy - 1, ps, ps, pal.trim);
  g.rect(hx - 1, hy - 1, 2, big ? 3 : 2, pal.trim[1]);
  g.px(hx - 1, hy - 1, pal.trim[2]);
  g.end();
}

export function anchorsOf(c: HumanoidCfg, p: Pose): Anchors {
  const S = c.size;
  const cx = (S >> 1) - 1 + (c.shiftX ?? 0);
  const ground = S - 2;
  const hover = c.legs.type === 'hover';
  const float = hover ? (p.t < 2 ? 0 : 1) : 0;
  const tw = c.torso.w;
  const th = c.torso.h;
  const tx = cx - (tw >> 1) + p.lean;
  const tBottom = ground - c.legs.h + 1 + (hover ? float : p.by);
  const ty = tBottom - th + 1;
  const hw = c.head.w;
  const hh = c.head.h;
  const hx = tx + ((tw - hw) >> 1) + (c.head.dx ?? 1);
  const hy = ty - hh + 1;
  return { cx, ground, tx, ty, tw, th, hx, hy, hw, hh, handX: tx + tw, handY: ty + (th >> 1) };
}

export function drawHumanoid(g: PixelCanvas, c: HumanoidCfg, p: Pose): void {
  const a = anchorsOf(c, p);
  for (const b of c.back ?? []) drawBack(g, b, c, a, p);
  drawLegs(g, c, a, p);
  g.begin();
  drawTorso(g, c, a, p);
  g.end();
  g.begin();
  drawHead(g, c, a, p);
  g.end();
  if (c.deco) {
    g.begin();
    c.deco(g, a, p);
    g.end();
  }
  if (c.shield) drawShield(g, c.shield, c, a, p);
  drawWeapon(g, c, a, p);
  if (c.weapon && !c.noArm) drawArm(g, c, a, p);
}
