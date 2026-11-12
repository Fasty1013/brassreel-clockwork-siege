import Phaser from 'phaser';
import { PixelCanvas } from './PixelCanvas';
import { FRAMES_PER_ANIM, POSES, SpriteDef } from './defs';
import { applyLevelLook } from './levelLook';
import { Pose } from './automaton';

/**
 * SpriteForge — turns a draw function into a 12-frame animated sprite:
 *   frames 0..3  idle, 4..7 walk, 8..11 attack
 * and registers it in Phaser as
 *   `<key>`           single idle frame (drop-in for the old static textures)
 *   `<key>_sheet`     the full strip
 *   `<key>_idle|_walk|_attack` animations
 */

export * from './defs';

const registry = new Map<string, SpriteDef>();

/** Opaque bounds of the idle frame in native pixels (for HP bars, shadows, hit boxes). */
export interface SpriteBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}
const boundsMap = new Map<string, SpriteBounds>();

export class SpriteForge {
  public static renderStrip(def: SpriteDef, post?: (g: PixelCanvas, p: Pose) => void): HTMLCanvasElement {
    const S = def.size;
    const canvas = document.createElement('canvas');
    canvas.width = S * POSES.length;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.imageSmoothingEnabled = false;
    POSES.forEach((pose, i) => {
      const g = new PixelCanvas(S, S);
      def.draw(g, pose);
      post?.(g, pose);
      g.drawTo(ctx, i * S, 0);
      if (i === 0 && !post) {
        const cells = g.cells();
        const b: SpriteBounds = { top: S, left: S, right: 0, bottom: 0 };
        for (let y = 0; y < S; y++) {
          for (let x = 0; x < S; x++) {
            if (cells[y * S + x] === null) continue;
            b.top = Math.min(b.top, y);
            b.bottom = Math.max(b.bottom, y);
            b.left = Math.min(b.left, x);
            b.right = Math.max(b.right, x);
          }
        }
        boundsMap.set(def.key, b);
      }
    });
    return canvas;
  }

  public static register(scene: Phaser.Scene, defs: SpriteDef[]): void {
    for (const def of defs) {
      registry.set(def.key, def);
      this.registerOne(scene, def.key, def);
    }
  }

  private static registerOne(
    scene: Phaser.Scene,
    key: string,
    def: SpriteDef,
    post?: (g: PixelCanvas, p: Pose) => void
  ): void {
    const tm = scene.textures;
    const S = def.size;
    const sheetKey = `${key}_sheet`;
    if (tm.exists(sheetKey)) return;

    const strip = this.renderStrip(def, post);
    const sheet = tm.addCanvas(sheetKey, strip);
    if (!sheet) return;
    for (let i = 0; i < POSES.length; i++) sheet.add(i, 0, i * S, 0, S, S);

    // Single idle frame under the plain key (replaces any older placeholder)
    if (tm.exists(key)) tm.remove(key);
    const single = document.createElement('canvas');
    single.width = S;
    single.height = S;
    const sctx = single.getContext('2d');
    if (sctx) {
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(strip, 0, 0, S, S, 0, 0, S, S);
    }
    tm.addCanvas(key, single);

    const mk = (suffix: string, start: number, frameRate: number, repeat: number): void => {
      const animKey = `${key}_${suffix}`;
      if (scene.anims.exists(animKey)) return;
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(sheetKey, { start, end: start + FRAMES_PER_ANIM - 1 }),
        frameRate,
        repeat
      });
    };
    mk('idle', 0, 5, -1);
    mk('walk', 4, 8, -1);
    mk('attack', 8, 12, 0);
  }

  /**
   * Level look: every level 2..5 changes the robot — a coloured rim light on its
   * contour (copper, silver, gold, gold + violet aura), plus extra rivets/plates.
   * Variants are forged lazily the first time a unit reaches that level.
   * Returns the texture key to use (the base key for level 1).
   */
  public static ensureLevel(scene: Phaser.Scene, key: string, level: number): string {
    const def = registry.get(key);
    if (!def || level <= 1) return key;
    const lvl = Math.min(5, Math.floor(level));
    const vKey = `${key}_L${lvl}`;
    if (!scene.textures.exists(`${vKey}_sheet`)) {
      this.registerOne(scene, vKey, def, (g, p) => applyLevelLook(g, lvl, p));
      const b = boundsMap.get(key);
      if (b) boundsMap.set(vKey, b);
    }
    return vKey;
  }

  public static has(key: string): boolean {
    return registry.has(key);
  }

  public static get(key: string): SpriteDef | undefined {
    return registry.get(key);
  }

  public static bounds(key: string): SpriteBounds | undefined {
    return boundsMap.get(key);
  }

  public static keys(): string[] {
    return [...registry.keys()];
  }
}
