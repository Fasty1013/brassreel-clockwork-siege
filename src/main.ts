import Phaser from 'phaser';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import { installTextDefaults, loadUiFont } from './ui/TextStyles';
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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
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
  game.events.once(Phaser.Core.Events.READY, () => {
    syncCanvasSmoothing(game);
    game.scale.on(Phaser.Scale.Events.RESIZE, () => syncCanvasSmoothing(game));
  });
  window.addEventListener('resize', () => syncCanvasSmoothing(game));
});

/**
 * pixelArt makes the browser scale the 1920×1080 canvas nearest-neighbour. That is
 * crisp at exact integer zoom, but at any other size (a 1600 px window, a laptop)
 * whole pixel rows of every glyph are dropped and text turns to mush. Keep crisp
 * scaling only for integer zoom; otherwise let the browser smooth the canvas.
 */
function syncCanvasSmoothing(game: Phaser.Game): void {
  const canvas = game.canvas;
  if (!canvas || !canvas.clientWidth) return;
  const zoom = canvas.clientWidth / canvas.width;
  const integerZoom = zoom >= 1 && Math.abs(zoom - Math.round(zoom)) < 0.01;
  canvas.style.imageRendering = integerZoom ? 'pixelated' : 'auto';
}
