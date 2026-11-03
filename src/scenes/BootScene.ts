import Phaser from 'phaser';
import { AssetLoader } from '../fx/AssetLoader';
import { CogKnightArt } from '../art/characters/cogKnight';
import { SpringArcherArt } from '../art/characters/springArcher';
import { ScrapperEnemyArt } from '../art/characters/scrapperEnemy';
import { DroneEnemyArt } from '../art/characters/droneEnemy';
import { ProjectilesArt } from '../art/projectiles';
import { SymbolArt } from '../art/symbols';
import { BackdropArt } from '../art/environment/backdrop';
import { UIFrameArt } from '../art/ui/frames';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // 1. Initialize Hybrid Progressive Asset Loader (procedural baseline + overrides)
    AssetLoader.init(this);

    // 2. Register bespoke retro pixel-art suites (P1 & P2 Benchmark)
    CogKnightArt.registerAnimations(this);
    SpringArcherArt.registerAnimations(this);
    ScrapperEnemyArt.registerAnimations(this);
    DroneEnemyArt.registerAnimations(this);
    ProjectilesArt.registerAll(this);
    SymbolArt.registerAllSymbols(this);
    BackdropArt.registerBackdrop(this);
    UIFrameArt.registerAllUI(this);

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
