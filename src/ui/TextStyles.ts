import Phaser from 'phaser';

/**
 * Single source of truth for UI typography.
 *
 * Every `scene.add.text(...)` goes through `installTextDefaults()`, which swaps the
 * generic families used around the codebase ('monospace', 'sans-serif', or none)
 * for UI_FONT. To switch the whole game to a bundled pixel font, add an
 * @font-face (see main.ts + loadUiFont) — nothing else has to change.
 */
export const UI_FONT = '"Rubik", "Segoe UI", Arial, sans-serif';

/**
 * Wait for both weights (with Cyrillic glyphs) so the first frame already uses the font.
 * Rubik replaced the pixel fonts: they tear apart when the game is shown smaller
 * than 1920×1080, and Pixelify's Ш and Д read as W and A.
 */
export function loadUiFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const sample = 'Шестерни Держать Gears 0123';
  return Promise.all([
    document.fonts.load(`500 20px "Rubik"`, sample),
    document.fonts.load(`700 20px "Rubik"`, sample)
  ])
    .then(() => undefined)
    .catch(() => undefined);
}

const GENERIC = new Set(['monospace', 'sans-serif', 'serif', 'Courier', '']);

/** Size multiplier for the UI font, applied to every UI text. */
const FONT_SCALE = 1;

/** Smallest font size allowed anywhere in the UI. */
export const MIN_FONT_PX = 15;

/**
 * Phones and small tablets show the 1920×1080 game at well under 60% of its size,
 * so 15–18 px text ends up 5–7 px tall on the glass. There every small text grows
 * (at least SMALL_SCREEN_MIN_PX); big titles are already readable and stay as they are.
 * `?ui=phone` / `?ui=desktop` in the address forces one mode (screenshots, tests).
 */
export const SMALL_SCREEN_MIN_PX = 22;
const SMALL_SCREEN_GROWTH = 1.15;
const SMALL_SCREEN_LIMIT_PX = 30;

function forcedMode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('ui');
}

export const SMALL_SCREEN: boolean = (() => {
  const forced = forcedMode();
  if (forced) return forced === 'phone';
  if (typeof window === 'undefined') return false;
  return Math.min(window.innerWidth / 1920, window.innerHeight / 1080) < 0.6;
})();

/** Touch screen as the main input: no keyboard, so no key hints in labels. */
export const TOUCH_ONLY: boolean = (() => {
  const forced = forcedMode();
  if (forced) return forced === 'phone';
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches;
})();

/** « (T)» after a label on a computer, nothing on a touch screen. */
export function keyHint(key: string): string {
  return TOUCH_ONLY ? '' : ` (${key})`;
}

/** Font size actually used for a size asked for in 1920×1080 units. */
export function uiFontSize(size: number): number {
  let px = Math.round(size * FONT_SCALE);
  if (SMALL_SCREEN && px < SMALL_SCREEN_LIMIT_PX) {
    px = Math.min(SMALL_SCREEN_LIMIT_PX, Math.max(SMALL_SCREEN_MIN_PX, Math.round(px * SMALL_SCREEN_GROWTH)));
  }
  return Math.max(MIN_FONT_PX, px);
}

/**
 * Keeps a one-line label inside its box (1920×1080 units): the font shrinks as
 * far as needed, never below MIN_FONT_PX, and fits again on every setText.
 * Small texts grow on phones (see uiFontSize), so labels in tight frames use this.
 */
export function fitBox<T extends Phaser.GameObjects.Text>(t: T, maxWidth: number, maxHeight = Infinity): T {
  const base = parseInt(String(t.style.fontSize), 10);
  if (Number.isNaN(base)) return t;
  const fit = (): void => {
    let size = base;
    t.setFontSize(size);
    while ((t.width > maxWidth || t.height > maxHeight) && size > MIN_FONT_PX) {
      size--;
      t.setFontSize(size);
    }
  };
  const text = t as Phaser.GameObjects.Text;
  const setText = text.setText.bind(text);
  text.setText = (value: string | string[]) => {
    setText(value);
    fit();
    return text;
  };
  fit();
  return t;
}

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
    // Rubik 500 is the regular weight; 'bold' maps to the bundled 700
    if (next.fontFamily === UI_FONT && !String(next.fontStyle ?? '').includes('bold')) {
      next.fontStyle = `${next.fontStyle ?? ''} 500`.trim();
    }
    // readability floor: nothing smaller than MIN_FONT_PX, bold by default
    const size = parseInt(String(next.fontSize ?? '16'), 10);
    if (!Number.isNaN(size)) next.fontSize = `${next.fontFamily === UI_FONT ? uiFontSize(size) : Math.max(MIN_FONT_PX, size)}px`;
    // a stroke closes the small counters of pixel glyphs (С→О, 5→8): thin it out,
    // and give light text a hard drop shadow instead so it reads on any backdrop
    if (next.strokeThickness !== undefined && next.strokeThickness > 2) next.strokeThickness = 2;
    if (!next.shadow && isLight(String(next.color ?? '#ffffff'))) {
      next.shadow = { offsetX: 2, offsetY: 2, color: '#0b0910', blur: 0, fill: true, stroke: false };
    }
    return original.call(this, x, y, text, next);
  };
}
