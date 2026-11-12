import Phaser from 'phaser';
import { UnitInstance } from '@core/units/unitFactory';
import { Tooltip } from './Tooltip';
import { UNITS_DATA } from '@data/units';
import { AnimationFX } from '../fx/AnimationFX';
import { ParticleKit } from '../presentation/ParticleKit';
import { SpriteForge } from '../art/forge/SpriteForge';
import { fieldScale, hasAnim, playAttack, playLoop } from '../art/forge/play';

const FACTION_COLORS: Record<string, number> = {
  cog: 0xc8893f,
  spring: 0x3f9b63,
  fuse: 0xc22a33,
  coil: 0x2274c4,
  scrap: 0x8a879c,
  legendary: 0xffd166
};

/** Feet sit this far below the card origin when standing on a grid tile. */
const FIELD_FOOT_Y = 26;
/** Feet position inside the 68×80 bench slot. */
const BENCH_FOOT_Y = 26;

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
  /** base forged key of the archetype, and the level variant currently shown */
  private readonly baseKey: string;
  private spriteKey: string;
  /** archetype the card was built for (an evolution needs a new card) */
  public readonly builtDefId: string;
  private readonly nativeSize: number;
  private readonly animated: boolean;
  private hpW = 52;

  constructor(scene: Phaser.Scene, x: number, y: number, unit: UnitInstance, tooltip: Tooltip) {
    super(scene, x, y);
    this.unit = unit;
    this.builtDefId = unit.defId;

    const borderColor = FACTION_COLORS[unit.faction] ?? 0xd4a373;
    const def = UNITS_DATA[unit.defId];
    this.baseKey = def?.spriteKey ?? 'tex_cog_knight';
    this.spriteKey = SpriteForge.ensureLevel(scene, this.baseKey, unit.starRank);
    this.nativeSize = SpriteForge.get(this.baseKey)?.size ?? 32;
    this.animated = hasAnim(scene, this.spriteKey, 'idle');

    // Ground shadow (visible on the meadow)
    this.shadow = scene.add.ellipse(0, FIELD_FOOT_Y, 48, 14, 0x0b1408, 0.38);
    this.add(this.shadow);

    // Bench card background (visible in the reserve shelf, hidden on the meadow)
    this.bg = scene.add.rectangle(0, 0, 68, 80, 0x1e1c1b);
    this.bg.setStrokeStyle(2, unit.isGilded ? 0xffd166 : borderColor);
    this.add(this.bg);

    this.sprite = scene.add.sprite(0, BENCH_FOOT_Y, this.spriteKey).setOrigin(0.5, 1);
    if (this.animated) this.sprite.play({ key: `${this.spriteKey}_idle`, startFrame: Math.floor(Math.random() * 4) });
    this.add(this.sprite);

    this.starText = scene.add.text(0, 22, '★'.repeat(unit.starRank), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
      stroke: '#17121f',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.starText);

    this.hpBarBg = scene.add.rectangle(0, -32, this.hpW + 4, 8, 0x17121f);
    this.hpBarFill = scene.add.rectangle(-this.hpW / 2, -32, this.hpW, 4, 0x5ad06b).setOrigin(0, 0.5);
    this.add(this.hpBarBg);
    this.add(this.hpBarFill);

    this.setSize(68, 80);
    this.setInteractive({ draggable: true });

    this.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) tooltip.showUnit(this.unit, pointer.x, pointer.y);
    });
    this.on('pointerout', () => tooltip.hide());

    scene.input.setDraggable(this);

    this.on('dragstart', () => {
      this.isDragging = true;
      this.stopIdleBobbing();
      this.originalX = this.x;
      this.originalY = this.y;
      this.setDepth(5000);
      tooltip.hide();
      this.setScale(1.12);
      this.shadow.setScale(1.2);
      if (this.animated) playLoop(this.sprite, this.spriteKey, 'walk');
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
    this.applyLayout();
    this.startIdleBobbing();
  }

  private benchScale(): number {
    // integer-ish scale that fits the 68×80 slot
    return Math.min(2, 76 / this.nativeSize);
  }

  /** Recompute sprite scale + HP bar / stars placement for bench or field mode. */
  private applyLayout(): void {
    const scale = this.isDeployed ? fieldScale(this.nativeSize) : this.benchScale();
    const footY = this.isDeployed ? FIELD_FOOT_Y : BENCH_FOOT_Y;
    this.sprite.setScale(scale);
    // native frames keep 1px of air below the feet
    this.sprite.setPosition(0, footY + scale);

    const b = SpriteForge.bounds(this.spriteKey);
    const S = this.nativeSize;
    const topPx = b ? b.top : 2;
    const headY = footY + scale - (S - topPx) * scale;

    if (this.isDeployed) {
      const bodyW = b ? (b.right - b.left + 1) * scale : S * scale;
      this.hpW = Phaser.Math.Clamp(Math.round(bodyW * 0.55), 40, 84);
      this.hpBarBg.setSize(this.hpW + 4, 8).setPosition(0, headY - 10);
      this.hpBarFill.setPosition(-this.hpW / 2, headY - 10);
      // stars ride on the left end of the HP bar so they never cover the unit above
      this.starText.setFontSize(11).setOrigin(1, 0.5).setPosition(-this.hpW / 2 - 3, headY - 10);
      this.starText.setVisible(this.unit.starRank > 1);
      this.shadow.setSize(Math.max(44, bodyW * 0.7), 16).setPosition(0, footY - 2);
    } else {
      this.hpW = 52;
      this.hpBarBg.setSize(56, 8).setPosition(0, 34);
      this.hpBarFill.setPosition(-26, 34);
      this.starText.setFontSize(13).setOrigin(0.5).setPosition(0, -30).setVisible(true);
    }
    this.updateHealthBarWidth();
  }

  private hpRatio = 1;

  private updateHealthBarWidth(): void {
    this.hpBarFill.setSize(this.hpW * this.hpRatio, 4);
  }

  /** Sets whether unit is deployed on the meadow or resting on the bench shelf. */
  public setDeployedMode(deployed: boolean): void {
    this.isDeployed = deployed;
    this.bg.setVisible(!deployed);
    this.shadow.setVisible(deployed);
    this.applyLayout();
    // y-sort by feet so taller units in lower rows overlap correctly
    this.setDepth(Math.floor(this.y + (deployed ? FIELD_FOOT_Y : 0)));
  }

  public startIdleBobbing(): void {
    if (this.isDragging) return;
    if (this.animated) {
      playLoop(this.sprite, this.spriteKey, 'idle');
      return;
    }
    if (this.idleTween) return;
    this.idleTween = AnimationFX.applyIdleBobbing(this.scene, this.sprite);
  }

  public stopIdleBobbing(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
      this.applyLayout();
    }
  }

  /**
   * Attack: plays the unit's own attack animation. Ranged units launch a
   * faction projectile toward `target` (world coords) if one is given.
   */
  public playAttack(isRanged = false, onImpact?: () => void, target?: { x: number; y: number }): void {
    const scene = this.scene;
    if (!this.animated) {
      AnimationFX.playAttackAnimation(scene, this.sprite, isRanged, onImpact);
      return;
    }
    playAttack(this.sprite, this.spriteKey, 'idle');

    if (!isRanged) {
      const baseX = this.x;
      scene.tweens.add({
        targets: this,
        x: baseX + 14,
        duration: 110,
        delay: 70,
        yoyo: true,
        ease: 'Quad.easeOut',
        onYoyo: () => {
          ParticleKit.sparkleBurst(scene, this.x + 40, this.y, 0xffd166, 5);
          onImpact?.();
        },
        onComplete: () => this.setX(baseX)
      });
      return;
    }

    const scale = this.sprite.scaleX;
    const sx = this.x + this.nativeSize * scale * 0.35;
    const sy = this.y + FIELD_FOOT_Y - this.nativeSize * scale * 0.45;
    const tx = target?.x ?? sx + 360;
    const ty = target ? target.y - 30 : sy;
    scene.time.delayedCall(85, () => this.launchProjectile(sx, sy, tx, ty, onImpact));
  }

  private launchProjectile(sx: number, sy: number, tx: number, ty: number, onImpact?: () => void): void {
    const scene = this.scene;
    if (!scene) return;
    const dist = Math.max(60, Math.hypot(tx - sx, ty - sy));
    const faction = this.unit.faction;

    if (faction === 'coil') {
      // crackling arc
      const g = scene.add.graphics().setDepth(2000);
      const pts: Array<[number, number]> = [];
      const steps = 7;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 26;
        pts.push([sx + (tx - sx) * t, sy + (ty - sy) * t + jitter]);
      }
      g.lineStyle(6, 0x4fb3ec, 0.5);
      g.strokePoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
      g.lineStyle(2, 0xeaffff, 1);
      g.strokePoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
      scene.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
      ParticleKit.sparkleBurst(scene, tx, ty, 0x7ee6f5, 6);
      onImpact?.();
      return;
    }

    const lob = faction === 'fuse';
    const key = lob ? 'tex_proj_bomb' : 'tex_proj_arrow';
    if (!scene.textures.exists(key)) {
      onImpact?.();
      return;
    }
    const proj = scene.add.image(sx, sy, key).setDepth(2000).setScale(lob ? 1.5 : 1.5);
    const duration = lob ? 380 + dist * 0.35 : 120 + dist * 0.35;
    const arc = lob ? Math.min(220, dist * 0.45) : 0;
    const counter = { t: 0 };
    scene.tweens.add({
      targets: counter,
      t: 1,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        const t = counter.t;
        const x = sx + (tx - sx) * t;
        const y = sy + (ty - sy) * t - Math.sin(t * Math.PI) * arc;
        if (!lob) proj.setRotation(Math.atan2(ty - sy, tx - sx));
        else proj.setRotation(proj.rotation + 0.25);
        proj.setPosition(x, y);
      },
      onComplete: () => {
        proj.destroy();
        if (lob) {
          ParticleKit.sparkleBurst(scene, tx, ty, 0xff9a2e, 10);
          scene.cameras.main.shake(70, 0.002);
        } else {
          ParticleKit.sparkleBurst(scene, tx, ty, 0xc8f2c0, 5);
        }
        onImpact?.();
      }
    });
  }

  public playHitFlash(): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    const baseX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: baseX - 5,
      duration: 50,
      yoyo: true,
      onComplete: () => this.setX(baseX)
    });
  }

  public updateHealth(current: number, max: number): void {
    this.hpRatio = Math.max(0, Math.min(1, current / max));
    this.updateHealthBarWidth();
    this.hpBarFill.setFillStyle(this.hpRatio < 0.3 ? 0xe63946 : this.hpRatio < 0.6 ? 0xffd166 : 0x5ad06b);
  }

  /** Re-read level (stars) after a merge. */
  public refreshLevel(): void {
    this.starText.setText('★'.repeat(this.unit.starRank));
    const key = SpriteForge.ensureLevel(this.scene, this.baseKey, this.unit.starRank);
    if (key !== this.spriteKey) {
      this.spriteKey = key;
      this.sprite.setTexture(key);
      if (this.animated) playLoop(this.sprite, key, 'idle');
    }
    this.applyLayout();
  }

  public revertPosition(): void {
    this.setPosition(this.originalX, this.originalY);
  }
}
