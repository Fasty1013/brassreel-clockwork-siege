import Phaser from 'phaser';
import { setLocale, getLocale } from '@data/i18n';
import { SoundManager } from '../audio/SoundManager';
import { ArchiveModal } from '../ui/ArchiveModal';

export class MenuScene extends Phaser.Scene {
  private startBtnText!: Phaser.GameObjects.Text;
  private langBtnText!: Phaser.GameObjects.Text;
  private gears: Phaser.GameObjects.Sprite[] = [];
  private archiveModal!: ArchiveModal;

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

    const loreText = this.add.text(width / 2, 370, 'Казино-кузница Нового Брассхольма под осадой паровых орд.\nКрутите барабаны 3×3, сплавляйте автоматонов и защитите Котёл!', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#adb5bd',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Start Game Button
    const startBtn = this.add.rectangle(width / 2, 540, 360, 72, 0xd4a373);
    startBtn.setStrokeStyle(4, 0xffd166);
    startBtn.setInteractive({ useHandCursor: true });

    this.startBtnText = this.add.text(width / 2, 540, 'НАЧАТЬ ОБОРОНУ ▶', {
      fontFamily: 'monospace',
      fontSize: '24px',
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

    const startGame = () => {
      SoundManager.getInstance().init();
      SoundManager.getInstance().playButtonClick();
      this.cameras.main.fade(300, 20, 16, 12);
      this.time.delayedCall(300, () => {
        this.scene.start('RunScene');
      });
    };

    startBtn.on('pointerdown', startGame);
    this.input.keyboard?.on('keydown-SPACE', startGame);
    this.input.keyboard?.on('keydown-ENTER', startGame);

    // Mount Archive Modal
    this.archiveModal = new ArchiveModal(this);

    // Archive Button
    const archiveBtn = this.add.rectangle(width / 2 - 130, 630, 240, 48, 0x2b221a);
    archiveBtn.setStrokeStyle(2, 0xffd166);
    archiveBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 - 130, 630, 'АРХИВ КУЗНИЦЫ ⚙️', {
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
    const langBtn = this.add.rectangle(width / 2 + 130, 630, 220, 48, 0x2b221a);
    langBtn.setStrokeStyle(2, 0x8c5836);
    langBtn.setInteractive({ useHandCursor: true });

    this.langBtnText = this.add.text(width / 2 + 130, 630, `ЯЗЫК / LANG: ${getLocale().toUpperCase()}`, {
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
      this.startBtnText.setText(nextLang === 'ru' ? 'НАЧАТЬ ОБОРОНУ ▶' : 'START DEFENSE ▶');
      loreText.setText(
        nextLang === 'ru'
          ? 'Казино-кузница Нового Брассхольма под осадой паровых орд.\nКрутите барабаны 3×3, сплавляйте автоматонов и защитите Котёл!'
          : 'The Forge-Casino of New Brassholm is besieged by steam swarms.\nSpin the 3×3 reels, smelt automatons, and defend The Boiler!'
      );
    });

    // Instructions Box
    const rulesBox = this.add.rectangle(width / 2, 820, 900, 140, 0x1b1714);
    rulesBox.setStrokeStyle(1, 0x495057);

    this.add.text(width / 2, 775, 'ПРАВИЛА И СИСТЕМЫ:', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      835,
      '1. 3 бесплатных спина за волну + доп. спины за Пар (Heat растёт).\n' +
      '2. Линии призывают автоматонов (Шестерня, Пружина, Фитиль, Катушка).\n' +
      '3. Перетаскивайте карты на поле боя для защиты или друг на друга для Smelt (слияние).\n' +
      '4. Не допустите прорыва врагов к Котлу (10 давлений).',
      {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ced4da',
        lineSpacing: 6,
        align: 'center'
      }
    ).setOrigin(0.5);

    // Footer info
    this.add.text(width / 2, height - 30, 'BRASSREEL v0.2.0 • Deterministic Seed: 20261102 • TypeScript + Phaser 3', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6c757d'
    }).setOrigin(0.5);
  }

  public update(_time: number, delta: number): void {
    const rotSpeed = (delta / 1000) * 0.4;
    if (this.gears[0]) this.gears[0].rotation += rotSpeed;
    if (this.gears[1]) this.gears[1].rotation -= rotSpeed * 0.8;
    if (this.gears[2]) this.gears[2].rotation += rotSpeed * 0.6;
    if (this.gears[3]) this.gears[3].rotation -= rotSpeed * 0.7;
  }
}
