import Phaser from 'phaser';
import { UNITS_DATA } from '@data/units';
import { QUIRKS_DATA } from '@data/quirks';
import { t } from '@data/i18n';

export class EvolutionModal extends Phaser.GameObjects.Container {
  private cardA: Phaser.GameObjects.Container;
  private cardB: Phaser.GameObjects.Container;
  private currentUnitId: string | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    // Dark blocking backdrop
    const backdrop = scene.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.8);
    backdrop.setInteractive();
    this.add(backdrop);

    // Modal housing panel
    const panel = scene.add.rectangle(0, 0, 840, 520, 0x1f1610);
    panel.setStrokeStyle(4, 0xffd166);
    this.add(panel);

    const title = scene.add.text(0, -210, '★ ЭВОЛЮЦИЯ АВТОМАТОНА ★', {
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(title);

    const subtitle = scene.add.text(0, -170, 'Накоплен опыт сплава! Выберите направление перековки:', {
      fontSize: '15px',
      color: '#adb5bd'
    }).setOrigin(0.5);
    this.add(subtitle);

    this.cardA = scene.add.container(-200, 20);
    this.cardB = scene.add.container(200, 20);
    this.add(this.cardA);
    this.add(this.cardB);

    this.setDepth(900);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public showEvolution(unitId: string, branchADefId: string, branchBDefId: string): void {
    this.currentUnitId = unitId;

    this.renderBranchCard(this.cardA, branchADefId);
    this.renderBranchCard(this.cardB, branchBDefId);

    this.setVisible(true);
  }

  private renderBranchCard(container: Phaser.GameObjects.Container, defId: string): void {
    container.removeAll(true);
    const def = UNITS_DATA[defId];
    if (!def) return;

    // Card BG
    const bg = this.scene.add.rectangle(0, 0, 340, 320, 0x2b221a);
    bg.setStrokeStyle(2, 0xd4a373);
    container.add(bg);

    // Sprite
    const sprite = this.scene.add.sprite(0, -90, def.spriteKey);
    sprite.setDisplaySize(64, 64);
    container.add(sprite);

    // Title
    const name = t(def.nameKey);
    const titleText = this.scene.add.text(0, -40, name, {
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(titleText);

    // Stats summary
    const statsText = this.scene.add.text(0, -10, `HP: ${def.baseHp}  |  УРОН: ${def.baseDamage}  |  БРОНЯ: ${def.armor ?? 0}`, {
      fontSize: '13px',
      color: '#e9ecef',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(statsText);

    // Quirk
    const quirk = QUIRKS_DATA[def.quirkId];
    const quirkName = quirk ? t(quirk.nameKey) : def.quirkId;
    const quirkDesc = quirk ? t(quirk.descKey) : '';

    const quirkHeader = this.scene.add.text(0, 25, `Черта: ${quirkName}`, {
      fontSize: '12px',
      color: '#2ec4b6',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(quirkHeader);

    const quirkBody = this.scene.add.text(0, 55, quirkDesc, {
      fontSize: '11px',
      color: '#ced4da',
      wordWrap: { width: 300 },
      align: 'center'
    }).setOrigin(0.5);
    container.add(quirkBody);

    // Select Button
    const btn = this.scene.add.rectangle(0, 115, 200, 42, 0xd4a373);
    btn.setStrokeStyle(2, 0xffd166);
    btn.setInteractive({ useHandCursor: true });
    container.add(btn);

    const btnText = this.scene.add.text(0, 115, 'ВЫБРАТЬ ФОРМУ', {
      fontSize: '14px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(btnText);

    btn.on('pointerdown', () => {
      if (this.currentUnitId) {
        this.emit('evolution_selected', {
          unitId: this.currentUnitId,
          chosenBranchDefId: defId
        });
        this.hide();
      }
    });

    btn.on('pointerover', () => {
      btn.setFillStyle(0xffd166);
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(0xd4a373);
    });
  }

  public hide(): void {
    this.currentUnitId = null;
    this.setVisible(false);
  }
}
