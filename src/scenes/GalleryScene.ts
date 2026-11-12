import Phaser from 'phaser';
import { BESTIARY, registerForgeArt, ROSTER } from '../art/forge';

/**
 * Debug gallery (`?debug=gallery`): every forged sprite at battlefield scale.
 * Keys: 1 idle, 2 walk, 3 attack loop. `&page=enemies` shows the bestiary.
 */
export class GalleryScene extends Phaser.Scene {
  constructor() {
    super('GalleryScene');
  }

  public create(): void {
    registerForgeArt(this);
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') ?? 'units';
    const scale = Number(params.get('scale') ?? 3);
    const anim = params.get('anim') ?? 'idle';
    const defs = page === 'enemies' ? BESTIARY : ROSTER;

    this.add.rectangle(960, 540, 1920, 1080, 0x6fae4a);
    for (let i = 0; i < 40; i++) {
      this.add.rectangle((i * 197) % 1920, (i * 331) % 1080, 6, 3, 0x5c9a3e);
    }

    const sprites: Phaser.GameObjects.Sprite[] = [];
    let x = 30;
    let y = 30;
    let rowH = 0;
    for (const def of defs) {
      const w = def.size * scale;
      if (x + w > 1900) {
        x = 30;
        y += rowH + 44;
        rowH = 0;
      }
      rowH = Math.max(rowH, w);
      const footY = y + w;
      this.add.ellipse(x + w / 2, footY - scale * 2, w * 0.55, scale * 4, 0x1b2a14, 0.35);
      const s = this.add.sprite(x + w / 2, footY, def.key).setOrigin(0.5, 1).setScale(scale);
      if (page === 'enemies') s.setFlipX(true);
      sprites.push(s);
      this.add.text(x + w / 2, footY + 4, def.key.replace('tex_', ''), {
        fontFamily: 'monospace', fontSize: '13px', color: '#12200c'
      }).setOrigin(0.5, 0);
      x += w + 14;
    }

    const play = (suffix: string): void => {
      sprites.forEach((s, i) => {
        const key = `${defs[i].key}_${suffix}`;
        if (!this.anims.exists(key)) return;
        s.play({ key, repeat: -1, repeatDelay: suffix === 'attack' ? 500 : 0 });
      });
    };
    play(anim);
    this.input.keyboard?.on('keydown-ONE', () => play('idle'));
    this.input.keyboard?.on('keydown-TWO', () => play('walk'));
    this.input.keyboard?.on('keydown-THREE', () => play('attack'));
  }
}
