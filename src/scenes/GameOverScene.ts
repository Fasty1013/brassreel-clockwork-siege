import Phaser from 'phaser';
import { MetaManager } from '@core/meta/metaManager';
import { SoundManager } from '../audio/SoundManager';
import { ArchiveModal } from '../ui/ArchiveModal';

export interface GameOverData {
  victory: boolean;
  wave: number;
  boilerHp: number;
  cogs: number;
  seed: number;
}

export class GameOverScene extends Phaser.Scene {
  private archiveModal!: ArchiveModal;

  constructor() {
    super('GameOverScene');
  }

  public create(data: GameOverData): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Record meta progress
    const meta = MetaManager.load();
    const earnedRefined = data.wave + (data.victory ? (data.wave >= 30 ? 50 : 20) : 0);
    meta.refinedCogs += earnedRefined;
    meta.lifetimeCogsEarned += earnedRefined;
    meta.totalRuns++;
    if (data.victory) meta.totalVictories++;
    meta.highestWaveReached = Math.max(meta.highestWaveReached, data.wave);
    MetaManager.save(meta);

    // Play Victory / Defeat sound
    if (data.victory) {
      SoundManager.getInstance().playJackpot();
    } else {
      SoundManager.getInstance().playValveHiss();
    }

    // Mount Archive Modal
    this.archiveModal = new ArchiveModal(this);

    // Background overlay
    const bgColor = data.victory ? 0x0f241d : 0x240f0f;
    this.add.rectangle(width / 2, height / 2, width, height, bgColor);

    const frame = this.add.rectangle(width / 2, height / 2, width - 200, height - 160);
    frame.setStrokeStyle(4, data.victory ? 0xffd166 : 0xe63946);

    // Title
    const title = data.victory ? 'ПОБЕДА: ОСАДА СНЯТА!' : 'ПОРАЖЕНИЕ: КОТЁЛ ВЗОРВАН!';
    const titleColor = data.victory ? '#ffd166' : '#e63946';

    this.add.text(width / 2, 220, title, {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: titleColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = data.victory
      ? 'Вражеские орды рассеяны! Заводской город Новый Брассхольм выстоял.'
      : 'Давление в котле упало до нуля. Осаждающие прорвали линию обороны.';

    this.add.text(width / 2, 290, sub, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#e9ecef'
    }).setOrigin(0.5);

    // Statistics summary box
    const statsBox = this.add.rectangle(width / 2, 470, 620, 220, 0x14100c);
    statsBox.setStrokeStyle(2, 0x8c5836);

    this.add.text(width / 2, 395, 'ИТОГИ ОБОРОНЫ:', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const statsInfo =
      `Пройдено волн: ${data.wave} / 30\n` +
      `Остаток давления котла: ${Math.max(0, data.boilerHp)} HP\n` +
      `Собрано шестерней в бою: ${data.cogs}\n` +
      `Награда архива: +${earnedRefined} Очищенных Шестерней ⚙️\n` +
      `Баланс в Архиве: ${meta.refinedCogs} ⚙️`;

    this.add.text(width / 2, 480, statsInfo, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ced4da',
      lineSpacing: 8,
      align: 'center'
    }).setOrigin(0.5);

    // New Run Button
    const restartBtn = this.add.rectangle(width / 2 - 240, 680, 210, 56, 0xd4a373);
    restartBtn.setStrokeStyle(3, 0xffd166);
    restartBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 - 240, 680, 'НОВЫЙ ЗАБЕГ ▶', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.scene.start('RunScene');
    });

    // Archive Button
    const archiveBtn = this.add.rectangle(width / 2, 680, 220, 56, 0x2b221a);
    archiveBtn.setStrokeStyle(2, 0xffd166);
    archiveBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 680, 'АРХИВ КУЗНИЦЫ ⚙️', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    archiveBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.archiveModal.open();
    });

    // Main Menu Button
    const menuBtn = this.add.rectangle(width / 2 + 240, 680, 210, 56, 0x2b221a);
    menuBtn.setStrokeStyle(2, 0x8c5836);
    menuBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 + 240, 680, 'ГЛАВНОЕ МЕНЮ', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ced4da',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.scene.start('MenuScene');
    });
  }
}
