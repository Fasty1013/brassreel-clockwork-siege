import Phaser from 'phaser';
import { UnitInstance } from '@core/units/unitFactory';
import { t } from '@data/i18n';
import { QUIRKS_DATA } from '@data/quirks';

export class Tooltip extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private quirkText: Phaser.GameObjects.Text;
  private modsContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.bg = scene.add.rectangle(0, 0, 260, 240, 0x141419, 0.95);
    this.bg.setStrokeStyle(2, 0xd4a373);
    this.bg.setOrigin(0, 0);
    this.add(this.bg);

    this.titleText = scene.add.text(12, 10, '', {
      fontSize: '16px',
      color: '#ffd166',
      fontStyle: 'bold'
    });
    this.add(this.titleText);

    this.statsText = scene.add.text(12, 36, '', {
      fontSize: '13px',
      color: '#ffffff',
      lineSpacing: 4
    });
    this.add(this.statsText);

    this.quirkText = scene.add.text(12, 110, '', {
      fontSize: '12px',
      color: '#00b4d8',
      wordWrap: { width: 236 }
    });
    this.add(this.quirkText);

    this.modsContainer = scene.add.container(12, 160);
    this.add(this.modsContainer);

    this.setDepth(1000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public showUnit(unit: UnitInstance, screenX: number, screenY: number): void {
    const unitName = t(`unit.${unit.defId.replace('unit_', '')}.name`);
    const starStr = '★'.repeat(unit.starRank);
    this.titleText.setText(`${unitName} ${starStr}`);

    this.statsText.setText(
      `HP: ${unit.currentHp}/${unit.maxHp}   УРОН: ${unit.damage}\n` +
      `СКОРОСТЬ: ${unit.attackSpeed}/с   ДИСТ: ${unit.attackRange}\n` +
      `БРОНЯ: ${unit.armor}   ОПЫТ: ${unit.smeltXp} XP`
    );

    const quirkDef = QUIRKS_DATA[unit.quirkId];
    if (quirkDef) {
      const qName = t(quirkDef.nameKey);
      const qDesc = t(quirkDef.descKey);
      this.quirkText.setText(`[Черта: ${qName}]\n${qDesc}`);
    } else {
      this.quirkText.setText('');
    }

    // Render Rolled Mods
    this.modsContainer.removeAll(true);
    let yOffset = 0;
    for (const mod of unit.mods) {
      const rarityColor = mod.rarity === 'epic' ? '#ffd166' : mod.rarity === 'rare' ? '#00b4d8' : '#adb5bd';
      const mName = t(mod.nameKey);
      const mDesc = t(mod.descKey);
      const modText = this.scene.add.text(0, yOffset, `• ${mName}: ${mDesc}`, {
        fontSize: '11px',
        color: rarityColor,
        wordWrap: { width: 236 }
      });
      this.modsContainer.add(modText);
      yOffset += modText.height + 4;
    }

    const totalHeight = Math.max(200, 160 + yOffset + 12);
    this.bg.setSize(260, totalHeight);

    // Keep on-screen
    const clampedX = Math.min(this.scene.scale.width - 270, Math.max(10, screenX + 15));
    const clampedY = Math.min(this.scene.scale.height - totalHeight - 10, Math.max(10, screenY - 50));
    this.setPosition(clampedX, clampedY);
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }
}

