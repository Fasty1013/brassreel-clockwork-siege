import Phaser from 'phaser';
import { UNITS_DATA } from '@data/units';
import { QUIRKS_DATA } from '@data/quirks';
import { t } from '@data/i18n';
import { SpriteForge } from '../art/forge/SpriteForge';
import { backdrop, button, card, panel, text, title, UI } from './ModalKit';

/**
 * Evolution choice (level 3 and 5): pick one of two new classes.
 * Each card shows the animated robot, its class stats, its trait and the
 * "+1 module" bonus every evolution grants.
 */
export class EvolutionModal extends Phaser.GameObjects.Container {
  private cardA: Phaser.GameObjects.Container;
  private cardB: Phaser.GameObjects.Container;
  private currentUnitId: string | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    backdrop(this, 0.82);
    panel(this, 1000, 760);
    title(this, -330, 'ЭВОЛЮЦИЯ РОБОТА', 'Выберите новый класс — он сильнее и получает +1 модуль');

    this.cardA = scene.add.container(-240, 50);
    this.cardB = scene.add.container(240, 50);
    this.add(this.cardA);
    this.add(this.cardB);

    this.setDepth(900);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public showEvolution(unitId: string, branchADefId: string, branchBDefId: string, level?: number): void {
    this.currentUnitId = unitId;
    this.renderBranchCard(this.cardA, branchADefId, level);
    this.renderBranchCard(this.cardB, branchBDefId, level);
    this.setVisible(true);
  }

  private renderBranchCard(c: Phaser.GameObjects.Container, defId: string, level?: number): void {
    c.removeAll(true);
    const def = UNITS_DATA[defId];
    if (!def) return;
    const scene = this.scene;

    card(c, 0, 0, 440, 580, true);

    // animated robot on a little plinth
    c.add(scene.add.ellipse(0, -112, 180, 26, 0x0b0910, 0.5));
    const key = level ? SpriteForge.ensureLevel(scene, def.spriteKey, level) : def.spriteKey;
    const size = SpriteForge.get(def.spriteKey)?.size ?? 32;
    const scale = size >= 48 ? 4 : 5;
    const sprite = scene.add.sprite(0, -108, key).setOrigin(0.5, 1).setScale(scale);
    if (scene.anims.exists(`${key}_idle`)) sprite.play(`${key}_idle`);
    c.add(sprite);

    text(c, 0, -74, t(def.nameKey), 30, UI.GOLD, { fontStyle: 'bold' });

    // stats as three labelled boxes
    const stats: Array<[string, string]> = [
      ['ЗДОРОВЬЕ', `${def.baseHp}`],
      ['УРОН', `${def.baseDamage}`],
      ['БРОНЯ', `${def.armor ?? 0}`]
    ];
    stats.forEach(([label, value], i) => {
      const x = -130 + i * 130;
      const box = scene.add.rectangle(x, -12, 118, 66, 0x15121b);
      box.setStrokeStyle(2, 0x534764);
      c.add(box);
      text(c, x, -28, label, 15, UI.MUTED);
      text(c, x, 2, value, 26, UI.CREAM);
    });

    const quirk = QUIRKS_DATA[def.quirkId];
    const quirkName = quirk ? t(quirk.nameKey) : def.quirkId;
    const quirkDesc = quirk ? t(quirk.descKey) : '';
    text(c, 0, 50, quirkName, 22, UI.TEAL);
    text(c, 0, 100, quirkDesc, 18, UI.CREAM, { align: 'center', wordWrap: { width: 390 }, lineSpacing: 4 });
    text(c, 0, 168, '+1 новый модуль', 20, UI.GREEN);

    button(c, 0, 234, 300, 64, 'ВЫБРАТЬ', () => {
      if (!this.currentUnitId) return;
      this.emit('evolution_selected', { unitId: this.currentUnitId, chosenBranchDefId: defId });
      this.hide();
    }, { size: 28 });
  }

  public hide(): void {
    this.currentUnitId = null;
    this.setVisible(false);
  }
}
