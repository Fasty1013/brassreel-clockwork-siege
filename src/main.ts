import Phaser from 'phaser';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import { installTextDefaults, loadUiFont } from './ui/TextStyles';
import { followScreen, initialRenderSize } from './ui/Display';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RunScene } from './scenes/RunScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ReferenceScene } from './scenes/ReferenceScene';
import { AnimationViewerScene } from './scenes/AnimationViewerScene';
import { GalleryScene } from './scenes/GalleryScene';

// Determine initial scene based on URL parameters
const isAnimDebug = typeof window !== 'undefined' && window.location.search.includes('debug=anim');
const isGallery = typeof window !== 'undefined' && window.location.search.includes('debug=gallery');
const isRefBenchmark = typeof window !== 'undefined' && window.location.search.includes('benchmark=ref');

installTextDefaults();

// the canvas size is the «resolution» setting (auto: the screen's real pixels); scenes stay 1920×1080
const render = initialRenderSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: render.w,
  height: render.h,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#0b090f',
  scene: isGallery
    ? [GalleryScene]
    : isAnimDebug
    ? [AnimationViewerScene, BootScene, MenuScene, RunScene, GameOverScene, ReferenceScene]
    : isRefBenchmark
    ? [ReferenceScene, AnimationViewerScene, BootScene, MenuScene, RunScene, GameOverScene]
    : [BootScene, MenuScene, RunScene, GameOverScene, ReferenceScene, AnimationViewerScene]
};

// Phaser rasterises text once, so the pixel font must be ready before the first scene
void loadUiFont().then(() => {
  const game = new Phaser.Game(config);
  (window as any).game = game;
  keepCanvasSharp(game);
  followScreen(game);
  installBackHandler(game);
});

/**
 * Android back gesture / button (the app calls window.__brassBack, see MainActivity):
 * in a run it does what Esc does (close a window, skip a story scene, pause into the menu);
 * in the menu it closes a window. Returns false when there is nothing to go back to —
 * the app then goes to the background (the run is kept).
 */
function installBackHandler(game: Phaser.Game): void {
  const pressEscape = (): void => {
    const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
    // Phaser reads keyCode, which a constructed event does not carry
    Object.defineProperty(ev, 'keyCode', { get: () => 27 });
    Object.defineProperty(ev, 'which', { get: () => 27 });
    window.dispatchEvent(ev);
    const up = new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true });
    Object.defineProperty(up, 'keyCode', { get: () => 27 });
    Object.defineProperty(up, 'which', { get: () => 27 });
    window.setTimeout(() => window.dispatchEvent(up), 30);
  };
  (window as unknown as { __brassBack: () => boolean }).__brassBack = (): boolean => {
    const active = game.scene.getScenes(true).map((s) => s.scene.key);
    if (active.includes('RunScene')) {
      pressEscape();
      return true;
    }
    const menu = game.scene.getScene('MenuScene') as Phaser.Scene & { handleBack?: () => boolean };
    if (active.includes('MenuScene')) return menu.handleBack?.() ?? false;
    const over = game.scene.getScene('GameOverScene') as Phaser.Scene & { handleBack?: () => boolean };
    if (active.includes('GameOverScene')) return over.handleBack?.() ?? false;
    return false;
  };
}

/**
 * Nearest-neighbour scaling keeps pixel art crisp when the canvas is shown at
 * a whole multiple of its size, but at any other scale it drops or doubles
 * whole rows of pixels and tears text apart. Smooth scaling is used then.
 */
function keepCanvasSharp(game: Phaser.Game): void {
  const apply = (): void => {
    const canvas = game.canvas;
    if (!canvas) return;
    const shown = canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    // pixel-exact only at whole multiples (×1, ×2…): a 1.5× stretch makes uneven pixel rows
    const ratio = shown / game.scale.width;
    const whole = ratio >= 0.99 && Math.abs(ratio - Math.round(ratio)) < 0.02;
    canvas.style.imageRendering = whole ? 'pixelated' : 'auto';
  };
  game.events.once(Phaser.Core.Events.READY, apply);
  game.scale.on(Phaser.Scale.Events.RESIZE, apply);
  game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => setTimeout(apply, 100));
  window.addEventListener('resize', () => setTimeout(apply, 50));
  apply();
}
