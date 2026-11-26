import Phaser from 'phaser';
import { UNITS_DATA } from '@data/units';
import { QUIRKS_DATA } from '@data/quirks';
import { t } from '@data/i18n';
import { SpriteForge } from '../art/forge/SpriteForge';
import { backdrop, button, card, panel, text, title, UI } from './ModalKit';
import { fitBox } from './TextStyles';

/**
 * Jackpot (three crowns): pick one of three legendary robots. The first one is already in
 * the reserve; picking another swaps it (CHOOSE_JACKPOT). Each card shows the animated robot,
 * its stats and its trait, like the evolution window.
 */
export class JackpotModal extends Phaser.GameObjects.Container {
  private cards: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);
    backdrop(this, 0.84);
    panel(this, 1380, 800);
    title(this, -350, 'ДЖЕКПОТ!', 'Три короны: выберите легендарного робота — он придёт в резерв на уровне 3');
    for (let i = 0; i < 3; i++) {
      const c = scene.add.container(-450 + i * 450, 60);
      this.add(c);
      this.cards.push(c);
    }
    this.setDepth(10350);
    this.setVisible(false);
    scene.add.existing(this);
  }

  /** `current`: the legendary already summoned (marked on its card). */
  public showChoices(choices: string[], current: string): void {
    choices.slice(0, 3).forEach((defId, i) => this.renderCard(this.cards[i], defId, defId === current));
    this.setVisible(true);
  }

  private renderCard(c: Phaser.GameObjects.Container, defId: string, isCurrent: boolean): void {
    c.removeAll(true);
    const def = UNITS_DATA[defId];
    if (!def) return;
    const scene = this.scene;
    card(c, 0, 0, 420, 600, true);

    c.add(scene.add.ellipse(0, -128, 180, 26, 0x0b0910, 0.5));
    const size = SpriteForge.get(def.spriteKey)?.size ?? 32;
    const sprite = scene.add.sprite(0, -124, def.spriteKey).setOrigin(0.5, 1).setScale(size >= 48 ? 3.5 : 5);
    if (scene.anims.exists(`${def.spriteKey}_idle`)) sprite.play(`${def.spriteKey}_idle`);
    c.add(sprite);

    fitBox(text(c, 0, -92, t(def.nameKey), 28, UI.GOLD, { fontStyle: 'bold' }), 400, 40);
    const stats: Array<[string, string]> = [
      ['ЗДОРОВЬЕ', `${def.baseHp}`],
      ['УРОН', `${def.baseDamage}`],
      ['БРОНЯ', `${def.armor ?? 0}`]
    ];
    stats.forEach(([label, value], i) => {
      const x = -128 + i * 128;
      const box = scene.add.rectangle(x, -28, 116, 66, 0x15121b);
      box.setStrokeStyle(2, 0x534764);
      c.add(box);
      fitBox(text(c, x, -44, label, 15, UI.MUTED), 108);
      text(c, x, -14, value, 26, UI.CREAM);
    });

    const quirk = QUIRKS_DATA[def.quirkId];
    fitBox(text(c, 0, 30, quirk ? t(quirk.nameKey) : '', 22, UI.TEAL), 400, 34);
    fitBox(text(c, 0, 108, quirk ? t(quirk.descKey) : '', 18, UI.CREAM, {
      align: 'center', wordWrap: { width: 380 }, lineSpacing: 4
    }), 396, 120);
    if (isCurrent) text(c, 0, 186, 'уже в резерве', 18, UI.GREEN);

    button(c, 0, 248, 300, 64, isCurrent ? 'ОСТАВИТЬ' : 'ВЫБРАТЬ', () => {
      this.emit('jackpot_selected', defId);
      this.setVisible(false);
    }, { size: 28 });
  }
}
