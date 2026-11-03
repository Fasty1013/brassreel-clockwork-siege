import Phaser from 'phaser';
import { MetaManager } from '@core/meta/metaManager';
import { META_UPGRADES } from '@core/meta/metaUpgrades';
import { SoundManager } from '../audio/SoundManager';

export class ArchiveModal extends Phaser.GameObjects.Container {
  private cogsText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private cardContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    // Dark blocking backdrop
    const backdrop = scene.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.85);
    backdrop.setInteractive();
    this.add(backdrop);

    // Main Archive Panel
    const panel = scene.add.rectangle(0, 0, 1200, 720, 0x1f1610);
    panel.setStrokeStyle(4, 0xd4a373);
    this.add(panel);

    const title = scene.add.text(0, -320, '★ АРХИВ КУЗНИЦЫ • ПОСТОЯННЫЕ УЛУЧШЕНИЯ ★', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(title);

    this.cogsText = scene.add.text(0, -280, 'Очищенные Шестерни: 0 ⚙️', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.cogsText);

    this.statsText = scene.add.text(0, -250, 'Всего забегов: 0  |  Побед: 0  |  Макс. волна: 0', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#adb5bd'
    }).setOrigin(0.5);
    this.add(this.statsText);

    // Close Button
    const closeBtn = scene.add.rectangle(0, 310, 240, 50, 0x2a9d8f);
    closeBtn.setStrokeStyle(2, 0xffd166);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add(closeBtn);

    const closeTxt = scene.add.text(0, 310, 'ЗАКРЫТЬ АРХИВ', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(closeTxt);

    closeBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.hide();
    });

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
    this.cogsText.setText(`Очищенные Шестерни: ${meta.refinedCogs} ⚙️`);
    this.statsText.setText(`Всего забегов: ${meta.totalRuns}  |  Побед: ${meta.totalVictories}  |  Рекордная волна: ${meta.highestWaveReached} / 30`);

    // Clear old upgrade cards
    for (const c of this.cardContainers) {
      c.destroy();
    }
    this.cardContainers = [];

    // Render 8 upgrades in 2 rows of 4
    const upgrades = Object.values(META_UPGRADES);
    const startX = -435;
    const startY = -140;
    const colSpacing = 290;
    const rowSpacing = 170;

    upgrades.forEach((u, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cardX = startX + col * colSpacing;
      const cardY = startY + row * rowSpacing;

      const card = this.scene.add.container(cardX, cardY);
      this.add(card);
      this.cardContainers.push(card);

      const rank = MetaManager.getUpgradeRank(meta, u.id);
      const isMax = rank >= u.maxRank;
      const nextCost = isMax ? 0 : u.costPerRank[rank];
      const canAfford = !isMax && meta.refinedCogs >= nextCost;

      const bg = this.scene.add.rectangle(0, 0, 270, 150, 0x2b221a);
      bg.setStrokeStyle(2, isMax ? 0x2ec4b6 : (canAfford ? 0xffd166 : 0x495057));
      card.add(bg);

      // Icon & Name
      const title = this.scene.add.text(-120, -55, `${u.icon} ${u.name}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffd166',
        fontStyle: 'bold'
      });
      card.add(title);

      // Rank
      const rankText = this.scene.add.text(120, -55, `[${rank}/${u.maxRank}]`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: isMax ? '#2ec4b6' : '#adb5bd'
      }).setOrigin(1, 0);
      card.add(rankText);

      // Description
      const desc = this.scene.add.text(0, -10, u.description, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#ced4da',
        wordWrap: { width: 250 },
        align: 'center'
      }).setOrigin(0.5);
      card.add(desc);

      // Buy Button
      const btnBg = this.scene.add.rectangle(0, 45, 180, 32, isMax ? 0x343a40 : (canAfford ? 0xd4a373 : 0x2b221a));
      btnBg.setStrokeStyle(1, isMax ? 0x6c757d : (canAfford ? 0xffd166 : 0x6c757d));
      if (!isMax) btnBg.setInteractive({ useHandCursor: canAfford });
      card.add(btnBg);

      const label = isMax ? 'МАКС. УРОВЕНЬ' : `Улучшить (${nextCost} ⚙️)`;
      const btnTxt = this.scene.add.text(0, 45, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: isMax ? '#6c757d' : (canAfford ? '#1f1610' : '#adb5bd'),
        fontStyle: 'bold'
      }).setOrigin(0.5);
      card.add(btnTxt);

      if (canAfford) {
        btnBg.on('pointerdown', () => {
          if (MetaManager.buyUpgrade(meta, u.id)) {
            SoundManager.getInstance().playSmelt();
            this.refresh();
          }
        });
      }
    });
  }
}

