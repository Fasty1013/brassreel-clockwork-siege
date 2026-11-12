/**
 * PixelCanvas — tiny indexed pixel-art rasterizer.
 *
 * Everything is drawn at native sprite resolution (1 unit = 1 art pixel) and
 * later integer-scaled by Phaser. Shapes are shaded with 4-step colour ramps
 * (light comes from the top-left) and every layer gets a 1px dark contour, so
 * all sprites share one consistent look.
 */

/** dark, mid, light, specular */
export type Ramp = readonly [string, string, string, string];

export const OUTLINE = '#17121f';

type Cell = string | null;

export class PixelCanvas {
  public readonly w: number;
  public readonly h: number;
  private cur: Cell[];
  private stack: Cell[][] = [];

  constructor(w: number, h: number = w) {
    this.w = w;
    this.h = h;
    this.cur = new Array<Cell>(w * h).fill(null);
  }

  // ---------------------------------------------------------------- pixels
  public px(x: number, y: number, c: string): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.cur[y * this.w + x] = c;
  }

  public erase(x: number, y: number): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.cur[y * this.w + x] = null;
  }

  public at(x: number, y: number): Cell {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.cur[y * this.w + x];
  }

  // ---------------------------------------------------------------- flat shapes
  public rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  public hl(x: number, y: number, len: number, c: string): void {
    for (let i = 0; i < len; i++) this.px(x + i, y, c);
  }

  public vl(x: number, y: number, len: number, c: string): void {
    for (let i = 0; i < len; i++) this.px(x, y + i, c);
  }

  public line(x0: number, y0: number, x1: number, y1: number, c: string): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Step `len` pixels from (x,y) along an 8-way direction. */
  public ray(x: number, y: number, dx: number, dy: number, len: number, c: string): void {
    for (let i = 0; i < len; i++) this.px(x + dx * i, y + dy * i, c);
  }

  // ---------------------------------------------------------------- shaded shapes
  /** Bevelled metal plate. `round` trims the four corner pixels. */
  public box(x: number, y: number, w: number, h: number, r: Ramp, round = true): void {
    if (w <= 0 || h <= 0) return;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let c = r[1];
        if (j === 0 || (i === 0 && j < h - 1)) c = r[2];
        if (j === h - 1 || (i === w - 1 && j > 0)) c = r[0];
        this.px(x + i, y + j, c);
      }
    }
    if (w >= 5 && h >= 5) this.px(x + 1, y + 1, r[3]);
    if (round && w >= 4 && h >= 4) {
      this.erase(x, y);
      this.erase(x + w - 1, y);
      this.erase(x, y + h - 1);
      this.erase(x + w - 1, y + h - 1);
    }
  }

  /** Shaded ellipse inscribed in the given bounding box (or flat if a colour string is passed). */
  public oval(x: number, y: number, w: number, h: number, r: Ramp | string): void {
    if (w <= 0 || h <= 0) return;
    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const nx = (x + i + 0.5 - cx) / rx;
        const ny = (y + j + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1.0) continue;
        if (typeof r === 'string') {
          this.px(x + i, y + j, r);
          continue;
        }
        const l = -(nx + ny) * 0.7071;
        let c = r[1];
        if (l > 0.42) c = r[2];
        if (l < -0.38) c = r[0];
        this.px(x + i, y + j, c);
      }
    }
    if (typeof r !== 'string' && w >= 5 && h >= 5) {
      this.px(Math.floor(cx - rx * 0.45), Math.floor(cy - ry * 0.45), r[3]);
    }
  }

  // ---------------------------------------------------------------- layers
  /** Start a new layer. Everything drawn until `end()` is contoured as one part. */
  public begin(): void {
    this.stack.push(this.cur);
    this.cur = new Array<Cell>(this.w * this.h).fill(null);
  }

  /** Close the layer: contour it and stamp it on top of the layer below. */
  public end(outline: string | null = OUTLINE): void {
    const below = this.stack.pop();
    if (!below) return;
    if (outline) this.outline(outline);
    const top = this.cur;
    for (let i = 0; i < top.length; i++) {
      if (top[i] !== null) below[i] = top[i];
    }
    this.cur = below;
  }

  /** Paint a 1px contour on every empty pixel that touches an opaque one. */
  public outline(c: string = OUTLINE): void {
    const src = this.cur;
    const out = src.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (src[i] !== null) continue;
        const n =
          (x > 0 && src[i - 1] !== null) ||
          (x < this.w - 1 && src[i + 1] !== null) ||
          (y > 0 && src[i - this.w] !== null) ||
          (y < this.h - 1 && src[i + this.w] !== null);
        if (n) out[i] = c;
      }
    }
    this.cur = out;
  }

  // ---------------------------------------------------------------- export
  /** Raw cells (row-major, null = transparent) for offline renderers. */
  public cells(): ReadonlyArray<string | null> {
    return this.cur;
  }

  public drawTo(ctx: CanvasRenderingContext2D, ox = 0, oy = 0): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.cur[y * this.w + x];
        if (c === null) continue;
        ctx.fillStyle = c;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}
