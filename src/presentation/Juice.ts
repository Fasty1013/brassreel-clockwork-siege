import Phaser from 'phaser';

/**
 * Game Juice & Screen Impact Engine
 * Manages integer-pixel camera shakes, hit-stop freezes, slow-motion,
 * screen-space spotlight dimming, and whiteout flashes.
 */
export class Juice {
  private static dimMask: Phaser.GameObjects.Rectangle | null = null;

  /**
   * Triggers a hit-stop freeze or micro slow-motion.
   */
  public static hitStop(scene: Phaser.Scene, durationMs: number, timeScale = 0.05): void {
    if (durationMs <= 0) return;

    const originalScale = scene.tweens.timeScale;
    const originalPhysics = scene.time.timeScale;

    scene.tweens.timeScale = timeScale;
    scene.time.timeScale = timeScale;

    scene.time.delayedCall(durationMs * timeScale, () => {
      scene.tweens.timeScale = originalScale;
      scene.time.timeScale = originalPhysics;
    });
  }

  /**
   * Shakes the camera using integer pixel displacements.
   */
  public static shake(scene: Phaser.Scene, durationMs = 150, intensity = 0.008): void {
    scene.cameras.main.shake(durationMs, intensity);
  }

  /**
   * Flashes the camera with a solid color.
   */
  public static flash(scene: Phaser.Scene, durationMs = 80, color = 0xffffff): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    scene.cameras.main.flash(durationMs, r, g, b);
  }

  /**
   * Dims the entire screen to highlight a winning line or tutorial step.
   */
  public static dimScreen(scene: Phaser.Scene, targetAlpha = 0.45, durationMs = 180): void {
    if (!this.dimMask || !this.dimMask.active) {
      this.dimMask = scene.add.rectangle(320, 180, 640, 360, 0x0b090f, 0);
      this.dimMask.setDepth(400);
      this.dimMask.setScrollFactor(0);
    }

    this.dimMask.setVisible(true);
    scene.tweens.add({
      targets: this.dimMask,
      alpha: targetAlpha,
      duration: durationMs,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * Undims the screen back to full brightness.
   */
  public static undimScreen(scene: Phaser.Scene, durationMs = 150): void {
    if (!this.dimMask || !this.dimMask.active) return;

    scene.tweens.add({
      targets: this.dimMask,
      alpha: 0,
      duration: durationMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.dimMask) this.dimMask.setVisible(false);
      }
    });
  }
}
