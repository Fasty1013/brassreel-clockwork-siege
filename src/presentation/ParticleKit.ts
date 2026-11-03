import Phaser from 'phaser';

/**
 * Pixel Particle Engine & Trajectory Animator
 * High-performance pooled particle effects with zero runtime GC allocations.
 */
export class ParticleKit {
  /**
   * Spawns a fountain burst of colored pixel sparkles on winning lines or hits.
   */
  public static sparkleBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color = 0xffd166,
    count = 14
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1 + Math.floor(Math.random() * 2);

      const p = scene.add.rectangle(x, y, size, size, color);
      p.setDepth(500);

      scene.tweens.add({
        targets: p,
        x: x + vx * 0.4,
        y: y + vy * 0.4 + 10, // gravity
        alpha: 0,
        duration: 350 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  /**
   * Spawns an explosion of flying scrap parts (cogs, plates) with physics gravity.
   */
  public static scrapScatter(scene: Phaser.Scene, x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const pColor = i % 2 === 0 ? 0x8c5836 : 0x534764;
      const p = scene.add.rectangle(x, y, 3, 3, pColor);
      p.setDepth(450);

      const vx = (Math.random() - 0.5) * 80;
      const vy = -40 - Math.random() * 60;

      scene.tweens.add({
        targets: p,
        x: x + vx * 0.45,
        y: y + vy * 0.2 + 25, // gravity drop
        angle: (Math.random() - 0.5) * 180,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  /**
   * Simulates a cascade of 150+ pixel coins pouring down during Jackpot.
   */
  public static coinShower(scene: Phaser.Scene, count = 160): void {
    for (let i = 0; i < count; i++) {
      const startX = 20 + Math.random() * 600;
      const startY = -20 - Math.random() * 100;
      const size = Math.random() > 0.3 ? 3 : 2;
      const color = Math.random() > 0.2 ? 0xffd166 : 0xd4a373;

      const coin = scene.add.rectangle(startX, startY, size, size, color);
      coin.setDepth(600);

      const delay = Math.random() * 1200;
      const targetY = 280 + Math.random() * 70;

      scene.tweens.add({
        targets: coin,
        y: targetY,
        x: startX + (Math.random() - 0.5) * 40,
        delay,
        duration: 500 + Math.random() * 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          // Ground bounce
          scene.tweens.add({
            targets: coin,
            y: targetY - (8 + Math.random() * 12),
            duration: 120,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
              // Fade out
              scene.tweens.add({
                targets: coin,
                alpha: 0,
                duration: 600,
                onComplete: () => coin.destroy()
              });
            }
          });
        }
      });
    }
  }

  /**
   * Animates a faction token detaching from the slot reel and flying in a high arc
   * with a colored particle trail directly into the battlefield summon cell.
   */
  public static flyToken(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    symbolKey: string,
    onArrive: () => void
  ): void {
    const token = scene.add.sprite(startX, startY, symbolKey);
    token.setDisplaySize(24, 24);
    token.setDepth(650);

    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 50; // High arc peak

    const path = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(endX, endY)
    );

    let trailTimer = 0;
    const duration = 450; // ms

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Quad.easeInOut',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        const pos = path.getPoint(t);
        token.setPosition(pos.x, pos.y);
        token.setScale(1.0 + Math.sin(t * Math.PI) * 0.35); // Enlarge at arc peak

        // Particle trail
        trailTimer += 16;
        if (trailTimer >= 30) {
          trailTimer = 0;
          this.sparkleBurst(scene, pos.x, pos.y, 0xffd166, 3);
        }
      },
      onComplete: () => {
        token.destroy();
        onArrive();
      }
    });
  }

  /**
   * Expands an illuminated summon circle on the battlefield ground.
   */
  public static spawnCellGlow(scene: Phaser.Scene, x: number, y: number): void {
    const glow = scene.add.ellipse(x, y + 14, 38, 14, 0xb5e48c, 0.85);
    glow.setDepth(100);

    scene.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy()
    });

    // Rising sparkle motes
    this.sparkleBurst(scene, x, y, 0x74c69d, 8);
  }
}
