import Phaser from 'phaser';

/**
 * Pixel-Matrix Renderer & Texture Factory
 * Translates indexed character strings into crisp nearest-neighbor HTML5 Canvases
 * and injects them into Phaser's TextureManager.
 */
export class PixelMatrix {
  /**
   * Renders a 2D string matrix into an HTML5 Canvas.
   */
  public static renderToCanvas(
    matrix: string[],
    charMap: Record<string, string>,
    pixelScale = 1
  ): HTMLCanvasElement {
    const height = matrix.length;
    const width = height > 0 ? matrix[0].length : 0;

    const canvas = document.createElement('canvas');
    canvas.width = width * pixelScale;
    canvas.height = height * pixelScale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < height; y++) {
      const row = matrix[y];
      for (let x = 0; x < width; x++) {
        const char = row[x] ?? '.';
        const color = charMap[char];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
        }
      }
    }

    return canvas;
  }

  /**
   * Creates a single texture in Phaser's TextureManager from a matrix.
   */
  public static registerTexture(
    manager: Phaser.Textures.TextureManager,
    key: string,
    matrix: string[],
    charMap: Record<string, string>,
    pixelScale = 1
  ): void {
    if (manager.exists(key)) return;
    const canvas = this.renderToCanvas(matrix, charMap, pixelScale);
    manager.addCanvas(key, canvas);
  }

  /**
   * Renders a multi-frame animation sheet into a horizontal texture atlas strip.
   */
  public static registerAnimationStrip(
    scene: Phaser.Scene,
    stripKey: string,
    animKey: string,
    frames: string[][],
    charMap: Record<string, string>,
    frameWidth: number,
    frameHeight: number,
    frameRate = 10,
    repeat = -1
  ): void {
    const manager = scene.textures;
    if (!manager.exists(stripKey)) {
      const totalFrames = frames.length;
      const canvas = document.createElement('canvas');
      canvas.width = totalFrames * frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < totalFrames; i++) {
          const frameCanvas = this.renderToCanvas(frames[i], charMap, 1);
          ctx.drawImage(frameCanvas, i * frameWidth, 0);
        }
        manager.addCanvas(stripKey, canvas);

        // Add sub-frame coordinates to the strip texture
        for (let i = 0; i < totalFrames; i++) {
          manager.get(stripKey).add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
        }
      }
    }

    // Register Phaser animation if anims manager exists
    if (scene.anims && !scene.anims.exists(animKey)) {
      const frameConfig = scene.anims.generateFrameNumbers(stripKey, {
        start: 0,
        end: frames.length - 1
      });
      scene.anims.create({
        key: animKey,
        frames: frameConfig,
        frameRate,
        repeat
      });
    }
  }
}

