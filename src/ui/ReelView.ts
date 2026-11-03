import Phaser from 'phaser';
import { ReelSymbol, Grid3x3, SpinResult } from '@core/reels/reels';
import { SoundManager } from '../audio/SoundManager';
import { ParticleKit } from '../presentation/ParticleKit';

export class ReelView extends Phaser.GameObjects.Container {
  private chassisImage: Phaser.GameObjects.Image;
  private leverSprite: Phaser.GameObjects.Sprite;
  private reelColumns: Phaser.GameObjects.Container[] = [];
  private symbolSprites: Phaser.GameObjects.Sprite[][] = [];
  private holdButtons: Phaser.GameObjects.Rectangle[] = [];
  private holdTexts: Phaser.GameObjects.Text[] = [];
  private nudgeButtons: Phaser.GameObjects.Image[] = [];
  private paylineGraphics: Phaser.GameObjects.Graphics;
  public isSpinning = false;

  // Header badges
  private spinBadgeText: Phaser.GameObjects.Text;
  private costBadgeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 1. Ornate Steampunk Brass Chassis (396 x 828 px at scale 3x)
    this.chassisImage = scene.add.image(0, 0, 'ui_slot_chassis');
    this.chassisImage.setScale(2.9);
    this.add(this.chassisImage);

    // 2. Physical Articulated Lever Arm on right of cabinet
    this.leverSprite = scene.add.sprite(206, -30, 'ui_lever');
    this.leverSprite.setScale(2.9);
    this.leverSprite.setInteractive({ useHandCursor: true });
    this.add(this.leverSprite);

    this.leverSprite.on('pointerdown', () => {
      if (!this.isSpinning) {
        this.pullLever();
        this.emit('spin_requested');
      }
    });

    // 3. Badges above Reels
    // Left: Spins remaining
    const spinsBg = scene.add.rectangle(-84, -188, 68, 28, 0x18141f);
    spinsBg.setStrokeStyle(2, 0x3d3047);
    this.add(spinsBg);
    this.spinBadgeText = scene.add.text(-84, -188, '★ 3', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.spinBadgeText);

    // Center: Spin Cost
    const costBg = scene.add.rectangle(0, -188, 86, 28, 0x18141f);
    costBg.setStrokeStyle(2, 0x3d3047);
    this.add(costBg);
    this.costBadgeText = scene.add.text(0, -188, 'БЕСПЛ.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#2ec4b6',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.costBadgeText);

    // Right: Paytable Book Button
    const bookBtn = scene.add.rectangle(84, -188, 64, 28, 0x2e2538);
    bookBtn.setStrokeStyle(2, 0xd4a373);
    bookBtn.setInteractive({ useHandCursor: true });
    this.add(bookBtn);
    const bookTxt = scene.add.text(84, -188, '📖 ИНФО', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(bookTxt);

    bookBtn.on('pointerdown', () => {
      this.emit('open_paytable');
    });

    // 4. Parchment Surface for 3 Reel Strips
    const paperSurface = scene.add.rectangle(0, -32, 296, 260, 0xded6cb);
    paperSurface.setStrokeStyle(3, 0x5a483a);
    this.add(paperSurface);

    // Payline overlay graphics
    this.paylineGraphics = scene.add.graphics();
    this.add(this.paylineGraphics);

    // 5. Initialize 3 Reel Columns
    for (let c = 0; c < 3; c++) {
      const colX = -92 + c * 92;
      const colContainer = scene.add.container(colX, -32);
      this.add(colContainer);
      this.reelColumns.push(colContainer);

      this.symbolSprites[c] = [];
      for (let r = 0; r < 3; r++) {
        const rowY = -78 + r * 78;
        const sprite = scene.add.sprite(0, rowY, 'sym_cog');
        sprite.setDisplaySize(68, 68);
        colContainer.add(sprite);
        this.symbolSprites[c].push(sprite);
      }

      // 6. Nudge Down-Arrow Buttons below Reels
      const nudgeBtn = scene.add.image(colX, 126, 'ui_btn_nudge');
      nudgeBtn.setScale(2.5);
      nudgeBtn.setInteractive({ useHandCursor: true });
      this.add(nudgeBtn);
      this.nudgeButtons.push(nudgeBtn);

      const colIdx = c;
      nudgeBtn.on('pointerdown', () => {
        if (!this.isSpinning) {
          this.emit('nudge_reel', colIdx);
          scene.tweens.add({
            targets: nudgeBtn,
            y: 132,
            duration: 80,
            yoyo: true
          });
        }
      });

      // 7. Hold Button
      const holdBtn = scene.add.rectangle(colX, 172, 74, 26, 0x241d2c);
      holdBtn.setStrokeStyle(1, 0x6c757d);
      holdBtn.setInteractive({ useHandCursor: true });
      this.add(holdBtn);
      this.holdButtons.push(holdBtn);

      const holdTxt = scene.add.text(colX, 172, 'HOLD', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#adb5bd',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add(holdTxt);
      this.holdTexts.push(holdTxt);

      holdBtn.on('pointerdown', () => {
        if (!this.isSpinning) {
          this.emit('toggle_hold', colIdx);
        }
      });
    }

    scene.add.existing(this);
  }

  /**
   * Pulls the physical articulated lever down with recoil and sound.
   */
  public pullLever(): void {
    SoundManager.getInstance().playButtonClick();
    this.scene.tweens.add({
      targets: this.leverSprite,
      y: 12,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onYoyo: () => {
        SoundManager.getInstance().playValveHiss();
        // Puff steam from boiler crown
        ParticleKit.sparkleBurst(this.scene, this.x + 190, this.y - 140, 0xffffff, 8);
      }
    });
  }

  public updateBadges(spinsLeft: number, isFree: boolean, cost: number): void {
    this.spinBadgeText.setText(`★ ${spinsLeft}`);
    if (isFree) {
      this.costBadgeText.setText('БЕСПЛ.');
      this.costBadgeText.setColor('#2ec4b6');
    } else {
      this.costBadgeText.setText(`${cost} Пар`);
      this.costBadgeText.setColor('#ffd166');
    }
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
        this.holdButtons[c].setFillStyle(0x241d2c);
        this.holdButtons[c].setStrokeStyle(1, 0x6c757d);
        this.holdTexts[c].setColor('#adb5bd');
      }
    }
  }

  /**
   * Plays reel spin animation with sequential stops and overshoot bounces.
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
      if (heldReels[c]) continue;

      const sprites = this.symbolSprites[c];

      // Reel scrolling timer
      const spinTimer = this.scene.time.addEvent({
        delay: 50,
        repeat: 12 + c * 6,
        callback: () => {
          for (let r = 0; r < 3; r++) {
            sprites[r].setTexture(Phaser.Utils.Array.GetRandom(symbols));
          }
          SoundManager.getInstance().playReelTick(1.0 + c * 0.15);
        },
        callbackScope: this
      });

      // Stop bounce tween
      this.scene.time.delayedCall(550 + c * 280, () => {
        spinTimer.remove();
        SoundManager.getInstance().playReelStop(c);

        // Set final symbols
        for (let r = 0; r < 3; r++) {
          const item = finalGrid[c][r];
          sprites[r].setTexture(`sym_${item.symbol}`);
        }

        // Overshoot bounce
        this.scene.tweens.add({
          targets: sprites,
          y: '+=8',
          duration: 70,
          yoyo: true,
          ease: 'Back.easeOut'
        });

        if (c === 2) {
          this.scene.time.delayedCall(160, () => {
            this.isSpinning = false;
            onComplete();
          });
        }
      });
    }

    if (heldReels.every((h) => h)) {
      this.isSpinning = false;
      onComplete();
    }
  }

  public highlightWinningLines(spinResult: SpinResult): void {
    this.clearPaylines();
    if (!spinResult.lineHits || spinResult.lineHits.length === 0) return;

    SoundManager.getInstance().playPaylineWin(spinResult.lineHits.length);

    this.paylineGraphics.lineStyle(4, 0xffd166, 0.95);
    for (const hit of spinResult.lineHits) {
      const coords = hit.coords;
      const pts = coords.map(([c, r]) => ({
        x: -92 + c * 92,
        y: -78 + r * 78 - 32
      }));

      this.paylineGraphics.beginPath();
      this.paylineGraphics.moveTo(pts[0].x, pts[0].y);
      this.paylineGraphics.lineTo(pts[1].x, pts[1].y);
      this.paylineGraphics.lineTo(pts[2].x, pts[2].y);
      this.paylineGraphics.strokePath();

      // Bounce winning symbols
      for (const [c, r] of coords) {
        this.scene.tweens.add({
          targets: this.symbolSprites[c][r],
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 130,
          yoyo: true
        });
      }
    }
  }

  public updateHeatAura(_heat: number): void {
    // Optional heat glow
  }

  public clearPaylines(): void {
    this.paylineGraphics.clear();
  }
}
