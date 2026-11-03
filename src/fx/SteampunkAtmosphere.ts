import Phaser from 'phaser';

/**
 * Steampunk Atmosphere & Visual Shader Manager
 * Provides industrial brass vignette, ambient factory particles,
 * and furnace heat haze effects across the screen.
 */
export class SteampunkAtmosphere {
  private scene: Phaser.Scene;
  private vignetteGraphics: Phaser.GameObjects.Graphics | null = null;
  private heatParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private ambientDust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createBrassVignette();
    this.createAmbientDust();
  }

  /**
   * Builds an industrial brass corner vignette framing the 1920x1080 viewport.
   */
  private createBrassVignette(): void {
    const w = 1920;
    const h = 1080;
    const g = this.scene.add.graphics();
    g.setDepth(95);

    // Darkened border vignette with brass corner studs
    g.lineStyle(6, 0x2b1e16, 0.9);
    g.strokeRect(3, 3, w - 6, h - 6);

    // Decorative corner brackets
    const bracketSize = 36;
    g.lineStyle(3, 0xd4a373, 0.85);

    // Top-Left
    g.strokeLineShape(new Phaser.Geom.Line(8, 8 + bracketSize, 8, 8));
    g.strokeLineShape(new Phaser.Geom.Line(8, 8, 8 + bracketSize, 8));
    // Top-Right
    g.strokeLineShape(new Phaser.Geom.Line(w - 8 - bracketSize, 8, w - 8, 8));
    g.strokeLineShape(new Phaser.Geom.Line(w - 8, 8, w - 8, 8 + bracketSize));
    // Bottom-Left
    g.strokeLineShape(new Phaser.Geom.Line(8, h - 8 - bracketSize, 8, h - 8));
    g.strokeLineShape(new Phaser.Geom.Line(8, h - 8, 8 + bracketSize, h - 8));
    // Bottom-Right
    g.strokeLineShape(new Phaser.Geom.Line(w - 8 - bracketSize, h - 8, w - 8, h - 8));
    g.strokeLineShape(new Phaser.Geom.Line(w - 8, h - 8 - bracketSize, w - 8, h - 8));

    // Corner brass rivets
    const rivets = [
      { x: 18, y: 18 },
      { x: w - 18, y: 18 },
      { x: 18, y: h - 18 },
      { x: w - 18, y: h - 18 }
    ];

    g.fillStyle(0xd4a373, 0.9);
    for (const r of rivets) {
      g.fillCircle(r.x, r.y, 4);
    }

    this.vignetteGraphics = g;
  }

  /**
   * Ambient floating brass motes and dust particles drifting across the factory floor.
   */
  private createAmbientDust(): void {
    if (!this.scene.textures.exists('fx_spark_particle')) return;

    try {
      this.ambientDust = this.scene.add.particles(960, 540, 'fx_spark_particle', {
        x: { min: -960, max: 960 },
        y: { min: -540, max: 540 },
        speedX: { min: -10, max: 20 },
        speedY: { min: -15, max: -5 },
        scale: { start: 0.4, end: 0.1 },
        alpha: { start: 0.35, end: 0 },
        lifespan: 6000,
        frequency: 250,
        blendMode: 'ADD'
      });
      this.ambientDust.setDepth(2);
    } catch {
      // Graceful fallback if particle manager is in headless mode
    }
  }

  /**
   * Updates heat shimmer aura based on current furnace Heat (0-100%).
   */
  public updateHeatHaze(heatPct: number, slotX = 240, slotY = 310): void {
    if (heatPct < 25) {
      if (this.heatParticles) {
        this.heatParticles.stop();
      }
      return;
    }

    if (!this.heatParticles && this.scene.textures.exists('fx_smoke_particle')) {
      try {
        this.heatParticles = this.scene.add.particles(slotX, slotY + 160, 'fx_smoke_particle', {
          x: { min: -160, max: 160 },
          y: 0,
          speedY: { min: -60, max: -30 },
          speedX: { min: -10, max: 10 },
          scale: { start: 0.5, end: 1.2 },
          alpha: { start: 0.25, end: 0 },
          lifespan: 1200,
          frequency: 180,
          tint: 0xffaa44,
          blendMode: 'SCREEN'
        });
        this.heatParticles.setDepth(15);
      } catch {}
    }

    if (this.heatParticles) {
      this.heatParticles.start();
      // Increase frequency & tint redness with higher heat
      const intensity = Math.min(1.0, (heatPct - 25) / 75);
      this.heatParticles.setParticleTint(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffaa44),
        Phaser.Display.Color.ValueToColor(0xff2200),
        100,
        Math.floor(intensity * 100)
      ).color);
    }
  }

  public destroy(): void {
    if (this.vignetteGraphics) this.vignetteGraphics.destroy();
    if (this.ambientDust) this.ambientDust.destroy();
    if (this.heatParticles) this.heatParticles.destroy();
  }
}
