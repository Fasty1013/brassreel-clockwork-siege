import Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { backdrop, button, panel, section, text, title, UI } from './ModalKit';
import { AUTO, chooseResolution, RESOLUTIONS, resolutionSetting, resolveResolution, screenBoxPixels } from './Display';
import { fitBox } from './TextStyles';

const STEPS = 10;
const ROW_X = -440;
const W = 880;

/** Pixels of the page kept clear of the camera cut-out / rounded corners (the safe-area padding in index.html). */
function cutoutInsets(): { top: number; right: number; bottom: number; left: number } {
  const s = getComputedStyle(document.body);
  const px = (v: string): number => Math.round((parseFloat(v) || 0) * (window.devicePixelRatio || 1));
  return { top: px(s.paddingTop), right: px(s.paddingRight), bottom: px(s.paddingBottom), left: px(s.paddingLeft) };
}

/**
 * Settings: sound (on/off, effects and background volume) and screen
 * (render resolution: auto by the screen's real pixels, or a fixed preset; full screen).
 * Everything applies at once and is remembered on this device.
 */
export class SettingsModal extends Phaser.GameObjects.Container {
  private content: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);
    backdrop(this, 0.86);
    panel(this, 1040, 900);
    title(this, -390, 'НАСТРОЙКИ');

    button(this, 0, 380, 320, 66, 'ЗАКРЫТЬ', () => {
      SoundManager.getInstance().playButtonClick();
      this.hide();
    }, { kind: 'plain', size: 26 });

    this.setDepth(10500);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public open(): void {
    SoundManager.getInstance().init();
    this.refresh();
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }

  private refresh(): void {
    this.content?.destroy();
    const c = this.scene.add.container(0, 0);
    this.add(c);
    this.content = c;
    this.buildSound(c, -320);
    this.buildScreen(c, -30);
  }

  private click(fn: () => void): () => void {
    return () => {
      fn();
      SoundManager.getInstance().playButtonClick();
      this.refresh();
    };
  }

  // ------------------------------------------------------------ sound

  private buildSound(c: Phaser.GameObjects.Container, y: number): void {
    const snd = SoundManager.getInstance();
    section(c, ROW_X, y, W, 'ЗВУК');

    const muted = snd.getMuted();
    text(c, ROW_X, y + 72, 'Звук', 24, UI.CREAM, { origin: [0, 0.5] });
    button(c, -60, y + 72, 160, 52, 'ВКЛ', this.click(() => snd.setMuted(false)), { kind: muted ? 'plain' : 'primary', size: 22 });
    button(c, 120, y + 72, 160, 52, 'ВЫКЛ', this.click(() => snd.setMuted(true)), { kind: muted ? 'primary' : 'plain', size: 22 });

    this.volumeRow(c, y + 142, 'Эффекты', snd.getVolume(), (v) => snd.setVolume(v), muted);
    this.volumeRow(c, y + 212, 'Гул завода', snd.getAmbientVolume(), (v) => snd.setAmbientVolume(v), muted);
  }

  /** Label, «−», ten tappable segments, «+», percent. */
  private volumeRow(c: Phaser.GameObjects.Container, y: number, label: string, value: number, set: (v: number) => void, muted: boolean): void {
    const level = Math.round(value * STEPS);
    text(c, ROW_X, y, label, 24, muted ? UI.MUTED : UI.CREAM, { origin: [0, 0.5] });
    button(c, -110, y, 56, 52, '−', this.click(() => set((level - 1) / STEPS)), { kind: 'plain', size: 30 });
    for (let i = 0; i < STEPS; i++) {
      const on = i < level;
      const seg = this.scene.add.rectangle(-60 + i * 30 + 14, y, 24, 40, on ? 0xffd166 : 0x2b2638);
      seg.setStrokeStyle(2, on ? 0xd4a373 : 0x534764);
      seg.setAlpha(muted ? 0.45 : 1);
      seg.setInteractive({ useHandCursor: true });
      seg.on('pointerdown', this.click(() => set((i + 1) / STEPS)));
      c.add(seg);
    }
    button(c, 270, y, 56, 52, '+', this.click(() => set((level + 1) / STEPS)), { kind: 'plain', size: 30 });
    text(c, 320, y, `${level * 10}%`, 24, muted ? UI.MUTED : UI.GOLD, { origin: [0, 0.5] });
  }

  // ------------------------------------------------------------ screen

  private buildScreen(c: Phaser.GameObjects.Container, y: number): void {
    const game = this.scene.game;
    const setting = resolutionSetting();
    const auto = resolveResolution(AUTO);
    section(c, ROW_X, y, W, 'ЭКРАН', 'качество картинки: больше — чётче, меньше — быстрее');

    text(c, ROW_X, y + 72, 'Разрешение', 24, UI.CREAM, { origin: [0, 0.5] });
    const options: Array<{ id: string; label: string }> = [
      { id: AUTO, label: `Авто · ${auto.w}×${auto.h}` },
      ...RESOLUTIONS.map((r) => ({ id: r.id, label: `${r.w}×${r.h}` }))
    ];
    options.forEach((o, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      button(c, -140 + col * 220, y + 72 + row * 64, 206, 52, o.label,
        this.click(() => chooseResolution(game, o.id)),
        { kind: o.id === setting ? 'primary' : 'plain', size: 21 });
    });

    // what «auto» sees: the game area in real pixels and the cut-out padding
    const box = screenBoxPixels();
    const cut = cutoutInsets();
    const sides = [
      cut.left && `слева ${cut.left}`, cut.right && `справа ${cut.right}`,
      cut.top && `сверху ${cut.top}`, cut.bottom && `снизу ${cut.bottom}`
    ].filter(Boolean);
    const now = `${game.scale.gameSize.width}×${game.scale.gameSize.height}`;
    fitBox(text(c, 0, y + 214,
      `Сейчас ${now} · место под игру ${box.w}×${box.h} px · ` +
      (sides.length ? `обход выреза камеры: ${sides.join(', ')} px` : 'вырезов камеры нет'),
      18, UI.MUTED), W);
    fitBox(text(c, 0, y + 246, 'Авто подбирает разрешение по экрану и меняет его при повороте или изменении окна.', 18, UI.MUTED), W);

    // full screen (the Android app is always full screen)
    if (game.device.fullscreen.available) {
      const full = game.scale.isFullscreen;
      text(c, ROW_X, y + 304, 'Полный экран', 24, UI.CREAM, { origin: [0, 0.5] });
      button(c, -60, y + 304, 160, 52, full ? 'ВЫЙТИ' : 'ВКЛЮЧИТЬ', () => {
        SoundManager.getInstance().playButtonClick();
        if (game.scale.isFullscreen) game.scale.stopFullscreen();
        else game.scale.startFullscreen();
        // the page changes size a moment later: «auto» refits, the window redraws
        this.scene.time.delayedCall(400, () => { if (this.visible) this.refresh(); });
      }, { kind: 'plain', size: 22 });
    }
  }
}
