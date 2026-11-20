/**
 * Android launcher icons from the game's own pixel art (the gilded cog symbol), for every density.
 *   npx tsx tools/android/makeIcons.ts
 * Writes android/app/src/main/res/mipmap-*\/ic_launcher*.png (legacy square and round icons and the
 * adaptive-icon foreground; the adaptive background is a colour in values/ic_launcher_background.xml).
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderSymbol, SYMBOL_SIZE } from '../../src/art/forge/symbolIcons';

const RES = 'android/app/src/main/res';
/** launcher icon edge (48dp) and adaptive foreground edge (108dp) per density */
const DENSITIES: Array<[string, number, number]> = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432]
];
const BG: [number, number, number] = [0x1e, 0x19, 0x26];
const RIM: [number, number, number] = [0xb5, 0x76, 0x47];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b: Buffer): number => {
  let c = 0xffffffff;
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const cr = Buffer.alloc(4);
  cr.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, cr]);
}
/** RGBA PNG */
function png(size: number, rgba: Uint8Array): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const cog = renderSymbol('sym_cog', true)!.cells();

/**
 * One icon: optional background shape, then the cog scaled by whole pixels into `art` px, centred.
 * shape: 'square' (rounded square), 'round' (circle), 'none' (transparent, adaptive foreground).
 */
function icon(size: number, art: number, shape: 'square' | 'round' | 'none'): Buffer {
  const rgba = new Uint8Array(size * size * 4);
  const put = (x: number, y: number, c: [number, number, number]): void => rgba.set([...c, 255], (y * size + x) * 4);
  if (shape !== 'none') {
    const r = size / 2;
    const corner = size * 0.18;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - r;
        const dy = y + 0.5 - r;
        let inside: boolean;
        let edge: boolean;
        if (shape === 'round') {
          const d = Math.hypot(dx, dy);
          inside = d <= r - 0.5;
          edge = inside && d > r - Math.max(2, size * 0.04);
        } else {
          const qx = Math.max(Math.abs(dx) - (r - corner), 0);
          const qy = Math.max(Math.abs(dy) - (r - corner), 0);
          const d = Math.hypot(qx, qy);
          inside = d <= corner - 0.5;
          edge = inside && (d > corner - Math.max(2, size * 0.04) || r - Math.max(Math.abs(dx), Math.abs(dy)) < Math.max(2, size * 0.04));
        }
        if (inside) put(x, y, edge ? RIM : BG);
      }
    }
  }
  const scale = Math.max(1, Math.floor(art / SYMBOL_SIZE));
  const off = Math.floor((size - SYMBOL_SIZE * scale) / 2);
  for (let y = 0; y < SYMBOL_SIZE; y++) {
    for (let x = 0; x < SYMBOL_SIZE; x++) {
      const c = cog[y * SYMBOL_SIZE + x];
      if (!c) continue;
      const col: [number, number, number] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) put(off + x * scale + sx, off + y * scale + sy, col);
    }
  }
  return png(size, rgba);
}

for (const [dpi, launcher, foreground] of DENSITIES) {
  const dir = join(RES, `mipmap-${dpi}`);
  writeFileSync(join(dir, 'ic_launcher.png'), icon(launcher, launcher * 0.75, 'square'));
  writeFileSync(join(dir, 'ic_launcher_round.png'), icon(launcher, launcher * 0.7, 'round'));
  // adaptive foreground: art inside the 66dp safe zone of the 108dp canvas
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), icon(foreground, foreground * 0.55, 'none'));
  console.log(dpi, launcher, foreground);
}
