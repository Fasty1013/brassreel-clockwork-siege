import Phaser from 'phaser';
import { UISkin } from '../art/ui/UISkin';
import { MetaManager } from '@core/meta/metaManager';
import { SoundManager } from '../audio/SoundManager';
import { ArchiveModal } from '../ui/ArchiveModal';
import { CampaignManager } from '@core/campaign/campaign';
import { CHAPTERS, THREAT_LEVELS, chapterForWave } from '@data/story';
import { fitBox } from '../ui/TextStyles';
import { fitCamera, WORLD_H, WORLD_W } from '../ui/Display';

export interface GameOverData {
  victory: boolean;
  wave: number;
  boilerHp: number;
  cogs: number;
  seed: number;
  /** campaign threat level of the run */
  threat?: number;
  /** Regulator parts recovered during the run */
  partsThisRun?: string[];
}

/** What the foreman says when the boiler blows, by chapter. */
const DEFEAT_LINES = [
  'Шестерёнкин: «Луг потерян… Но Маховик всё ещё у Барона. Соберись — и снова в бой.»',
  'Шестерёнкин: «Топи взяли своё. Архив кузницы поможет начать сильнее.»',
  'Шестерёнкин: «Мы были у самых ворот Колосса. В следующий раз Сердце будет нашим.»'
];

export class GameOverScene extends Phaser.Scene {
  private archiveModal!: ArchiveModal;

  constructor() {
    super('GameOverScene');
  }

  public create(data: GameOverData): void {
    fitCamera(this);
    const width = WORLD_W;
    const height = WORLD_H;

    // Record meta progress
    const meta = MetaManager.load();
    const threat = data.threat ?? 0;
    const campaign = CampaignManager.recordRunEnd(meta, threat, data.wave, data.victory);
    const earnedRefined = Math.round((data.wave + (data.victory ? 50 : 0)) * campaign.rewardMult);
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
      ? 'Великий Регулятор собран — часы Нью-Брассхольма снова идут!'
      : `Давление в котле упало до нуля. ${chapterForWave(data.wave).title}, волна ${data.wave}.`;

    this.add.text(width / 2, 290, sub, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#e9ecef'
    }).setOrigin(0.5);

    // Statistics summary box
    const statsBox = this.add.rectangle(width / 2, 475, 620, 250, 0x14100c);
    statsBox.setStrokeStyle(2, 0x8c5836);

    this.add.text(width / 2, 372, 'ИТОГИ ОБОРОНЫ:', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const statsInfo =
      `Угроза: ${THREAT_LEVELS[threat]?.name ?? threat}\n` +
      `Пройдено волн: ${data.wave} / 30\n` +
      `Остаток давления котла: ${Math.max(0, data.boilerHp)} HP\n` +
      `Собрано шестерней в бою: ${data.cogs}\n` +
      `Награда архива: +${earnedRefined} Очищенных Шестерней ⚙️\n` +
      `Баланс в Архиве: ${meta.refinedCogs} ⚙️`;

    this.add.text(width / 2, 490, statsInfo, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ced4da',
      lineSpacing: 8,
      align: 'center'
    }).setOrigin(0.5);

    // Campaign progress: Regulator parts
    const campBox = this.add.rectangle(width / 2, 690, 900, 150, 0x14100c);
    campBox.setStrokeStyle(2, 0xd4a373);
    this.add.text(width / 2, 635, 'ВЕЛИКИЙ РЕГУЛЯТОР', { fontSize: '18px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5);
    const got = data.partsThisRun ?? [];
    CHAPTERS.forEach((c, i) => {
      const x = width / 2 - 260 + i * 260;
      const inRun = got.includes(c.part.id);
      const ever = CampaignManager.hasPart(meta, c.part.id);
      this.add.image(x - 70, 680, c.part.icon).setScale(2).setAlpha(inRun ? 1 : ever ? 0.6 : 0.2);
      fitBox(this.add.text(x - 40, 680, `${c.part.name}\n${inRun ? 'добыт в этом забеге' : ever ? 'добыт раньше' : 'у врага'}`, {
        fontSize: '16px',
        color: inRun ? '#ffd166' : '#9a93ad'
      }).setOrigin(0, 0.5), 200, 70);
    });
    let note = data.victory ? 'Кампания пройдена на этой угрозе.' : DEFEAT_LINES[Math.min(2, Math.ceil(data.wave / 10) - 1)];
    if (campaign.unlockedThreat !== null) {
      note = `Открыта новая угроза: «${THREAT_LEVELS[campaign.unlockedThreat].name}» — выберите её в меню «Кампания».`;
    }
    this.add.text(width / 2, 740, note, { fontSize: '16px', color: '#ced4da', align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5);

    // New Run Button
    const restartBtn = this.add.rectangle(width / 2 - 240, 840, 210, 56, 0xd4a373);
    restartBtn.setStrokeStyle(3, 0xffd166);
    restartBtn.setInteractive({ useHandCursor: true });

    fitBox(this.add.text(width / 2 - 240, 840, 'НОВЫЙ ЗАБЕГ ▶', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5), 194, 50);

    restartBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.scene.start('RunScene');
    });

    // Archive Button
    const archiveBtn = this.add.rectangle(width / 2, 840, 220, 56, 0x2b221a);
    archiveBtn.setStrokeStyle(2, 0xffd166);
    archiveBtn.setInteractive({ useHandCursor: true });

    fitBox(this.add.text(width / 2, 840, 'АРХИВ КУЗНИЦЫ ⚙️', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5), 204, 50);

    archiveBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.archiveModal.open();
    });

    // Main Menu Button
    const menuBtn = this.add.rectangle(width / 2 + 240, 840, 210, 56, 0x2b221a);
    menuBtn.setStrokeStyle(2, 0x8c5836);
    menuBtn.setInteractive({ useHandCursor: true });

    fitBox(this.add.text(width / 2 + 240, 840, 'ГЛАВНОЕ МЕНЮ', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ced4da',
      fontStyle: 'bold'
    }).setOrigin(0.5), 194, 50);

    menuBtn.on('pointerdown', () => {
      SoundManager.getInstance().playButtonClick();
      this.scene.start('MenuScene');
    });

    // pixel-art 9-slice skin for every framed panel/button in the scene
    UISkin.install(this);
  }
}
