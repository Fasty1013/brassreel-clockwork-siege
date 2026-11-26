import Phaser from 'phaser';
import { UISkin } from '../art/ui/UISkin';
import { setLocale, getLocale } from '@data/i18n';
import { SoundManager } from '../audio/SoundManager';
import { ArchiveModal } from '../ui/ArchiveModal';
import { CampaignModal } from '../ui/CampaignModal';
import { SettingsModal } from '../ui/SettingsModal';
import { DialogueModal } from '../ui/DialogueModal';
import { RunSave } from '@core/state/runSave';

import { MetaManager } from '@core/meta/metaManager';
import { CampaignManager } from '@core/campaign/campaign';
import { CHAPTERS, THREAT_LEVELS } from '@data/story';
import type { RunState } from '@core/state/RunState';
import { ACTS, WAVES_PER_ACT } from '@data/acts';
import { WAVES_DATA } from '@data/waves';
import { fitBox, TOUCH_ONLY } from '../ui/TextStyles';
import { FULL_VIEW, FULL_W, fitCamera, setView, shownArea, WORLD_H, WORLD_RESIZE, WORLD_W, type View } from '../ui/Display';

/** The menu's content: title to the briefing box (shown as large as the screen allows). */
const MENU_VIEW: View = { x0: 380, x1: 1540, y0: 150, y1: 975 };

/** « [ПРОБЕЛ]» on the start button with a keyboard, nothing on a touch screen. */
const spaceHint = (ru: boolean): string => (TOUCH_ONLY ? '' : ru ? ' [ПРОБЕЛ]' : ' [SPACE]');

export class MenuScene extends Phaser.Scene {
  private startBtnText!: Phaser.GameObjects.Text;
  private langBtnText!: Phaser.GameObjects.Text;
  private gears: Phaser.GameObjects.Sprite[] = [];
  private archiveModal!: ArchiveModal;
  private campaignModal!: CampaignModal;
  private settingsModal!: SettingsModal;
  private zoomedOut = false;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    // the menu shows its content as large as the screen allows; a window zooms back out (update())
    fitCamera(this, MENU_VIEW);
    this.zoomedOut = false;
    // the screen changed shape (cut-out reported late, window resized): lay the menu out again
    const relayout = (): void => {
      if (this.scene.isActive() && !this.anyModalOpen()) this.scene.restart();
    };
    this.game.events.on(WORLD_RESIZE, relayout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(WORLD_RESIZE, relayout));
    const width = WORLD_W;
    const height = WORLD_H;

    // Background, frame, gears and the sound button follow the screen's edges
    const area = shownArea(this);
    const aw = area.x1 - area.x0;
    const ah = area.y1 - area.y0;
    this.add.rectangle(width / 2, height / 2, FULL_W, FULL_W, 0x14100c);

    // Decorative rotating background gears
    const gear1 = this.add.sprite(area.x0 + 110, area.y0 + 110, 'sym_cog').setScale(3.5).setAlpha(0.18);
    const gear2 = this.add.sprite(area.x1 - 130, area.y0 + 150, 'sym_cog').setScale(4.5).setAlpha(0.18);
    const gear3 = this.add.sprite(area.x0 + 150, area.y1 - 120, 'sym_cog').setScale(3.0).setAlpha(0.15);
    const gear4 = this.add.sprite(area.x1 - 150, area.y1 - 110, 'sym_cog').setScale(3.2).setAlpha(0.15);
    this.gears = [gear1, gear2, gear3, gear4];

    // Marquee Frame
    const border = this.add.rectangle((area.x0 + area.x1) / 2, (area.y0 + area.y1) / 2, aw - 40, ah - 40);
    border.setStrokeStyle(3, 0xd4a373, 0.5);

    // Sound toggle at top right
    const soundBtn = this.add.rectangle(area.x1 - 50, area.y0 + 42, 48, 40, 0x2b221a);
    soundBtn.setStrokeStyle(1, 0x8c5836);
    soundBtn.setInteractive({ useHandCursor: true });

    const soundText = this.add.text(area.x1 - 50, area.y0 + 42, SoundManager.getInstance().getMuted() ? '🔇' : '🔊', {
      fontSize: '20px'
    }).setOrigin(0.5);

    soundBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().toggleMute();
    });
    // the icon follows the settings window too
    const offSound = SoundManager.getInstance().onChange(() => {
      if (soundText.active) soundText.setText(SoundManager.getInstance().getMuted() ? '🔇' : '🔊');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, offSound);

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

    // A run left through the «МЕНЮ» button sleeps in RunScene; a run from an earlier launch
    // (the app was closed between waves) is kept on the device. Either one can be continued.
    const sleeping = this.scene.isSleeping('RunScene');
    const savedRun = sleeping ? null : RunSave.load();
    const canResume = sleeping || savedRun !== null;
    const startLabel = (ru: boolean): string =>
      canResume
        ? ru ? `ПРОДОЛЖИТЬ ЗАБЕГ${spaceHint(ru)} ▶` : `CONTINUE RUN${spaceHint(ru)} ▶`
        : ru ? `В БОЙ${spaceHint(ru)} ⚔` : `START DEFENSE${spaceHint(ru)} ⚔`;
    if (canResume) {
      const run = sleeping ? (this.scene.get('RunScene') as Phaser.Scene & { state?: RunState }).state : savedRun?.state;
      if (run) {
        const act = ACTS[Math.min(ACTS.length, Math.ceil(run.waveNumber / WAVES_PER_ACT)) - 1];
        this.add.text(
          width / 2, 446,
          isRu
            ? `${sleeping ? 'Забег на паузе' : 'Сохранённый забег'}: акт ${act.act} «${act.name}» · волна ${run.waveNumber} из ${WAVES_DATA.length} · котёл ${run.boilerHp}/${run.maxBoilerHp}`
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

    this.startBtnText = fitBox(this.add.text(startX, 540, startLabel(isRu), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5), (canResume ? 460 : 380) - 24, 64);

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
        if (sleeping) {
          this.scene.wake('RunScene');
          this.scene.stop();
        } else {
          this.scene.start('RunScene', { resume: true });
        }
      });
    };
    const startGame = canResume ? resumeRun : newRun;

    startBtn.on('pointerdown', startGame);
    const startFromKeys = () => {
      if (!this.anyModalOpen()) startGame();
    };
    this.input.keyboard?.on('keydown-SPACE', startFromKeys);
    this.input.keyboard?.on('keydown-ENTER', startFromKeys);
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.settingsModal?.visible) this.settingsModal.hide();
      else if (canResume && !this.anyModalOpen()) resumeRun();
    });

    // New run while one is paused: the second click within 3 s confirms (the paused run is lost)
    if (canResume) {
      const newBtn = this.add.rectangle(width / 2 + 290, 540, 300, 56, 0x2b221a);
      newBtn.setStrokeStyle(2, 0xd90429);
      newBtn.setInteractive({ useHandCursor: true });
      const idle = isRu ? 'НОВЫЙ ЗАБЕГ\n(текущий пропадёт)' : 'NEW RUN\n(current one is lost)';
      const sure = isRu ? 'ТОЧНО?\nНАЖМИТЕ ЕЩЁ РАЗ' : 'SURE?\nCLICK AGAIN';
      const newTxt = fitBox(
        this.add.text(width / 2 + 290, 540, idle, { fontSize: '16px', color: '#ff8a7a', fontStyle: 'bold', align: 'center' }).setOrigin(0.5),
        284, 54
      );
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
    const campBtn = this.add.rectangle(width / 2, 698, 460, 56, 0x2b221a);
    campBtn.setStrokeStyle(3, 0xffd166);
    campBtn.setInteractive({ useHandCursor: true });
    fitBox(this.add.text(width / 2, 698,
      isRu ? `📖 Кампания · Регулятор ${CampaignManager.partsFound(meta)}/${CHAPTERS.length}` : `📖 Campaign · Regulator ${CampaignManager.partsFound(meta)}/${CHAPTERS.length}`, {
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5), 440, 52);
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
    const archiveBtn = this.add.rectangle(width / 2 - 320, 630, 300, 56, 0x2b221a);
    archiveBtn.setStrokeStyle(2, 0xffd166);
    archiveBtn.setInteractive({ useHandCursor: true });

    fitBox(this.add.text(width / 2 - 320, 630, isRu ? '📜 Архив Кузницы' : '📜 Archives', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5), 284, 52);

    archiveBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.archiveModal.open();
    });

    // Settings: sound and screen resolution
    this.settingsModal = new SettingsModal(this);
    const settingsBtn = this.add.rectangle(width / 2, 630, 300, 56, 0x2b221a);
    settingsBtn.setStrokeStyle(2, 0xffd166);
    settingsBtn.setInteractive({ useHandCursor: true });
    fitBox(this.add.text(width / 2, 630, isRu ? '⚙ Настройки' : '⚙ Settings', {
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5), 284, 52);
    settingsBtn.on('pointerdown', () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.settingsModal.open();
    });

    // Language Toggle Button (RU / EN)
    const langBtn = this.add.rectangle(width / 2 + 320, 630, 300, 56, 0x2b221a);
    langBtn.setStrokeStyle(2, 0x8c5836);
    langBtn.setInteractive({ useHandCursor: true });

    this.langBtnText = fitBox(this.add.text(width / 2 + 320, 630, `ЯЗЫК / LANG: ${getLocale().toUpperCase()}`, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#adb5bd',
      fontStyle: 'bold'
    }).setOrigin(0.5), 284, 52);

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

    const rulesHead = this.add.text(width / 2, 765, isRu ? 'ИНСТРУКТАЖ МАСТЕРА:' : 'FOREMAN INSTRUCTIONS:', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // a touch screen has no keyboard: the rules name the lever and buttons instead
    const rules = TOUCH_ONLY
      ? isRu
        ? '1. Рычаг крутит барабаны: 3 одинаковых символа в линию призывают робота в резерв.\n' +
          '2. Перетащи роботов на луг; робот на такого же — слияние, уровень +1.\n' +
          '3. Кнопка с черепом запускает волну. «Древо» — навыки на весь забег.\n' +
          '4. Между волнами — мастерская. Выстой 30 волн и одолей трёх боссов!'
        : '1. The lever spins the reels: 3 equal symbols on a line summon a robot to the reserve.\n' +
          '2. Drag robots onto the meadow; drop one on its twin to merge it, level +1.\n' +
          '3. The skull button starts the wave. «Tree» holds upgrades for the whole run.\n' +
          '4. The workshop opens between waves. Survive 30 waves and beat three bosses!'
      : isRu
        ? '1. Пробел крутит барабаны: 3 одинаковых символа в линию призывают робота в резерв.\n' +
          '2. Перетащи роботов на луг; робот на такого же — слияние, уровень +1.\n' +
          '3. Кнопка с черепом или ENTER запускает волну. T — древо навыков.\n' +
          '4. Между волнами — мастерская. Выстой 30 волн и одолей трёх боссов!'
        : '1. Space spins the reels: 3 equal symbols on a line summon a robot to the reserve.\n' +
          '2. Drag robots onto the meadow; drop one on its twin to merge it, level +1.\n' +
          '3. The skull button or ENTER starts the wave. T opens the skill tree.\n' +
          '4. The workshop opens between waves. Survive 30 waves and beat three bosses!';
    const rulesText = this.add.text(
      width / 2,
      835,
      rules,
      {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ced4da',
        lineSpacing: 6,
        align: 'center'
      }
    ).setOrigin(0.5);
    // the box grows around the text (it is larger on phones), keeping its top edge
    fitBox(rulesText, width - 200);
    const boxW = Math.max(940, rulesText.width + 48);
    const boxH = Math.max(150, rulesText.height + rulesHead.height + 34);
    const boxTop = 745;
    rulesBox.setSize(boxW, boxH).setPosition(width / 2, boxTop + boxH / 2);
    rulesHead.setY(boxTop + 12 + rulesHead.height / 2);
    rulesText.setY(rulesHead.y + rulesHead.height / 2 + 8 + rulesText.height / 2);

    // Footer info
    // version line: developer info, only with a keyboard (no room for it on a phone)
    if (!TOUCH_ONLY) {
      fitBox(this.add.text(width / 2, area.y1 - 40, 'BRASSREEL v0.4.0 • случайное зерно каждый забег (?seed=… повторяет забег) • TypeScript + Phaser 3', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6c757d'
      }).setOrigin(0.5), area.x1 - area.x0 - 120, 30);
    }

    // pixel-art 9-slice skin for every framed panel/button in the scene
    UISkin.install(this);
  }

  public update(_time: number, delta: number): void {
    // windows (archive, campaign, settings, story) are laid out for the whole design: zoom out for them
    const out = this.anyModalOpen() || DialogueModal.isBusy(0);
    if (out !== this.zoomedOut) {
      this.zoomedOut = out;
      setView(this, out ? FULL_VIEW : MENU_VIEW);
    }
    const rotSpeed = (delta / 1000) * 0.4;
    if (this.gears[0]) this.gears[0].rotation += rotSpeed;
    if (this.gears[1]) this.gears[1].rotation -= rotSpeed * 0.8;
    if (this.gears[2]) this.gears[2].rotation += rotSpeed * 0.6;
    if (this.gears[3]) this.gears[3].rotation -= rotSpeed * 0.7;
  }

  /** Android back: closes an open window; with none open the app goes to the background (false). */
  public handleBack(): boolean {
    if (DialogueModal.isBusy(0)) return false;
    if (this.settingsModal?.visible) this.settingsModal.hide();
    else if (this.archiveModal?.visible) this.archiveModal.hide();
    else if (this.campaignModal?.visible) this.campaignModal.setVisible(false);
    else return false;
    return true;
  }

  private anyModalOpen(): boolean {
    return Boolean(this.campaignModal?.visible || this.archiveModal?.visible || this.settingsModal?.visible);
  }
}
