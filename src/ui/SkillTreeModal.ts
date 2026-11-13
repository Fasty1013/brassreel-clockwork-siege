import Phaser from 'phaser';
import type { RunState } from '@core/state/RunState';
import { SkillManager } from '@core/skills/skills';
import { SKILL_BRANCHES, SKILLS, SkillNode } from '@data/skills';
import { backdrop, button, card, panel, pips, text, title, UI } from './ModalKit';

const COL_W = 350;
const ROW_H = 208;
const TOP = -168;

/**
 * Skill tree window: 4 branches (columns) × 3 tiers (rows).
 * A node unlocks when the node above it has at least rank 1.
 * Emits `buy_skill` (skillId) and `closed`.
 */
export class SkillTreeModal extends Phaser.GameObjects.Container {
  private dynamic: Phaser.GameObjects.Container;
  private cogsText: Phaser.GameObjects.Text;
  private capText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    backdrop(this, 0.84);
    panel(this, 1520, 940);
    title(this, -420, 'ДРЕВО НАВЫКОВ', 'Улучшения действуют до конца забега · узел открывается после узла над ним');

    const bal = scene.add.rectangle(-330, -330, 300, 46, 0x15121b);
    bal.setStrokeStyle(2, 0x534764);
    this.add(bal);
    this.add(scene.add.image(-450, -330, 'sym_cog').setScale(1.5));
    text(this, -422, -330, 'Шестерни:', 22, UI.CREAM, { origin: [0, 0.5] });
    this.cogsText = text(this, -200, -330, '0', 28, UI.GOLD, { origin: [1, 0.5] });

    const cap = scene.add.rectangle(330, -330, 300, 46, 0x15121b);
    cap.setStrokeStyle(2, 0x534764);
    this.add(cap);
    this.capText = text(this, 330, -330, '', 22, UI.CREAM);

    // branch headers
    SKILL_BRANCHES.forEach((b, i) => {
      const x = (i - 1.5) * COL_W;
      text(this, x, -272, b.name.toUpperCase(), 26, b.color, { fontStyle: 'bold' });
    });

    this.dynamic = scene.add.container(0, 0);
    this.add(this.dynamic);

    button(this, 0, 420, 320, 62, 'ЗАКРЫТЬ', () => this.hide(), { kind: 'plain', size: 26 });

    this.setDepth(950);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public open(state: RunState, canBuyNow: boolean): void {
    this.refresh(state, canBuyNow);
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
    this.emit('closed');
  }

  public refresh(state: RunState, canBuyNow: boolean): void {
    const c = this.dynamic;
    c.removeAll(true);
    this.cogsText.setText(`${state.economy.cogs}`);
    this.capText.setText(`Роботов на поле:  ${state.deployedUnits.length} / ${SkillManager.unitCap(state)}`);

    SKILL_BRANCHES.forEach((branch, col) => {
      const x = (col - 1.5) * COL_W;
      const nodes = SKILLS.filter((s) => s.branch === branch.id).sort((a, b) => a.tier - b.tier);
      const tint = Phaser.Display.Color.HexStringToColor(branch.color).color;

      nodes.forEach((node) => {
        const y = TOP + node.tier * ROW_H;
        const unlocked = SkillManager.isUnlocked(state, node.id);

        // connector to the node above
        if (node.tier > 0) {
          c.add(this.scene.add.rectangle(x, y - ROW_H / 2, 6, ROW_H - 178 + 8, unlocked ? tint : 0x3a3648));
        }
        this.renderNode(c, x, y, node, state, canBuyNow, tint);
      });
    });
  }

  private renderNode(
    c: Phaser.GameObjects.Container, x: number, y: number, node: SkillNode,
    state: RunState, canBuyNow: boolean, tint: number
  ): void {
    const rank = SkillManager.rank(state, node.id);
    const isMax = rank >= node.maxRank;
    const unlocked = SkillManager.isUnlocked(state, node.id);
    const cost = SkillManager.nextCost(state, node.id);
    const reject = SkillManager.canBuy(state, node.id, canBuyNow);
    const affordable = reject === null;

    const bg = card(c, x, y, 326, 178, affordable);
    if (!unlocked) bg.setAlpha(0.55);

    const nameColor = unlocked ? UI.GOLD : UI.MUTED;
    text(c, x, y - 64, node.name, 21, nameColor, { fontStyle: 'bold', align: 'center', wordWrap: { width: 300 } });
    pips(c, x, y - 36, rank, node.maxRank, isMax ? 0x5ae0d0 : tint);
    text(c, x, y + 2, node.desc.replace('{n}', `${node.perRank}`), 17, unlocked ? UI.CREAM : UI.MUTED, {
      align: 'center', wordWrap: { width: 296 }, lineSpacing: 2
    });

    if (isMax) {
      button(c, x, y + 56, 230, 46, 'МАКСИМУМ', () => undefined, { size: 20, disabled: true, color: UI.TEAL });
      return;
    }
    if (!unlocked) {
      button(c, x, y + 56, 230, 46, 'ЗАКРЫТО', () => undefined, { size: 20, disabled: true });
      return;
    }
    const label = reject === 'wrong_phase' ? `ПОСЛЕ БОЯ  ${cost}` : `КУПИТЬ  ${cost}`;
    const btn = button(c, x - 12, y + 56, 230, 46, label, () => this.emit('buy_skill', node.id), {
      size: 20, disabled: !affordable
    });
    btn.bg.x = x;
    const icon = this.scene.add.image(btn.label.x + btn.label.width / 2 + 16, y + 56, 'sym_cog').setAlpha(affordable ? 1 : 0.5);
    c.add(icon);
  }
}
