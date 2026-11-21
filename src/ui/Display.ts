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
  // scenes may show their design up to ~1.4× larger (the menu, the run on wide phones)
  return Math.max(1, Math.round(currentZoom * 1.5 * 4) / 4);
}

// ------------------------------------------------------------ scenes

/** A part of the 1920×1080 design a scene wants shown as large as the screen allows. */
export interface View {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The whole 1920×1080 design. */
export const FULL_VIEW: View = { x0: 0, x1: WORLD_W, y0: 0, y1: WORLD_H };

/** The world area each scene shows (fixed when it is laid out, so pinned elements stay put). */
const shown = new Map<Phaser.Scene, View>();

/**
 * World area shown for a view on the current canvas: the view fits whole, and the rest of the
 * screen extends it on the sides (wide phones) or above and below (4:3 tablets).
 */
function showFor(scene: Phaser.Scene, view: View): View {
  const cw = scene.scale.gameSize.width;
  const ch = scene.scale.gameSize.height;
  const zoom = Math.min(cw / (view.x1 - view.x0), ch / (view.y1 - view.y0));
  const cx = (view.x0 + view.x1) / 2;
  const cy = (view.y0 + view.y1) / 2;
  const hw = cw / zoom / 2;
  const hh = ch / zoom / 2;
  return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
}

/**
 * Call at the start of a scene's create(): the scene shows `view` (the whole design by default)
 * as large as the screen allows and lays out its pinned elements by the area actually shown
 * (shownArea / sideMargin / leftEdge / rightEdge).
 */
export function fitCamera(scene: Phaser.Scene, view: View = FULL_VIEW): void {
  shown.set(scene, showFor(scene, view));
  // a stopped scene loses its cameras; it is fitted again on its next create()
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => shown.delete(scene));
  scene.events.once(Phaser.Scenes.Events.DESTROY, () => shown.delete(scene));
  applyZoom(scene);
}

/** Switch a running scene to another view (the menu zooms out while a window is open). */
export function setView(scene: Phaser.Scene, view: View): void {
  shown.set(scene, showFor(scene, view));
  applyZoom(scene);
}

/** World area this scene shows. */
export function shownArea(scene: Phaser.Scene): View {
  return shown.get(scene) ?? showFor(scene, FULL_VIEW);
}

/** How far the shown area reaches past the 1920 design on each side (negative: less than 1920 shown). */
export function sideMargin(scene: Phaser.Scene): number {
  const a = shownArea(scene);
  return (a.x1 - a.x0 - WORLD_W) / 2;
}

/** World x of the screen's left / right edge in this scene. */
export const leftEdge = (scene: Phaser.Scene): number => shownArea(scene).x0;
export const rightEdge = (scene: Phaser.Scene): number => shownArea(scene).x1;

/** Wide enough for any full-screen background or shade (centred at x = 960). */
export const FULL_W = 2 * WORLD_W;
/** Tall enough for any full-screen shade (centred at y = 540). */
export const FULL_H = 2 * WORLD_H;

function applyZoom(scene: Phaser.Scene): void {
  const cam = scene.cameras?.main;
  if (!cam) return;
  const cw = scene.scale.gameSize.width;
  const ch = scene.scale.gameSize.height;
  const a = shownArea(scene);
  // the area fits whole; if the screen changed shape since the scene was laid out, it is centred
  const zoom = Math.min(cw / (a.x1 - a.x0), ch / (a.y1 - a.y0));
  cam.setSize(cw, ch);
  cam.setOrigin(0, 0).setZoom(zoom);
  cam.setScroll((a.x0 + a.x1) / 2 - cw / zoom / 2, (a.y0 + a.y1) / 2 - ch / zoom / 2);
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
  for (const scene of shown.keys()) {
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
