import Phaser from 'phaser';

/**
 * Render resolution of the game.
 *
 * Every scene is laid out in a fixed 1920×1080 world. The canvas itself can be
 * smaller or larger (the «resolution» setting): the main camera of each scene is
 * zoomed so the whole world always fills the canvas, and the canvas is then fitted
 * into the screen (`Phaser.Scale.FIT`, bars in index.html, camera cut-outs kept
 * clear by the safe-area padding).
 *
 * «Auto» picks the preset that matches the real pixels of the screen area the game
 * gets: a 2400×1080 phone gets 1920×1080, a 1600×720 one 1280×720, a 1440p monitor
 * 2560×1440. It is picked again when the window or the phone turns.
 */

export const WORLD_W = 1920;
export const WORLD_H = 1080;

import { pickResolution, RESOLUTIONS, type Resolution } from './resolutions';

export { RESOLUTIONS, type Resolution };

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

/**
 * Real pixels of the 16:9 box the game gets on this screen: the page area left
 * after the camera cut-out padding, times the device pixel ratio.
 */
export function screenBoxPixels(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: WORLD_W, h: WORLD_H };
  const box = document.getElementById('game-container');
  const cssW = box?.clientWidth || window.innerWidth;
  const cssH = box?.clientHeight || window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const h = Math.min(cssH, (cssW * 9) / 16) * dpr;
  return { w: Math.round((h * 16) / 9), h: Math.round(h) };
}

/** Largest preset that is not bigger than the screen box (the smallest one on tiny screens). */
export function autoResolution(): Resolution {
  return pickResolution(screenBoxPixels().h);
}

export function resolveResolution(setting = resolutionSetting()): Resolution {
  return RESOLUTIONS.find((r) => r.id === setting) ?? autoResolution();
}

/** World → canvas scale of the current canvas. */
export function worldZoom(game?: Phaser.Game): number {
  const w = game ? game.scale.gameSize.width : resolveResolution().w;
  return w / WORLD_W;
}

/** Text is rasterised this much finer, so it stays sharp on canvases larger than the world. */
export function textResolution(): number {
  return Math.max(1, currentZoom);
}

let currentZoom = 1;
const fitted = new Set<Phaser.Scene>();

/** Call at the start of a scene's create(): the camera shows the 1920×1080 world on any canvas size. */
export function fitCamera(scene: Phaser.Scene): void {
  fitted.add(scene);
  // a stopped scene loses its cameras; it is fitted again on its next create()
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => fitted.delete(scene));
  scene.events.once(Phaser.Scenes.Events.DESTROY, () => fitted.delete(scene));
  applyZoom(scene);
}

function applyZoom(scene: Phaser.Scene): void {
  const cam = scene.cameras?.main;
  if (!cam) return;
  cam.setSize(scene.scale.gameSize.width, scene.scale.gameSize.height);
  cam.setOrigin(0, 0).setScroll(0, 0).setZoom(scene.scale.gameSize.width / WORLD_W);
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

/** Switch the canvas to another size at once, keeping every scene (a paused run too). */
export function setRenderSize(game: Phaser.Game, r: Resolution): void {
  currentZoom = r.w / WORLD_W;
  if (game.scale.gameSize.width === r.w && game.scale.gameSize.height === r.h) return;
  game.scale.setGameSize(r.w, r.h);
  const res = textResolution();
  for (const scene of fitted) {
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
export function initialRenderSize(): Resolution {
  const r = resolveResolution();
  currentZoom = r.w / WORLD_W;
  return r;
}

/** In «auto», follow the window: a turned phone, a resized browser, a moved window. */
export function followScreen(game: Phaser.Game): void {
  let timer: number | undefined;
  const refit = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (resolutionSetting() === AUTO) setRenderSize(game, autoResolution());
    }, 200);
  };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  // the cut-out padding can change without a window resize (the Android app reports it late)
  const box = document.getElementById('game-container');
  if (box && typeof ResizeObserver !== 'undefined') new ResizeObserver(refit).observe(box);
}
