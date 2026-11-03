import Phaser from 'phaser';
import { AssetLoader } from '../fx/AssetLoader';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Initialize Hybrid Progressive Asset Loader (procedural baseline + overrides)
    AssetLoader.init(this);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x14100c);

    this.add.text(width / 2, height / 2 - 40, 'BRASSREEL: CLOCKWORK SIEGE', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30, 'Forging brass automatons & loading steam engines...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#adb5bd'
    }).setOrigin(0.5);
  }

  public create(): void {
    // Immediate transition to MenuScene
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
