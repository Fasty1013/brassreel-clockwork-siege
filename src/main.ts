import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RunScene } from './scenes/RunScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ReferenceScene } from './scenes/ReferenceScene';
import { AnimationViewerScene } from './scenes/AnimationViewerScene';

// Determine initial scene based on URL parameters
const isAnimDebug = typeof window !== 'undefined' && window.location.search.includes('debug=anim');
const isRefBenchmark = typeof window !== 'undefined' && window.location.search.includes('benchmark=ref');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 640,
  height: 360,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#0b090f',
  scene: isAnimDebug
    ? [AnimationViewerScene, ReferenceScene, BootScene, MenuScene, RunScene, GameOverScene]
    : isRefBenchmark
    ? [ReferenceScene, AnimationViewerScene, BootScene, MenuScene, RunScene, GameOverScene]
    : [ReferenceScene, BootScene, MenuScene, RunScene, GameOverScene, AnimationViewerScene]
};

export const game = new Phaser.Game(config);
(window as any).game = game;
