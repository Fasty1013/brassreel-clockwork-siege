import Phaser from 'phaser';
import { UnitInstance } from '@core/units/unitFactory';
import { Tooltip } from './Tooltip';
import { UNITS_DATA } from '@data/units';
import { AnimationFX } from '../fx/AnimationFX';
import { ParticleKit } from '../presentation/ParticleKit';

export class UnitCard extends Phaser.GameObjects.Container {
  public unit: UnitInstance;
  private bg: Phaser.GameObjects.Rectangle;
  public sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Ellipse;
  private starText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private isDragging = false;
  private isDeployed = false;
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

    // Ground shadow for living meadow depth
    this.shadow = scene.add.ellipse(0, 18, 42, 14, 0x09070d, 0.45);
    this.add(this.shadow);

    // Bench Card background (visible in reserve shelf, hidden on meadow)
    this.bg = scene.add.rectangle(0, 0, 68, 80, 0x1e1c1b);
    this.bg.setStrokeStyle(2, unit.isGilded ? 0xffd166 : borderColor);
    this.add(this.bg);

    // Unit sprite (32x32 retro pixel art scaled 2x to 64x64)
    const def = UNITS_DATA[unit.defId];
    const spriteKey = def?.spriteKey ?? 'tex_cog_knight';
    
    // Check if animation exists (cog knight or spring archer)
    if (scene.anims.exists('cog_knight_idle') && unit.faction === 'cog') {
      this.sprite = scene.add.sprite(0, -2, 'tex_cog_knight');
      this.sprite.play('cog_knight_idle');
    } else if (scene.anims.exists('spring_archer_idle') && (unit.faction === 'spring' || unit.defId.includes('archer'))) {
      this.sprite = scene.add.sprite(0, -2, 'tex_spring_archer');
      this.sprite.play('spring_archer_idle');
    } else {
      this.sprite = scene.add.sprite(0, -2, spriteKey);
    }
    this.sprite.setDisplaySize(54, 54);
    this.add(this.sprite);

    // Star rank
    const starStr = '★'.repeat(unit.starRank);
    this.starText = scene.add.text(0, 22, starStr, {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.starText);

    // Floating HP Bar
    this.hpBarBg = scene.add.rectangle(0, -32, 52, 6, 0x141018);
    this.hpBarBg.setStrokeStyle(1, 0x3d3047);
    this.hpBarFill = scene.add.rectangle(-26, -32, 52, 6, 0x2ec4b6);
    this.hpBarFill.setOrigin(0, 0.5);
    this.add(this.hpBarBg);
    this.add(this.hpBarFill);

    this.setSize(68, 80);
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
      this.setScale(1.15);
      this.shadow.setScale(1.2);
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.setPosition(dragX, dragY);
    });

    this.on('dragend', () => {
      this.isDragging = false;
      this.setScale(1.0);
      this.shadow.setScale(1.0);
      this.setDepth(Math.floor(this.y));
      this.startIdleBobbing();
      this.emit('card_dropped', this);
    });

    scene.add.existing(this);
    this.startIdleBobbing();
  }

  /**
   * Sets whether unit is actively deployed on the meadow or resting on the bench shelf.
   */
  public setDeployedMode(deployed: boolean): void {
    this.isDeployed = deployed;
    this.bg.setVisible(!deployed);
    this.shadow.setVisible(deployed);
    this.setDepth(Math.floor(this.y));

    if (deployed) {
      this.starText.setPosition(0, -42);
      this.hpBarBg.setPosition(0, -32);
      this.hpBarFill.setPosition(-26, -32);
    } else {
      this.starText.setPosition(0, 22);
      this.hpBarBg.setPosition(0, 32);
      this.hpBarFill.setPosition(-26, 32);
    }
  }

  public startIdleBobbing(): void {
    if (this.idleTween || this.isDragging) return;
    if (this.isDeployed && this.scene.anims.exists('cog_knight_idle') && this.unit.faction === 'cog') {
      this.sprite.play('cog_knight_idle', true);
    } else {
      this.idleTween = AnimationFX.applyIdleBobbing(this.scene, this.sprite);
    }
  }

  public stopIdleBobbing(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
      this.sprite.y = -2;
      this.sprite.setScale(1);
    }
  }

  public playAttack(isRanged = false, onImpact?: () => void): void {
    if (this.scene.anims.exists('cog_knight_attack') && this.unit.faction === 'cog') {
      this.sprite.play('cog_knight_attack');
      this.scene.tweens.add({
        targets: this,
        x: this.x + 22,
        duration: 140,
        yoyo: true,
        ease: 'Quad.easeOut',
        onYoyo: () => {
          ParticleKit.sparkleBurst(this.scene, this.x + 30, this.y, 0xffd166, 6);
          if (onImpact) onImpact();
        },
        onComplete: () => {
          this.sprite.play('cog_knight_idle', true);
        }
      });
    } else if (this.scene.anims.exists('spring_archer_attack') && (this.unit.faction === 'spring' || this.unit.defId.includes('archer'))) {
      this.sprite.play('spring_archer_attack');
      const startX = this.x + 20;
      const startY = this.y - 2;
      if (this.scene.textures.exists('tex_proj_arrow')) {
        const arrow = this.scene.add.image(startX, startY, 'tex_proj_arrow');
        arrow.setDepth(600);
        this.scene.tweens.add({
          targets: arrow,
          x: startX + 320,
          duration: 220,
          ease: 'Linear',
          onComplete: () => {
            arrow.destroy();
            ParticleKit.sparkleBurst(this.scene, startX + 320, startY, 0x2a9d8f, 6);
            if (onImpact) onImpact();
          }
        });
      }
      this.scene.time.delayedCall(320, () => {
        this.sprite.play('spring_archer_idle', true);
      });
    } else {
      AnimationFX.playAttackAnimation(this.scene, this.sprite, isRanged, onImpact);
    }
  }

  public playHitFlash(): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this,
      x: this.x - 6,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this.sprite.clearTint();
      }
    });
    ParticleKit.sparkleBurst(this.scene, this.x, this.y, 0xff5400, 8);
  }

  public updateHealth(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.hpBarFill.setSize(52 * ratio, 6);
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
