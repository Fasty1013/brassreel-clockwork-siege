import Phaser from 'phaser';
import { GadgetDefinition } from '@data/schemas/gadgetSchema';
import { SlotSymbol } from '@core/reels/reels';
import { t } from '@data/i18n';

/** Shop prices (shown on the buttons; the reducer charges the real amounts). */
const PRICE = { symbol: 15, gild: 25, remove: 20, reroll: 5 };

const GOLD = '#ffd166';
const CREAM = '#f4ecd8';
const MUTED = '#9a93ad';

const SYMBOLS: Array<{ sym: SlotSymbol; name: string; color: string }> = [
  { sym: 'cog', name: 'Шестерня', color: '#e0a45c' },
  { sym: 'spring', name: 'Пружина', color: '#74c98d' },
  { sym: 'fuse', name: 'Запал', color: '#ee5a4a' },
  { sym: 'coil', name: 'Катушка', color: '#7ee6f5' }
];

/**
 * Forge Workshop — between-wave shop.
 * Layout: header with cog balance · 3 gadget cards · reel modification row ·
 * footer with reroll and "next wave". Every frame/button is a framed Rectangle,
 * which UISkin turns into a pixel 9-slice panel.
 */
export class ShopView extends Phaser.GameObjects.Container {
  private gadgetCards: Phaser.GameObjects.Container[] = [];
  private cogsText: Phaser.GameObjects.Text;
  private rerollButton: Phaser.GameObjects.Rectangle;
  private priced: Array<{ cost: number; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; tag: Phaser.GameObjects.Container }> = [];
  private cogs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    const overlay = scene.add.rectangle(0, 0, 1920, 1080, 0x07050a, 0.8);
    overlay.setInteractive(); // blocks clicks underneath
    this.add(overlay);

    // main brass panel
    const panel = scene.add.rectangle(0, 0, 1140, 800, 0x1d1824);
    panel.setStrokeStyle(4, 0xd4a373);
    this.add(panel);

    // header
    this.add(scene.add.text(0, -350, 'МАСТЕРСКАЯ ГОРНА', {
      fontSize: '42px', color: GOLD, fontStyle: 'bold'
    }).setOrigin(0.5));

    const balanceBg = scene.add.rectangle(0, -296, 300, 46, 0x15121b);
    balanceBg.setStrokeStyle(2, 0x534764);
    this.add(balanceBg);
    this.add(scene.add.image(-100, -296, 'sym_cog').setScale(1.5));
    this.add(scene.add.text(-78, -296, 'Шестерни:', { fontSize: '22px', color: CREAM }).setOrigin(0, 0.5));
    this.cogsText = scene.add.text(118, -296, '0', { fontSize: '28px', color: GOLD }).setOrigin(1, 0.5);
    this.add(this.cogsText);

    // section: gadgets
    this.sectionHeader(-250, 'ГАДЖЕТЫ', 'постоянные бонусы на весь забег');

    // section: reels
    this.sectionHeader(30, 'БАРАБАНЫ', 'добавьте символ на центральный барабан');
    SYMBOLS.forEach((s, i) => {
      const x = -405 + i * 270;
      const y = 112;
      const btn = scene.add.rectangle(x, y, 250, 92, 0x1f1a27);
      btn.setStrokeStyle(2, 0xd4a373);
      btn.setInteractive({ useHandCursor: true });
      this.add(btn);
      this.add(scene.add.image(x - 82, y, `sym_${s.sym}`).setScale(2));
      const label = scene.add.text(x - 44, y - 16, `+ ${s.name}`, { fontSize: '22px', color: s.color }).setOrigin(0, 0.5);
      this.add(label);
      const tag = this.priceTag(x - 44, y + 18, PRICE.symbol, 'left');
      this.priced.push({ cost: PRICE.symbol, bg: btn, label, tag });
      this.hover(btn);
      btn.on('pointerdown', () => this.emit('buy_symbol', 1, s.sym));
    });

    // gild + remove
    const gild = this.actionButton(-245, 214, 470, 70, 'Позолотить символ', GOLD, PRICE.gild, 0xd4a373, 'sym_crown_gilded');
    gild.on('pointerdown', () => this.emit('gild_symbol', 1, 0));
    const remove = this.actionButton(245, 214, 470, 70, 'Убрать символ', '#ff8a7a', PRICE.remove, 0xd90429, null, '+');
    remove.on('pointerdown', () => this.emit('remove_symbol', 1, 0));

    // footer
    this.rerollButton = this.actionButton(-205, 330, 330, 66, 'Обновить товары', CREAM, PRICE.reroll, 0x6c757d, null);
    this.rerollButton.on('pointerdown', () => this.emit('reroll_shop'));

    const closeBtn = scene.add.rectangle(205, 330, 390, 74, 0x1f1a27);
    closeBtn.setStrokeStyle(3, 0xffd166);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add(closeBtn);
    this.add(scene.add.text(205, 330, 'СЛЕДУЮЩАЯ ВОЛНА  ▶', { fontSize: '28px', color: GOLD }).setOrigin(0.5));
    this.hover(closeBtn);
    closeBtn.on('pointerdown', () => this.emit('close_shop'));

    this.setDepth(800);
    this.setVisible(false);
    scene.add.existing(this);
  }

  // ---------------------------------------------------------------- helpers
  private sectionHeader(y: number, title: string, hint: string): void {
    const s = this.scene;
    const head = s.add.text(-530, y, title, { fontSize: '26px', color: GOLD }).setOrigin(0, 0.5);
    this.add(head);
    this.add(s.add.text(-530 + head.width + 22, y + 2, hint, { fontSize: '18px', color: MUTED }).setOrigin(0, 0.5));
    this.add(s.add.rectangle(0, y + 26, 1060, 2, 0x534764));
  }

  /** "15" + cog icon. */
  private priceTag(x: number, y: number, amount: number, align: 'left' | 'center', suffix = ''): Phaser.GameObjects.Container {
    const s = this.scene;
    const c = s.add.container(x, y);
    const txt = s.add.text(0, 0, `${amount}${suffix}`, { fontSize: '22px', color: CREAM }).setOrigin(0, 0.5);
    const icon = s.add.image(txt.width + 16, 0, 'sym_cog').setScale(1);
    c.add([txt, icon]);
    if (align === 'center') c.x -= (txt.width + 30) / 2;
    this.add(c);
    return c;
  }

  private actionButton(
    x: number, y: number, w: number, h: number, text: string, color: string,
    cost: number, stroke: number, iconKey: string | null, suffix = ''
  ): Phaser.GameObjects.Rectangle {
    const s = this.scene;
    const btn = s.add.rectangle(x, y, w, h, 0x1f1a27);
    btn.setStrokeStyle(2, stroke);
    btn.setInteractive({ useHandCursor: true });
    this.add(btn);
    let left = x - w / 2 + 26;
    if (iconKey && s.textures.exists(iconKey)) {
      this.add(s.add.image(left + 18, y, iconKey).setScale(1.5));
      left += 48;
    }
    const label = s.add.text(left, y, text, { fontSize: '22px', color }).setOrigin(0, 0.5);
    this.add(label);
    const tag = this.priceTag(x + w / 2 - 92, y, cost, 'left', suffix);
    this.priced.push({ cost, bg: btn, label, tag });
    this.hover(btn);
    return btn;
  }

  private hover(btn: Phaser.GameObjects.Rectangle): void {
    btn.on('pointerover', () => btn.setScale(1.03));
    btn.on('pointerout', () => btn.setScale(1));
  }

  /** Dim everything the player cannot afford. */
  private refreshAffordability(): void {
    for (const p of this.priced) {
      const ok = this.cogs >= p.cost;
      p.label.setAlpha(ok ? 1 : 0.45);
      p.tag.setAlpha(ok ? 1 : 0.45);
    }
  }

  // ---------------------------------------------------------------- API
  public showShop(cogs: number, gadgets: GadgetDefinition[]): void {
    this.cogs = cogs;
    this.cogsText.setText(`${cogs}`);

    for (const card of this.gadgetCards) card.destroy();
    this.gadgetCards = [];
    this.priced = this.priced.filter((p) => p.bg.active);

    for (let i = 0; i < Math.min(3, gadgets.length); i++) {
      const g = gadgets[i];
      const card = this.scene.add.container(-360 + i * 360, -110);
      this.add(card);
      this.gadgetCards.push(card);

      const bg = this.scene.add.rectangle(0, 0, 340, 210, 0x231d2c);
      bg.setStrokeStyle(2, 0x8c5836);
      card.add(bg);

      card.add(this.scene.add.text(0, -76, t(g.nameKey), {
        fontSize: '24px', color: GOLD, align: 'center', wordWrap: { width: 310 }
      }).setOrigin(0.5));

      card.add(this.scene.add.text(0, -14, t(g.descKey), {
        fontSize: '19px', color: CREAM, align: 'center', wordWrap: { width: 300 }, lineSpacing: 4
      }).setOrigin(0.5));

      const afford = cogs >= g.cost;
      const buyBtn = this.scene.add.rectangle(0, 70, 200, 48, 0x1f1a27);
      buyBtn.setStrokeStyle(2, afford ? 0xffd166 : 0x534764);
      buyBtn.setInteractive({ useHandCursor: true });
      card.add(buyBtn);
      const buyTxt = this.scene.add.text(-56, 70, 'КУПИТЬ', { fontSize: '22px', color: afford ? GOLD : MUTED }).setOrigin(0, 0.5);
      card.add(buyTxt);
      const price = this.scene.add.text(40, 70, `${g.cost}`, { fontSize: '22px', color: afford ? CREAM : MUTED }).setOrigin(0, 0.5);
      card.add(price);
      card.add(this.scene.add.image(40 + price.width + 16, 70, 'sym_cog').setAlpha(afford ? 1 : 0.45));
      buyBtn.on('pointerover', () => buyBtn.setScale(1.04));
      buyBtn.on('pointerout', () => buyBtn.setScale(1));
      buyBtn.on('pointerdown', () => this.emit('buy_gadget', g.id, g.cost));
    }

    this.refreshAffordability();
    this.setVisible(true);
  }

  public hideShop(): void {
    this.setVisible(false);
  }
}
