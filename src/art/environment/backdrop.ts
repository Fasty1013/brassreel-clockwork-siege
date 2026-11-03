import Phaser from 'phaser';

/**
 * Coarse 320x180 Pixel-Art Battlefield Environment Backdrop
 * Directly replicates the charming retro chunky pixel background of the reference video.
 * Layered: Sky -> Golden Sun -> Volumetric Clouds -> Steampunk Silhouettes -> 3-Tier Trees -> Meadow Turf & Rails.
 */
export class BackdropArt {
  public static createBackdropCanvas(): HTMLCanvasElement {
    const W = 320;
    const H = 180;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;

    // 1. Summer Sky Gradient (Chunky 4px bands)
    const skyBands = [
      { y: 0, h: 25, color: '#5eb3dc' },
      { y: 25, h: 25, color: '#70c4e8' },
      { y: 50, h: 25, color: '#88d1ef' },
      { y: 75, h: 30, color: '#a6ddf4' }
    ];
    for (const b of skyBands) {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, b.y, W, b.h);
    }

    // 2. Big Golden Cream Sun (Center-right horizon, radius ~36 px)
    const sunX = 175;
    const sunY = 78;
    const sunR = 36;

    // Sun dark contour
    ctx.fillStyle = '#b57647';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR + 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun outer rim
    ctx.fillStyle = '#fed053';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Sun core cream
    ctx.fillStyle = '#fff4cc';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR - 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Volumetric Clouds with Lavender Shadows
    ctx.fillStyle = '#b8cde3'; // Cloud shadow
    ctx.beginPath();
    ctx.arc(sunX - 45, sunY + 8, 22, 0, Math.PI * 2);
    ctx.arc(sunX + 25, sunY + 12, 26, 0, Math.PI * 2);
    ctx.arc(sunX + 65, sunY + 14, 18, 0, Math.PI * 2);
    ctx.arc(60, 85, 24, 0, Math.PI * 2);
    ctx.arc(100, 80, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f8fb'; // Cloud pure white puffs
    ctx.beginPath();
    ctx.arc(sunX - 45, sunY + 4, 20, 0, Math.PI * 2);
    ctx.arc(sunX + 25, sunY + 8, 24, 0, Math.PI * 2);
    ctx.arc(sunX + 65, sunY + 10, 16, 0, Math.PI * 2);
    ctx.arc(60, 81, 22, 0, Math.PI * 2);
    ctx.arc(100, 76, 26, 0, Math.PI * 2);
    ctx.fill();

    // 4. Distant Steampunk Silhouettes (Clocktowers & Smokestacks)
    ctx.fillStyle = '#534764'; // Distant dark purple towers
    // Left factory chimney
    ctx.fillRect(40, 68, 8, 30);
    ctx.fillRect(38, 66, 12, 3);
    // Clock tower spire
    ctx.fillRect(135, 60, 12, 38);
    ctx.beginPath();
    ctx.moveTo(135, 60);
    ctx.lineTo(141, 46);
    ctx.lineTo(147, 60);
    ctx.fill();
    // Steam puff from chimney
    ctx.fillStyle = '#e7e0ef';
    ctx.fillRect(41, 58, 6, 6);
    ctx.fillRect(43, 52, 8, 5);

    // 5. Stylized 3-Tiered Green Pixel Trees
    // Left tree cluster
    this.drawPixelTree(ctx, 35, 95, 38, 48);
    // Right massive landmark tree
    this.drawPixelTree(ctx, 275, 92, 54, 62);
    this.drawPixelTree(ctx, 235, 102, 36, 42);

    // 6. Lush Meadow Turf (Foreground battlefield, y = 105 to 180)
    // Dark horizon under-brush
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 100, W, 12);
    // Primary meadow grass
    ctx.fillStyle = '#40916c';
    ctx.fillRect(0, 108, W, 58);
    // Darker lower grass strip where units anchor
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 166, W, 14);

    // Subtle rusty narrow-gauge rails along the bottom
    ctx.fillStyle = '#3a2215'; // Dark iron rails
    ctx.fillRect(0, 168, W, 1);
    ctx.fillRect(0, 175, W, 1);
    // Wooden rail ties every 12 px
    ctx.fillStyle = '#5c381e';
    for (let rx = 6; rx < W; rx += 14) {
      ctx.fillRect(rx, 167, 3, 10);
    }

    return canvas;
  }

  private static drawPixelTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // Trunk
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(x - 4, y, 8, h - 10);
    ctx.fillStyle = '#5c381e';
    ctx.fillRect(x - 2, y, 4, h - 10);

    // 3-Tier Foliage (Dark shadow -> Mid-tone -> Highlight)
    const tiers = [
      { yOff: -h + 20, r: w * 0.45 },
      { yOff: -h + 8, r: w * 0.38 },
      { yOff: -h - 4, r: w * 0.3 }
    ];

    for (const t of tiers) {
      // Dark under-leaves
      ctx.fillStyle = '#1b4332';
      ctx.beginPath();
      ctx.arc(x, y + t.yOff + 2, t.r, 0, Math.PI * 2);
      ctx.fill();

      // Mid green
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(x, y + t.yOff, t.r, 0, Math.PI * 2);
      ctx.fill();

      // Top-left highlight
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.arc(x - t.r * 0.25, y + t.yOff - t.r * 0.25, t.r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Golden sunlight tip
      ctx.fillStyle = '#b5e48c';
      ctx.beginPath();
      ctx.arc(x - t.r * 0.35, y + t.yOff - t.r * 0.35, t.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  public static registerBackdrop(scene: Phaser.Scene): void {
    const mgr = scene.textures;
    if (mgr.exists('bg_meadow_day')) return;
    const canvas = this.createBackdropCanvas();
    mgr.addCanvas('bg_meadow_day', canvas);
  }
}

