import Phaser from 'phaser';
import { WAVES_DATA } from '@data/waves';
import { ACTS, WAVES_PER_ACT } from '@data/acts';
import { t } from '@data/i18n';
import { backdrop, button, panel, text, title, UI } from './ModalKit';
import { fitBox } from './TextStyles';

const TILE_W = 132;
const TILE_H = 112;
const TILE_GAP = 8;
const ROW_H = 232;
const TOP = -296;

/**
 * Campaign map: all 3 acts × 10 waves, the waves already beaten,
 * the current one ("вы здесь"), inspections and bosses.
 */
export class CampaignMapModal extends Phaser.GameObjects.Container {
  private dynamic: Phaser.GameObjects.Container;
  private subtitle: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 960, 540);

    backdrop(this, 0.84);
    panel(this, 1520, 940);
    title(this, -420, 'КАРТА КАМПАНИИ');
    this.subtitle = text(this, 0, -376, '', 22, UI.MUTED);

    this.dynamic = scene.add.container(0, 0);
    this.add(this.dynamic);

    // legend
    const legend: [number, string, string][] = [
      [0x3a5a40, '✓', 'пройдена'],
      [0xffd166, '▶', 'вы здесь'],
      [0x1f6f6b, '⚙', 'инспекция ОТК'],
      [0x7a1f2b, '★', 'босс']
    ];
    legend.forEach(([color, mark, label], i) => {
      const x = -560 + i * 300;
      const sw = scene.add.rectangle(x, 422, 30, 30, color);
      sw.setStrokeStyle(2, 0x534764);
      this.add(sw);
      text(this, x, 422, mark, 18, UI.CREAM, { fontStyle: 'bold' });
      text(this, x + 26, 422, label, 20, UI.MUTED, { origin: [0, 0.5] });
    });

    button(this, 600, 422, 240, 56, 'ЗАКРЫТЬ', () => this.hide(), { kind: 'plain', size: 24 });

    this.setDepth(950);
    this.setVisible(false);
    scene.add.existing(this);
  }

  public open(currentWave: number): void {
    this.refresh(currentWave);
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
    this.emit('closed');
  }

  private refresh(currentWave: number): void {
    const c = this.dynamic;
    c.removeAll(true);
    const total = WAVES_DATA.length;
    const act = ACTS[Math.min(ACTS.length, Math.ceil(currentWave / WAVES_PER_ACT)) - 1];
    this.subtitle.setText(
      `Акт ${act.act} из ${ACTS.length} · ${act.name} · волна ${currentWave} из ${total} · пройдено ${currentWave - 1}`
    );

    const rowW = WAVES_PER_ACT * TILE_W + (WAVES_PER_ACT - 1) * TILE_GAP;
    const left = -rowW / 2;

    ACTS.forEach((info, row) => {
      const y = TOP + row * ROW_H;
      const accent = Phaser.Display.Color.HexStringToColor(info.color).color;
      const headColor = currentWave > (row + 1) * WAVES_PER_ACT ? UI.GREEN : info.color;
      text(c, left, y, `АКТ ${info.act} · ${info.name.toUpperCase()}`, 26, headColor, {
        fontStyle: 'bold',
        origin: [0, 0.5]
      });
      text(c, left + rowW, y, `босс: ${info.boss} · часть Регулятора: ${info.part}`, 20, UI.MUTED, { origin: [1, 0.5] });

      for (let i = 0; i < WAVES_PER_ACT; i++) {
        const wave = row * WAVES_PER_ACT + i + 1;
        const def = WAVES_DATA[wave - 1];
        if (!def) continue;
        const x = left + i * (TILE_W + TILE_GAP) + TILE_W / 2;
        const ty = y + 30 + TILE_H / 2;
        const done = wave < currentWave;
        const here = wave === currentWave;

        let fill = 0x231d2c;
        if (def.isBoss) fill = 0x7a1f2b;
        else if (def.isInspection) fill = 0x1f6f6b;
        if (done) fill = 0x3a5a40;

        const tile = c.scene.add.rectangle(x, ty, TILE_W, TILE_H, fill, done ? 0.75 : 1);
        tile.setStrokeStyle(here ? 4 : 2, here ? 0xffd166 : def.isBoss ? accent : 0x534764);
        c.add(tile);

        const mark = done ? '✓' : here ? '▶' : def.isBoss ? '★' : def.isInspection ? '⚙' : '';
        text(c, x - TILE_W / 2 + 10, ty - TILE_H / 2 + 16, `${wave}`, 22, here ? UI.GOLD : done ? UI.GREEN : UI.CREAM, {
          fontStyle: 'bold',
          origin: [0, 0.5]
        });
        if (mark) {
          text(c, x + TILE_W / 2 - 10, ty - TILE_H / 2 + 16, mark, 20, here ? UI.GOLD : done ? UI.GREEN : UI.CREAM, {
            fontStyle: 'bold',
            origin: [1, 0.5]
          });
        }
        const name = t(def.titleKey).replace(/^(ФИНАЛЬНЫЙ БОСС|БОСС|Инспекция):\s*/, '');
        // long single words («рельсотронов») and phone-size text must stay inside the tile
        fitBox(text(c, x, ty + 14, name, 15, done ? UI.MUTED : UI.CREAM, {
          align: 'center',
          wordWrap: { width: TILE_W - 12 }
        }), TILE_W - 8, TILE_H - 34);
        if (here) {
          text(c, x, ty + TILE_H / 2 + 14, 'ВЫ ЗДЕСЬ', 15, UI.GOLD, { fontStyle: 'bold' });
        }
      }
    });
  }
}
