import Phaser from 'phaser';
import { GadgetDefinition } from '@data/schemas/gadgetSchema';
import { SlotSymbol } from '@core/reels/reels';
import { t } from '@data/i18n';

export class ShopView extends Phaser.GameObjects.Container {
  private gadgetCards: Phaser.GameObjects.Container[] = [];
  private cogsText: Phaser.GameObjects.Text;
  private rerollButton: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    // Modal background overlay
    const overlay = scene.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.75);
    overlay.setInteractive(); // Blocks clicks underneath
    this.add(overlay);

    // Workshop panel
    const panel = scene.add.rectangle(0, 0, 960, 680, 0x1f1610);
    panel.setStrokeStyle(4, 0xd4a373);
    this.add(panel);

    const title = scene.add.text(0, -300, '★ МАСТЕРСКАЯ ГОРНА ★', {
      fontSize: '26px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(title);

    this.cogsText = scene.add.text(0, -260, 'Доступно Шестерней: 0', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.add(this.cogsText);

    // Section 1: Gadget Shelf
    const gadgetHeader = scene.add.text(-420, -220, 'ГАДЖЕТЫ И ПРЕДМЕТЫ:', {
      fontSize: '16px',
      color: '#ffd166',
      fontStyle: 'bold'
    });
    this.add(gadgetHeader);

    // Section 2: Reel Deck Modification
    const reelHeader = scene.add.text(-420, 60, 'МОДИФИКАЦИЯ БАРАБАНОВ:', {
      fontSize: '16px',
      color: '#ffd166',
      fontStyle: 'bold'
    });
    this.add(reelHeader);

    // Add Symbol Buttons for 4 factions
    const symTypes: SlotSymbol[] = ['cog', 'spring', 'fuse', 'coil'];
    for (let i = 0; i < 4; i++) {
      const sym = symTypes[i];
      const x = -350 + i * 180;
      const btn = scene.add.rectangle(x, 120, 160, 48, 0x3d2b1f);
      btn.setStrokeStyle(2, 0xd4a373);
      btn.setInteractive({ useHandCursor: true });
      this.add(btn);

      const btnText = scene.add.text(x, 120, `+ ${sym.toUpperCase()}\n(15 Шест.)`, {
        fontSize: '12px',
        color: '#ffd166',
        align: 'center'
      }).setOrigin(0.5);
      this.add(btnText);

      btn.on('pointerdown', () => {
        this.emit('buy_symbol', 1, sym); // Adds to central reel
      });
    }

    // Gild Symbol Button
    const gildBtn = scene.add.rectangle(-200, 200, 220, 48, 0x3d2b1f);
    gildBtn.setStrokeStyle(2, 0xffd166);
    gildBtn.setInteractive({ useHandCursor: true });
    this.add(gildBtn);

    const gildText = scene.add.text(-200, 200, 'ЗОЛОЧЕНИЕ СИМВОЛА\n(25 Шест.)', {
      fontSize: '12px',
      color: '#ffd166',
      align: 'center'
    }).setOrigin(0.5);
    this.add(gildText);

    gildBtn.on('pointerdown', () => {
      this.emit('gild_symbol', 1, 0);
    });

    // Remove Symbol (Thinning) Button
    const removeBtn = scene.add.rectangle(200, 200, 220, 48, 0x3d2b1f);
    removeBtn.setStrokeStyle(2, 0xd90429);
    removeBtn.setInteractive({ useHandCursor: true });
    this.add(removeBtn);

    const removeText = scene.add.text(200, 200, 'УДАЛЕНИЕ СИМВОЛА\n(20+ Шест.)', {
      fontSize: '12px',
      color: '#e63946',
      align: 'center'
    }).setOrigin(0.5);
    this.add(removeText);

    removeBtn.on('pointerdown', () => {
      this.emit('remove_symbol', 1, 0);
    });

    // Reroll Button
    this.rerollButton = scene.add.rectangle(-150, 280, 200, 48, 0x2b2d42);
    this.rerollButton.setStrokeStyle(2, 0x6c757d);
    this.rerollButton.setInteractive({ useHandCursor: true });
    this.add(this.rerollButton);

    const rerollText = scene.add.text(-150, 280, 'ОБНОВИТЬ (5 Шест.)', {
      fontSize: '14px',
      color: '#adb5bd',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(rerollText);

    this.rerollButton.on('pointerdown', () => {
      this.emit('reroll_shop');
    });

    // Close / Next Wave Button
    const closeBtn = scene.add.rectangle(150, 280, 200, 48, 0x2a9d8f);
    closeBtn.setStrokeStyle(2, 0xf4a261);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add(closeBtn);

    const closeText = scene.add.text(150, 280, 'СЛЕДУЮЩАЯ ВОЛНА ▶', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(closeText);

    closeBtn.on('pointerdown', () => {
      this.emit('close_shop');
    });

    this.setDepth(800);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public showShop(cogs: number, gadgets: GadgetDefinition[]): void {
    this.cogsText.setText(`Доступно Шестерней: ${cogs}`);

    // Render 3 Gadgets
    for (const card of this.gadgetCards) {
      card.destroy();
    }
    this.gadgetCards = [];

    for (let i = 0; i < Math.min(3, gadgets.length); i++) {
      const g = gadgets[i];
      const cardX = -300 + i * 300;
      const cardContainer = this.scene.add.container(cardX, -130);
      this.add(cardContainer);
      this.gadgetCards.push(cardContainer);

      const cardBg = this.scene.add.rectangle(0, 0, 260, 140, 0x2b221a);
      cardBg.setStrokeStyle(2, 0x8c5836);
      cardContainer.add(cardBg);

      const gName = t(g.nameKey);
      const gDesc = t(g.descKey);

      const title = this.scene.add.text(0, -45, gName, {
        fontSize: '14px',
        color: '#ffd166',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      cardContainer.add(title);

      const desc = this.scene.add.text(0, -10, gDesc, {
        fontSize: '11px',
        color: '#f4f1de',
        wordWrap: { width: 240 },
        align: 'center'
      }).setOrigin(0.5);
      cardContainer.add(desc);

      const buyBtn = this.scene.add.rectangle(0, 42, 140, 30, 0xd4a373);
      buyBtn.setInteractive({ useHandCursor: true });
      cardContainer.add(buyBtn);

      const buyTxt = this.scene.add.text(0, 42, `Купить (${g.cost})`, {
        fontSize: '12px',
        color: '#1f1610',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      cardContainer.add(buyTxt);

      buyBtn.on('pointerdown', () => {
        this.emit('buy_gadget', g.id, g.cost);
      });
    }

    this.setVisible(true);
  }

  public hideShop(): void {
    this.setVisible(false);
  }
}

