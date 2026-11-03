import Phaser from 'phaser';

/**
 * Procedural Animation & Visual Feedback Engine
 * Handles dynamic procedural tweens, squashes, stretches, hit flashes,
 * attack lunges, death dissolves, and atmospheric screen-space effects.
 */
export class AnimationFX {
  /**
   * Applies subtle pneumatic steam breathing / idle bobbing to a unit container or sprite.
   */
  public static applyIdleBobbing(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite,
    delayOffset = 0
  ): Phaser.Tweens.Tween {
    const originalY = target.y;
    return scene.tweens.add({
      targets: target,
      y: originalY - 3,
      scaleX: 1.02,
      scaleY: 0.98,
      duration: 750 + Math.random() * 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: delayOffset
    });
  }

  /**
   * Plays an attack windup and lunge or recoil animation.
   * @param isRanged True for back-kick recoil (bows/cannons), false for forward lunge (melee).
   */
  public static playAttackAnimation(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container,
    isRanged = false,
    onImpact?: () => void
  ): void {
    const originX = sprite.x;

    if (isRanged) {
      // Ranged recoil: kick backward, then return
      scene.tweens.add({
        targets: sprite,
        x: originX - 10,
        scaleX: 0.92,
        scaleY: 1.1,
        duration: 80,
        ease: 'Quad.easeOut',
        yoyo: true,
        onYoyo: () => {
          if (onImpact) onImpact();
        },
        onComplete: () => {
          sprite.x = originX;
          sprite.setScale(1);
        }
      });
    } else {
      // Melee lunge: anticipatory draw-back, explosive forward lunge, return
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          {
            x: originX - 6,
            duration: 60,
            ease: 'Quad.easeOut'
          },
          {
            x: originX + 18,
            duration: 70,
            ease: 'Back.easeOut',
            onComplete: () => {
              if (onImpact) onImpact();
            }
          },
          {
            x: originX,
            duration: 120,
            ease: 'Quad.easeInOut',
            onComplete: () => {
              sprite.x = originX;
            }
          }
        ]
      });
    }
  }

  /**
   * Triggers a high-impact whiteout hit flash on taking damage.
   */
  public static playHitFlash(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite,
    flashColor = 0xffffff
  ): void {
    if (!sprite || !sprite.active) return;

    sprite.setTintFill(flashColor);
    const originalX = sprite.x;
    sprite.x += (Math.random() - 0.5) * 6;

    scene.time.delayedCall(70, () => {
      if (sprite && sprite.active) {
        sprite.clearTint();
        sprite.x = originalX;
      }
    });
  }

  /**
   * Plays a death dissolve / scrap explosion sequence for defeated enemies.
   */
  public static playDeathDissolve(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    onComplete?: () => void
  ): void {
    scene.tweens.add({
      targets: container,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      y: container.y + 15,
      angle: (Math.random() - 0.5) * 60,
      duration: 280,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (onComplete) onComplete();
        if (container.active) container.destroy();
      }
    });
  }

  /**
   * Spawns an expanding shockwave ring on critical impacts or boss phase shifts.
   */
  public static spawnShockwaveRing(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color = 0xffd166,
    maxRadius = 70
  ): void {
    const ring = scene.add.circle(x, y, 4);
    ring.setStrokeStyle(3, color, 1);
    ring.setDepth(55);

    scene.tweens.add({
      targets: ring,
      radius: maxRadius,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  /**
   * Plays an Emergency Valve full-screen steam eruption with screen shake.
   */
  public static playValveEruption(scene: Phaser.Scene): void {
    // 1. Camera rumble
    scene.cameras.main.shake(450, 0.018);

    // 2. Whiteout steam haze veil
    const steamHaze = scene.add.rectangle(960, 540, 1920, 1080, 0xe0e6ed, 0.45);
    steamHaze.setDepth(90);

    scene.tweens.add({
      targets: steamHaze,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => steamHaze.destroy()
    });

    // 3. Ascending steam puffs along boiler edge
    for (let i = 0; i < 18; i++) {
      const puffX = 440 + Math.random() * 80;
      const puffY = 120 + Math.random() * 400;
      const puff = scene.add.circle(puffX, puffY, 14 + Math.random() * 16, 0xffffff, 0.7);
      puff.setDepth(85);

      scene.tweens.add({
        targets: puff,
        x: puffX + (Math.random() - 0.5) * 80,
        y: puffY - 120 - Math.random() * 80,
        radius: 40 + Math.random() * 20,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  /**
   * Visual vortex for Smelt Crucible fusion and star evolution.
   */
  public static playSmeltVortex(scene: Phaser.Scene, x: number, y: number): void {
    // Ascending golden light pillar
    const pillar = scene.add.rectangle(x, y, 50, 160, 0xffd166, 0.6);
    pillar.setDepth(50);
    scene.tweens.add({
      targets: pillar,
      scaleX: 2.0,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => pillar.destroy()
    });

    // Expanding dual gold rings
    this.spawnShockwaveRing(scene, x, y, 0xffd700, 80);
    scene.time.delayedCall(80, () => {
      this.spawnShockwaveRing(scene, x, y, 0xffaa00, 110);
    });
  }
}
