/**
 * Offline contact-sheet renderer for the forged sprites.
 *   npx tsx tools/qa/renderForge.ts <outDir> [scale]
 * Writes PNG sheets (idle / walk / wind-up / strike / follow frames per sprite).
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PixelCanvas } from '../../src/art/forge/PixelCanvas';
import { POSES, SpriteDef } from '../../src/art/forge/defs';
import { ROSTER } from '../../src/art/forge/roster';
import { applyLevelLook } from '../../src/art/forge/levelLook';
import { BESTIARY } from '../../src/art/forge/bestiary';
import { BG_H, BG_W, PAINTERS } from '../../src/art/environment/actBackdrops';
import { renderSymbol, SYMBOL_KEYS, SYMBOL_SIZE } from '../../src/art/forge/symbolIcons';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const cr = Buffer.alloc(4);
  cr.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, cr]);
};
function png(w: number, h: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const FRAMES = [0, 5, 8, 9, 10];
const BG = [0x6f, 0xae, 0x4a];

function sheet(defs: SpriteDef[], scale: number, flip: boolean): Buffer {
  const cell = Math.max(...defs.map((d) => d.size)) * scale;
  const perRow = defs.length > 6 ? 2 : 1;
  const rows = Math.ceil(defs.length / perRow);
  const W = perRow * FRAMES.length * cell + (perRow - 1) * 16;
  const H = rows * cell;
  const rgb = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) rgb.set(BG, i * 3);
  defs.forEach((def, idx) => {
    const col = idx % perRow;
    const row = Math.floor(idx / perRow);
    FRAMES.forEach((fi, k) => {
      const g = new PixelCanvas(def.size, def.size);
      def.draw(g, POSES[fi]);
      const cells = g.cells();
      const ox = col * (FRAMES.length * cell + 16) + k * cell + ((cell - def.size * scale) >> 1);
      const oy = row * cell + (cell - def.size * scale);
      for (let y = 0; y < def.size; y++) {
        for (let x = 0; x < def.size; x++) {
          const c = cells[y * def.size + (flip ? def.size - 1 - x : x)];
          if (!c) continue;
          const r = parseInt(c.slice(1, 3), 16);
          const gg = parseInt(c.slice(3, 5), 16);
          const b = parseInt(c.slice(5, 7), 16);
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const p = ((oy + y * scale + sy) * W + ox + x * scale + sx) * 3;
              rgb[p] = r;
              rgb[p + 1] = gg;
              rgb[p + 2] = b;
            }
          }
        }
      }
    });
  });
  return png(W, H, rgb);
}

const out = process.argv[2] ?? 'forge-sheets';
const scale = Number(process.argv[3] ?? 4);
mkdirSync(out, { recursive: true });
const groups: Array<[string, SpriteDef[], boolean]> = [
  ['u1_scrap_cog', ROSTER.slice(0, 8), false],
  ['u2_spring', ROSTER.slice(8, 15), false],
  ['u3_fuse', ROSTER.slice(15, 22), false],
  ['u4_coil', ROSTER.slice(22, 29), false],
  ['u5_legendary', ROSTER.slice(29), false],
  ['e1_act1a', BESTIARY.slice(0, 6), false],
  ['e2_act1b', BESTIARY.slice(6, 12), false],
  ['e3_act2', BESTIARY.slice(13, 17), false],
  ['e4_act3', BESTIARY.slice(18, 22), false],
  ['b1_baron', [BESTIARY[12]], false],
  ['b2_empress', [BESTIARY[17]], false],
  ['b3_colossus', [BESTIARY[22]], false]
];
for (const [name, defs, flip] of groups) {
  writeFileSync(join(out, `${name}.png`), sheet(defs, scale, flip));
  console.log(name, defs.map((d) => d.key).join(' '));
}

// symbols: plain row + gilded row
{
  const sc = 6;
  const cell = SYMBOL_SIZE * sc + 12;
  const W = cell * SYMBOL_KEYS.length;
  const H = cell * 2;
  const rgb = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) rgb.set([0xde, 0xd6, 0xcb], i * 3);
  SYMBOL_KEYS.forEach((key, k) => {
    [false, true].forEach((gild, row) => {
      const g = renderSymbol(key, gild);
      if (!g) return;
      const cells = g.cells();
      for (let y = 0; y < SYMBOL_SIZE; y++) for (let x = 0; x < SYMBOL_SIZE; x++) {
        const c = cells[y * SYMBOL_SIZE + x];
        if (!c) continue;
        const col = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
        for (let sy = 0; sy < sc; sy++) for (let sx = 0; sx < sc; sx++) {
          rgb.set(col, ((row * cell + 6 + y * sc + sy) * W + k * cell + 6 + x * sc + sx) * 3);
        }
      }
    });
  });
  writeFileSync(join(out, 'symbols.png'), png(W, H, rgb));
}

// act backdrops via a minimal fillRect-only 2D context
for (const [key, paint] of Object.entries(PAINTERS)) {
  const rgb = new Uint8Array(BG_W * BG_H * 3);
  const ctx = {
    fillStyle: '#000000',
    fillRect(x: number, y: number, w: number, h: number) {
      const c = String(this.fillStyle);
      const col = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
      for (let j = Math.max(0, y); j < Math.min(BG_H, y + h); j++)
        for (let i = Math.max(0, x); i < Math.min(BG_W, x + w); i++) rgb.set(col, (j * BG_W + i) * 3);
    }
  };
  paint(ctx as unknown as CanvasRenderingContext2D);
  const S = 3;
  const big = new Uint8Array(BG_W * S * BG_H * S * 3);
  for (let y = 0; y < BG_H * S; y++) for (let x = 0; x < BG_W * S; x++)
    big.set(rgb.subarray(((y / S | 0) * BG_W + (x / S | 0)) * 3, ((y / S | 0) * BG_W + (x / S | 0)) * 3 + 3), (y * BG_W * S + x) * 3);
  writeFileSync(join(out, `${key}.png`), png(BG_W * S, BG_H * S, big));
}

// level looks: a few robots at levels 1..5 (idle frame 0)
{
  const picks = ['tex_cog_knight', 'tex_spring_archer', 'tex_fuse_hellfire', 'tex_coil_tesla'];
  const defs = picks.map((k) => ROSTER.find((d) => d.key === k)!).filter(Boolean);
  const sc = 4;
  const cell = 48 * sc + 8;
  const W = cell * 5;
  const H = cell * defs.length;
  const rgb = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) rgb.set(BG, i * 3);
  defs.forEach((def, row) => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      const g = new PixelCanvas(def.size, def.size);
      def.draw(g, POSES[1]);
      if (lvl > 1) applyLevelLook(g, lvl, POSES[1]);
      const cells = g.cells();
      for (let y = 0; y < def.size; y++) for (let x = 0; x < def.size; x++) {
        const c = cells[y * def.size + x];
        if (!c) continue;
        const col = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
        for (let sy = 0; sy < sc; sy++) for (let sx = 0; sx < sc; sx++)
          rgb.set(col, ((row * cell + (cell - def.size * sc) + y * sc + sy) * W + (lvl - 1) * cell + x * sc + sx) * 3);
      }
    }
  });
  writeFileSync(join(out, 'levels.png'), png(W, H, rgb));
}
