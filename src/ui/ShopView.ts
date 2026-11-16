import Phaser from 'phaser';
import { GadgetDefinition } from '@data/schemas/gadgetSchema';
import { SlotSymbol } from '@core/reels/reels';
import { t } from '@data/i18n';
import { InfoTip } from './InfoTip';

/** Prices of the reel and reroll buttons, computed by the core (discounts included). */
export interface ShopPrices {
  symbol: number;
  gild: number;
  remove: number;
  reroll: number;
}

export interface ShopOffer {
  def: GadgetDefinition;
  price: number;
}

/** Everything the workshop shows; built by RunScene from the run state. */
export interface ShopModel {
  cogs: number;
  offers: ShopOffer[];
  prices: ShopPrices;
  /** names of the permanent gadgets already bought */
  owned: string[];
  /** consumables waiting for the next wave or battle, as short lines */
  pending: string[];
}

type PriceKey = keyof ShopPrices;

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
  private priced: Array<{
    key: PriceKey;
    cost: number;
    bg: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    tag: Phaser.GameObjects.Container;
    amount: Phaser.GameObjects.Text;
    icon: Phaser.GameObjects.Image;
  }> = [];
  private cogs = 0;
  private gadgetHint!: Phaser.GameObjects.Text;
  private ownedText!: Phaser.GameObjects.Text;
  private model: ShopModel | null = null;

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
    this.gadgetHint = this.sectionHeader(-250, 'ГАДЖЕТЫ', 'улучшения на весь забег и расходники');
    this.ownedText = scene.add.text(530, -250, '', { fontSize: '18px', color: MUTED, align: 'right' }).setOrigin(1, 0.5);
    this.add(this.ownedText);
    InfoTip.of(scene).attach(this.ownedText, 'Ваши гаджеты', () => {
      const m = this.model;
      if (!m) return '';
      const lines = m.owned.length > 0 ? [...m.owned] : ['Постоянных улучшений пока нет.'];
      if (m.pending.length > 0) lines.push('', 'Ждут своего часа:', ...m.pending);
      return lines.join('\n');
    });

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
      this.registerPrice('symbol', x - 44, y + 18, btn, label);
      this.hover(btn);
      btn.on('pointerdown', () => this.emit('buy_symbol', 1, s.sym));
    });

    // gild + remove
    const gild = this.actionButton(-245, 214, 470, 70, 'Позолотить символ', GOLD, 'gild', 0xd4a373, 'sym_crown_gilded');
    gild.on('pointerdown', () => this.emit('gild_symbol', 1, 0));
    const remove = this.actionButton(245, 214, 470, 70, 'Убрать символ', '#ff8a7a', 'remove', 0xd90429, null);
    remove.on('pointerdown', () => this.emit('remove_symbol', 1, 0));

    // footer
    this.rerollButton = this.actionButton(-205, 330, 330, 66, 'Обновить товары', CREAM, 'reroll', 0x6c757d, null);
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
  private sectionHeader(y: number, title: string, hint: string): Phaser.GameObjects.Text {
    const s = this.scene;
    const head = s.add.text(-530, y, title, { fontSize: '26px', color: GOLD }).setOrigin(0, 0.5);
    this.add(head);
    const hintText = s.add.text(-530 + head.width + 22, y + 2, hint, { fontSize: '18px', color: MUTED }).setOrigin(0, 0.5);
    this.add(hintText);
    this.add(s.add.rectangle(0, y + 26, 1060, 2, 0x534764));
    return hintText;
  }

  /** "15" + cog icon on a button; the number is filled in by showShop. */
  private registerPrice(key: PriceKey, x: number, y: number, bg: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text): void {
    const s = this.scene;
    const tag = s.add.container(x, y);
    const amount = s.add.text(0, 0, '0', { fontSize: '22px', color: CREAM }).setOrigin(0, 0.5);
    const icon = s.add.image(amount.width + 16, 0, 'sym_cog').setScale(1);
    tag.add([amount, icon]);
    this.add(tag);
    this.priced.push({ key, cost: 0, bg, label, tag, amount, icon });
  }

  private actionButton(
    x: number, y: number, w: number, h: number, text: string, color: string,
    priceKey: PriceKey, stroke: number, iconKey: string | null
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
    this.registerPrice(priceKey, x + w / 2 - 92, y, btn, label);
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
  public showShop(model: ShopModel): void {
    const { cogs, offers } = model;
    this.cogs = cogs;
    this.cogsText.setText(`${cogs}`);

    for (const p of this.priced) {
      p.cost = model.prices[p.key];
      p.amount.setText(`${p.cost}`);
      p.icon.x = p.amount.width + 16;
    }

    this.model = model;
    const parts = [];
    if (model.owned.length > 0) parts.push(`куплено: ${model.owned.length}`);
    if (model.pending.length > 0) parts.push(`в запасе: ${model.pending.length}`);
    this.ownedText.setText(parts.join(' · '));
    this.gadgetHint.setText(offers.length > 0 ? 'улучшения на весь забег и расходники' : 'витрина пуста — обновите товары');

    for (const card of this.gadgetCards) card.destroy();
    this.gadgetCards = [];

    for (let i = 0; i < Math.min(3, offers.length); i++) {
      const g = offers[i].def;
      const cost = offers[i].price;
      const card = this.scene.add.container(-360 + i * 360, -110);
      this.add(card);
      this.gadgetCards.push(card);

      const bg = this.scene.add.rectangle(0, 0, 340, 210, 0x231d2c);
      bg.setStrokeStyle(2, g.type === 'passive' ? 0x8c5836 : 0x2e7d74);
      card.add(bg);

      card.add(this.scene.add.text(0, -88, t(g.nameKey), {
        fontSize: '24px', color: GOLD, align: 'center', wordWrap: { width: 310 }
      }).setOrigin(0.5));
      card.add(this.scene.add.text(0, -60, g.type === 'passive' ? 'улучшение' : 'расходник', {
        fontSize: '16px', color: g.type === 'passive' ? '#d4a373' : '#5ae0d0'
      }).setOrigin(0.5));

      card.add(this.scene.add.text(0, -8, t(g.descKey), {
        fontSize: '18px', color: CREAM, align: 'center', wordWrap: { width: 310 }, lineSpacing: 3
      }).setOrigin(0.5));

      const afford = cogs >= cost;
      const buyBtn = this.scene.add.rectangle(0, 70, 220, 48, 0x1f1a27);
      buyBtn.setStrokeStyle(2, afford ? 0xffd166 : 0x534764);
      buyBtn.setInteractive({ useHandCursor: true });
      card.add(buyBtn);
      const buyTxt = this.scene.add.text(-70, 70, 'КУПИТЬ', { fontSize: '22px', color: afford ? GOLD : MUTED }).setOrigin(0, 0.5);
      card.add(buyTxt);
      const price = this.scene.add.text(30, 70, `${cost}`, { fontSize: '22px', color: afford ? CREAM : MUTED }).setOrigin(0, 0.5);
      card.add(price);
      card.add(this.scene.add.image(30 + price.width + 16, 70, 'sym_cog').setAlpha(afford ? 1 : 0.45));
      buyBtn.on('pointerover', () => buyBtn.setScale(1.04));
      buyBtn.on('pointerout', () => buyBtn.setScale(1));
      buyBtn.on('pointerdown', () => this.emit('buy_gadget', g.id));
    }

    this.refreshAffordability();
    this.setVisible(true);
  }

  public hideShop(): void {
    this.setVisible(false);
  }
}
