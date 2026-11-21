import Phaser from 'phaser';
import {
  canvasSize, MIN_WORLD_W, pickResolution, RESOLUTIONS, WORLD_H, worldWidthFor, type Resolution
} from './resolutions';

/**
 * Screen, world and render resolution.
 *
 * Scenes are designed for 1920×1080 (WORLD_W). The world is 1080 tall and as wide as
 * the screen's shape asks (worldWidthFor: 1920 for 16:9 up to 2560 for 21:9), so a
 * 20:9 phone is filled edge to edge: each scene puts its full-screen backgrounds across
 * the whole width and pins side elements to the edges (sideMargin / leftEdge / rightEdge);
 * the 1920 design stays centred.
 *
 * The canvas has the world's shape; its height is the «resolution» setting (auto: the
 * screen's real pixels). The page keeps the canvas clear of camera cut-outs with the
 * safe-area padding in index.html, so the world fills exactly the area left beside a cut-out.
 */

export const WORLD_W = 1920;
export { WORLD_H, RESOLUTIONS, type Resolution };

export const AUTO = 'auto';
const STORAGE_KEY = 'brassreel_resolution';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private mode / blocked storage: the choice lasts until the page closes
  }
}

/** The saved choice: 'auto' or a preset id. */
export function resolutionSetting(): string {
  const saved = typeof window === 'undefined' ? null : read(STORAGE_KEY);
  return saved && RESOLUTIONS.some((r) => r.id === saved) ? saved : AUTO;
}

/** CSS size of the page area the game gets (after the cut-out padding). */
function gameArea(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: WORLD_W, h: WORLD_H };
  const box = document.getElementById('game-container');
  return { w: box?.clientWidth || window.innerWidth, h: box?.clientHeight || window.innerHeight };
}

/** World width this screen asks for. */
export function screenWorldWidth(): number {
  const a = gameArea();
  return worldWidthFor(a.w, a.h);
}

/** Real pixels of the area the game is shown in (CSS size × device pixel ratio, world shape). */
export function screenBoxPixels(): { w: number; h: number } {
  const a = gameArea();
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const ww = worldWidth;
  const h = Math.min(a.h, (a.w * WORLD_H) / ww) * dpr;
  return { w: Math.round((h * ww) / WORLD_H), h: Math.round(h) };
}

export function autoResolution(): Resolution {
  return pickResolution(screenBoxPixels().h);
}

export function resolveResolution(setting = resolutionSetting()): Resolution {
  return RESOLUTIONS.find((r) => r.id === setting) ?? autoResolution();
}

/** Canvas size of a preset at the current world shape (for labels in the settings). */
export function presetCanvas(r: Resolution): { w: number; h: number } {
  return canvasSize(r, worldWidth);
}

let worldWidth = MIN_WORLD_W;
let currentZoom = 1;

/** Text is rasterised this much finer, so it stays sharp on canvases taller than 1080. */
export function textResolution(): number {
  return Math.max(1, currentZoom);
}

// ------------------------------------------------------------ scenes

/** World width each scene was laid out for (fixed at its create()). */
const layoutWidth = new Map<Phaser.Scene, number>();

/**
 * Call at the start of a scene's create(): the scene is laid out for the current world
 * width, and its camera shows that world on any canvas size.
 */
export function fitCamera(scene: Phaser.Scene): void {
  layoutWidth.set(scene, worldWidth);
  // a stopped scene loses its cameras; it is fitted again on its next create()
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => layoutWidth.delete(scene));
  scene.events.once(Phaser.Scenes.Events.DESTROY, () => layoutWidth.delete(scene));
  applyZoom(scene);
}

/** How far the world reaches past the 1920 design on each side, for this scene. */
export function sideMargin(scene: Phaser.Scene): number {
  return ((layoutWidth.get(scene) ?? worldWidth) - WORLD_W) / 2;
}

/** World x of the screen's left / right edge in this scene. */
export const leftEdge = (scene: Phaser.Scene): number => -sideMargin(scene);
export const rightEdge = (scene: Phaser.Scene): number => WORLD_W + sideMargin(scene);

/** Wide enough for any full-screen background or shade (centred at x = 960). */
export const FULL_W = 2 * WORLD_W;

function applyZoom(scene: Phaser.Scene): void {
  const cam = scene.cameras?.main;
  if (!cam) return;
  const cw = scene.scale.gameSize.width;
  const ch = scene.scale.gameSize.height;
  const sceneW = layoutWidth.get(scene) ?? worldWidth;
  // the scene's world fits whole; if the screen changed shape since it was laid out, it is centred
  const zoom = Math.min(cw / sceneW, ch / WORLD_H);
  cam.setSize(cw, ch);
  cam.setOrigin(0, 0).setZoom(zoom);
  cam.setScroll(WORLD_W / 2 - cw / zoom / 2, WORLD_H / 2 - ch / zoom / 2);
}

/** Pointer position in world coordinates (pointer.x / y are canvas pixels). */
export function worldPoint(scene: Phaser.Scene, p: Phaser.Input.Pointer): { x: number; y: number } {
  const v = p.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
  return { x: v.x, y: v.y };
}

function retuneTexts(list: Phaser.GameObjects.GameObject[], res: number): void {
  for (const obj of list) {
    if (obj instanceof Phaser.GameObjects.Text) obj.setResolution(res);
    else if (obj instanceof Phaser.GameObjects.Container) retuneTexts(obj.list, res);
  }
}

/** Resize the canvas to a preset at the current world shape, keeping every scene (a paused run too). */
export function setRenderSize(game: Phaser.Game, r: Resolution): void {
  const size = canvasSize(r, worldWidth);
  currentZoom = size.h / WORLD_H;
  if (game.scale.gameSize.width !== size.w || game.scale.gameSize.height !== size.h) {
    game.scale.setGameSize(size.w, size.h);
  }
  const res = textResolution();
  for (const scene of layoutWidth.keys()) {
    applyZoom(scene);
    retuneTexts(scene.children.list, res);
  }
}

/** Save a choice ('auto' or a preset id) and apply it. */
export function chooseResolution(game: Phaser.Game, setting: string): Resolution {
  write(STORAGE_KEY, setting);
  const r = resolveResolution(setting);
  setRenderSize(game, r);
  return r;
}

/** Canvas size for the game config, before the game exists. */
export function initialRenderSize(): { w: number; h: number } {
  worldWidth = screenWorldWidth();
  const size = canvasSize(resolveResolution(), worldWidth);
  currentZoom = size.h / WORLD_H;
  return size;
}

/** Emitted on game.events when the world width changes; scenes that can re-lay themselves out do. */
export const WORLD_RESIZE = 'world-resize';

/**
 * Follow the screen: a turned phone, a resized or moved window, a cut-out reported late
 * by the Android app. The world takes the new shape and the canvas the new size.
 */
export function followScreen(game: Phaser.Game): void {
  let timer: number | undefined;
  const refit = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const w = screenWorldWidth();
      const changed = w !== worldWidth;
      worldWidth = w;
      setRenderSize(game, resolveResolution());
      if (changed) game.events.emit(WORLD_RESIZE, w);
    }, 150);
  };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  const box = document.getElementById('game-container');
  if (box && typeof ResizeObserver !== 'undefined') new ResizeObserver(refit).observe(box);
}
