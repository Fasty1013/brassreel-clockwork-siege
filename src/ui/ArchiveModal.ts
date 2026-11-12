import Phaser from 'phaser';
import { MetaManager } from '@core/meta/metaManager';
import { META_UPGRADES } from '@core/meta/metaUpgrades';
import { SoundManager } from '../audio/SoundManager';
import { backdrop, button, card, panel, pips, text, title, UI } from './ModalKit';

/** Forge Archive — permanent meta upgrades bought with refined cogs. */
export class ArchiveModal extends Phaser.GameObjects.Container {
  private cogsText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private cardContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    backdrop(this, 0.86);
    panel(this, 1300, 860);
    title(this, -380, 'АРХИВ КУЗНИЦЫ', 'Постоянные улучшения для всех будущих забегов');

    const bal = scene.add.rectangle(0, -282, 420, 50, 0x15121b);
    bal.setStrokeStyle(2, 0x534764);
    this.add(bal);
    this.add(scene.add.image(-170, -282, 'sym_cog').setScale(1.5));
    this.cogsText = text(this, -140, -282, '', 24, UI.CREAM, { origin: [0, 0.5] });
    this.statsText = text(this, 0, -238, '', 19, UI.MUTED);

    button(this, 0, 370, 320, 66, 'ЗАКРЫТЬ', () => {
      SoundManager.getInstance().playButtonClick();
      this.hide();
    }, { kind: 'plain', size: 26 });

    this.setDepth(1100);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public open(): void {
    this.refresh();
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }

  public refresh(): void {
    const meta = MetaManager.load();
    this.cogsText.setText(`Очищенные шестерни:  ${meta.refinedCogs}`);
    this.statsText.setText(
      `Забегов: ${meta.totalRuns}   ·   Побед: ${meta.totalVictories}   ·   Рекорд: волна ${meta.highestWaveReached} / 30`
    );

    for (const c of this.cardContainers) c.destroy();
    this.cardContainers = [];

    const upgrades = Object.values(META_UPGRADES);
    const colSpacing = 306;
    const rowSpacing = 250;
    const startX = -1.5 * colSpacing;
    const startY = -80;

    upgrades.forEach((u, i) => {
      const x = startX + (i % 4) * colSpacing;
      const y = startY + Math.floor(i / 4) * rowSpacing;
      const c = this.scene.add.container(x, y);
      this.add(c);
      this.cardContainers.push(c);

      const rank = MetaManager.getUpgradeRank(meta, u.id);
      const isMax = rank >= u.maxRank;
      const nextCost = isMax ? 0 : u.costPerRank[rank];
      const canAfford = !isMax && meta.refinedCogs >= nextCost;

      card(c, 0, 0, 290, 232, canAfford);
      text(c, 0, -88, u.name, 21, UI.GOLD, { fontStyle: 'bold', align: 'center', wordWrap: { width: 266 } });
      pips(c, 0, -56, rank, u.maxRank, isMax ? 0x5ae0d0 : 0xffd166);
      text(c, 0, 0, u.description, 17, UI.CREAM, { align: 'center', wordWrap: { width: 262 }, lineSpacing: 3 });

      const label = isMax ? 'МАКСИМУМ' : `УЛУЧШИТЬ  ${nextCost}`;
      const btn = button(c, 0, 82, 230, 50, label, () => {
        if (MetaManager.buyUpgrade(meta, u.id)) {
          SoundManager.getInstance().playSmelt();
          this.refresh();
        }
      }, { size: 20, disabled: !canAfford, color: isMax ? UI.TEAL : undefined });
      if (!isMax) {
        const icon = this.scene.add.image(btn.label.x + btn.label.width / 2 + 16, 82, 'sym_cog').setAlpha(canAfford ? 1 : 0.5);
        c.add(icon);
        btn.label.x -= 12;
        icon.x -= 12;
      }
    });
  }
}
