import Phaser from 'phaser';
import { BALANCE } from '@data/balance';

export interface GridSlot {
  col: number;
  row: number;
  x: number;
  y: number;
  tileBg: Phaser.GameObjects.Rectangle;
}

/**
 * GridView — Tactical Battlefield Grid on the Retro Meadow Lawn
 * Renders subtle, semi-transparent brass cell brackets during PREP phase,
 * and fades out during BATTLE so combatants fight naturally on the grass.
 */
export class GridView extends Phaser.GameObjects.Container {
  public slots: GridSlot[][] = [];
  public tileWidth = 140;
  public tileHeight = 72;
  private divider: Phaser.GameObjects.Rectangle;
  private boilerLine: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Build discrete grid matching lawn coordinates
    for (let c = 0; c < BALANCE.GRID_COLS; c++) {
      this.slots[c] = [];
      // every cell is a valid placement now
      const isPlayerZone = true;

      for (let r = 0; r < BALANCE.GRID_ROWS; r++) {
        const tileX = c * this.tileWidth + this.tileWidth / 2;
        const tileY = r * this.tileHeight + this.tileHeight / 2;

        // Subtle brass bracket for player deploy zone, transparent for enemy lane
        const tile = scene.add.rectangle(tileX, tileY, this.tileWidth - 8, this.tileHeight - 6);
        if (isPlayerZone) {
          tile.setFillStyle(0x2d3a1f, 0.22); // Soft lawn shadow
          tile.setStrokeStyle(1, 0xd4a373, 0.45); // Delicate brass border
        } else {
          tile.setFillStyle(0x000000, 0.0);
          tile.setStrokeStyle(1, 0x534764, 0.15); // Faint rail lane
        }
        this.add(tile);

        this.slots[c][r] = {
          col: c,
          row: r,
          x: tileX,
          y: tileY,
          tileBg: tile
        };
      }
    }

    // Border dividing Player defense zone and No Man's Land
    const divideX = BALANCE.PLAYER_DEPLOY_COLS * this.tileWidth;
    this.divider = scene.add.rectangle(divideX, (BALANCE.GRID_ROWS * this.tileHeight) / 2, 2, BALANCE.GRID_ROWS * this.tileHeight, 0xffd166, 0.7);
    this.divider.setVisible(false);
    this.add(this.divider);

    // Boiler defense line on Column 0 (left edge of meadow)
    this.boilerLine = scene.add.rectangle(0, (BALANCE.GRID_ROWS * this.tileHeight) / 2, 4, BALANCE.GRID_ROWS * this.tileHeight, 0xe63946, 0.85);
    this.add(this.boilerLine);

    scene.add.existing(this);
  }

  /**
   * Toggles tactical grid overlay visibility between PREP and BATTLE phases.
   */
  public setBattleMode(isBattle: boolean): void {
    const targetAlpha = isBattle ? 0.0 : 1.0;
    this.scene.tweens.add({
      targets: [this.divider, ...this.slots.flat().map(s => s.tileBg)],
      alpha: targetAlpha,
      duration: 250,
      ease: 'Quad.easeInOut'
    });
  }

  /**
   * Finds the grid slot under screen coordinates.
   */
  public getSlotAtWorldPos(worldX: number, worldY: number): GridSlot | null {
    const localX = worldX - this.x;
    const localY = worldY - this.y;

    for (let c = 0; c < BALANCE.GRID_COLS; c++) {
      for (let r = 0; r < BALANCE.GRID_ROWS; r++) {
        const slot = this.slots[c][r];
        const halfW = this.tileWidth / 2;
        const halfH = this.tileHeight / 2;

        if (
          localX >= slot.x - halfW &&
          localX <= slot.x + halfW &&
          localY >= slot.y - halfH &&
          localY <= slot.y + halfH
        ) {
          return slot;
        }
      }
    }
    return null;
  }

  /**
   * Returns world coordinates for the center of a given grid slot.
   */
  public getSlotWorldPos(col: number, row: number): { x: number; y: number } {
    const slot = this.slots[col]?.[row];
    if (slot) {
      return { x: this.x + slot.x, y: this.y + slot.y };
    }
    return {
      x: this.x + (col * this.tileWidth + this.tileWidth / 2),
      y: this.y + (row * this.tileHeight + this.tileHeight / 2)
    };
  }
}
