import Phaser from 'phaser';

/**
 * Single source of truth for UI typography.
 *
 * Every `scene.add.text(...)` goes through `installTextDefaults()`, which swaps the
 * generic families used around the codebase ('monospace', 'sans-serif', or none)
 * for UI_FONT. To switch the whole game to a bundled pixel font, add an
 * @font-face (see main.ts + loadUiFont) — nothing else has to change.
 */
export const UI_FONT = '"Pixelify Sans", Consolas, "Lucida Console", monospace';

/** Wait for both weights (with Cyrillic glyphs) so the first frame already uses the pixel font. */
export function loadUiFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const sample = 'Шестерни Gears 0123';
  return Promise.all([
    document.fonts.load(`500 20px "Pixelify Sans"`, sample),
    document.fonts.load(`700 20px "Pixelify Sans"`, sample)
  ])
    .then(() => undefined)
    .catch(() => undefined);
}

const GENERIC = new Set(['monospace', 'sans-serif', 'serif', 'Courier', '']);

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
    // readability floor: nothing smaller than MIN_FONT_PX, bold by default
    const size = parseInt(String(next.fontSize ?? '16'), 10);
    if (!Number.isNaN(size) && size < MIN_FONT_PX) next.fontSize = `${MIN_FONT_PX}px`;
    // a stroke closes the small counters of pixel glyphs (С→О, 5→8): thin it out,
    // and give light text a hard drop shadow instead so it reads on any backdrop
    if (next.strokeThickness !== undefined && next.strokeThickness > 2) next.strokeThickness = 2;
    if (!next.shadow && isLight(String(next.color ?? '#ffffff'))) {
      next.shadow = { offsetX: 2, offsetY: 2, color: '#0b0910', blur: 0, fill: true, stroke: false };
    }
    return original.call(this, x, y, text, next);
  };
}
