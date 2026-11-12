import Phaser from 'phaser';
import { UnitInstance } from '@core/units/unitFactory';
import { t } from '@data/i18n';
import { QUIRKS_DATA } from '@data/quirks';
import { BALANCE } from '@data/balance';
import { UI } from './ModalKit';

const W = 400;
const PAD = 18;
const INNER = W - PAD * 2;

const FACTION_RU: Record<string, string> = {
  cog: 'Шестерни', spring: 'Пружины', fuse: 'Запалы', coil: 'Катушки', scrap: 'Утиль', legendary: 'Легенда'
};

/**
 * Robot info card shown on hover: name + level, faction line, stats grid,
 * trait and rolled modules. Height adapts to the content.
 */
export class Tooltip extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private content: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.bg = scene.add.rectangle(0, 0, W, 240, 0x1d1824, 0.97);
    this.bg.setStrokeStyle(2, 0xd4a373);
    this.bg.setOrigin(0, 0);
    this.add(this.bg);

    this.content = scene.add.container(PAD, PAD);
    this.add(this.content);

    this.setDepth(1000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  private line(y: number, str: string, size: number, color: string, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): number {
    const txt = this.scene.add.text(0, y, str, { fontSize: `${size}px`, color, wordWrap: { width: INNER }, lineSpacing: 3, ...opts });
    this.content.add(txt);
    return y + txt.height;
  }

  public showUnit(unit: UnitInstance, screenX: number, screenY: number): void {
    this.content.removeAll(true);
    const s = this.scene;

    // header: name + level stars
    const name = t(`unit.${unit.defId.replace('unit_', '')}.name`);
    let y = this.line(0, name, 26, UI.GOLD, { fontStyle: 'bold' });
    const stars = s.add.text(INNER, 4, '★'.repeat(unit.starRank), { fontSize: '20px', color: UI.GOLD }).setOrigin(1, 0);
    this.content.add(stars);
    y = this.line(y + 2, `${FACTION_RU[unit.faction] ?? unit.faction} · уровень ${unit.starRank} из ${BALANCE.MAX_UNIT_LEVEL}`, 17, UI.MUTED);

    // stats grid 3×2
    y += 12;
    const stats: Array<[string, string]> = [
      ['ЗДОРОВЬЕ', `${unit.currentHp}/${unit.maxHp}`],
      ['УРОН', `${unit.damage}`],
      ['БРОНЯ', `${unit.armor}`],
      ['СКОРОСТЬ', `${unit.attackSpeed}/с`],
      ['ДАЛЬНОСТЬ', `${unit.attackRange}`],
      ['МОДУЛИ', `${unit.mods.length}`]
    ];
    const cellW = INNER / 3;
    stats.forEach(([label, value], i) => {
      const cx = (i % 3) * cellW;
      const cy = y + Math.floor(i / 3) * 52;
      const box = s.add.rectangle(cx + cellW / 2, cy + 23, cellW - 8, 46, 0x15121b);
      this.content.add(box);
      this.content.add(s.add.text(cx + cellW / 2, cy + 12, label, { fontSize: '15px', color: UI.MUTED }).setOrigin(0.5));
      this.content.add(s.add.text(cx + cellW / 2, cy + 32, value, { fontSize: '20px', color: UI.CREAM }).setOrigin(0.5));
    });
    y += 106;

    // trait
    const quirkDef = QUIRKS_DATA[unit.quirkId];
    if (quirkDef) {
      y = this.line(y + 6, t(quirkDef.nameKey), 20, UI.TEAL);
      y = this.line(y + 2, t(quirkDef.descKey), 17, UI.CREAM);
    }

    // modules
    if (unit.mods.length > 0) {
      y += 10;
      this.content.add(s.add.rectangle(INNER / 2, y, INNER, 2, 0x534764));
      y += 8;
      for (const mod of unit.mods) {
        const color = mod.rarity === 'epic' ? UI.GOLD : mod.rarity === 'rare' ? UI.TEAL : '#c9c3d6';
        y = this.line(y + 4, `• ${t(mod.nameKey)}: ${t(mod.descKey)}`, 16, color);
      }
    }

    if (unit.starRank < BALANCE.MAX_UNIT_LEVEL) {
      y = this.line(y + 10, `Слияние с таким же роботом ${unit.starRank}★ → ${unit.starRank + 1}★`, 16, UI.GREEN);
    }

    const totalHeight = y + PAD * 2;
    this.bg.setSize(W, totalHeight);

    // keep on-screen
    const clampedX = Math.min(this.scene.scale.width - W - 10, Math.max(10, screenX + 20));
    const clampedY = Math.min(this.scene.scale.height - totalHeight - 10, Math.max(10, screenY - 60));
    this.setPosition(clampedX, clampedY);
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }
}
