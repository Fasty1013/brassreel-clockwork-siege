import Phaser from 'phaser';
import { BALANCE } from '@data/balance';

export interface GridSlot {
  col: number;
  row: number;
  x: number;
  y: number;
  tileBg: Phaser.GameObjects.Rectangle;
}

export class GridView extends Phaser.GameObjects.Container {
  public slots: GridSlot[][] = [];
  public tileWidth = 80;
  public tileHeight = 80;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Build 8x5 discrete grid
    for (let c = 0; c < BALANCE.GRID_COLS; c++) {
      this.slots[c] = [];
      const isPlayerZone = c < BALANCE.PLAYER_DEPLOY_COLS;

      for (let r = 0; r < BALANCE.GRID_ROWS; r++) {
        const tileX = c * this.tileWidth + this.tileWidth / 2;
        const tileY = r * this.tileHeight + this.tileHeight / 2;

        const tileColor = isPlayerZone
          ? (c + r) % 2 === 0 ? 0x2b221a : 0x382c22
          : (c + r) % 2 === 0 ? 0x1b1918 : 0x242120;

        const tile = scene.add.rectangle(tileX, tileY, this.tileWidth - 4, this.tileHeight - 4, tileColor);
        tile.setStrokeStyle(1, isPlayerZone ? 0x8c5836 : 0x495057, 0.6);
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
    const divider = scene.add.rectangle(divideX, (BALANCE.GRID_ROWS * this.tileHeight) / 2, 4, BALANCE.GRID_ROWS * this.tileHeight, 0xffd166, 0.8);
    this.add(divider);

    // Boiler defense line on Column 0 (left edge)
    const boilerLine = scene.add.rectangle(0, (BALANCE.GRID_ROWS * this.tileHeight) / 2, 6, BALANCE.GRID_ROWS * this.tileHeight, 0xe63946, 0.9);
    this.add(boilerLine);

    scene.add.existing(this);
  }

  /**
   * Finds the grid slot under screen coordinates.
   */
  public getSlotAtWorldPos(worldX: number, worldY: number): GridSlot | null {
    const localX = worldX - this.x;
    const localY = worldY - this.y;

    const col = Math.floor(localX / this.tileWidth);
    const row = Math.floor(localY / this.tileHeight);

    if (col >= 0 && col < BALANCE.GRID_COLS && row >= 0 && row < BALANCE.GRID_ROWS) {
      return this.slots[col][row];
    }
    return null;
  }

  public highlightPlayerSlots(active: boolean): void {
    for (let c = 0; c < BALANCE.PLAYER_DEPLOY_COLS; c++) {
      for (let r = 0; r < BALANCE.GRID_ROWS; r++) {
        const slot = this.slots[c][r];
        if (active) {
          slot.tileBg.setStrokeStyle(2, 0xffd166, 0.9);
        } else {
          slot.tileBg.setStrokeStyle(1, 0x8c5836, 0.6);
        }
      }
    }
  }

  public getSlotWorldPos(col: number, row: number): { x: number; y: number } {
    const slot = this.slots[col][row];
    return {
      x: this.x + slot.x,
      y: this.y + slot.y
    };
  }
}
