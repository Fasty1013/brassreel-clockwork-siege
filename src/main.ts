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
  keepCanvasSharp(game);
});

/**
 * Nearest-neighbour scaling keeps pixel art crisp when the game is shown at
 * full size or larger, but when the window is smaller than 1920×1080 it drops
 * whole rows of pixels and tears text apart. Smooth scaling is used then.
 */
function keepCanvasSharp(game: Phaser.Game): void {
  const apply = (): void => {
    const canvas = game.canvas;
    if (!canvas) return;
    const shown = canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    canvas.style.imageRendering = shown >= game.scale.width - 1 ? 'pixelated' : 'auto';
  };
  game.events.once(Phaser.Core.Events.READY, apply);
  game.scale.on(Phaser.Scale.Events.RESIZE, apply);
  window.addEventListener('resize', () => setTimeout(apply, 50));
  apply();
}
