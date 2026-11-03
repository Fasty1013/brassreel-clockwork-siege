import Phaser from 'phaser';
import { UnitInstance } from '@core/units/unitFactory';
import { Tooltip } from './Tooltip';
import { UNITS_DATA } from '@data/units';
import { AnimationFX } from '../fx/AnimationFX';

export class UnitCard extends Phaser.GameObjects.Container {
  public unit: UnitInstance;
  private bg: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite;
  private starText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private isDragging = false;
  private originalX = 0;
  private originalY = 0;
  private idleTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, unit: UnitInstance, tooltip: Tooltip) {
    super(scene, x, y);
    this.unit = unit;

    const factionColors: Record<string, number> = {
      cog: 0x8c5836,
      spring: 0x2a9d8f,
      fuse: 0xd62828,
      coil: 0x0077b6,
      scrap: 0x6c757d,
      legendary: 0xffb703
    };

    const borderColor = factionColors[unit.faction] ?? 0xd4a373;

    // Card background
    this.bg = scene.add.rectangle(0, 0, 64, 76, 0x1e1c1b);
    this.bg.setStrokeStyle(2, unit.isGilded ? 0xffd166 : borderColor);
    this.add(this.bg);

    // Unit sprite
    const def = UNITS_DATA[unit.defId];
    const spriteKey = def?.spriteKey ?? 'tex_scrap_bot';
    this.sprite = scene.add.sprite(0, -8, spriteKey);
    this.sprite.setDisplaySize(36, 36);
    this.add(this.sprite);

    // Star rank
    const starStr = '★'.repeat(unit.starRank);
    this.starText = scene.add.text(0, 14, starStr, {
      fontSize: '11px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.starText);

    // HP Bar
    this.hpBarBg = scene.add.rectangle(0, 28, 54, 6, 0x343a40);
    this.hpBarFill = scene.add.rectangle(-27, 28, 54, 6, 0x2ec4b6);
    this.hpBarFill.setOrigin(0, 0.5);
    this.add(this.hpBarBg);
    this.add(this.hpBarFill);

    this.setSize(64, 76);
    this.setInteractive({ draggable: true });

    // Hover tooltip
    this.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        tooltip.showUnit(this.unit, pointer.x, pointer.y);
      }
    });

    this.on('pointerout', () => {
      tooltip.hide();
    });

    // Drag-and-drop handling
    scene.input.setDraggable(this);

    this.on('dragstart', (_pointer: Phaser.Input.Pointer, _dragX: number, _dragY: number) => {
      this.isDragging = true;
      this.stopIdleBobbing();
      this.originalX = this.x;
      this.originalY = this.y;
      this.setDepth(500);
      tooltip.hide();
      this.setScale(1.1);
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.setPosition(dragX, dragY);
    });

    this.on('dragend', () => {
      this.isDragging = false;
      this.setScale(1.0);
      this.setDepth(10);
      this.startIdleBobbing();
      this.emit('card_dropped', this);
    });

    scene.add.existing(this);
    this.startIdleBobbing();
  }

  public startIdleBobbing(): void {
    if (this.idleTween || this.isDragging) return;
    this.idleTween = AnimationFX.applyIdleBobbing(this.scene, this.sprite);
  }

  public stopIdleBobbing(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
      this.sprite.y = -8;
      this.sprite.setScale(1);
    }
  }

  public playAttack(isRanged = false, onImpact?: () => void): void {
    AnimationFX.playAttackAnimation(this.scene, this.sprite, isRanged, onImpact);
  }

  public playHitFlash(): void {
    AnimationFX.playHitFlash(this.scene, this.sprite);
  }

  public updateHealth(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.hpBarFill.setSize(54 * ratio, 6);
    if (ratio < 0.3) {
      this.hpBarFill.setFillStyle(0xe63946);
    } else {
      this.hpBarFill.setFillStyle(0x2ec4b6);
    }
  }

  public revertPosition(): void {
    this.setPosition(this.originalX, this.originalY);
  }
}
