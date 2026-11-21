import Phaser from 'phaser';
import { SPEAKERS, StoryScene } from '@data/story';
import { SoundManager } from '../audio/SoundManager';
import { text, UI } from './ModalKit';
import { keyHint, TOUCH_ONLY } from './TextStyles';

const CHAR_MS = 22;
const PORTRAIT = 200;

/**
 * Story dialogue over the game: portrait, speaker name and typed-out text.
 * Click / Space / Enter shows the rest of the line or goes to the next one,
 * Esc skips the scene. The scene's own keyboard is paused while it is open,
 * so Space does not spin the reels underneath.
 */
export class DialogueModal extends Phaser.GameObjects.Container {
  private story: StoryScene;
  private index = 0;
  private shown = 0;
  private full = '';
  private typing?: Phaser.Time.TimerEvent;
  private portraitBox: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private counterText: Phaser.GameObjects.Text;
  private onDone: () => void;
  private keyHandler: (e: KeyboardEvent) => void;
  private keyboardWasEnabled = true;
  private finished = false;
  /** dialogues on screen right now, and when the last one was closed (performance.now) */
  private static openCount = 0;
  private static closedAt = -Infinity;

  /**
   * True while a dialogue is open or was closed a moment ago. The key that closes a
   * dialogue (Esc, Space, Enter) still reaches the scene's own keys on the next frame,
   * so scene hotkeys check this to ignore that same press.
   */
  public static isBusy(graceMs = 250): boolean {
    return DialogueModal.openCount > 0 || performance.now() - DialogueModal.closedAt < graceMs;
  }

  /** Show a story scene; `onDone` runs after the last line or a skip. */
  public static play(scene: Phaser.Scene, story: StoryScene, onDone: () => void = () => undefined): DialogueModal {
    return new DialogueModal(scene, story, onDone);
  }

  private constructor(scene: Phaser.Scene, story: StoryScene, onDone: () => void) {
    super(scene, 960, 540);
    this.story = story;
    this.onDone = onDone;

    const shade = scene.add.rectangle(0, 0, 1920, 1080, 0x07050a, 0.6);
    shade.setInteractive();
    shade.on('pointerdown', () => this.advance());
    this.add(shade);

    // chapter / scene title plate
    const plate = scene.add.rectangle(0, -400, 820, 84, 0x1d1824);
    plate.setStrokeStyle(4, 0xd4a373);
    this.add(plate);
    text(this, 0, -400, story.title, 36, UI.GOLD, { fontStyle: 'bold' });

    // dialogue panel
    const box = scene.add.rectangle(0, 300, 1560, 330, 0x1d1824);
    box.setStrokeStyle(4, 0xd4a373);
    box.setInteractive();
    box.on('pointerdown', () => this.advance());
    this.add(box);

    const frame = scene.add.rectangle(-620, 300, PORTRAIT + 40, PORTRAIT + 40, 0x15121b);
    frame.setStrokeStyle(2, 0x534764);
    this.add(frame);
    this.portraitBox = scene.add.container(-620, 300);
    this.add(this.portraitBox);

    this.nameText = text(this, -470, 175, '', 26, UI.GOLD, { origin: [0, 0.5], fontStyle: 'bold' });
    this.bodyText = text(this, -470, 210, '', 28, UI.CREAM, {
      origin: [0, 0],
      wordWrap: { width: 1150 },
      lineSpacing: 8
    });
    this.counterText = text(this, 740, 440, '', 17, UI.MUTED, { origin: [1, 0.5] });

    const skip = scene.add.text(740, 160, `Пропустить${keyHint('Esc')}`, { fontSize: '18px', color: UI.MUTED }).setOrigin(1, 0.5);
    skip.setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.finish());
    this.add(skip);

    // keyboard: pause the scene's own keys, listen on the window instead
    const kb = scene.input.keyboard;
    if (kb) {
      this.keyboardWasEnabled = kb.enabled;
      kb.enabled = false;
    }
    DialogueModal.openCount++;
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') this.finish();
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') this.advance();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', this.keyHandler);
    this.once(Phaser.GameObjects.Events.DESTROY, () => window.removeEventListener('keydown', this.keyHandler));

    this.setDepth(11000);
    scene.add.existing(this);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 180 });
    this.showLine();
  }

  private showLine(): void {
    const line = this.story.lines[this.index];
    const who = SPEAKERS[line.speaker];
    this.nameText.setText(who.name).setColor(who.color);
    this.counterText.setText(`${this.index + 1} / ${this.story.lines.length}   ${TOUCH_ONLY ? 'Касание' : 'Пробел или клик'} — дальше`);

    this.portraitBox.removeAll(true);
    if (this.scene.textures.exists(who.portrait)) {
      const img = this.scene.add.image(0, 0, who.portrait);
      const k = Math.max(1, Math.floor(PORTRAIT / Math.max(img.width, img.height)));
      img.setScale(k);
      this.portraitBox.add(img);
      // a small "talking" bob
      this.scene.tweens.add({ targets: img, y: -4, duration: 220, yoyo: true, repeat: 1 });
    }

    this.full = line.text;
    this.shown = 0;
    this.bodyText.setText('');
    this.typing?.remove();
    this.typing = this.scene.time.addEvent({
      delay: CHAR_MS,
      repeat: this.full.length - 1,
      callback: () => {
        this.shown++;
        this.bodyText.setText(this.full.slice(0, this.shown));
      }
    });
  }

  private advance(): void {
    if (this.finished) return;
    if (this.shown < this.full.length) {
      // first press finishes the line
      this.typing?.remove();
      this.shown = this.full.length;
      this.bodyText.setText(this.full);
      return;
    }
    SoundManager.getInstance().playButtonClick();
    this.index++;
    if (this.index >= this.story.lines.length) this.finish();
    else this.showLine();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    DialogueModal.openCount = Math.max(0, DialogueModal.openCount - 1);
    DialogueModal.closedAt = performance.now();
    this.typing?.remove();
    const kb = this.scene.input.keyboard;
    if (kb) kb.enabled = this.keyboardWasEnabled;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.destroy();
        this.onDone();
      }
    });
  }
}
