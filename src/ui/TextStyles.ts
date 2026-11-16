import Phaser from 'phaser';

/**
 * Single source of truth for UI typography.
 *
 * Every `scene.add.text(...)` goes through `installTextDefaults()`, which swaps the
 * generic families used around the codebase ('monospace', 'sans-serif', or none)
 * for UI_FONT. To switch the whole game to a bundled pixel font, add an
 * @font-face (see main.ts + loadUiFont) — nothing else has to change.
 */
export const UI_FONT = '"Tiny5", Consolas, "Lucida Console", monospace';

/**
 * Wait for the pixel font (with Cyrillic glyphs) so the first frame already uses it.
 * Tiny5 was chosen over Pixelify Sans: its Ш and Д do not read as W and A.
 */
export function loadUiFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const sample = 'Шестерни Держать Gears 0123';
  return document.fonts
    .load(`400 20px "Tiny5"`, sample)
    .then(() => undefined)
    .catch(() => undefined);
}

const GENERIC = new Set(['monospace', 'sans-serif', 'serif', 'Courier', '']);

/** Size multiplier for the pixel font, applied to every UI text. */
const FONT_SCALE = 1.1;

/** Smallest font size allowed anywhere in the UI. */
export const MIN_FONT_PX = 15;

function isLight(color: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return true;
  const v = parseInt(m[1], 16);
  const lum = (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
  return lum > 0.45;
}

let installed = false;

export function installTextDefaults(): void {
  if (installed) return;
  installed = true;
  const proto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
  };
  const original = proto.text;
  proto.text = function (this: unknown, x, y, text, style = {}) {
    const family = style.fontFamily ?? '';
    const next: Phaser.Types.GameObjects.Text.TextStyle = GENERIC.has(family) ? { ...style, fontFamily: UI_FONT } : { ...style };
    // the pixel font has a single weight; a synthetic bold smears its pixels
    if (next.fontFamily === UI_FONT && next.fontStyle) {
      next.fontStyle = String(next.fontStyle).replace(/bold/g, '').trim();
    }
    // readability floor: nothing smaller than MIN_FONT_PX, bold by default
    let size = parseInt(String(next.fontSize ?? '16'), 10);
    // Tiny5 has a lower cap height than the old font: keep the same visual size
    if (!Number.isNaN(size) && next.fontFamily === UI_FONT) size = Math.round(size * FONT_SCALE);
    if (!Number.isNaN(size)) next.fontSize = `${Math.max(MIN_FONT_PX, size)}px`;
    // a stroke closes the small counters of pixel glyphs (С→О, 5→8): thin it out,
    // and give light text a hard drop shadow instead so it reads on any backdrop
    if (next.strokeThickness !== undefined && next.strokeThickness > 2) next.strokeThickness = 2;
    if (!next.shadow && isLight(String(next.color ?? '#ffffff'))) {
      next.shadow = { offsetX: 2, offsetY: 2, color: '#0b0910', blur: 0, fill: true, stroke: false };
    }
    return original.call(this, x, y, text, next);
  };
}
