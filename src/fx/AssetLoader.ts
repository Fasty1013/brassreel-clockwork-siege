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

    // 2. Scan and load external overrides if available
    this.loadExternalOverrides(scene);
  }

  /**
   * Attempts to load external high-detail sprite overrides from /public/assets/
   * If not found, Phaser simply continues using the procedural textures without failing.
   */
  public static loadExternalOverrides(scene: Phaser.Scene): void {
    if (this.externalAssetsAttempted) return;
    this.externalAssetsAttempted = true;

    // Optional external atlas paths
    const overrideAtlasPath = 'assets/sprites.json';
    const overridePngPath = 'assets/sprites.png';

    // Hook loader error handler so missing optional external files don't throw unhandled warnings
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      // Graceful fallback: file is optional
      if (file.key === 'external_sprites_atlas' || file.key.startsWith('ext_override_')) {
        // Suppress error - fallback already active in TextureManager
      }
    });

    // Check if atlas file is present
    try {
      scene.load.atlas('external_sprites_atlas', overridePngPath, overrideAtlasPath);
    } catch {
      // Ignored - fallback active
    }
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

