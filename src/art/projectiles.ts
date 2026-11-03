import Phaser from 'phaser';
import { PixelMatrix } from './pixelMatrix';
import { PALETTE } from './palette';

/**
 * Combat Projectiles and Slash Visuals (Authentic 2D Retro Pixel Art)
 */
export class ProjectilesArt {
  private static readonly MAP: Record<string, string> = {
    '.': PALETTE.TRANSPARENT,
    '0': PALETTE.VOID_BLACK,
    'W': '#ffffff',
    'Y': PALETTE.GILDED_GOLD,
    'B': PALETTE.ANTIQUE_BRASS,
    'I': PALETTE.DARK_IRON,
    'R': PALETTE.PYRITE_RED,
    'F': PALETTE.BLAZING_EMBER,
    'E': PALETTE.ARC_CYAN,
    'S': PALETTE.LAVENDER_SMOKE
  };

  // 16x5 Arrow Projectile
  private static readonly ARROW_MATRIX = [
    "....00..........",
    "...0WW0.........",
    "000IWWIIIIII0Y0.",
    "...0WW0.....00Y0",
    "....00.......00."
  ];

  // 12x12 Round Bomb with burning fuse
  private static readonly BOMB_MATRIX = [
    "........00YF",
    ".......0II0F",
    "......0II0..",
    "....000000..",
    "...0IIIIII0.",
    "..0IWWIIIII0",
    "..0IIIIIIII0",
    "..0IIIIIIII0",
    "..0IIIIIIII0",
    "...0IIIIII0.",
    "....000000..",
    "............"
  ];

  // 24x24 Crescent Slash Arc (Pure retro white swipe)
  private static readonly SLASH_MATRIX = [
    "........................",
    "....................000.",
    "..................00WWW0",
    "...............000WWWW0.",
    "............000WWWWW00..",
    ".........000WWWWWW00....",
    ".......00WWWWWWW00......",
    ".....00WWWWWWW00........",
    "....0WWWWWWW00..........",
    "...0WWWWWW00............",
    "..0WWWWW00..............",
    "..0WWWW00...............",
    ".0WWWW00................",
    ".0WWW00.................",
    ".0WW00..................",
    ".0W00...................",
    ".000....................",
    ".00.....................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ];

  // 10x10 Scrap Debris Chunk
  private static readonly SCRAP_MATRIX = [
    "..0000..",
    ".0IIII0.",
    "0IBBIII0",
    "0IBBIII0",
    "0IIIIII0",
    ".0IIII0.",
    "..0000.."
  ];

  public static registerAll(scene: Phaser.Scene): void {
    const tm = scene.textures;
    PixelMatrix.registerTexture(tm, 'tex_proj_arrow', this.ARROW_MATRIX, this.MAP, 2);
    PixelMatrix.registerTexture(tm, 'tex_proj_bomb', this.BOMB_MATRIX, this.MAP, 2);
    PixelMatrix.registerTexture(tm, 'tex_slash_arc', this.SLASH_MATRIX, this.MAP, 2);
    PixelMatrix.registerTexture(tm, 'tex_scrap_debris', this.SCRAP_MATRIX, this.MAP, 2);
  }
}
