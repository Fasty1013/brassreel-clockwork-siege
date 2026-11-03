import Phaser from 'phaser';
import { CogKnightArt } from '../art/characters/cogKnight';
import { SymbolArt } from '../art/symbols';
import { BackdropArt } from '../art/environment/backdrop';
import { UIFrameArt } from '../art/ui/frames';

/**
 * Interactive Animation Viewer & Sprite QA Tool
 * Accessible via /?debug=anim
 * Enables frame-by-frame inspection, timeScale scaling, and pixel alignment audits.
 */
export class AnimationViewerScene extends Phaser.Scene {
  private characterSprite!: Phaser.GameObjects.Sprite;
  private currentAnimKey = 'cog_knight_idle';
  private currentStateName = 'IDLE';
  private statusText!: Phaser.GameObjects.Text;
  private frameInfoText!: Phaser.GameObjects.Text;
  private timeScaleText!: Phaser.GameObjects.Text;
  private currentBgIndex = 0;
  private bgImage!: Phaser.GameObjects.Image;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private isGridVisible = false;

  constructor() {
    super('AnimationViewerScene');
  }

  public preload(): void {
    // Register all P1 pixel art assets
    CogKnightArt.registerAnimations(this);
    SymbolArt.registerAllSymbols(this);
    BackdropArt.registerBackdrop(this);
    UIFrameArt.registerAllUI(this);
  }

  public create(): void {
    const W = 640;
    const H = 360;

    // 1. Background Layer (toggleable)
    this.add.rectangle(W / 2, H / 2, W, H, 0x15121b);
    this.bgImage = this.add.image(W / 2, H / 2, 'bg_meadow_day');
    this.bgImage.setDisplaySize(W, H);
    this.bgImage.setVisible(false);

    // Pixel Grid Graphics
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x534764, 0.25);
    for (let x = 0; x < W; x += 16) {
      this.gridGraphics.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y < H; y += 16) {
      this.gridGraphics.lineBetween(0, y, W, y);
    }
    this.gridGraphics.setVisible(false);

    // 2. Character Stage (Center)
    const stageX = 320;
    const stageY = 170;

    // Ground shadow
    this.add.ellipse(stageX, stageY + 36, 42, 14, 0x0b090f, 0.45);

    // Cog Knight Sprite (Scaled 2x for easy inspection on viewer)
    this.characterSprite = this.add.sprite(stageX, stageY, 'tex_cog_knight');
    this.characterSprite.setScale(2.0); // 2x magnification on viewer
    this.characterSprite.play(this.currentAnimKey);

    // 3. Header & Info Panel
    const headerBg = this.add.rectangle(W / 2, 16, W - 16, 26, 0x231d2c);
    headerBg.setStrokeStyle(1, 0xd4a373);

    this.add.text(18, 10, '★ ANIMATION VIEWER (PIXEL QA) ★', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd166',
      fontStyle: 'bold'
    });

    this.statusText = this.add.text(380, 10, 'ENTITY: COG KNIGHT | STATE: IDLE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this.frameInfoText = this.add.text(stageX, stageY + 54, 'FRAME: 0 / 4 (FPS: 8)', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#d4a373'
    }).setOrigin(0.5);

    // 4. State Buttons (Left Sidebar)
    const states = [
      { name: '1. IDLE', key: 'cog_knight_idle' },
      { name: '2. MOVE', key: 'cog_knight_move' },
      { name: '3. ATTACK', key: 'cog_knight_attack' },
      { name: '4. HIT', key: 'cog_knight_hit' },
      { name: '5. DEATH', key: 'cog_knight_death' },
      { name: '6. SPAWN', key: 'cog_knight_spawn' }
    ];

    states.forEach((s, idx) => {
      const btnY = 56 + idx * 30;
      const btn = this.add.rectangle(70, btnY, 110, 24, 0x393047);
      btn.setStrokeStyle(1, 0xd4a373);
      btn.setInteractive({ useHandCursor: true });

      this.add.text(70, btnY, s.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4ecd8',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.currentAnimKey = s.key;
        this.currentStateName = s.name.replace(/^[0-9]\.\s*/, '');
        this.characterSprite.play(s.key);
        this.statusText.setText(`ENTITY: COG KNIGHT | STATE: ${this.currentStateName}`);
      });
    });

    // 5. Playback Controls (Right Sidebar)
    const speeds = [0.25, 0.5, 1.0, 2.0];
    this.add.text(560, 50, 'SPEED CONTROL:', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffd166'
    }).setOrigin(0.5);

    speeds.forEach((spd, idx) => {
      const spdY = 72 + idx * 24;
      const btn = this.add.rectangle(560, spdY, 90, 20, 0x231d2c);
      btn.setStrokeStyle(1, 0x534764);
      btn.setInteractive({ useHandCursor: true });

      this.add.text(560, spdY, `${spd}x`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#e7e0ef'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.characterSprite.anims.timeScale = spd;
        this.timeScaleText.setText(`TIME-SCALE: ${spd}x`);
      });
    });

    this.timeScaleText = this.add.text(560, 175, 'TIME-SCALE: 1x', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#b5e48c'
    }).setOrigin(0.5);

    // Pause / Step Button
    const pauseBtn = this.add.rectangle(560, 205, 90, 22, 0x4a0e17);
    pauseBtn.setStrokeStyle(1, 0xc1121f);
    pauseBtn.setInteractive({ useHandCursor: true });
    const pauseTxt = this.add.text(560, 205, 'PAUSE / STEP', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      if (this.characterSprite.anims.isPlaying) {
        this.characterSprite.anims.pause();
        pauseTxt.setText('RESUME');
      } else {
        this.characterSprite.anims.resume();
        pauseTxt.setText('PAUSE / STEP');
      }
    });

    // Background Toggle Button
    const bgToggleBtn = this.add.rectangle(560, 235, 90, 22, 0x1b4332);
    bgToggleBtn.setStrokeStyle(1, 0x52b788);
    bgToggleBtn.setInteractive({ useHandCursor: true });
    this.add.text(560, 235, 'TOGGLE BG', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#b5e48c',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bgToggleBtn.on('pointerdown', () => {
      this.currentBgIndex = (this.currentBgIndex + 1) % 2;
      this.bgImage.setVisible(this.currentBgIndex === 1);
    });

    // Grid Toggle Button
    const gridToggleBtn = this.add.rectangle(560, 265, 90, 22, 0x393047);
    gridToggleBtn.setStrokeStyle(1, 0xb8a9c9);
    gridToggleBtn.setInteractive({ useHandCursor: true });
    this.add.text(560, 265, 'TOGGLE GRID', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#f4ecd8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    gridToggleBtn.on('pointerdown', () => {
      this.isGridVisible = !this.isGridVisible;
      this.gridGraphics.setVisible(this.isGridVisible);
    });

    // 6. Bottom Symbol Showcase Bar
    const symbolBar = this.add.rectangle(W / 2, 334, W - 16, 38, 0x15121b);
    symbolBar.setStrokeStyle(1, 0x393047);

    this.add.text(20, 334, 'SLOT SYMBOLS (28x28):', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const symKeys = ['sym_cog', 'sym_spring', 'sym_fuse', 'sym_coil', 'sym_wild', 'sym_crown'];
    symKeys.forEach((key, idx) => {
      const symX = 170 + idx * 42;
      this.add.sprite(symX, 334, key).setDisplaySize(28, 28);
    });

    // Return to Game / Reference Scene Button
    const returnBtn = this.add.rectangle(570, 334, 100, 22, 0xd4a373);
    returnBtn.setStrokeStyle(1, 0xffd166);
    returnBtn.setInteractive({ useHandCursor: true });
    this.add.text(570, 334, 'VIEW GAME ▶', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#15121b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    returnBtn.on('pointerdown', () => {
      this.scene.start('ReferenceScene');
    });
  }

  public override update(): void {
    if (this.characterSprite && this.characterSprite.anims && this.characterSprite.anims.currentFrame) {
      const frameIdx = this.characterSprite.anims.currentFrame.index;
      const totalFrames = this.characterSprite.anims.currentAnim?.frames.length ?? 0;
      this.frameInfoText.setText(
        `FRAME: ${frameIdx} / ${totalFrames} | FPS: ${Math.round(this.game.loop.actualFps)}`
      );
    }
  }
}
