import Phaser from 'phaser';
import { CORES_DATA } from '@data/cores';
import { t } from '@data/i18n';
import { SoundManager } from '../audio/SoundManager';

export class CoreDraftModal extends Phaser.GameObjects.Container {
  private panel: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private cardsContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    // Dim background overlay
    const overlay = scene.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.75);
    overlay.setInteractive();
    this.add(overlay);

    // Modal panel
    this.panel = scene.add.rectangle(0, 0, 1100, 520, 0x191410);
    this.panel.setStrokeStyle(3, 0xffd166, 0.9);
    this.add(this.panel);

    this.titleText = scene.add.text(0, -210, '⚙️ ВЫБОР ЯДРА ДВИГАТЕЛЯ (МОДИФИКАЦИЯ СЛОТ-МАШИНЫ) ⚙️', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.titleText);

    const subText = scene.add.text(0, -170, 'Ядра навсегда меняют правила барабанов и кузницы на весь текущий ран', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#adb5bd'
    }).setOrigin(0.5);
    this.add(subText);

    this.cardsContainer = scene.add.container(0, 20);
    this.add(this.cardsContainer);

    this.setVisible(false);
    this.setDepth(900);
    scene.add.existing(this);
  }

  public showDraft(coreIds: string[]): void {
    this.cardsContainer.removeAll(true);
    SoundManager.getInstance().playReelStop(1);

    const cardWidth = 310;
    const spacing = 340;
    const startX = -((coreIds.length - 1) * spacing) / 2;

    coreIds.forEach((coreId, index) => {
      const core = CORES_DATA[coreId];
      if (!core) return;

      const cardX = startX + index * spacing;
      const cardY = 0;

      const cardBg = this.scene.add.rectangle(cardX, cardY, cardWidth, 320, 0x241b14);
      cardBg.setStrokeStyle(2, 0xd4a373);
      this.cardsContainer.add(cardBg);

      // Core title
      const name = t(core.nameKey);
      const nameTxt = this.scene.add.text(cardX, cardY - 120, name, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffd166',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 280 }
      }).setOrigin(0.5);
      this.cardsContainer.add(nameTxt);

      // Tags badge
      const tagsStr = core.tags.map((tg) => `[${tg.toUpperCase()}]`).join(' ');
      const tagsTxt = this.scene.add.text(cardX, cardY - 70, tagsStr, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#00b4d8'
      }).setOrigin(0.5);
      this.cardsContainer.add(tagsTxt);

      // Description
      const desc = t(core.descKey);
      const descTxt = this.scene.add.text(cardX, cardY - 10, desc, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#e9ecef',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 270 }
      }).setOrigin(0.5);
      this.cardsContainer.add(descTxt);

      // Choose button
      const chooseBtn = this.scene.add.rectangle(cardX, cardY + 115, 240, 44, 0x2a9d8f);
      chooseBtn.setStrokeStyle(2, 0xffd166);
      chooseBtn.setInteractive({ useHandCursor: true });
      this.cardsContainer.add(chooseBtn);

      const btnTxt = this.scene.add.text(cardX, cardY + 115, 'УСТАНОВИТЬ ЯДРО ▶', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.cardsContainer.add(btnTxt);

      chooseBtn.on('pointerover', () => chooseBtn.setFillStyle(0x38b000));
      chooseBtn.on('pointerout', () => chooseBtn.setFillStyle(0x2a9d8f));
      chooseBtn.on('pointerdown', () => {
        SoundManager.getInstance().playPaylineWin(1);
        this.emit('core_selected', coreId);
        this.setVisible(false);
      });
    });

    this.setVisible(true);
  }
}

