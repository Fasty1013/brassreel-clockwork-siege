import Phaser from 'phaser';
import { UI } from './ModalKit';

type Body = string | (() => string);

const W = 380;
const PAD = 14;

/**
 * InfoTip — "what is this?" hint shown when the pointer rests on any UI element.
 * One shared panel per scene; `attach` wires an existing object, `zone` covers a
 * non-interactive area (HUD counters, the bench...).
 */
export class InfoTip {
  private static byScene = new WeakMap<Phaser.Scene, InfoTip>();

  public static of(scene: Phaser.Scene): InfoTip {
    let tip = this.byScene.get(scene);
    if (!tip) {
      tip = new InfoTip(scene);
      this.byScene.set(scene, tip);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.byScene.delete(scene));
    }
    return tip;
  }

  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private owner: Phaser.GameObjects.GameObject | null = null;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.box = scene.add.container(0, 0).setDepth(3000).setVisible(false);
    this.bg = scene.add.rectangle(0, 0, W, 80, 0x1d1824, 0.98).setOrigin(0, 0);
    this.bg.setStrokeStyle(2, 0xd4a373);
    this.title = scene.add.text(PAD, PAD - 2, '', { fontSize: '20px', color: UI.GOLD, fontStyle: 'bold', wordWrap: { width: W - PAD * 2 } });
    this.body = scene.add.text(PAD, 0, '', { fontSize: '17px', color: UI.CREAM, wordWrap: { width: W - PAD * 2 }, lineSpacing: 3 });
    this.box.add([this.bg, this.title, this.body]);
  }

  /** Show the hint while the pointer is over `obj` (made interactive if it is not yet). */
  public attach(obj: Phaser.GameObjects.GameObject, title: string, body: Body): void {
    if (!obj.input) (obj as Phaser.GameObjects.Image).setInteractive();
    obj.on('pointerover', (p: Phaser.Input.Pointer) => this.show(obj, title, body, p));
    obj.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.owner === obj) this.place(p.x, p.y);
    });
    obj.on('pointerout', () => this.hide(obj));
    obj.on('pointerdown', () => this.hide(obj));
    obj.once(Phaser.GameObjects.Events.DESTROY, () => this.hide(obj));
  }

  /** Invisible hover area for things that are not objects of their own. */
  public zone(x: number, y: number, w: number, h: number, title: string, body: Body, depth = 0): Phaser.GameObjects.Zone {
    const z = this.scene.add.zone(x, y, w, h).setDepth(depth);
    z.setInteractive();
    this.attach(z, title, body);
    return z;
  }

  private show(obj: Phaser.GameObjects.GameObject, title: string, body: Body, p: Phaser.Input.Pointer): void {
    this.owner = obj;
    this.title.setText(title);
    this.body.setText(typeof body === 'function' ? body() : body);
    this.body.setY(this.title.y + this.title.height + 6);
    this.bg.setSize(W, this.body.y + this.body.height + PAD);
    this.box.setVisible(true);
    this.place(p.x, p.y);
  }

  private place(px: number, py: number): void {
    const h = this.bg.height;
    const { width, height } = this.scene.scale;
    let x = px + 22;
    let y = py + 26;
    if (x + W > width - 8) x = px - W - 16;
    if (y + h > height - 8) y = py - h - 16;
    this.box.setPosition(Math.max(8, x), Math.max(8, y));
  }

  private hide(obj: Phaser.GameObjects.GameObject): void {
    if (this.owner !== obj) return;
    this.owner = null;
    this.box.setVisible(false);
  }
}
