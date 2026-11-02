import Phaser from 'phaser';

export interface GameOverData {
  victory: boolean;
  wave: number;
  boilerHp: number;
  cogs: number;
  seed: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  public create(data: GameOverData): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background overlay
    const bgColor = data.victory ? 0x0f241d : 0x240f0f;
    this.add.rectangle(width / 2, height / 2, width, height, bgColor);

    const frame = this.add.rectangle(width / 2, height / 2, width - 200, height - 160);
    frame.setStrokeStyle(4, data.victory ? 0xffd166 : 0xe63946);

    // Title
    const title = data.victory ? 'ПОБЕДА: ОСАДА СНЯТА!' : 'ПОРАЖЕНИЕ: КОТЁЛ ВЗОРВАН!';
    const titleColor = data.victory ? '#ffd166' : '#e63946';

    this.add.text(width / 2, 240, title, {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: titleColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = data.victory
      ? 'Паровой Барон повержен! Заводской город Новый Брассхольм выстоял.'
      : 'Давление в котле упало до нуля. Осаждающие прорвали линию обороны.';

    this.add.text(width / 2, 320, sub, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#e9ecef'
    }).setOrigin(0.5);

    // Statistics summary box
    const statsBox = this.add.rectangle(width / 2, 500, 560, 200, 0x14100c);
    statsBox.setStrokeStyle(2, 0x8c5836);

    this.add.text(width / 2, 430, 'ИТОГИ ОБОРОНЫ:', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const statsInfo =
      `Пройдено волн: ${data.wave} / 10\n` +
      `Остаток давления котла: ${Math.max(0, data.boilerHp)} / 10\n` +
      `Собрано шестерней: ${data.cogs}\n` +
      `Сид генерации: ${data.seed}`;

    this.add.text(width / 2, 520, statsInfo, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ced4da',
      lineSpacing: 10,
      align: 'center'
    }).setOrigin(0.5);

    // New Run Button
    const restartBtn = this.add.rectangle(width / 2 - 160, 720, 260, 60, 0xd4a373);
    restartBtn.setStrokeStyle(3, 0xffd166);
    restartBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 - 160, 720, 'НОВЫЙ ЗАБЕГ ▶', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      this.scene.start('RunScene');
    });

    restartBtn.on('pointerover', () => {
      restartBtn.setFillStyle(0xffd166);
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setFillStyle(0xd4a373);
    });

    // Main Menu Button
    const menuBtn = this.add.rectangle(width / 2 + 160, 720, 260, 60, 0x2b221a);
    menuBtn.setStrokeStyle(2, 0x8c5836);
    menuBtn.setInteractive({ useHandCursor: true });

    this.add.text(width / 2 + 160, 720, 'ГЛАВНОЕ МЕНЮ', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
