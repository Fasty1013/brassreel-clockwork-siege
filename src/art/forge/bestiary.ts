import { PixelCanvas, Ramp } from './PixelCanvas';
import { C, Palette, R } from './ramps';
import { Anchors, Pose } from './automaton';
import { bot } from './roster';
import { custom, human, SpriteDef } from './defs';

/**
 * Enemy bestiary — 20 enemies + 3 bosses.
 * Drawn facing right like everything else; the battlefield flips them.
 * Act 1 is rust & dusk iron with red eyes, act 2 acid & bog, act 3 crimson & black steel.
 */

const ACT1: Palette = { body: R.rust, trim: R.dusk, accent: R.crimson, eye: C.eyeRed };
const ACT1B: Palette = { body: R.dusk, trim: R.rust, accent: R.ember, eye: C.eyeRed };
const ACT2: Palette = { body: R.bog, trim: R.rust, accent: R.acid, eye: C.eyeGreen };
const ACT3: Palette = { body: R.iron, trim: R.crimson, accent: R.crimson, eye: C.eyeRed };

const fl = (t: number): number => (t < 2 ? 0 : 1);
const lunge = (p: Pose): number => (p.arm === 'strike' ? 3 : p.arm === 'follow' ? 1 : p.arm === 'windup' ? -1 : 0);

// ---------------------------------------------------------------- custom critters
function beetle(g: PixelCanvas, p: Pose): void {
  const by = p.by;
  const ox = lunge(p) - 3;
  for (let i = 0; i < 3; i++) {
    const lift = i % 2 === 0 ? p.legA : p.legB;
    const lx = 9 + i * 5 + ox;
    g.begin();
    g.line(lx, 24 + by, lx + (i - 1) * 2, 27, R.iron[2]);
    g.line(lx + (i - 1) * 2, 27, lx + (i - 1) * 3, 30 - lift, R.iron[1]);
    g.end();
  }
  g.begin();
  g.oval(5 + ox, 13 + by, 20, 16, ACT1.body);
  for (let y = 25 + by; y < 32; y++) for (let x = 0; x < 32; x++) g.erase(x, y);
  g.hl(6 + ox, 24 + by, 18, R.dusk[1]);
  g.line(12 + ox, 14 + by, 11 + ox, 23 + by, ACT1.body[0]);
  g.line(18 + ox, 14 + by, 19 + ox, 23 + by, ACT1.body[0]);
  g.px(9 + ox, 17 + by, R.rust[3]);
  g.px(15 + ox, 15 + by, R.gold[1]);
  g.px(15 + ox, 20 + by, R.gold[1]);
  g.end();
  g.begin();
  g.box(23 + ox, 19 + by, 6, 6, R.dusk);
  g.px(27 + ox, 21 + by, C.eyeRed);
  g.px(25 + ox, 21 + by, C.eyeRed);
  const bite = p.arm === 'strike' ? 0 : 1;
  g.px(29 + ox, 22 + by - bite, R.bone[2]);
  g.px(30 + ox, 23 + by - bite, R.bone[3]);
  g.px(29 + ox, 24 + by + bite, R.bone[1]);
  g.px(30 + ox, 24 + by + bite - 1 + bite, R.bone[2]);
  g.px(24 + ox, 18 + by, R.dusk[3]);
  g.px(23 + ox, 16 + by, R.dusk[2]);
  g.end();
}

function hound(g: PixelCanvas, p: Pose): void {
  const by = p.by;
  const ox = lunge(p) - 3;
  const leg = (x: number, lift: number, ramp: Ramp): void => {
    g.begin();
    g.rect(x, 24 + by, 2, 6 - lift - by, ramp[1]);
    g.vl(x + 1, 24 + by, 6 - lift - by, ramp[0]);
    g.hl(x, 30 - lift, 3, ramp[0]);
    g.end();
  };
  leg(7 + ox, p.legB, R.dusk);
  leg(19 + ox, p.legA, R.dusk);
  // tail pipe
  g.begin();
  g.line(6 + ox, 19 + by, 3 + ox, 15 + by, R.iron[2]);
  g.px(3 + ox, 14 + by - (p.t & 1), C.steam);
  g.end();
  g.begin();
  g.box(6 + ox, 18 + by, 17, 7, ACT1.body);
  g.hl(8 + ox, 21 + by, 12, R.dusk[1]);
  g.px(10 + ox, 19 + by, R.gold[1]);
  g.px(16 + ox, 19 + by, R.gold[1]);
  for (let i = 0; i < 3; i++) g.px(9 + ox + i * 4, 17 + by, R.steel[2]);
  g.end();
  leg(10 + ox, p.legA, ACT1.body);
  leg(22 + ox, p.legB, ACT1.body);
  // head
  const hx = 20 + ox + (p.arm === 'strike' ? 1 : 0);
  const open = p.arm === 'windup' ? 2 : p.arm === 'strike' ? 0 : 1;
  g.begin();
  g.box(hx, 12 + by, 9, 7, ACT1.body);
  g.px(hx + 1, 11 + by, ACT1.body[2]);
  g.px(hx + 1, 10 + by, ACT1.body[1]);
  g.px(hx + 4, 11 + by, ACT1.body[1]);
  g.rect(hx + 5, 14 + by, 2, 2, C.dark);
  g.px(hx + 6, 14 + by, C.eyeRed);
  g.hl(hx + 4, 17 + by, 5, R.bone[2]);
  g.px(hx + 5, 17 + by, C.dark);
  g.px(hx + 7, 17 + by, C.dark);
  g.end();
  g.begin();
  g.hl(hx + 3, 19 + by + open, 6, R.dusk[2]);
  g.px(hx + 8, 18 + by + open, R.bone[3]);
  g.px(hx + 6, 18 + by + open, R.bone[2]);
  g.end();
}

function drone(shield: boolean, acid: boolean) {
  return (g: PixelCanvas, p: Pose): void => {
    const f = fl(p.t);
    const ox = lunge(p);
    const pal = acid ? ACT2 : ACT1B;
    const y = 9 + f;
    // rotor
    g.begin();
    g.vl(14 + ox, y - 3, 3, R.steel[1]);
    if ((p.t & 1) === 0) g.hl(7 + ox, y - 4, 15, R.steel[2]);
    else g.hl(12 + ox, y - 4, 5, R.steel[3]);
    g.end();
    // hull
    g.begin();
    g.oval(8 + ox, y, 14, 11, pal.body);
    g.hl(9 + ox, y + 6, 12, pal.trim[1]);
    g.oval(15 + ox, y + 2, 5, 5, C.dark);
    g.rect(16 + ox, y + 3, 3, 3, pal.eye);
    g.px(16 + ox, y + 3, C.white);
    g.end();
    if (acid) {
      g.begin();
      g.oval(10 + ox, y + 10, 9, 7, R.glass);
      g.rect(11 + ox, y + 13, 7, 3, R.acid[2]);
      g.hl(12 + ox, y + 13, 5, R.acid[3]);
      g.px(20 + ox, y + 12, R.iron[2]);
      g.px(21 + ox, y + 13, R.iron[1]);
      g.end();
      const drip = p.arm === 'strike' ? 5 : p.t;
      g.px(22 + ox, y + 14 + drip, R.acid[2]);
      if (p.arm === 'strike') {
        g.px(24 + ox, y + 15, R.acid[3]);
        g.px(26 + ox, y + 17, R.acid[2]);
        g.px(23 + ox, y + 17, R.acid[3]);
      }
    } else {
      g.begin();
      g.px(11 + ox, y + 11, R.iron[1]);
      g.px(10 + ox, y + 12, R.iron[2]);
      g.px(18 + ox, y + 11, R.iron[1]);
      g.px(19 + ox, y + 12, R.iron[2]);
      g.end();
      g.px(14 + ox, y + 12 + (p.t & 1), C.fire2);
    }
    if (shield) {
      g.begin();
      g.oval(23 + ox, y - 2, 5, 15, R.cyan);
      g.vl(25 + ox, y + 1, 9, (p.t & 1) === 0 ? R.cyan[3] : R.cyan[2]);
      g.end(R.cyan[0]);
      if (p.arm === 'strike') {
        g.px(29 + ox, y + 5, C.arc);
        g.px(30 + ox, y + 4, C.white);
      }
    }
  };
}

function bomber(g: PixelCanvas, p: Pose): void {
  const f = fl(p.t);
  // balloon
  g.begin();
  g.oval(4, 2 + f, 23, 13, R.crimson);
  for (let x = 9; x < 24; x += 5) g.line(x, 3 + f, x - 1, 13 + f, R.crimson[0]);
  g.hl(7, 8 + f, 17, R.gold[1]);
  g.px(3, 8 + f, R.dusk[2]);
  g.px(2, 7 + f, R.dusk[2]);
  g.px(2, 9 + f, R.dusk[1]);
  g.end();
  // ropes
  g.line(9, 14 + f, 11, 18 + f, R.wood[2]);
  g.line(21, 14 + f, 19, 18 + f, R.wood[2]);
  // gondola
  g.begin();
  g.box(10, 18 + f, 11, 5, ACT1.body);
  g.px(18, 20 + f, C.eyeRed);
  g.px(16, 20 + f, C.eyeRed);
  g.vl(8, 19 + f, 3, R.steel[(p.t & 1) + 1]);
  g.end();
  // payload
  const drop = p.arm === 'strike' ? 3 : p.arm === 'follow' ? 6 : 0;
  if (p.arm !== 'follow' || true) {
    g.begin();
    g.oval(13, 23 + f + Math.min(drop, 3), 5, 5, R.iron);
    g.px(15, 22 + f + Math.min(drop, 3), R.wood[2]);
    g.end();
    g.px(16, 21 + f + Math.min(drop, 3), [C.fire1, C.fire2, C.white, C.fire2][p.t & 3]);
  }
}

function leech(g: PixelCanvas, p: Pose): void {
  const ox = lunge(p);
  const w = (p.t & 1) === 0 ? 0 : 1;
  const seg: Array<[number, number, number]> = [
    [1, 26, 5], [4, 24 + w, 7], [8, 22, 8], [11, 18 + w, 9], [13 + (ox >> 1), 13, 10]
  ];
  seg.forEach(([x, y, d], i) => {
    g.begin();
    g.oval(x, y, d, d, i % 2 === 0 ? ACT2.body : R.moss);
    if (i > 0) g.px(x + (d >> 1), y + 1, R.acid[2]);
    g.end();
  });
  // head / maw
  const hx = 17 + ox;
  const hy = 9 - (p.arm === 'windup' ? 2 : 0) + (p.arm === 'strike' ? 3 : 0);
  g.begin();
  g.oval(hx, hy, 11, 11, R.moss);
  g.oval(hx + 4, hy + 3, 6, 6, C.dark);
  g.px(hx + 5, hy + 3, R.bone[3]);
  g.px(hx + 8, hy + 3, R.bone[3]);
  g.px(hx + 5, hy + 8, R.bone[2]);
  g.px(hx + 8, hy + 8, R.bone[2]);
  g.px(hx + 9, hy + 5, R.bone[3]);
  g.px(hx + 6, hy + 5, R.acid[2]);
  g.px(hx + 7, hy + 6, R.acid[3]);
  g.px(hx + 2, hy + 2, C.eyeGreen);
  g.px(hx + 4, hy + 1, C.eyeGreen);
  g.end();
  if (p.arm === 'strike') {
    g.px(hx + 12, hy + 5, R.acid[3]);
    g.px(hx + 14, hy + 6, R.acid[2]);
    g.px(hx + 13, hy + 8, R.acid[2]);
  }
}

// ---------------------------------------------------------------- boss deco
function baronDeco(g: PixelCanvas, a: Anchors, p: Pose): void {
  const { hx, hy, hw, hh } = a;
  // top hat
  g.rect(hx + 2, hy - 10, hw - 4, 9, R.dusk[1]);
  g.vl(hx + 2, hy - 10, 9, R.dusk[2]);
  g.vl(hx + hw - 3, hy - 10, 9, R.dusk[0]);
  g.hl(hx + 2, hy - 10, hw - 4, R.dusk[3]);
  g.rect(hx + 2, hy - 4, hw - 4, 2, R.crimson[2]);
  g.px(hx + hw - 5, hy - 4, R.gold[2]);
  g.rect(hx - 1, hy - 1, hw + 2, 2, R.dusk[1]);
  g.hl(hx - 1, hy - 1, hw + 2, R.dusk[3]);
  // monocle
  const ey = hy + Math.floor(hh * 0.45);
  g.oval(hx + hw - 6, ey - 2, 5, 5, R.gold);
  g.rect(hx + hw - 5, ey - 1, 3, 3, R.glass[2]);
  g.px(hx + hw - 4, ey, C.eyeRed);
  g.line(hx + hw - 2, ey + 3, hx + hw - 1, ey + 7, R.gold[1]);
  // moustache
  g.hl(hx + hw - 7, ey + 4, 6, R.bone[2]);
  g.px(hx + hw - 8, ey + 5, R.bone[1]);
  g.px(hx + hw - 1, ey + 3, R.bone[3]);
  // boiler belly
  const bx = a.tx + (a.tw >> 1) - 2;
  const by = a.ty + (a.th >> 1) - 4;
  g.oval(bx, by, 10, 10, R.bone);
  g.oval(bx + 1, by + 1, 8, 8, R.bone);
  g.px(bx + 5, by + 5, C.dark);
  const nd = p.arm === 'strike' ? [3, -2] : [[1, -3], [2, -3], [2, -2], [1, -3]][p.t & 3];
  g.line(bx + 5, by + 5, bx + 5 + nd[0], by + 5 + nd[1], R.red[1]);
  for (let i = 0; i < 5; i++) {
    g.px(a.tx + 3 + i * 5, a.ty + a.th - 4, R.gold[2]);
    g.px(a.tx + 3 + i * 5, a.ty + 3, R.gold[1]);
  }
  g.hl(a.tx + 2, a.ty + a.th - 6, a.tw - 4, R.gold[0]);
  // cannon arm
  const rc = p.arm === 'strike' ? -3 : p.arm === 'windup' ? 1 : 0;
  const cx = a.handX - 3 + rc;
  const cy = a.handY - 2;
  g.box(cx, cy - 4, 20, 10, R.iron, false);
  g.vl(cx + 3, cy - 4, 10, R.gold[1]);
  g.vl(cx + 10, cy - 4, 10, R.gold[1]);
  g.rect(cx + 17, cy - 6, 4, 14, R.gold[1]);
  g.vl(cx + 17, cy - 6, 14, R.gold[2]);
  g.rect(cx + 20, cy - 2, 1, 6, C.dark);
  g.oval(cx - 4, cy - 6, 9, 9, R.gold);
  if (p.arm === 'strike') {
    for (let i = 0; i < 6; i++) {
      const hgt = 9 - i * 2 + (i & 1);
      g.vl(cx + 22 + i, cy + 1 - (hgt >> 1), Math.max(1, hgt), i < 2 ? C.white : i < 4 ? C.fire1 : C.fire2);
    }
  }
  if (p.arm === 'follow') {
    g.px(cx + 23, cy - 2, C.steam);
    g.px(cx + 25, cy - 4, C.steamDim);
    g.px(cx + 24, cy + 1, C.steamDim);
  }
}

function empressDeco(g: PixelCanvas, a: Anchors, p: Pose): void {
  const { tx, ty, tw, th, hx, hy, hw, hh } = a;
  const mid = tx + (tw >> 1);

  // tattered wing-vanes fanning out behind her
  for (let k = 0; k < 4; k++) {
    const ex = tx - 12 - k * 3 + (p.t & 1);
    const ey = ty - 16 + k * 8;
    g.line(tx + 1, ty + 4, ex, ey, R.gold[1]);
    if (k < 3) {
      const nx = tx - 15 - k * 3 + (p.t & 1);
      const ny = ty - 8 + k * 8;
      for (let m = 2; m < 9; m += 2) {
        const fx = tx + 1 + ((ex - tx - 1) * m) / 9;
        const fy = ty + 4 + ((ey - ty - 4) * m) / 9;
        const gx = tx + 1 + ((nx - tx - 1) * m) / 9;
        const gy = ty + 4 + ((ny - ty - 4) * m) / 9;
        g.line(fx, fy + 1, gx, gy - 1, (m + k) % 4 === 0 ? R.acid[1] : R.bog[1]);
      }
    }
    g.px(ex, ey, R.acid[3]);
  }

  // bell skirt of riveted plates
  const top = ty + th - 3;
  const rows = 20;
  for (let j = 0; j < rows; j++) {
    const half = Math.floor(tw / 2 + 2 + Math.min(9, j * 1.1) + (j > rows - 4 ? 1 : 0));
    for (let i = -half; i <= half; i++) {
      const panel = Math.abs(i) % 5 === 4;
      let c: string | null = R.bog[1];
      if (i < -half + 3) c = R.bog[2];
      if (i > half - 4) c = R.bog[0];
      if (panel) c = R.bog[0];
      if (j === 0 || j === 1) c = j === 0 ? R.gold[2] : R.gold[1];
      if (j === rows - 2) c = R.acid[1];
      if (j === rows - 1) c = (i + 60) % 5 < 3 ? R.acid[2] : null;
      if (j === rows - 6 && !panel) c = R.acid[0];
      if (c) g.px(mid + i, top + j, c);
    }
  }
  g.px(mid - 4, top + 6, R.acid[3]);
  g.px(mid + 6, top + 11, R.acid[3]);
  g.px(mid - 9, top + 14, R.acid[2]);
  // acid dripping from the hem
  for (let i = 0; i < 5; i++) {
    g.px(mid - 14 + i * 7, top + rows + ((p.t + i * 3) & 3), R.acid[2]);
  }

  // bodice
  g.rect(mid - 1, ty + 2, 3, th - 6, R.gold[1]);
  g.px(mid, ty + 4, R.acid[3]);
  g.px(mid, ty + 8, R.acid[3]);
  // high collar
  g.line(tx - 1, ty + 2, tx - 4, ty - 8, R.acid[1]);
  g.line(tx, ty + 2, tx - 3, ty - 8, R.acid[2]);
  g.line(tx + tw, ty + 2, tx + tw + 3, ty - 7, R.acid[0]);
  g.line(tx + tw - 1, ty + 2, tx + tw + 2, ty - 7, R.acid[1]);

  // porcelain face mask
  g.oval(hx + 3, hy + 2, hw - 3, hh - 3, R.bone);
  g.px(hx + hw - 3, hy + 6, C.dark);
  g.px(hx + hw - 6, hy + 6, C.dark);
  g.px(hx + hw - 3, hy + 5, C.eyeGreen);
  g.px(hx + hw - 6, hy + 5, C.eyeGreen);
  g.px(hx + hw - 4, hy + 9, R.acid[0]);
  g.vl(hx + hw - 3, hy + 7, 3, R.acid[2]);
  // crown
  g.rect(hx, hy - 1, hw, 3, R.gold[1]);
  g.hl(hx, hy - 1, hw, R.gold[2]);
  for (let i = 0; i < 3; i++) {
    const sx = hx + 1 + i * ((hw - 3) >> 1);
    const sh = i === 1 ? 7 : 4;
    g.rect(sx, hy - sh, 2, sh, R.gold[1]);
    g.px(sx, hy - sh, R.gold[3]);
    g.px(sx, hy - sh - 1, R.acid[3]);
    g.px(sx + 1, hy - sh - 1, R.acid[2]);
  }
  g.px(hx + (hw >> 1), hy, R.acid[3]);

  // orb of corrosion gathered while casting
  if (p.arm === 'strike' || p.arm === 'windup') {
    const ox = a.handX + 8;
    const oy = a.handY - 14;
    g.oval(ox, oy, 8, 8, R.acid);
    g.px(ox + 3, oy + 3, C.white);
    g.px(ox + 9, oy + 2, R.acid[3]);
    g.px(ox - 2, oy + 6, R.acid[3]);
    if (p.arm === 'strike') {
      g.px(ox + 11, oy + 4, R.acid[2]);
      g.px(ox + 13, oy + 3, R.acid[3]);
      g.px(ox + 12, oy + 7, R.acid[2]);
    }
  }
}

function colossusDeco(g: PixelCanvas, a: Anchors, p: Pose): void {
  const { tx, ty, tw, th, hx, hy, hw } = a;
  // smokestacks
  for (const sx of [tx - 3, tx + 4]) {
    g.rect(sx, ty - 14, 6, 14, R.iron[1]);
    g.vl(sx, ty - 14, 14, R.iron[2]);
    g.vl(sx + 5, ty - 14, 14, R.iron[0]);
    g.rect(sx - 1, ty - 15, 8, 2, R.crimson[1]);
    g.px(sx + 2, ty - 17 - (p.t & 3), C.steamDim);
    g.px(sx + 3, ty - 19 - (p.t & 3), C.steam);
    g.px(sx + 4, ty - 22 - (p.t & 3), C.steamDim);
  }
  // pauldrons
  g.oval(tx - 5, ty - 4, 14, 12, R.iron);
  g.oval(tx + tw - 10, ty - 4, 14, 12, R.dusk);
  g.px(tx - 2, ty - 6, R.steel[2]);
  g.px(tx + 1, ty - 7, R.steel[3]);
  g.px(tx + tw - 4, ty - 6, R.steel[2]);
  g.hl(tx - 3, ty + 4, 10, R.crimson[1]);
  g.hl(tx + tw - 8, ty + 4, 10, R.crimson[1]);
  // armour seams
  g.hl(tx + 2, ty + th - 8, tw - 4, R.iron[0]);
  g.hl(tx + 2, ty + th - 7, tw - 4, R.crimson[1]);
  for (let i = 0; i < 6; i++) g.px(tx + 4 + i * 6, ty + th - 4, R.steel[3]);
  // reactor core
  const d = 16;
  const cx = tx + ((tw - d) >> 1) + 2;
  const cy = ty + 6;
  g.oval(cx, cy, d, d, R.dusk);
  g.oval(cx + 2, cy + 2, d - 4, d - 4, C.dark);
  const hot = p.arm === 'strike' || p.arm === 'windup';
  g.oval(cx + 3, cy + 3, d - 6, d - 6, hot ? R.ember : R.crimson);
  g.oval(cx + 5 + (p.t & 1), cy + 5, d - 11, d - 11, hot ? R.gold : R.ember);
  g.px(cx + 7, cy + 7, C.white);
  if (hot) {
    g.px(cx - 2, cy + 3, C.fire1);
    g.px(cx + d + 1, cy + 9, C.fire1);
    g.px(cx + 8, cy - 2, C.fire2);
    g.px(cx + 5, cy + d + 1, C.fire2);
  }
  // face plate
  g.hl(hx + 3, hy + 6, hw - 3, C.dark);
  g.hl(hx + 3, hy + 7, hw - 3, C.dark);
  g.rect(hx + hw - 5, hy + 6, 3, 2, C.eyeRed);
  g.rect(hx + hw - 10, hy + 6, 3, 2, C.eyeRed);
  for (let i = 0; i < 4; i++) g.vl(hx + hw - 3 - i * 3, hy + 10, 3, R.steel[1]);
  // great hammer
  const ph = p.arm;
  const dir: [number, number] = ph === 'windup' ? [-1, -1] : ph === 'strike' ? [1, 0] : ph === 'follow' ? [1, 1] : [1, -1];
  const hx0 = a.handX + (ph === 'strike' ? 3 : ph === 'windup' ? -2 : 0);
  const hy0 = a.handY + (ph === 'follow' ? 3 : 0);
  const len = 16;
  for (let i = -3; i < len; i++) {
    g.rect(hx0 + dir[0] * i, hy0 + dir[1] * i, 2, 2, i % 5 === 0 ? R.crimson[1] : R.wood[2]);
  }
  const ex = hx0 + dir[0] * len;
  const ey = hy0 + dir[1] * len;
  g.box(ex - 7, ey - 6, 15, 13, R.iron, false);
  g.rect(ex - 7, ey - 1, 15, 3, R.crimson[1]);
  g.hl(ex - 7, ey - 1, 15, R.crimson[2]);
  g.px(ex - 5, ey - 4, R.steel[3]);
  g.px(ex + 5, ey + 4, R.steel[2]);
  g.rect(a.handX - 2 + (ph === 'strike' ? 3 : 0), hy0 - 2, 5, 6, R.dusk[2]);
  if (ph === 'follow') {
    for (let i = 0; i < 5; i++) g.px(ex - 10 + i * 5, ey + 8 + (i & 1), C.fire1);
    g.px(ex - 12, ey + 9, C.steamDim);
    g.px(ex + 11, ey + 9, C.steamDim);
  }
}

// ---------------------------------------------------------------- bestiary
export const BESTIARY: SpriteDef[] = [
  // ============ ACT 1 — Rustlands
  human('tex_en_scrapper', bot(32, ACT1, {
    head: 'mask', hw: 9, hh: 8, chest: 'grill', weapon: 'cleaver', wlen: 6, wmat: R.steel,
    back: ['spikes'], tw: 9
  })),
  human('tex_en_steam_rover', bot(32, ACT1B, {
    head: 'cyclops', hw: 8, hh: 7, legs: 'wheel', lh: 6, shape: 'round', weapon: 'saw',
    back: ['chimney'], tw: 12, th: 8, shift: -5
  })),
  custom('tex_en_beetle', 32, beetle),
  human('tex_en_sniper', bot(32, ACT1, {
    head: 'spike', hw: 8, hh: 7, chest: 'belt', weapon: 'rifle', wlen: 12, back: ['cape'],
    tw: 7, th: 8, lh: 5, shift: -8
  })),
  custom('tex_en_shield_drone', 32, drone(true, false), true),
  custom('tex_en_hound', 32, hound),
  human('tex_en_mortar', bot(32, ACT1B, {
    head: 'bucket', hw: 8, hh: 6, legs: 'tread', lh: 4, shape: 'box', weapon: 'mortar', wlen: 6,
    tw: 11, th: 6, shift: -3, noArm: true
  })),
  custom('tex_en_bomber', 32, bomber, true),
  human('tex_en_borer', bot(40, ACT1B, {
    head: 'goggles', hw: 9, hh: 7, legs: 'tread', shape: 'box', chest: 'grill', weapon: 'drill',
    wlen: 10, wmat: R.steel, back: ['chimney'], tw: 13, shift: -7
  })),
  human('tex_en_prowler', bot(32, { ...ACT1B, accent: R.cyan }, {
    head: 'mask', hw: 9, hh: 7, legs: 'spider', lh: 6, shape: 'round', weapon: 'prod', wlen: 6,
    back: ['coilpack'], tw: 10, th: 6
  })),
  human('tex_en_golem', bot(48, ACT1, {
    head: 'cyclops', hw: 10, hh: 9, shape: 'box', chest: 'grill', weapon: 'mace', wlen: 7,
    back: ['chimney2'], tw: 19, th: 14, lh: 5, lw: 4,
    deco: (g, a) => {
      g.oval(a.tx - 3, a.ty - 3, 8, 7, R.dusk);
      g.px(a.tx - 1, a.ty - 5, R.steel[2]);
      g.hl(a.tx + 1, a.ty + a.th - 4, a.tw - 2, R.dusk[1]);
      g.px(a.tx + 3, a.ty + 6, R.rust[3]);
      g.px(a.tx + 4, a.ty + 7, R.rust[0]);
    }
  })),
  human('tex_en_raider', bot(40, ACT1, {
    head: 'horns', chest: 'belt', weapon: 'axe', wlen: 8, back: ['tank'], shift: -5,
    deco: (g, a) => g.oval(a.tx - 2, a.ty - 2, 5, 5, R.dusk)
  })),
  human('tex_boss_steam_baron', bot(72, { body: R.bronze, trim: R.gold, accent: R.crimson, eye: C.eyeRed }, {
    head: 'helm', hw: 16, hh: 13, shape: 'round', tw: 30, th: 26, lh: 9, lw: 5,
    back: ['cape', 'chimney2'], shift: -9, deco: baronDeco
  })),

  // ============ ACT 2 — Corroded Marsh
  custom('tex_en_acid_drone', 32, drone(false, true), true),
  human('tex_en_rust_creeper', bot(32, { ...ACT2, body: R.rust }, {
    head: 'mask', hw: 9, hh: 7, legs: 'spider', lh: 5, shape: 'round', weapon: 'claw',
    wmat: R.bone, tw: 11, th: 6, back: ['spikes']
  })),
  human('tex_en_bog_stalker', bot(40, ACT2, {
    head: 'hood', legs: 'spring', lh: 8, chest: 'belt', weapon: 'fork', wlen: 9, wmat: R.rust,
    back: ['cape'], tw: 9, th: 9, shift: -6
  })),
  custom('tex_en_toxic_leech', 32, leech),
  human('tex_boss_corrosion_empress', bot(80, { body: R.bog, trim: R.gold, accent: R.acid, eye: C.eyeGreen }, {
    head: 'dome', hw: 13, hh: 12, legs: 'hover', lh: 23, weapon: 'staff', wlen: 26,
    tw: 13, th: 16, shift: -2, deco: empressDeco
  })),

  // ============ ACT 3 — Iron Citadel
  human('tex_en_clockwork_executioner', bot(48, { ...ACT3, accent: R.crimson }, {
    head: 'hood', chest: 'gear', weapon: 'axe', wlen: 10, back: ['cape'], shift: -6,
    deco: (g, a) => g.oval(a.tx - 2, a.ty - 2, 6, 6, R.crimson)
  })),
  human('tex_en_siege_engine', bot(48, ACT3, {
    head: 'furnace', hw: 10, hh: 8, legs: 'wheel', lh: 8, shape: 'box', weapon: 'cannon', wlen: 12,
    back: ['chimney2', 'spikes'], tw: 18, th: 12, shift: -8, noArm: true,
    deco: (g, a) => {
      for (let i = 0; i < a.tw; i += 4) {
        g.rect(a.tx + i, a.ty - 2, 2, 2, R.iron[1]);
      }
      g.hl(a.tx + 1, a.ty + 4, a.tw - 2, R.crimson[1]);
    }
  })),
  human('tex_en_dreadnought', bot(56, ACT3, {
    head: 'spike', legs: 'tread', lh: 8, shape: 'box', chest: 'core', weapon: 'gatling', wlen: 11,
    shield: 'tower', back: ['chimney2'], tw: 22, th: 15, shift: -8,
    deco: (g, a) => {
      g.oval(a.tx - 3, a.ty - 3, 9, 8, R.crimson);
      g.hl(a.tx + 2, a.ty + a.th - 4, a.tw - 4, R.crimson[1]);
    }
  })),
  human('tex_en_lightning_spire', bot(48, { ...ACT3, accent: R.violet, eye: C.arc }, {
    head: 'coil', hw: 11, hh: 14, legs: 'base', lh: 6, shape: 'box', tw: 9, th: 14, shift: -1,
    back: ['coilpack'],
    deco: (g, a, p) => {
      g.hl(a.tx, a.ty + 4, a.tw, R.crimson[1]);
      g.hl(a.tx, a.ty + 9, a.tw, R.crimson[1]);
      if (p.arm === 'strike' || p.arm === 'follow') {
        let x = a.hx + a.hw;
        let y = a.hy - 1;
        for (let i = 0; i < 9; i++) {
          g.px(x, y, i % 3 === 0 ? C.white : C.arc);
          x += 1;
          y += (i + p.t) % 2 === 0 ? 2 : -1;
        }
      }
    }
  })),
  human('tex_boss_iron_colossus', bot(96, { body: R.iron, trim: R.crimson, accent: R.ember, eye: C.eyeRed }, {
    head: 'horns', hw: 20, hh: 16, shape: 'box', tw: 38, th: 32, lh: 16, lw: 8, shift: -12,
    deco: colossusDeco
  }))
];
