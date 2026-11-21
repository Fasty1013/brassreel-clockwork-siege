import Phaser from 'phaser';
import { MetaManager } from '@core/meta/metaManager';
import { CampaignManager } from '@core/campaign/campaign';
import { CHAPTERS, STORY_SCENES, THREAT_LEVELS } from '@data/story';
import { SoundManager } from '../audio/SoundManager';
import { backdrop, button, card, panel, text, title, UI } from './ModalKit';
import { DialogueModal } from './DialogueModal';
import { fitBox } from './TextStyles';

/**
 * Campaign «Великий Регулятор»: goal, chapters with their parts, threat level
 * for the next run and the chronicle of story scenes already seen.
 */
export class CampaignModal extends Phaser.GameObjects.Container {
  private content?: Phaser.GameObjects.Container;
  private onStart: () => void;

  constructor(scene: Phaser.Scene, onStart: () => void) {
    super(scene, 960, 540);
    this.onStart = onStart;
    backdrop(this, 0.88);
    panel(this, 1500, 940);
    title(this, -420, 'КАМПАНИЯ: ВЕЛИКИЙ РЕГУЛЯТОР', 'Верните три части Регулятора и запустите часы Нью-Брассхольма');

    button(this, -170, 410, 300, 62, 'В БОЙ ▶', () => {
      SoundManager.getInstance().playButtonClick();
      this.setVisible(false);
      this.onStart();
    }, { size: 26 });
    button(this, 170, 410, 300, 62, 'ЗАКРЫТЬ', () => {
      SoundManager.getInstance().playButtonClick();
      this.setVisible(false);
    }, { kind: 'plain', size: 24 });

    this.setDepth(10500);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public open(): void {
    this.refresh();
    this.setVisible(true);
  }

  private refresh(): void {
    this.content?.destroy();
    const c = this.scene.add.container(0, 0);
    this.add(c);
    this.content = c;
    const meta = MetaManager.load();
    const found = CampaignManager.partsFound(meta);

    // regulator progress
    text(c, 0, -322, `Собрано частей: ${found} / ${CHAPTERS.length}${CampaignManager.isComplete(meta) ? ' — Регулятор запущен!' : ''}`, 22,
      CampaignManager.isComplete(meta) ? UI.GREEN : UI.CREAM);

    // chapters
    CHAPTERS.forEach((ch, i) => {
      const x = -480 + i * 480;
      const y = -150;
      const got = CampaignManager.hasPart(meta, ch.part.id);
      card(c, x, y, 450, 290, got);
      text(c, x, y - 118, ch.title, 23, UI.GOLD, { fontStyle: 'bold' });
      fitBox(text(c, x, y - 82, `Место: ${ch.place} · Босс: ${ch.boss}`, 17, UI.MUTED), 430);
      text(c, x, y - 30, ch.goal, 19, UI.CREAM, { align: 'center', wordWrap: { width: 400 } });
      c.add(this.scene.add.image(x - 110, y + 50, ch.part.icon).setScale(2.5).setAlpha(got ? 1 : 0.25));
      text(c, x - 70, y + 38, ch.part.name, 21, got ? UI.GOLD : UI.MUTED, { origin: [0, 0.5] });
      fitBox(text(c, x - 70, y + 64, got ? 'возвращён' : `у врага · награда ${ch.firstClearReward} очищ.`, 16, got ? UI.GREEN : UI.MUTED, { origin: [0, 0.5] }), 285);
    });

    // threat levels
    text(c, -700, 40, 'УГРОЗА', 22, UI.GOLD, { origin: [0, 0.5] });
    const active = CampaignManager.activeThreat(meta);
    THREAT_LEVELS.forEach((t, i) => {
      const unlocked = t.level <= meta.campaign.threatUnlocked;
      const x = -390 + i * 300;
      const b = button(c, x, 40, 280, 52, unlocked ? t.name : '🔒 ' + t.name, () => {
        const m = MetaManager.load();
        if (CampaignManager.selectThreat(m, t.level)) {
          MetaManager.save(m);
          SoundManager.getInstance().playButtonClick();
          this.refresh();
        }
      }, { size: 19, kind: t.level === active ? 'primary' : 'plain', disabled: !unlocked });
      if (t.level === active) b.bg.setStrokeStyle(4, 0xffd166);
    });
    const best = meta.campaign.bestWaveByThreat[String(active)] ?? 0;
    const cleared = meta.campaign.bestThreatCleared >= active;
    text(c, 0, 92,
      `${THREAT_LEVELS[active].desc}  Лучший результат: ${cleared ? 'пройдено!' : `волна ${best}/30`}` +
      (meta.campaign.threatUnlocked < CampaignManager.MAX_THREAT ? '  · Следующая угроза откроется после победы.' : ''),
      17, UI.MUTED);

    // chronicle
    text(c, -700, 165, 'ХРОНИКА', 22, UI.GOLD, { origin: [0, 0.5] });
    const seen = Object.values(STORY_SCENES).filter((sc) => CampaignManager.seen(meta, sc.id));
    if (seen.length === 0) {
      text(c, -560, 165, 'Сцены появятся здесь, когда вы увидите их в забеге.', 18, UI.MUTED, { origin: [0, 0.5] });
    }
    seen.forEach((sc, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = -450 + col * 255;
      const y = 165 + row * 62;
      button(c, x, y, 240, 50, sc.title, () => {
        SoundManager.getInstance().playButtonClick();
        DialogueModal.play(this.scene, sc);
      }, { size: 15, kind: 'plain' });
    });
  }
}
