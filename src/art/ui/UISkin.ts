import Phaser from 'phaser';

/**
 * UISkin — pixel-art 9-slice panels for every framed rectangle in a scene.
 *
 * The UI code builds its boxes from plain `Rectangle`s with a stroke. Instead of
 * rewriting every call site, the skin finds those rectangles, puts a NineSlice
 * panel underneath (12×12 native texture, 4px corners, shown at an exact ×3) and
 * hides the flat fill. The rectangle stays the interactive / tweened object; the
 * panel copies its position, size, visibility and alpha every frame, and its
 * style follows later `setFillStyle` / `setStrokeStyle` calls (hover, HOLD...).
 */

export type PanelStyle = 'iron' | 'brass' | 'parchment' | 'paper' | 'red';

/**
 * «Midnight brass» — one palette for every panel, button and frame:
 * dark plum panels, a single brass edge, gold for the main actions, crimson for danger.
 * Corners are cut by two pixels (×3 = a soft 6 px rounding); no rivets on buttons.
 */
export const THEME = {
  out: '#0c0a10',
  panel: '#1f1a29',
  panelHi: '#2b2438',
  panelLo: '#17131f',
  line: '#3b3350',
  lineHi: '#524866',
  brassHi: '#f2c98a',
  brass: '#c08a4e',
  brassLo: '#7a4f2a',
  gold: '#f0b44c',
  goldDeep: '#e3a23c',
  goldHi: '#ffe2a0',
  goldLo: '#a86a24',
  goldOut: '#3b2412',
  red: '#c43241',
  redDeep: '#ad2836',
  redHi: '#ff8a7a',
  redLo: '#5e0f1a'
} as const;

const N = 12;
const CORNER = 4;
const SCALE = 3;
const T = THEME;

type Painter = (x: number, y: number) => string | null;

function edgeDist(x: number, y: number): number {
  return Math.min(x, y, N - 1 - x, N - 1 - y);
}
/** The two-pixel cut at each corner (soft rounding). */
function cut(x: number, y: number): boolean {
  return Math.min(x, N - 1 - x) + Math.min(y, N - 1 - y) < 2;
}
/** Is (x,y) on the top or left side of ring `d` (the lit side)? */
function topLeft(x: number, y: number, d: number): boolean {
  return (y === d && x < N - 1 - d) || (x === d && y < N - 1 - d);
}

const PAINTERS: Record<PanelStyle, Painter> = {
  // neutral panel: dark plum, a quiet lavender edge
  iron: (x, y) => {
    if (cut(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return T.out;
    if (d === 1) return topLeft(x, y, 1) ? T.lineHi : T.line;
    if (y === 2) return T.panelHi;
    return T.panel;
  },
  // framed panel / secondary button: one brass edge around the dark plate
  brass: (x, y) => {
    if (cut(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return T.out;
    if (d === 1) return topLeft(x, y, 1) ? T.brassHi : T.brassLo;
    if (d === 2) return T.out;
    if (y === 3) return T.panelHi;
    return T.panel;
  },
  // main action: warm gold, lit top edge, deeper lower half
  parchment: (x, y) => {
    if (cut(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return T.goldOut;
    if (d === 1) return topLeft(x, y, 1) ? T.goldHi : T.goldLo;
    return y >= 7 ? T.goldDeep : T.gold;
  },
  // light paper (reel cells, cards on paper): ivory with a soft lavender edge
  paper: (x, y) => {
    if (cut(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return '#8f86a3';
    if (d === 1) return topLeft(x, y, 1) ? '#ffffff' : '#cfc6dc';
    return y >= 8 ? '#e9e3f0' : '#f3eef7';
  },
  // danger: crimson
  red: (x, y) => {
    if (cut(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return T.out;
    if (d === 1) return topLeft(x, y, 1) ? T.redHi : T.redLo;
    return y >= 7 ? T.redDeep : T.red;
  }
};

export function registerPanelTextures(tm: Phaser.Textures.TextureManager): void {
  for (const [style, paint] of Object.entries(PAINTERS) as Array<[PanelStyle, Painter]>) {
    const key = `panel_${style}`;
    if (tm.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = N;
    canvas.height = N;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = paint(x, y);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    tm.addCanvas(key, canvas);
  }
}

// ---------------------------------------------------------------- style picking
const rgb = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const lum = (c: number): number => {
  const [r, g, b] = rgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const isRed = (c: number): boolean => {
  const [r, g, b] = rgb(c);
  return r > 0xb0 && g < 0x70 && b < 0x80;
};
const isGold = (c: number): boolean => {
  const [r, g, b] = rgb(c);
  return r > 0xc0 && g > 0x80 && b < 0xa0;
};

/** Grey-ish light colours are paper; warm saturated light colours are the gold action style. */
const isNeutral = (c: number): boolean => {
  const [r, g, b] = rgb(c);
  return Math.max(r, g, b) - Math.min(r, g, b) < 50;
};

function pickStyle(fill: number, stroke: number | null): PanelStyle {
  if (isRed(fill)) return 'red';
  if (lum(fill) > 0.6) return isNeutral(fill) ? 'paper' : 'parchment';
  if (stroke !== null && isRed(stroke) && lum(fill) > 0.25) return 'red';
  if (stroke !== null && isGold(stroke)) return 'brass';
  return 'iron';
}

// ---------------------------------------------------------------- skinning
interface Skinned {
  rect: Phaser.GameObjects.Rectangle;
  panel: Phaser.GameObjects.NineSlice;
  fill: number;
  stroke: number | null;
  fillAlpha: number;
}

const SKIN_KEY = '__uiskin';

export class UISkin {
  private static skins = new WeakMap<Phaser.Scene, Skinned[]>();

  /** Skin everything framed in the scene now, and anything framed that gets added later. */
  public static install(scene: Phaser.Scene): void {
    if (!scene.textures.exists('panel_iron')) registerPanelTextures(scene.textures);
    if (this.skins.has(scene)) return;
    const list: Skinned[] = [];
    this.skins.set(scene, list);

    const scan = (): void => {
      const visit = (obj: Phaser.GameObjects.GameObject): void => {
        if (obj instanceof Phaser.GameObjects.Container) {
          for (const child of obj.list) visit(child);
        } else if (obj instanceof Phaser.GameObjects.Rectangle) {
          this.trySkin(scene, obj, list);
        }
      };
      for (const obj of scene.children.list) visit(obj);
    };
    scan();

    // later-built rectangles (shop cards, archive rows, unit cards) get skinned on the next frame
    let pending = false;
    const onAdded = (): void => {
      if (pending) return;
      pending = true;
      scene.time.delayedCall(0, () => {
        pending = false;
        scan();
      });
    };
    scene.sys.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, () => this.sync(list));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.sys.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
      this.skins.delete(scene);
    });
    this.sync(list);
  }

  private static trySkin(scene: Phaser.Scene, rect: Phaser.GameObjects.Rectangle, list: Skinned[]): void {
    if (rect.getData(SKIN_KEY)) return;
    if (!rect.isStroked || !rect.isFilled) return;
    if (rect.fillAlpha < 0.6) return; // grid hints / translucent overlays stay as they are
    if (rect.width < 30 || rect.height < 22) return;

    const panel = scene.add.nineslice(
      rect.x, rect.y, 'panel_iron', undefined,
      rect.width / SCALE, rect.height / SCALE, CORNER, CORNER, CORNER, CORNER
    ).setScale(SCALE).setOrigin(rect.originX, rect.originY);

    const parent = rect.parentContainer;
    if (parent) {
      parent.addAt(panel, parent.getIndex(rect));
    } else {
      panel.setDepth(rect.depth);
      scene.children.moveBelow(panel as never, rect as never);
    }

    const s: Skinned = {
      rect,
      panel,
      fill: rect.fillColor,
      stroke: rect.strokeColor,
      fillAlpha: rect.fillAlpha
    };
    rect.setData(SKIN_KEY, true);
    this.applyStyle(s);
    rect.isFilled = false;
    rect.isStroked = false;

    // follow later colour changes (hover states, HOLD toggles...)
    const origFill = rect.setFillStyle.bind(rect);
    const origStroke = rect.setStrokeStyle.bind(rect);
    rect.setFillStyle = ((color?: number, alpha = 1) => {
      origFill(color, alpha);
      if (color !== undefined) {
        s.fill = color;
        s.fillAlpha = alpha;
        this.applyStyle(s);
      }
      rect.isFilled = false;
      return rect;
    }) as typeof rect.setFillStyle;
    rect.setStrokeStyle = ((lineWidth?: number, color?: number, alpha?: number) => {
      origStroke(lineWidth, color, alpha);
      s.stroke = color ?? null;
      this.applyStyle(s);
      rect.isStroked = false;
      return rect;
    }) as typeof rect.setStrokeStyle;

    rect.once(Phaser.GameObjects.Events.DESTROY, () => panel.destroy());
    list.push(s);
  }

  private static applyStyle(s: Skinned): void {
    const style = pickStyle(s.fill, s.stroke);
    const key = `panel_${style}`;
    if (s.panel.texture.key !== key) s.panel.setTexture(key);
  }

  private static sync(list: Skinned[]): void {
    for (let i = list.length - 1; i >= 0; i--) {
      const { rect, panel, fillAlpha } = list[i];
      if (!rect.active || !panel.active) {
        list.splice(i, 1);
        continue;
      }
      panel.setPosition(rect.x, rect.y);
      panel.setVisible(rect.visible);
      panel.setAlpha(rect.alpha * Math.max(0.6, fillAlpha));
      panel.setRotation(rect.rotation);
      const w = (rect.width * rect.scaleX) / SCALE;
      const h = (rect.height * rect.scaleY) / SCALE;
      if (Math.abs(panel.width - w) > 0.01 || Math.abs(panel.height - h) > 0.01) {
        panel.setSize(Math.max(CORNER * 2, w), Math.max(CORNER * 2, h));
      }
      if (!rect.parentContainer) panel.setDepth(rect.depth);
    }
  }
}
