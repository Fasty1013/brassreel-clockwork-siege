import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';

export class HUD extends Phaser.GameObjects.Container {
  private boilerText: Phaser.GameObjects.Text;
  private cogsText: Phaser.GameObjects.Text;
  private steamText: Phaser.GameObjects.Text;
  private heatText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private heatBarFill: Phaser.GameObjects.Rectangle;
  private valveButton: Phaser.GameObjects.Rectangle;
  private valveText: Phaser.GameObjects.Text;
  private soundButton: Phaser.GameObjects.Rectangle;
  private soundText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Top HUD Bar background
    const topBar = scene.add.rectangle(960, 30, 1920, 60, 0x141419, 0.95);
    topBar.setStrokeStyle(1, 0x4a3b2c);
    this.add(topBar);

    // Boiler HP (Pressure)
    this.boilerText = scene.add.text(40, 20, 'Давление котла: 10/10', {
      fontSize: '18px',
      color: '#e63946',
      fontStyle: 'bold'
    });
    this.add(this.boilerText);

    // Cogs (Gold)
    this.cogsText = scene.add.text(340, 20, 'Шестерни: 25', {
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    });
    this.add(this.cogsText);

    // Steam (Spins energy)
    this.steamText = scene.add.text(560, 20, 'Пар: 3/5', {
      fontSize: '18px',
      color: '#00b4d8',
      fontStyle: 'bold'
    });
    this.add(this.steamText);

    // Heat Gauge
    this.heatText = scene.add.text(780, 20, 'Нагрев горна: 0%', {
      fontSize: '18px',
      color: '#f77f00',
      fontStyle: 'bold'
    });
    this.add(this.heatText);

    const heatBarBg = scene.add.rectangle(1020, 30, 140, 16, 0x22150c);
    heatBarBg.setStrokeStyle(1, 0x8c5836);
    this.add(heatBarBg);

    this.heatBarFill = scene.add.rectangle(950, 30, 0, 14, 0x2ec4b6);
    this.heatBarFill.setOrigin(0, 0.5);
    this.add(this.heatBarFill);

    // Wave indicator in center
    this.waveText = scene.add.text(1220, 20, 'Волна 1 / 10', {
      fontSize: '20px',
      color: '#f4f1de',
      fontStyle: 'bold'
    });
    this.add(this.waveText);

    // Emergency Valve Button
    this.valveButton = scene.add.rectangle(1580, 30, 230, 40, 0x3d2b1f);
    this.valveButton.setStrokeStyle(2, 0xd4a373);
    this.valveButton.setInteractive({ useHandCursor: true });
    this.add(this.valveButton);

    this.valveText = scene.add.text(1580, 30, 'Сброс пара (Замедл. 60%)', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.valveText);

    this.valveButton.on('pointerdown', () => {
      this.emit('use_valve', 'slow');
    });

    // Sound Mute Toggle Button
    this.soundButton = scene.add.rectangle(1760, 30, 48, 38, 0x2b221a);
    this.soundButton.setStrokeStyle(1, 0x8c5836);
    this.soundButton.setInteractive({ useHandCursor: true });
    this.add(this.soundButton);

    const initialMuted = SoundManager.getInstance().getMuted();
    this.soundText = scene.add.text(1760, 30, initialMuted ? '🔇' : '🔊', {
      fontSize: '18px'
    }).setOrigin(0.5);
    this.add(this.soundText);

    this.soundButton.on('pointerdown', () => {
      const isMuted = SoundManager.getInstance().toggleMute();
      this.soundText.setText(isMuted ? '🔇' : '🔊');
    });

    scene.add.existing(this);
  }

  public updateState(data: {
    boilerHp: number;
    maxBoilerHp: number;
    cogs: number;
    steam: number;
    maxSteam: number;
    heat: number;
    wave: number;
    valveUsed: boolean;
  }): void {
    this.boilerText.setText(`Давление котла: ${data.boilerHp}/${data.maxBoilerHp}`);
    if (data.boilerHp <= 3) {
      this.boilerText.setColor('#ff0054');
    } else {
      this.boilerText.setColor('#e63946');
    }

    this.cogsText.setText(`Шестерни: ${data.cogs}`);
    this.steamText.setText(`Пар: ${data.steam}/${data.maxSteam}`);
    this.heatText.setText(`Нагрев горна: ${data.heat}%`);

    const heatRatio = Math.min(1.0, data.heat / 100);
    this.heatBarFill.setSize(140 * heatRatio, 14);
    if (data.heat >= 60) {
      this.heatBarFill.setFillStyle(0xd90429); // Jam danger!
      this.heatText.setColor('#ff0054');
    } else if (data.heat >= 40) {
      this.heatBarFill.setFillStyle(0xf77f00);
      this.heatText.setColor('#f77f00');
    } else {
      this.heatBarFill.setFillStyle(0x2ec4b6);
      this.heatText.setColor('#ffd166');
    }

    const act = data.wave > 20 ? 3 : (data.wave > 10 ? 2 : 1);
    this.waveText.setText(`Волна ${data.wave}/30 [Акт ${act}]`);

    if (data.valveUsed) {
      this.valveButton.setFillStyle(0x2b2d42);
      this.valveButton.setStrokeStyle(1, 0x6c757d);
      this.valveText.setColor('#6c757d');
      this.valveText.setText('Клапан использован');
    } else {
      this.valveButton.setFillStyle(0x3d2b1f);
      this.valveButton.setStrokeStyle(2, 0xd4a373);
      this.valveText.setColor('#ffd166');
      this.valveText.setText('Сброс пара (Замедление 60%)');
    }
  }
}
