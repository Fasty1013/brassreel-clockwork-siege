import Phaser from 'phaser';
import { UISkin } from '../art/ui/UISkin';
import { setLocale, getLocale } from '@data/i18n';
import { SoundManager } from '../audio/SoundManager';
import { ArchiveModal } from '../ui/ArchiveModal';
import { CampaignModal } from '../ui/CampaignModal';
import { MetaManager } from '@core/meta/metaManager';
import { CampaignManager } from '@core/campaign/campaign';
import { CHAPTERS, THREAT_LEVELS } from '@data/story';
import type { RunState } from '@core/state/RunState';
import { ACTS, WAVES_PER_ACT } from '@data/acts';
import { WAVES_DATA } from '@data/waves';

export class MenuScene extends Phaser.Scene {
  private startBtnText!: Phaser.GameObjects.Text;
  private langBtnText!: Phaser.GameObjects.Text;
  private gears: Phaser.GameObjects.Sprite[] = [];
  private archiveModal!: ArchiveModal;
  private campaignModal!: CampaignModal;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient / dark casino chamber
    this.add.rectangle(width / 2, height / 2, width, height, 0x14100c);

    // Decorative rotating background gears
    const gear1 = this.add.sprite(180, 200, 'sym_cog').setScale(3.5).setAlpha(0.18);
    const gear2 = this.add.sprite(width - 200, 260, 'sym_cog').setScale(4.5).setAlpha(0.18);
    const gear3 = this.add.sprite(width / 2 - 400, height - 180, 'sym_cog').setScale(3.0).setAlpha(0.15);
    const gear4 = this.add.sprite(width / 2 + 450, height - 160, 'sym_cog').setScale(3.2).setAlpha(0.15);
    this.gears = [gear1, gear2, gear3, gear4];

    // Marquee Frame
    const border = this.add.rectangle(width / 2, height / 2, width - 80, height - 80);
    border.setStrokeStyle(3, 0xd4a373, 0.5);

    // Sound toggle at top right
    const soundBtn = this.add.rectangle(width - 70, 50, 48, 40, 0x2b221a);
    soundBtn.setStrokeStyle(1, 0x8c5836);
    soundBtn.setInteractive({ useHandCursor: true });

    const soundText = this.add.text(width - 70, 50, SoundManager.getInstance().getMuted() ? '🔇' : '🔊', {
      fontSize: '20px'
    }).setOrigin(0.5);

    soundBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      const muted = SoundManager.getInstance().toggleMute();
      soundText.setText(muted ? '🔇' : '🔊');
    });

    // Title & Subtitle
    this.add.text(width / 2, 220, 'BRASSREEL', {
      fontFamily: 'monospace',
      fontSize: '76px',
      color: '#ffd166',
      fontStyle: 'bold',
      stroke: '#3d2b1f',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, 'CLOCKWORK SIEGE', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e76f51',
      fontStyle: 'bold',
      letterSpacing: 6
    }).setOrigin(0.5);

    const isRu = getLocale() === 'ru';
    const loreText = this.add.text(
      width / 2, 
      370, 
      isRu 
        ? 'Кузница-Казино Нью-Брассхольма осаждена автоматонами барона.\nКрути барабаны 3×3, призывай паровых бойцов и защити Котёл!'
        : 'The Forge-Casino of New Brassholm is besieged by steam swarms.\nSpin the 3×3 reels, summon automatons, and defend The Boiler!', 
      {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#adb5bd',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5);

    // A run left through the «МЕНЮ» button sleeps in RunScene: offer to continue it.
    const canResume = this.scene.isSleeping('RunScene');
    const startLabel = (ru: boolean): string =>
      canResume
        ? ru ? 'ПРОДОЛЖИТЬ ЗАБЕГ [ПРОБЕЛ] ▶' : 'CONTINUE RUN [SPACE] ▶'
        : ru ? 'В БОЙ [ПРОБЕЛ] ⚔' : 'START DEFENSE [SPACE] ⚔';
    if (canResume) {
      const run = (this.scene.get('RunScene') as Phaser.Scene & { state?: RunState }).state;
      if (run) {
        const act = ACTS[Math.min(ACTS.length, Math.ceil(run.waveNumber / WAVES_PER_ACT)) - 1];
        this.add.text(
          width / 2, 446,
          isRu
            ? `Забег на паузе: акт ${act.act} «${act.name}» · волна ${run.waveNumber} из ${WAVES_DATA.length} · котёл ${run.boilerHp}/${run.maxBoilerHp}`
            : `Run paused: act ${act.act} · wave ${run.waveNumber} of ${WAVES_DATA.length} · boiler ${run.boilerHp}/${run.maxBoilerHp}`,
          { fontSize: '20px', color: '#ffd166', fontStyle: 'bold' }
        ).setOrigin(0.5);
      }
    }

    // Start Game Button (with a paused run: «continue» on the left, «new run» on the right)
    const startX = canResume ? width / 2 - 110 : width / 2;
    const startBtn = this.add.rectangle(startX, 540, canResume ? 460 : 380, 72, 0xd4a373);
    startBtn.setStrokeStyle(4, 0xffd166);
    startBtn.setInteractive({ useHandCursor: true });

    this.startBtnText = this.add.text(startX, 540, startLabel(isRu), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => {
      startBtn.setFillStyle(0xffd166);
      this.tweens.add({
        targets: startBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    startBtn.on('pointerout', () => {
      startBtn.setFillStyle(0xd4a373);
      this.tweens.add({
        targets: startBtn,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100
      });
    });

    let leaving = false;
    // a fresh run (a paused one is shut down and replaced)
    const newRun = () => {
      if (leaving) return;
      leaving = true;
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.cameras.main.fade(300, 20, 16, 12);
      this.time.delayedCall(300, () => {
        this.scene.start('RunScene');
      });
    };
    const resumeRun = () => {
      if (leaving) return;
      leaving = true;
      SoundManager.getInstance().playButtonClick();
      this.cameras.main.fade(200, 20, 16, 12);
      this.time.delayedCall(200, () => {
        this.scene.wake('RunScene');
        this.scene.stop();
      });
    };
    const startGame = canResume ? resumeRun : newRun;

    startBtn.on('pointerdown', startGame);
    const startFromKeys = () => {
      if (!this.campaignModal?.visible && !this.archiveModal?.visible) startGame();
    };
    this.input.keyboard?.on('keydown-SPACE', startFromKeys);
    this.input.keyboard?.on('keydown-ENTER', startFromKeys);
    this.input.keyboard?.on('keydown-ESC', () => {
      if (canResume && !this.campaignModal?.visible && !this.archiveModal?.visible) resumeRun();
    });

    // New run while one is paused: the second click within 3 s confirms (the paused run is lost)
    if (canResume) {
      const newBtn = this.add.rectangle(width / 2 + 290, 540, 300, 56, 0x2b221a);
      newBtn.setStrokeStyle(2, 0xd90429);
      newBtn.setInteractive({ useHandCursor: true });
      const idle = isRu ? 'НОВЫЙ ЗАБЕГ\n(текущий пропадёт)' : 'NEW RUN\n(current one is lost)';
      const sure = isRu ? 'ТОЧНО?\nНАЖМИТЕ ЕЩЁ РАЗ' : 'SURE?\nCLICK AGAIN';
      const newTxt = this.add.text(width / 2 + 290, 540, idle, { fontSize: '16px', color: '#ff8a7a', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
      let armedUntil = 0;
      newBtn.on('pointerdown', () => {
        if (this.time.now < armedUntil) {
          newRun();
          return;
        }
        armedUntil = this.time.now + 3000;
        newTxt.setText(sure);
        SoundManager.getInstance().playButtonClick();
        this.time.delayedCall(3000, () => { if (newTxt.active) newTxt.setText(idle); });
      });
    }

    // Campaign: goal, chapters, threat level, chronicle
    this.campaignModal = new CampaignModal(this, newRun);
    const meta = MetaManager.load();
    const threat = CampaignManager.activeThreat(meta);
    const campBtn = this.add.rectangle(width / 2, 690, 380, 52, 0x2b221a);
    campBtn.setStrokeStyle(3, 0xffd166);
    campBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 690,
      isRu ? `📖 Кампания · Регулятор ${CampaignManager.partsFound(meta)}/${CHAPTERS.length}` : `📖 Campaign · Regulator ${CampaignManager.partsFound(meta)}/${CHAPTERS.length}`, {
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    if (threat > 0) {
      this.add.text(width / 2, 478, `Угроза: ${THREAT_LEVELS[threat].name}`, { fontSize: '16px', color: '#ff8a7a' }).setOrigin(0.5);
    }
    campBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.campaignModal.open();
    });

    // Mount Archive Modal
    this.archiveModal = new ArchiveModal(this);

    // Archive Button
    const archiveBtn = this.add.rectangle(width / 2 - 140, 630, 240, 48, 0x2b221a);
    archiveBtn.setStrokeStyle(2, 0xffd166);
    archiveBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 - 140, 630, isRu ? '📜 Архив Кузницы' : '📜 Archives', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    archiveBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.archiveModal.open();
    });

    // Language Toggle Button (RU / EN)
    const langBtn = this.add.rectangle(width / 2 + 140, 630, 220, 48, 0x2b221a);
    langBtn.setStrokeStyle(2, 0x8c5836);
    langBtn.setInteractive({ useHandCursor: true });

    this.langBtnText = this.add.text(width / 2 + 140, 630, `ЯЗЫК / LANG: ${getLocale().toUpperCase()}`, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#adb5bd',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    langBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      const nextLang = getLocale() === 'ru' ? 'en' : 'ru';
      setLocale(nextLang);
      this.langBtnText.setText(`ЯЗЫК / LANG: ${nextLang.toUpperCase()}`);
      this.startBtnText.setText(startLabel(nextLang === 'ru'));
      loreText.setText(
        nextLang === 'ru'
          ? 'Кузница-Казино Нью-Брассхольма осаждена автоматонами барона.\nКрути барабаны 3×3, призывай паровых бойцов и защити Котёл!'
          : 'The Forge-Casino of New Brassholm is besieged by steam swarms.\nSpin the 3×3 reels, summon automatons, and defend The Boiler!'
      );
    });

    // Instructions Box
    const rulesBox = this.add.rectangle(width / 2, 820, 940, 150, 0x1b1714);
    rulesBox.setStrokeStyle(1, 0x495057);

    this.add.text(width / 2, 765, isRu ? 'ИНСТРУКТАЖ МАСТЕРА:' : 'FOREMAN INSTRUCTIONS:', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      835,
      isRu
        ? '1. Пробел крутит барабаны: 3 одинаковых символа в линию призывают робота в резерв.\n' +
          '2. Перетащи роботов на луг; робот на такого же — слияние, уровень +1.\n' +
          '3. Кнопка с черепом или ENTER запускает волну. T — древо навыков.\n' +
          '4. Между волнами — мастерская. Выстой 30 волн и одолей трёх боссов!'
        : '1. Space spins the reels: 3 equal symbols on a line summon a robot to the reserve.\n' +
          '2. Drag robots onto the meadow; drop one on its twin to merge it, level +1.\n' +
          '3. The skull button or ENTER starts the wave. T opens the skill tree.\n' +
          '4. The workshop opens between waves. Survive 30 waves and beat three bosses!',
      {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ced4da',
        lineSpacing: 6,
        align: 'center'
      }
    ).setOrigin(0.5);

    // Footer info
    this.add.text(width / 2, height - 30, 'BRASSREEL v0.4.0 • случайное зерно каждый забег (?seed=… повторяет забег) • TypeScript + Phaser 3', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6c757d'
    }).setOrigin(0.5);

    // pixel-art 9-slice skin for every framed panel/button in the scene
    UISkin.install(this);
  }

  public update(_time: number, delta: number): void {
    const rotSpeed = (delta / 1000) * 0.4;
    if (this.gears[0]) this.gears[0].rotation += rotSpeed;
    if (this.gears[1]) this.gears[1].rotation -= rotSpeed * 0.8;
    if (this.gears[2]) this.gears[2].rotation += rotSpeed * 0.6;
    if (this.gears[3]) this.gears[3].rotation -= rotSpeed * 0.7;
  }
}
