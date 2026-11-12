import Phaser from 'phaser';

/**
 * ModalKit — shared building blocks for every pop-up window, so the shop,
 * evolution, core draft and archive all look and read the same.
 * Framed rectangles are turned into pixel 9-slice panels by UISkin.
 */

export const UI = {
  GOLD: '#ffd166',
  CREAM: '#f4ecd8',
  MUTED: '#9a93ad',
  TEAL: '#5ae0d0',
  RED: '#ff8a7a',
  GREEN: '#8fe39a'
} as const;

type Parent = Phaser.GameObjects.Container;

export function backdrop(c: Parent, alpha = 0.8): Phaser.GameObjects.Rectangle {
  const r = c.scene.add.rectangle(0, 0, 1920, 1080, 0x07050a, alpha);
  r.setInteractive(); // blocks clicks underneath
  c.add(r);
  return r;
}

/** Main window: dark plate with a brass frame. */
export function panel(c: Parent, w: number, h: number, x = 0, y = 0): Phaser.GameObjects.Rectangle {
  const r = c.scene.add.rectangle(x, y, w, h, 0x1d1824);
  r.setStrokeStyle(4, 0xd4a373);
  c.add(r);
  return r;
}

/** Inner card: iron plate; `highlight` gives it a brass frame. */
export function card(c: Parent, x: number, y: number, w: number, h: number, highlight = false): Phaser.GameObjects.Rectangle {
  const r = c.scene.add.rectangle(x, y, w, h, 0x231d2c);
  r.setStrokeStyle(2, highlight ? 0xffd166 : 0x534764);
  c.add(r);
  return r;
}

export function text(
  c: Parent, x: number, y: number, str: string, size: number, color: string,
  opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> & { origin?: [number, number] } = {}
): Phaser.GameObjects.Text {
  const { origin = [0.5, 0.5], ...style } = opts;
  const t = c.scene.add.text(x, y, str, { fontSize: `${size}px`, color, ...style }).setOrigin(origin[0], origin[1]);
  c.add(t);
  return t;
}

export function title(c: Parent, y: number, str: string, sub?: string): void {
  text(c, 0, y, str, 40, UI.GOLD, { fontStyle: 'bold' });
  if (sub) text(c, 0, y + 44, sub, 20, UI.MUTED);
}

/** Thin divider line with an optional section label on the left. */
export function section(c: Parent, x: number, y: number, w: number, label?: string, hint?: string): void {
  if (label) {
    const head = text(c, x, y, label, 26, UI.GOLD, { origin: [0, 0.5] });
    if (hint) text(c, x + head.width + 20, y + 2, hint, 18, UI.MUTED, { origin: [0, 0.5] });
  }
  c.add(c.scene.add.rectangle(x + w / 2, y + 26, w, 2, 0x534764));
}

export interface ButtonOpts {
  size?: number;
  color?: string;
  /** 'primary' = brass frame, 'danger' = red frame, 'plain' = iron */
  kind?: 'primary' | 'danger' | 'plain';
  disabled?: boolean;
}

export function button(
  c: Parent, x: number, y: number, w: number, h: number, label: string, onClick: () => void, opts: ButtonOpts = {}
): { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const kind = opts.kind ?? 'primary';
  const stroke = opts.disabled ? 0x534764 : kind === 'danger' ? 0xd90429 : kind === 'plain' ? 0x6c757d : 0xffd166;
  const bg = c.scene.add.rectangle(x, y, w, h, 0x1f1a27);
  bg.setStrokeStyle(kind === 'primary' ? 3 : 2, stroke);
  c.add(bg);
  const color = opts.disabled ? UI.MUTED : opts.color ?? (kind === 'danger' ? UI.RED : kind === 'plain' ? UI.CREAM : UI.GOLD);
  const t = text(c, x, y, label, opts.size ?? 24, color);
  if (!opts.disabled) {
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setScale(1.04));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', onClick);
  } else {
    t.setAlpha(0.7);
  }
  return { bg, label: t };
}

/** Row of rank pips: ■■□□□ */
export function pips(c: Parent, x: number, y: number, filled: number, total: number, color = 0xffd166): void {
  const size = 12;
  const gap = 5;
  const start = x - ((total * (size + gap) - gap) / 2) + size / 2;
  for (let i = 0; i < total; i++) {
    const on = i < filled;
    const r = c.scene.add.rectangle(start + i * (size + gap), y, size, size, on ? color : 0x2b2638);
    r.setStrokeStyle(1, on ? 0xffffff : 0x534764, on ? 0.5 : 1);
    c.add(r);
  }
}
