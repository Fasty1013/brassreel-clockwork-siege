import Phaser from 'phaser';
import { Juice } from './Juice';
import { ParticleKit } from './ParticleKit';
import { SpinResult, LineEvaluationResult } from '@core/reels/reels';
import { SoundManager } from '../audio/SoundManager';

export interface SlotDirectorConfig {
  machineX: number;
  machineY: number;
  reelSpacingX: number;
  rowSpacingY: number;
}

/**
 * SlotDirector — Presentation & Kinetic Choreography of the 3x3 Slot Forge
 * Orchestrates physical lever pulls, motion blur reel scrolls, anticipation slowdowns,
 * neon payline traces, and token trajectory flights linking slot wins to the battlefield.
 */
export class SlotDirector {
  private scene: Phaser.Scene;
  private leverSprite: Phaser.GameObjects.Sprite;
  private symbolSprites: Phaser.GameObjects.Sprite[][] = [];
  private paylineGraphics: Phaser.GameObjects.Graphics;
  private comboBadge: Phaser.GameObjects.Container;
  private comboText: Phaser.GameObjects.Text;
  private isSpinning = false;

  // Layout anchors (Native 640x360 coordinates)
  private readonly originX: number;
  private readonly originY: number;
  private readonly colX = [36, 74, 112];
  private readonly rowY = [106, 142, 178];

  constructor(
    scene: Phaser.Scene,
    machineX = 8,
    machineY = 22,
    leverSprite: Phaser.GameObjects.Sprite
  ) {
    this.scene = scene;
    this.originX = machineX;
    this.originY = machineY;
    this.leverSprite = leverSprite;

    // 1. Create Symbol Sprites Matrix (3x3)
    for (let c = 0; c < 3; c++) {
      this.symbolSprites[c] = [];
      for (let r = 0; r < 3; r++) {
        const sprite = scene.add.sprite(this.colX[c], this.rowY[r], 'sym_cog');
        sprite.setDisplaySize(28, 28);
        sprite.setDepth(20);
        this.symbolSprites[c].push(sprite);
      }
    }

    // 2. Payline Overlay Graphics
    this.paylineGraphics = scene.add.graphics();
    this.paylineGraphics.setDepth(450);

    // 3. Floating Combo Badge
    this.comboBadge = scene.add.container(74, 82);
    const badgeBg = scene.add.rectangle(0, 0, 92, 18, 0x0b090f, 0.85);
    badgeBg.setStrokeStyle(1, 0xffd166);
    this.comboBadge.add(badgeBg);
    this.comboText = scene.add.text(0, 0, 'COMBO x2', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.comboBadge.add(this.comboText);
    this.comboBadge.setVisible(false);
    this.comboBadge.setDepth(550);
  }

  /**
   * Sets current grid symbols without animation.
   */
  public setGrid(grid: string[][]): void {
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 3; r++) {
        const key = grid[c]?.[r] ?? 'sym_cog';
        this.symbolSprites[c][r].setTexture(key);
      }
    }
  }

  /**
   * Executes the full physical spin sequence:
   * Lever pull -> Reel blur scroll -> Staggered stop with overshoot bounce -> Callback.
   */
  public async playSpinSequence(
    finalGrid: string[][],
    heldReels: boolean[],
    hasAnticipation = false
  ): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;

    // 1. Physical Lever Pull
    await this.pullLever();

    // 2. Spin Sound & Reels Acceleration
    SoundManager.getInstance().playReelTick(1.0);

    // 3. Staggered Reel Stops (Reel 0 -> Reel 1 -> Reel 2)
    const stopPromises: Promise<void>[] = [];

    for (let col = 0; col < 3; col++) {
      if (heldReels[col]) {
        // Held reel: locked, chains clink
        continue;
      }

      const isThirdReel = col === 2;
      const delay = col * 320 + (isThirdReel && hasAnticipation ? 700 : 0);

      stopPromises.push(
        new Promise<void>((resolve) => {
          this.scene.time.delayedCall(delay, () => {
            this.stopReelWithBounce(col, finalGrid[col], () => {
              SoundManager.getInstance().playReelStop(col);
              resolve();
            });
          });
        })
      );
    }

    await Promise.all(stopPromises);
    this.isSpinning = false;
  }

  /**
   * Animates the articulated red ball lever arm.
   */
  private pullLever(): Promise<void> {
    return new Promise((resolve) => {
      const origY = this.leverSprite.y;

      // Anticipation up (-4px, 70ms)
      this.scene.tweens.add({
        targets: this.leverSprite,
        y: origY - 4,
        duration: 70,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Slam down (+24px, 110ms)
          this.scene.tweens.add({
            targets: this.leverSprite,
            y: origY + 24,
            duration: 110,
            ease: 'Quad.easeIn',
            onComplete: () => {
              // Steam puff from side
              ParticleKit.sparkleBurst(this.scene, this.originX + 138, origY + 20, 0xe7e0ef, 6);

              // Spring rebound with overshoot (-2px, 220ms, Back.easeOut)
              this.scene.tweens.add({
                targets: this.leverSprite,
                y: origY,
                duration: 220,
                ease: 'Back.easeOut',
                onComplete: () => resolve()
              });
            }
          });
        }
      });
    });
  }

  /**
   * Stops a single reel column with realistic 3px overshoot bounce.
   */
  private stopReelWithBounce(col: number, newSymbols: string[], onDone: () => void): void {
    // Rapid vertical offset bounce
    const sprites = this.symbolSprites[col];

    for (let r = 0; r < 3; r++) {
      sprites[r].setTexture(newSymbols[r]);
      const targetY = this.rowY[r];

      // Overshoot down (+4px)
      this.scene.tweens.add({
        targets: sprites[r],
        y: targetY + 4,
        duration: 80,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: () => {
          sprites[r].y = targetY;
          if (r === 2) onDone();
        }
      });
    }
  }

  /**
   * Presents line hits sequentially:
   * Screen dims -> Neon payline traces -> Symbols bounce with sparkles -> Token flies to meadow.
   */
  public async presentWinningLines(
    spinResult: SpinResult,
    targetMeadowX = 276,
    targetMeadowY = 247,
    onSummonSpawn?: (unitName: string, faction: string) => void
  ): Promise<void> {
    if (!spinResult.lineHits || spinResult.lineHits.length === 0) return;

    // 1. Dim screen to focus attention on winning lines
    Juice.dimScreen(this.scene, 0.45, 180);

    for (let i = 0; i < spinResult.lineHits.length; i++) {
      const hit = spinResult.lineHits[i];
      await this.highlightSingleLine(hit, i + 1, spinResult.lineHits.length);

      // Fly token from middle cell of winning line to battlefield meadow
      const midCoord = hit.coords[1];
      const tokenStartX = this.colX[midCoord[0]];
      const tokenStartY = this.rowY[midCoord[1]];
      const sym = hit.faction ?? 'wild';

      await new Promise<void>((resolve) => {
        ParticleKit.flyToken(
          this.scene,
          tokenStartX,
          tokenStartY,
          targetMeadowX + i * 36,
          targetMeadowY,
          sym,
          () => {
            // Ground illuminates green with sparkles
            ParticleKit.spawnCellGlow(this.scene, targetMeadowX + i * 36, targetMeadowY);
            if (onSummonSpawn) {
              onSummonSpawn(sym, sym);
            }
            resolve();
          }
        );
      });

      // Pause between lines
      await new Promise((r) => setTimeout(r, 260));
    }

    // Undim screen and clear paylines
    this.paylineGraphics.clear();
    this.comboBadge.setVisible(false);
    Juice.undimScreen(this.scene, 150);
  }

  /**
   * Highlights a single payline with animated neon line trace and symbol bounces.
   */
  private highlightSingleLine(hit: LineEvaluationResult, lineNum: number, totalLines: number): Promise<void> {
    return new Promise((resolve) => {
      this.paylineGraphics.clear();

      // Show combo badge
      if (totalLines > 1) {
        this.comboText.setText(`COMBO x${lineNum} (ЛИНИЯ ${hit.paylineId + 1})`);
        this.comboBadge.setVisible(true);
        this.comboBadge.setScale(0.8);
        this.scene.tweens.add({
          targets: this.comboBadge,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 120,
          yoyo: true
        });
      }

      // Draw neon payline vector
      const pts = hit.coords.map(([c, r]: [number, number]) => ({
        x: this.colX[c],
        y: this.rowY[r]
      }));

      // Neon outer glow + bright white core
      this.paylineGraphics.lineStyle(5, 0xffd166, 0.7);
      this.paylineGraphics.beginPath();
      this.paylineGraphics.moveTo(pts[0].x, pts[0].y);
      this.paylineGraphics.lineTo(pts[1].x, pts[1].y);
      this.paylineGraphics.lineTo(pts[2].x, pts[2].y);
      this.paylineGraphics.strokePath();

      this.paylineGraphics.lineStyle(2, 0xffffff, 1.0);
      this.paylineGraphics.beginPath();
      this.paylineGraphics.moveTo(pts[0].x, pts[0].y);
      this.paylineGraphics.lineTo(pts[1].x, pts[1].y);
      this.paylineGraphics.lineTo(pts[2].x, pts[2].y);
      this.paylineGraphics.strokePath();

      // Bounce the 3 matching symbols and emit sparkles
      pts.forEach((pt: { x: number; y: number }, idx: number) => {
        const coord = hit.coords[idx];
        const sprite = this.symbolSprites[coord[0]][coord[1]];

        this.scene.tweens.add({
          targets: sprite,
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 140,
          yoyo: true,
          ease: 'Back.easeOut'
        });

        ParticleKit.sparkleBurst(this.scene, pt.x, pt.y, 0xffd166, 10);
      });

      SoundManager.getInstance().playPaylineWin(lineNum);

      this.scene.time.delayedCall(450, () => resolve());
    });
  }

  /**
   * Triggers the full 3-Crown Jackpot celebration show.
   */
  public async playJackpotShow(): Promise<void> {
    // 1. Freeze hit-stop
    Juice.hitStop(this.scene, 150, 0.1);
    Juice.flash(this.scene, 350, 0xffd166);
    Juice.shake(this.scene, 400, 0.015);

    // 2. Sound fanfare
    SoundManager.getInstance().playJackpot();

    // 3. Cascade of 160+ golden coins
    ParticleKit.coinShower(this.scene, 160);

    // 4. Bouncing JACKPOT Banner
    const banner = this.scene.add.container(320, 140);
    banner.setDepth(700);

    const bg = this.scene.add.rectangle(0, 0, 240, 42, 0x0b090f, 0.9);
    bg.setStrokeStyle(2, 0xffd166);
    banner.add(bg);

    const txt = this.scene.add.text(0, 0, '★ JACKPOT! 3x CROWNS ★', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    banner.add(txt);

    banner.setScale(0);
    this.scene.tweens.add({
      targets: banner,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 250,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1800,
      onComplete: () => {
        this.scene.tweens.add({
          targets: banner,
          alpha: 0,
          duration: 300,
          onComplete: () => banner.destroy()
        });
      }
    });

    await new Promise((r) => setTimeout(r, 2200));
  }

  /**
   * Displays the Jam malfunction state with smoke and alarm.
   */
  public playJamAlert(): void {
    Juice.shake(this.scene, 350, 0.012);
    SoundManager.getInstance().playBossAlarm();

    // Black smoke puffs from boiler dome
    for (let i = 0; i < 8; i++) {
      ParticleKit.sparkleBurst(this.scene, this.originX + 66, this.originY + 16, 0x393047, 4);
    }
  }
}
