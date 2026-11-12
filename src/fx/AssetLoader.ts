import Phaser from 'phaser';
import { ProceduralAssets } from './proceduralAssets';

/**
 * Hybrid Progressive Asset Loader
 * Combines zero-dependency instant procedural Canvas textures with
 * an optional modular external sprite atlas / PNG override layer.
 */
export class AssetLoader {
  private static externalAssetsAttempted = false;
  private static registeredKeys: Set<string> = new Set();

  /**
   * Initializes all game assets in Phaser TextureManager.
   * Procedural canvas assets are generated first so the game is 100% playable immediately.
   */
  public static init(scene: Phaser.Scene): void {
    // 1. Generate full baseline procedural asset inventory
    ProceduralAssets.generateAllTextures(scene);

    // Track baseline texture keys
    const textureManager = scene.textures;
    const allKeys = textureManager.getTextureKeys();
    for (const key of allKeys) {
      this.registeredKeys.add(key);
    }

    // 2. External PNG overrides are probed later (BootScene.create) — see loadExternalOverrides
  }

  /**
   * Optional external PNG atlas override (public/assets/sprites.png + sprites.json).
   * The dev server answers missing files with index.html, which Phaser would try to
   * parse as JSON and stall the loader — so we probe the file first and only queue
   * the atlas when it really exists. Resolves once the atlas is loaded (or skipped).
   */
  public static loadExternalOverrides(scene: Phaser.Scene): Promise<void> {
    if (this.externalAssetsAttempted) return Promise.resolve();
    this.externalAssetsAttempted = true;

    const overrideAtlasPath = 'assets/sprites.json';
    const overridePngPath = 'assets/sprites.png';

    return fetch(overrideAtlasPath, { method: 'GET', cache: 'no-store' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || !type.includes('json')) return;
        return new Promise<void>((resolve) => {
          scene.load.atlas('external_sprites_atlas', overridePngPath, overrideAtlasPath);
          scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
          scene.load.start();
        });
      })
      .catch(() => undefined);
  }

  /**
   * Checks if a texture key is registered and available in Phaser.
   */
  public static hasTexture(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }

  /**
   * Resolves the best available texture key for an entity.
   * If an external animated atlas frame exists, returns that frame;
   * otherwise returns the standard procedural key.
   */
  public static resolveTexture(scene: Phaser.Scene, key: string): string {
    if (scene.textures.exists('external_sprites_atlas')) {
      const atlas = scene.textures.get('external_sprites_atlas');
      if (atlas && atlas.has(key)) {
        return key;
      }
    }
    return key;
  }
}

