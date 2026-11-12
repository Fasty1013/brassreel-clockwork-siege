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

export type PanelStyle = 'iron' | 'brass' | 'parchment' | 'red';

const N = 12;
const CORNER = 4;
const SCALE = 3;
const OUT = '#17121f';

type Painter = (x: number, y: number) => string | null;

function edgeDist(x: number, y: number): number {
  return Math.min(x, y, N - 1 - x, N - 1 - y);
}
function isCorner(x: number, y: number): boolean {
  return (x === 0 || x === N - 1) && (y === 0 || y === N - 1);
}
/** Is (x,y) on the top or left side of ring `d` (light side of a bevel)? */
function topLeft(x: number, y: number, d: number): boolean {
  return (y === d && x < N - 1 - d) || (x === d && y < N - 1 - d);
}
function rivet(x: number, y: number, at: number): boolean {
  return (x === at || x === N - 1 - at) && (y === at || y === N - 1 - at);
}

const PAINTERS: Record<PanelStyle, Painter> = {
  iron: (x, y) => {
    if (isCorner(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return OUT;
    if (d === 1) return topLeft(x, y, 1) ? '#6a6280' : '#1c1a26';
    if (rivet(x, y, 2)) return '#b57647';
    return '#2f2b3c';
  },
  brass: (x, y) => {
    if (isCorner(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return OUT;
    if (d === 1) return topLeft(x, y, 1) ? '#e0a45c' : '#6b3f22';
    if (d === 2) return rivet(x, y, 2) ? '#ffe3a1' : '#b57647';
    if (d === 3) return OUT;
    return '#241e2c';
  },
  parchment: (x, y) => {
    if (isCorner(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return '#3b2416';
    if (d === 1) return '#9a6638';
    if (d === 2) return topLeft(x, y, 2) ? '#fff8e6' : '#d6c8a8';
    return '#efe6d0';
  },
  red: (x, y) => {
    if (isCorner(x, y)) return null;
    const d = edgeDist(x, y);
    if (d === 0) return OUT;
    if (d === 1) return topLeft(x, y, 1) ? '#ff8a6a' : '#6e1220';
    if (rivet(x, y, 2)) return '#ffd166';
    return '#c22a33';
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

function pickStyle(fill: number, stroke: number | null): PanelStyle {
  if (isRed(fill)) return 'red';
  if (lum(fill) > 0.6) return 'parchment';
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
