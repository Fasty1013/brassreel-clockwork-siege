import Phaser from 'phaser';
import { ReelSymbol, Grid3x3, SpinResult } from '@core/reels/reels';

export class ReelView extends Phaser.GameObjects.Container {
  private reelColumns: Phaser.GameObjects.Container[] = [];
  private symbolSprites: Phaser.GameObjects.Sprite[][] = [];
  private holdButtons: Phaser.GameObjects.Rectangle[] = [];
  private holdTexts: Phaser.GameObjects.Text[] = [];
  private paylineGraphics: Phaser.GameObjects.Graphics;
  private isSpinning = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Slot housing frame (brass / mahogany casino chassis)
    const frame = scene.add.rectangle(0, 0, 360, 420, 0x1f1610);
    frame.setStrokeStyle(4, 0xd4a373);
    this.add(frame);

    // Casino marquee header
    const marquee = scene.add.rectangle(0, -180, 340, 44, 0x3d2b1f);
    marquee.setStrokeStyle(2, 0xffd166);
    this.add(marquee);
    const marqueeText = scene.add.text(0, -180, '★ GORN-SLOT 3×3 ★', {
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(marqueeText);

    // 3 Reel Window background
    const windowBg = scene.add.rectangle(0, -10, 320, 260, 0x100c08);
    windowBg.setStrokeStyle(2, 0x8c5836);
    this.add(windowBg);

    // Payline overlay graphics
    this.paylineGraphics = scene.add.graphics();
    this.add(this.paylineGraphics);

    // Initialize 3 Reel Columns (Col width = 100, spacing = 8)
    for (let c = 0; c < 3; c++) {
      const colX = -100 + c * 100;
      const colContainer = scene.add.container(colX, -10);
      this.add(colContainer);
      this.reelColumns.push(colContainer);

      this.symbolSprites[c] = [];
      for (let r = 0; r < 3; r++) {
        const rowY = -75 + r * 75;
        const sprite = scene.add.sprite(0, rowY, 'sym_cog');
        sprite.setDisplaySize(60, 60);
        colContainer.add(sprite);
        this.symbolSprites[c].push(sprite);
      }

      // Hold Button below each reel
      const holdBtn = scene.add.rectangle(colX, 140, 84, 28, 0x343a40);
      holdBtn.setStrokeStyle(2, 0x6c757d);
      holdBtn.setInteractive({ useHandCursor: true });
      this.add(holdBtn);
      this.holdButtons.push(holdBtn);

      const holdTxt = scene.add.text(colX, 140, 'HOLD', {
        fontSize: '12px',
        color: '#adb5bd',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add(holdTxt);
      this.holdTexts.push(holdTxt);

      const reelIndex = c;
      holdBtn.on('pointerdown', () => {
        if (!this.isSpinning) {
          this.emit('toggle_hold', reelIndex);
        }
      });
    }

    scene.add.existing(this);
  }

  public setGrid(grid: Grid3x3): void {
    const symTextureMap: Record<string, string> = {
      cog: 'sym_cog',
      spring: 'sym_spring',
      fuse: 'sym_fuse',
      coil: 'sym_coil',
      wild: 'sym_wild',
      crown: 'sym_crown'
    };

    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 3; r++) {
        const item: ReelSymbol = grid[c][r];
        const tex = symTextureMap[item.symbol] ?? 'sym_cog';
        this.symbolSprites[c][r].setTexture(tex);
        if (item.isGilded) {
          this.symbolSprites[c][r].setTint(0xffea00);
        } else {
          this.symbolSprites[c][r].clearTint();
        }
      }
    }
  }

  public updateHolds(heldReels: [boolean, boolean, boolean]): void {
    for (let c = 0; c < 3; c++) {
      if (heldReels[c]) {
        this.holdButtons[c].setFillStyle(0xd90429);
        this.holdButtons[c].setStrokeStyle(2, 0xffd166);
        this.holdTexts[c].setColor('#ffffff');
      } else {
        this.holdButtons[c].setFillStyle(0x343a40);
        this.holdButtons[c].setStrokeStyle(2, 0x6c757d);
        this.holdTexts[c].setColor('#adb5bd');
      }
    }
  }

  /**
   * Plays reel spin animation with sequential stops.
   */
  public playSpinAnimation(
    finalGrid: Grid3x3,
    heldReels: [boolean, boolean, boolean],
    onComplete: () => void
  ): void {
    this.isSpinning = true;
    this.clearPaylines();

    const symbols = ['sym_cog', 'sym_spring', 'sym_fuse', 'sym_coil', 'sym_wild', 'sym_crown'];

    for (let c = 0; c < 3; c++) {
      if (heldReels[c]) continue; // Held reels do not blur/scroll

      const colContainer = this.reelColumns[c];
      const sprites = this.symbolSprites[c];

      // Blurring / scrolling tween
      const spinTimer = this.scene.time.addEvent({
        delay: 50,
        repeat: 12 + c * 6, // Reel 1 stops at 600ms, Reel 2 at 900ms, Reel 3 at 1200ms
        callback: () => {
          for (let r = 0; r < 3; r++) {
            sprites[r].setTexture(Phaser.Utils.Array.GetRandom(symbols));
          }
        },
        callbackScope: this
      });

      // Stop bounce tween
      this.scene.time.delayedCall(600 + c * 300, () => {
        spinTimer.remove();
        // Set final symbols
        for (let r = 0; r < 3; r++) {
          const item = finalGrid[c][r];
          sprites[r].setTexture(`sym_${item.symbol}`);
          if (item.isGilded) sprites[r].setTint(0xffea00);
          else sprites[r].clearTint();
        }

        // Mechanical clunk bounce
        this.scene.tweens.add({
          targets: colContainer,
          y: '-=12',
          duration: 60,
          yoyo: true,
          ease: 'Quad.easeInOut'
        });

        if (c === 2) {
          this.isSpinning = false;
          onComplete();
        }
      });
    }

    if (heldReels.every((h) => h)) {
      this.isSpinning = false;
      onComplete();
    }
  }

  public highlightWinningLines(spinResult: SpinResult): void {
    this.paylineGraphics.clear();
    this.paylineGraphics.lineStyle(4, 0xffd166, 0.9);

    for (const hit of spinResult.lineHits) {
      const coords = hit.coords;
      const startX = -100 + coords[0][0] * 100;
      const startY = -85 + coords[0][1] * 75;
      const midX = -100 + coords[1][0] * 100;
      const midY = -85 + coords[1][1] * 75;
      const endX = -100 + coords[2][0] * 100;
      const endY = -85 + coords[2][1] * 75;

      this.paylineGraphics.beginPath();
      this.paylineGraphics.moveTo(startX, startY);
      this.paylineGraphics.lineTo(midX, midY);
      this.paylineGraphics.lineTo(endX, endY);
      this.paylineGraphics.strokePath();
    }
  }

  public clearPaylines(): void {
    this.paylineGraphics.clear();
  }
}

