import Phaser from 'phaser';
import { CORES_DATA } from '@data/cores';
import { t } from '@data/i18n';
import { SoundManager } from '../audio/SoundManager';
import { backdrop, button, card, panel, text, title, UI } from './ModalKit';

const TAG_RU: Record<string, string> = {
  reel: 'барабаны', reels: 'барабаны', smelt: 'слияние', heat: 'жар', economy: 'экономика',
  combat: 'бой', wild: 'джокер', hold: 'удержание', nudge: 'сдвиг', boss: 'боссы', steam: 'пар',
  combo: 'комбо', defense: 'защита', faction: 'фракции', fodder: 'утиль', overclock: 'разгон', skill: 'мастерство'
};

/** Engine-core draft: pick one permanent rule change for the run. */
export class CoreDraftModal extends Phaser.GameObjects.Container {
  private cardsContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    backdrop(this, 0.8);
    panel(this, 1180, 680);
    title(this, -270, 'ВЫБОР ЯДРА ДВИГАТЕЛЯ', 'Ядро навсегда меняет правила барабанов и кузницы до конца забега');

    this.cardsContainer = scene.add.container(0, 50);
    this.add(this.cardsContainer);

    this.setVisible(false);
    this.setDepth(900);
    scene.add.existing(this);
  }

  public showDraft(coreIds: string[]): void {
    this.cardsContainer.removeAll(true);
    SoundManager.getInstance().playReelStop(1);

    const spacing = 370;
    const startX = -((coreIds.length - 1) * spacing) / 2;
    const c = this.cardsContainer;

    coreIds.forEach((coreId, index) => {
      const core = CORES_DATA[coreId];
      if (!core) return;
      const x = startX + index * spacing;

      card(c, x, 0, 340, 440);
      text(c, x, -170, t(core.nameKey), 26, UI.GOLD, { fontStyle: 'bold', align: 'center', wordWrap: { width: 300 } });

      const tags = core.tags.map((tg) => TAG_RU[tg.toLowerCase()] ?? tg.toLowerCase()).join(' · ');
      text(c, x, -122, tags, 17, UI.TEAL);
      c.add(this.scene.add.rectangle(x, -100, 280, 2, 0x534764));

      text(c, x, -10, t(core.descKey), 20, UI.CREAM, { align: 'center', lineSpacing: 6, wordWrap: { width: 290 } });

      button(c, x, 170, 280, 62, 'УСТАНОВИТЬ', () => {
        SoundManager.getInstance().playPaylineWin(1);
        this.emit('core_selected', coreId);
        this.setVisible(false);
      }, { size: 26 });
    });

    this.setVisible(true);
  }
}
