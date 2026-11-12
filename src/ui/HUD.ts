import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';

export class HUD extends Phaser.GameObjects.Container {
  private boilerText: Phaser.GameObjects.Text;
  private cogsText: Phaser.GameObjects.Text;
  private steamText: Phaser.GameObjects.Text;
  private heatText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private valveButton: Phaser.GameObjects.Rectangle;
  private valveText: Phaser.GameObjects.Text;
  private soundButton: Phaser.GameObjects.Rectangle;
  private soundText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Floating HUD Cartouche Pills spanning x: 480 to 1860 at y: 32
    // 1. Cogs (Gold) Pill
    const cogsPill = scene.add.image(580, 32, 'ui_hud_pill_gold');
    cogsPill.setScale(2.5);
    this.add(cogsPill);
    this.cogsText = scene.add.text(595, 32, '350', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.cogsText);

    // 2. Boiler HP (Hearts) Pill
    const hpPill = scene.add.image(760, 32, 'ui_hud_pill_boiler');
    hpPill.setScale(2.5);
    this.add(hpPill);
    this.boilerText = scene.add.text(775, 32, '10/10', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.boilerText);

    // 3. Units Deployed Pill
    const unitsPill = scene.add.image(940, 32, 'ui_hud_pill_units');
    unitsPill.setScale(2.5);
    this.add(unitsPill);
    this.waveText = scene.add.text(955, 32, '3/5', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#a8dadc',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.waveText);

    // 4. Steam / Heat Manometer Pill
    const steamPill = scene.add.image(1140, 32, 'ui_hud_pill_steam');
    steamPill.setScale(2.5);
    this.add(steamPill);
    this.steamText = scene.add.text(1125, 32, '3/5', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#00b4d8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.steamText);

    this.heatText = scene.add.text(1175, 32, '0%', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#f77f00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.heatText);

    // 5. Emergency Valve Button
    this.valveButton = scene.add.rectangle(1540, 32, 220, 36, 0x2b221a);
    this.valveButton.setStrokeStyle(2, 0xd4a373);
    this.valveButton.setInteractive({ useHandCursor: true });
    this.add(this.valveButton);

    this.valveText = scene.add.text(1540, 32, 'КЛАПАН (V: -60%)', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.valveText);

    this.valveButton.on('pointerdown', () => {
      this.emit('use_valve', 'slow');
    });

    // 6. Sound Toggle Button
    this.soundButton = scene.add.rectangle(1820, 32, 44, 36, 0x241d2c);
    this.soundButton.setStrokeStyle(1, 0x8c5836);
    this.soundButton.setInteractive({ useHandCursor: true });
    this.add(this.soundButton);

    const initialMuted = SoundManager.getInstance().getMuted();
    this.soundText = scene.add.text(1820, 32, initialMuted ? '🔇' : '🔊', {
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
    activeCores?: string[];
  }): void {
    this.boilerText.setText(`${data.boilerHp}/${data.maxBoilerHp}`);
    if (data.boilerHp <= 3) {
      this.boilerText.setColor('#ff0054');
    } else {
      this.boilerText.setColor('#ff6b6b');
    }

    this.cogsText.setText(`${data.cogs}`);
    this.steamText.setText(`${data.steam}/${data.maxSteam}`);
    this.heatText.setText(`${data.heat}%`);

    if (data.heat >= 60) {
      this.heatText.setColor('#ff0054');
    } else if (data.heat >= 40) {
      this.heatText.setColor('#f77f00');
    } else {
      this.heatText.setColor('#2ec4b6');
    }

    if (data.valveUsed) {
      this.valveButton.setFillStyle(0x1a1512);
      this.valveText.setColor('#6c757d');
    } else {
      this.valveButton.setFillStyle(0x2b221a);
      this.valveText.setColor('#ffd166');
    }
  }

  public updateUnitsCount(deployed: number, max: number): void {
    this.waveText.setText(`${deployed}/${max}`);
  }
}
