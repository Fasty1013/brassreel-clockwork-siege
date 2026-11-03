import Phaser from 'phaser';
import { PixelMatrix } from './pixelMatrix';
import { PALETTE } from './palette';

/**
 * High-Contrast 28x28 Pixel-Art Slot Machine Symbols
 * Designed for instant silhouette recognition at a glance.
 * 1px dark contour, 3-4 tonal steps per material, compliant with ART_BIBLE.md.
 */

const MAP: Record<string, string> = {
  '.': PALETTE.TRANSPARENT,
  '0': PALETTE.VOID_BLACK,       // Dark contour
  '1': PALETTE.IRON_CHARCOAL,    // Deep shadow
  'B': PALETTE.POLISHED_BRASS,   // Primary brass
  'A': PALETTE.ANTIQUE_BRASS,    // Darker brass
  'G': PALETTE.GILDED_GOLD,      // Gold highlights
  'D': PALETTE.RADIANT_SPARK,    // Bright gold glint
  'H': PALETTE.SPRING_LEAF,      // Spring green
  'I': PALETTE.EMERALD_LIME,     // Bright green
  'E': PALETTE.FOREST_SHADOW,    // Deep green
  'M': PALETTE.PYRITE_RED,       // Fuse red
  'N': PALETTE.BLAZING_EMBER,    // Flame orange-red
  'O': PALETTE.FURNACE_FLAME,    // Bright flame
  'S': PALETTE.ELECTRIC_BLUE,    // Coil blue
  'T': PALETTE.ARC_CYAN,         // Bright cyan
  'U': PALETTE.PLASMA_WHITE,     // Electric white
  'P': PALETTE.PARCHMENT_BEIGE,  // Bone / ivory
  'W': PALETTE.PARCHMENT_SILK    // White specular highlight
};

export class SymbolArt {
  // 1. COGWHEEL (sym_cog, 28x28)
  private static readonly COG_MATRIX: string[] = [
    "............................",
    "............0000............",
    "...........0GGDD0...........",
    "...........0BGGGB0..........",
    "......00...0BAAAB0...00.....",
    ".....0GD0...00000...0GD0....",
    "....0BGGB00000000000BGGB0...",
    "....0BAAABBDDDDDBGBAAAB0....",
    ".....0000BDDDDDDDDDB0000....",
    "........0BDD00000DDB0.......",
    "....0000BDD0.....0DDB0000...",
    "...0GDDGBD0.......0DBGDDG0..",
    "...0BAAABD0...0...0DBAAAB0..",
    "...0BAAABD0..000..0DBAAAB0..",
    "...0BAAABD0...0...0DBAAAB0..",
    "...0GDDGBD0.......0DBGDDG0..",
    "....0000BDD0.....0DDB0000...",
    "........0BDD00000DDB0.......",
    ".....0000BDDDDDDDDDB0000....",
    "....0BAAABBDDDDDBGBAAAB0....",
    "....0BGGB00000000000BGGB0...",
    ".....0GD0...00000...0GD0....",
    "......00...0BAAAB0...00.....",
    "...........0BGGGB0..........",
    "...........0GGDD0...........",
    "............0000............",
    "............................",
    "............................"
  ];

  // 2. SPRING BOW (sym_spring, 28x28)
  private static readonly SPRING_MATRIX: string[] = [
    "............................",
    "................000.........",
    "..............00IIH0........",
    "............00IIHH00........",
    "...........0IIHH00W0........",
    "..........0IHH00..W0........",
    ".........0IHH0....W0........",
    "........0IHH0.....W0........",
    ".......0IHH0......W0........",
    "......0BGG0.......W0........",
    ".....0BGGB0.......W0........",
    "....0BAAAB0.......W0........",
    "....0B000B0.......W0........",
    "....0B0D0B0.......W0........",
    "....0B000B0.......W0........",
    "....0BAAAB0.......W0........",
    ".....0BGGB0.......W0........",
    "......0BGG0.......W0........",
    ".......0IHH0......W0........",
    "........0IHH0.....W0........",
    ".........0IHH0....W0........",
    "..........0IHH00..W0........",
    "...........0IIHH00W0........",
    "............00IIHH00........",
    "..............00IIH0........",
    "................000.........",
    "............................",
    "............................"
  ];

  // 3. FUSE BOMB (sym_fuse, 28x28)
  private static readonly FUSE_MATRIX: string[] = [
    "............................",
    "...................000......",
    "..................0OOD0.....",
    "..................0ODO0.....",
    ".................00OO0......",
    "..............0000.00.......",
    ".............01AA10.........",
    "............01AAAA10........",
    "...........0000000000.......",
    "..........001111111100......",
    ".........011MMMMMMMM110.....",
    "........011MMNNNNNNMM110....",
    ".......011MMNNWWNNNNMM110...",
    ".......011MNNNWWNNNNNM110...",
    "......011MNNNNWWNNNNNNM110..",
    "......011MNNNNNNNNNNNNM110..",
    "......011MNNNNNNNNNNNNM110..",
    "......011MNNNNNNNNNNNNM110..",
    ".......011MNNNNNNNNNNM110...",
    ".......011MMNNNNNNNNMM110...",
    "........011MMNNNNNNMM110....",
    ".........011MMMMMMMM110.....",
    "..........001111111100......",
    "...........0000000000.......",
    "............................",
    "............................",
    "............................",
    "............................"
  ];

  // 4. COIL TESLA (sym_coil, 28x28)
  private static readonly COIL_MATRIX: string[] = [
    "............................",
    ".......0000......0000.......",
    "......0BGGB0....0BGGB0......",
    "......0GDDGB0..0BGDDG0......",
    "......0BAAAB0..0BAAAB0......",
    ".......0000......0000.......",
    "........00........00........",
    "........0U0......0U0........",
    ".........0UT0..0TU0.........",
    "..........0TTUUTT0..........",
    "..........0TTUUTT0..........",
    ".........0UT0..0TU0.........",
    "........0U0......0U0........",
    "........00........00........",
    ".......0000......0000.......",
    "......0BGGB0....0BGGB0......",
    "......0BAAAB0..0BAAAB0......",
    "......0BAAAB0..0BAAAB0......",
    "......0BAAAB0..0BAAAB0......",
    "......0BAAAB0..0BAAAB0......",
    "......0BAAAB0..0BAAAB0......",
    "......0BAAAB0..0BAAAB0......",
    ".....00111100..00111100.....",
    "....011SSSS110011SSSS110....",
    "....01SSSSSS1101SSSSSS110...",
    "....00000000000000000000....",
    "............................",
    "............................"
  ];

  // 5. WILD JESTER (sym_wild, 28x28)
  private static readonly WILD_MATRIX: string[] = [
    "............................",
    "....00..............00......",
    "...0DD0............0DD0.....",
    "...0GDG0..........0GDG0.....",
    "....0BGB0........0BGB0......",
    ".....0BB0000000000BB0.......",
    "......0BGGDDDGGGB00.........",
    ".....0BGGDDDDDDGGB0.........",
    "....0BGGGBBBBBBGGB0.........",
    "...00BGB00000000BGB00.......",
    "..0D0BB0MM0..0MM0BB0D0......",
    "..0DG0B0MM0..0MM0B0GD0......",
    "...000BB000..000BB000.......",
    "......0BBBAAABBB0...........",
    "......0BAAADDDAAB0..........",
    "......0BAADDDDDAB0..........",
    ".......0BAADDDAB0...........",
    "........0BAAAB0.............",
    ".........00A00..............",
    "..........0D0...............",
    ".........0GDG0..............",
    ".........0DDD0..............",
    "..........000...............",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................"
  ];

  // 6. IMPERIAL CROWN (sym_crown, 28x28)
  private static readonly CROWN_MATRIX: string[] = [
    "............................",
    ".....0D0....0D0....0D0......",
    "....0DDD0..0DDD0..0DDD0.....",
    ".....0D0....0D0....0D0......",
    "....0BGB0..0BGB0..0BGB0.....",
    "...0GGDDG00GGDDG00GGDDG0....",
    "...0GDDDGBBGGDDGGBBDDDG0....",
    "...0GDDDGBBGGDDGGBBDDDG0....",
    "....0GDDGBBGGDDGGBBDDG0.....",
    "....0BGDDGGGGDDGGGDDGB0.....",
    ".....0BGDDDDDDDDDDDDGB0.....",
    ".....0BGGDDDDDDDDDGGB0......",
    "......0BBGGDDSGGDGGBB0......",
    "......00BBGGSMMSGGBB00......",
    ".....0DD0000SMMS0000DD0.....",
    "....0DDDD0111111110DDDD0....",
    "....0DDDD0BGGDDDGB0DDDD0....",
    ".....00000BGGDDDGB00000.....",
    ".........0BAAAAAB0..........",
    ".........0BAAAAAB0..........",
    ".........000000000..........",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................"
  ];

  public static registerAllSymbols(scene: Phaser.Scene): void {
    const mgr = scene.textures;
    PixelMatrix.registerTexture(mgr, 'sym_cog', this.COG_MATRIX, MAP, 1);
    PixelMatrix.registerTexture(mgr, 'sym_spring', this.SPRING_MATRIX, MAP, 1);
    PixelMatrix.registerTexture(mgr, 'sym_fuse', this.FUSE_MATRIX, MAP, 1);
    PixelMatrix.registerTexture(mgr, 'sym_coil', this.COIL_MATRIX, MAP, 1);
    PixelMatrix.registerTexture(mgr, 'sym_wild', this.WILD_MATRIX, MAP, 1);
    PixelMatrix.registerTexture(mgr, 'sym_crown', this.CROWN_MATRIX, MAP, 1);
  }
}
