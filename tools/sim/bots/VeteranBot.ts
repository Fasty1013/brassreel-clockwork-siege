import { BotPolicy } from './BotPolicy';
import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';
import { ReelSymbol, SlotSymbol } from '@core/reels/reels';
import { SkillManager } from '@core/skills/skills';
import { SmeltManager } from '@core/smelt/smelt';
import { UnitInstance } from '@core/units/unitFactory';
import { UNITS_DATA } from '@data/units';
import { BALANCE } from '@data/balance';
import { GADGETS_DATA } from '@data/gadgets';
import { GadgetManager } from '@core/gadgets/gadgets';
import { EconomyManager } from '@core/economy/economy';
import { CoreEffects } from '@core/cores/coreEffects';

export interface VeteranOptions {
  /** buy skill-tree nodes */
  skills: boolean;
  /** use reel holds and nudges */
  holds: boolean;
  /** focus the reels on the main robot line (cut other lines, add and gild the main one) */
  symbols: boolean;
  /** buy workshop gadgets */
  gadgets: boolean;
  /** rank-by-rank buying order; the bot saves up for the next entry */
  skillOrder: string[];
}

/** Field first, then economy, then damage and health, then the expensive tail. */
export const DEFAULT_SKILL_ORDER: string[] = [
  'log_hangar', 'log_hangar', 'log_salvage', 'log_hangar',
  'ars_whetstone', 'arm_plating', 'log_salvage', 'ars_whetstone', 'arm_plating',
  'log_salvage', 'ars_whetstone', 'arm_plating',
  'log_command', 'ars_grease', 'log_command', 'ars_grease', 'ars_grease',
  'ars_overheat', 'arm_plates', 'ars_overheat', 'arm_plates', 'arm_plates',
  'arm_boiler', 'arm_boiler', 'mech_spin', 'mech_spin', 'mech_hold', 'mech_hold', 'mech_nudge', 'mech_nudge'
];

/** The bot's taste in permanent gadgets, best first. */
const PASSIVE_PREFERENCE = [
  'gadget_toolkit', 'gadget_oil_can', 'gadget_lens_array', 'gadget_reinforced_boiler',
  'gadget_brass_knuckles', 'gadget_gunpowder_flask', 'gadget_sharpening_stone', 'gadget_iron_plates',
  'gadget_chrono_gear', 'gadget_cog_wrench', 'gadget_discount_coupon', 'gadget_pressure_spring',
  'gadget_magnet_arm', 'gadget_copper_coil', 'gadget_lucky_coin', 'gadget_golden_key',
  'gadget_scrap_magnet', 'gadget_steam_battery', 'gadget_steam_gauge', 'gadget_insulated_gloves'
];

const JACKPOT_VALUE = 4; // a level-3 legendary is worth about four fresh robots
const ROW_ORDER = [2, 1, 3, 0, 4];
const FRONT_COL = 5;
const BACK_COL = 2;

type Strips = [ReelSymbol[], ReelSymbol[], ReelSymbol[]];
type Idx = [number, number, number];

function lineValue(a: SlotSymbol, b: SlotSymbol, c: SlotSymbol): number {
  if (a === 'crown' || b === 'crown' || c === 'crown') {
    return a === 'crown' && b === 'crown' && c === 'crown' ? JACKPOT_VALUE : 0;
  }
  const base = a !== 'wild' ? a : b !== 'wild' ? b : c;
  return (a === base || a === 'wild') && (b === base || b === 'wild') && (c === base || c === 'wild') ? 1 : 0;
}

/** Summons a 3x3 window is worth. Mirrors ReelManager.evaluateGrid without allocations. */
function gridValue(strips: Strips, idx: Idx, mirror: boolean): number {
  const g = (r: number, k: number): SlotSymbol => strips[r][(idx[r] + k) % strips[r].length].symbol;
  let total = 0;
  for (let k = 0; k < 3; k++) {
    const v = lineValue(g(0, k), g(1, k), g(2, k));
    total += v === 1 && mirror ? 2 : v;
  }
  for (let r = 0; r < 3; r++) total += lineValue(g(r, 0), g(r, 1), g(r, 2));
  total += lineValue(g(0, 0), g(1, 1), g(2, 2));
  total += lineValue(g(0, 2), g(1, 1), g(2, 0));
  return total;
}

/** Expected summons of the next spin when the reels in `mask` stay where they are. */
function expectedValue(strips: Strips, idx: Idx, mask: number, mirror: boolean): number {
  const free = [0, 1, 2].filter((r) => !(mask & (1 << r)));
  const cur: Idx = [idx[0], idx[1], idx[2]];
  let sum = 0;
  let n = 0;
  const walk = (k: number): void => {
    if (k === free.length) {
      sum += gridValue(strips, cur, mirror);
      n++;
      return;
    }
    const r = free[k];
    for (let i = 0; i < strips[r].length; i++) {
      cur[r] = i;
      walk(k + 1);
    }
  };
  walk(0);
  return sum / n;
}

const popcount = (m: number): number => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1);

/**
 * Plays by the current rules the way an attentive player would: holds reels
 * that already show a line, merges only when the field is full, keeps the
 * strongest robots on the field with one blocker per lane, and buys skills.
 * It is called repeatedly within a phase and reacts to what the reels gave.
 */
export class VeteranBot implements BotPolicy {
  public name: string;
  public interactive = true;
  private opts: VeteranOptions;
  private baselineCache = new Map<string, number>();
  private rerollsThisShop = 0;

  constructor(name = 'VeteranBot', opts: Partial<VeteranOptions> = {}) {
    this.name = name;
    this.opts = { skills: true, holds: true, symbols: false, gadgets: true, skillOrder: DEFAULT_SKILL_ORDER, ...opts };
  }

  // ------------------------------------------------------------------ prep
  public decidePrepActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const evolution = this.evolution(state);
    if (evolution) return [evolution];

    const merge = this.merge(state);
    if (merge) return [merge];

    const skill = this.nextSkill(state);
    if (skill) return [{ type: 'BUY_SKILL', skillId: skill }];

    if (this.spinsAvailable(state) > 0) return this.spin(state);

    return this.arrange(state);
  }

  private evolution(state: RunState): RunCommand | null {
    const id = state.pendingEvolutionUnitId;
    if (!id) return null;
    const unit = [...state.deployedUnits, ...state.reserveBench].find((u) => u.instanceId === id);
    const def = unit ? UNITS_DATA[unit.defId] : undefined;
    const branches = [def?.evolutionBranchA, def?.evolutionBranchB].filter((b): b is string => !!b && !!UNITS_DATA[b]);
    if (!unit || branches.length === 0) {
      state.pendingEvolutionUnitId = undefined;
      return null;
    }
    const power = (defId: string): number => {
      const d = UNITS_DATA[defId];
      return d.baseHp * d.baseDamage * d.attackSpeed;
    };
    branches.sort((a, b) => power(b) - power(a));
    return { type: 'CHOOSE_EVOLUTION', unitId: id, chosenBranchDefId: branches[0] };
  }

  /** Two robots give more than one merged robot, so merge only what does not fit on the field. */
  private merge(state: RunState): RunCommand | null {
    const all = [...state.deployedUnits, ...state.reserveBench];
    if (all.length <= SkillManager.unitCap(state)) return null;
    const sorted = [...all].sort((a, b) => a.starRank - b.starRank);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (SmeltManager.canMerge(sorted[i], sorted[j]) !== null) continue;
        const deployed = (u: UnitInstance): boolean => u.deployedSlot !== undefined;
        const [target, sacrifice] = deployed(sorted[j]) && !deployed(sorted[i]) ? [sorted[j], sorted[i]] : [sorted[i], sorted[j]];
        return { type: 'SMELT_UNITS', targetId: target.instanceId, sacrificeId: sacrifice.instanceId };
      }
    }
    return null;
  }

  private nextSkill(state: RunState): string | null {
    if (!this.opts.skills) return null;
    const wanted: Record<string, number> = {};
    for (const id of this.opts.skillOrder) {
      wanted[id] = (wanted[id] ?? 0) + 1;
      if (SkillManager.rank(state, id) >= wanted[id]) continue;
      // the first rank the bot does not own yet: buy it or keep saving for it
      return SkillManager.canBuy(state, id, true) === null ? id : null;
    }
    return null;
  }

  private nextSkillCost(state: RunState): number {
    if (!this.opts.skills) return 0;
    const wanted: Record<string, number> = {};
    for (const id of this.opts.skillOrder) {
      wanted[id] = (wanted[id] ?? 0) + 1;
      if (SkillManager.rank(state, id) < wanted[id]) return SkillManager.nextCost(state, id) ?? 0;
    }
    return 0;
  }

  /** Which gadget on the shelf to buy now, if any. Saves up for the next skill first. */
  private pickGadget(state: RunState): string | null {
    const reserve = this.nextSkillCost(state);
    const affordable = (id: string): boolean => state.economy.cogs - GadgetManager.price(state, id) >= reserve;
    const bossNext = (state.waveNumber + 1) % 10 === 0;
    const wants = (id: string): boolean => {
      const g = GADGETS_DATA[id];
      if (g.type === 'passive') return true;
      switch (g.effectType) {
        case 'heal_boiler':
          return state.boilerHp <= state.maxBoilerHp - 2;
        case 'battle_damage_surge':
          return bossNext && state.consumables.overcharges === 0;
        case 'spawn_temporary_turret':
          return bossNext && state.consumables.turrets === 0;
        case 'stun_front_enemies':
          return bossNext && state.consumables.grenades === 0;
        default:
          return false;
      }
    };
    const rank = (id: string): number => {
      const order = PASSIVE_PREFERENCE.indexOf(id);
      return order === -1 ? PASSIVE_PREFERENCE.length : order;
    };
    const candidates = state.shopOffers.filter((id) => wants(id) && affordable(id)).sort((a, b) => rank(a) - rank(b));
    return candidates[0] ?? null;
  }

  /**
   * Focus the reels on the line the army is built on: cut symbols of other
   * lines, then add the main one, then gild it. Keeps the next skill affordable.
   */
  private reelEdit(state: RunState): RunCommand | null {
    const discount = GadgetManager.discount(state);
    const spare = state.economy.cogs - this.nextSkillCost(state);
    // healers support the army instead of being it: the reels focus on a fighting line, wrenches are kept
    const counts: Record<string, number> = { cog: 0, spring: 0, fuse: 0, coil: 0 };
    for (const u of [...state.deployedUnits, ...state.reserveBench]) {
      if (u.faction in counts) counts[u.faction] += 2 ** (u.starRank - 1);
    }
    const main = (Object.keys(counts) as SlotSymbol[]).sort((a, b) => counts[b] - counts[a])[0];
    const isOff = (sym: SlotSymbol): boolean => sym !== main && sym !== 'wild' && sym !== 'crown' && sym !== 'wrench';

    if (spare >= EconomyManager.getRemoveSymbolCost(state.economy, discount)) {
      let best: { reel: number; index: number; off: number } | null = null;
      state.reelStrips.forEach((strip, reel) => {
        if (strip.length <= BALANCE.MIN_STRIP_LENGTH) return;
        const off = strip.filter((x) => isOff(x.symbol)).length;
        const index = strip.findIndex((x) => isOff(x.symbol));
        if (index >= 0 && (!best || off > best.off)) best = { reel, index, off };
      });
      const pick = best as { reel: number; index: number; off: number } | null;
      if (pick) return { type: 'REMOVE_SYMBOL', reelIndex: pick.reel, symbolIndex: pick.index };
    }
    if (spare >= EconomyManager.getAddSymbolCost(discount)) {
      const reel = [0, 1, 2]
        .filter((r) => state.reelStrips[r].length < BALANCE.MAX_STRIP_LENGTH)
        .sort((a, b) => state.reelStrips[a].length - state.reelStrips[b].length)[0];
      const mainShare = (r: number): number =>
        state.reelStrips[r].filter((x) => x.symbol === main).length / state.reelStrips[r].length;
      if (reel !== undefined && mainShare(reel) < 0.75) return { type: 'BUY_SYMBOL', reelIndex: reel, symbol: main };
    }
    if (spare >= CoreEffects.gildCost(state)) {
      for (let r = 0; r < 3; r++) {
        const index = state.reelStrips[r].findIndex((x) => x.symbol === main && !x.isGilded);
        if (index >= 0) return { type: 'GILD_SYMBOL', reelIndex: r, symbolIndex: index };
      }
    }
    return null;
  }

  /** Free spins plus paid spins that cannot jam (heat stays at the threshold or below). */
  private spinsAvailable(state: RunState): number {
    const heatRoom = Math.floor((BALANCE.HEAT_JAM_THRESHOLD - state.heat.currentHeat) / BALANCE.EXTRA_SPIN_HEAT_ADD);
    const paid = Math.max(0, Math.min(Math.floor(state.economy.steam / BALANCE.EXTRA_SPIN_STEAM_COST), heatRoom));
    return state.freeSpinsLeft + paid;
  }

  private baseline(strips: Strips, mirror: boolean): number {
    const key = strips.map((s) => s.map((x) => x.symbol.slice(0, 3)).join('')).join('|') + (mirror ? 'm' : '');
    let v = this.baselineCache.get(key);
    if (v === undefined) {
      v = expectedValue(strips, [0, 0, 0], 0, mirror);
      this.baselineCache.set(key, v);
    }
    return v;
  }

  private spin(state: RunState): RunCommand[] {
    const commands: RunCommand[] = [];
    if (this.opts.holds && state.holdsLeft > 0) {
      const strips = state.reelStrips;
      const mirror = state.activeCores.includes('core_mirror_piston');
      const base = this.baseline(strips, mirror);
      const spins = this.spinsAvailable(state);
      // charges do not carry over to the next wave, so the last spins may burn them freely
      const perHold = state.holdsLeft >= spins * 3 ? 0.05 : 0.3;

      let best = { ev: base, mask: 0, nudge: null as { reel: number; dir: 1 | -1 } | null };
      const consider = (idx: Idx, nudge: { reel: number; dir: 1 | -1 } | null): void => {
        for (let mask = 1; mask < 8; mask++) {
          const used = popcount(mask);
          if (used > state.holdsLeft) continue;
          if (nudge && !(mask & (1 << nudge.reel))) continue; // a nudge only matters on a held reel
          const ev = expectedValue(strips, idx, mask, mirror) - used * perHold - (nudge ? 0.3 : 0);
          if (ev > best.ev) best = { ev, mask, nudge };
        }
      };
      consider(state.reelIndices, null);
      if (state.nudgesLeft > 0) {
        for (let r = 0; r < 3; r++) {
          for (const dir of [1, -1] as const) {
            const len = strips[r].length;
            const idx: Idx = [state.reelIndices[0], state.reelIndices[1], state.reelIndices[2]];
            idx[r] = (idx[r] + dir + len) % len;
            consider(idx, { reel: r, dir });
          }
        }
      }

      if (best.nudge) commands.push({ type: 'NUDGE_REEL', reelIndex: best.nudge.reel, direction: best.nudge.dir });
      for (let r = 0; r < 3; r++) {
        const want = !!(best.mask & (1 << r));
        if (want && !state.heldReels[r]) commands.push({ type: 'HOLD_REEL', reelIndex: r });
      }
    }
    commands.push({ type: 'SPIN' });
    return commands;
  }

  // ------------------------------------------------------------ placement
  private static score(u: UnitInstance): number {
    // a healer's damage is its healing power: worth about three times as much to the line
    const worth = u.faction === 'wrench' ? 3 : 1;
    return u.damage * u.attackSpeed * 10 * worth + u.maxHp;
  }

  /**
   * One robot per lane first (an empty lane lets enemies walk to the boiler),
   * melee in front, shooters behind; the rest double up lane by lane.
   */
  private arrange(state: RunState): RunCommand[] {
    const cap = SkillManager.unitCap(state);
    const all = [...state.deployedUnits, ...state.reserveBench];
    const chosen = [...all].sort((a, b) => VeteranBot.score(b) - VeteranBot.score(a)).slice(0, cap);
    const isMelee = (u: UnitInstance): boolean => u.attackRange <= 2;
    const melee = chosen.filter(isMelee).sort((a, b) => b.maxHp - a.maxHp);
    const ranged = chosen.filter((u) => !isMelee(u)).sort((a, b) => VeteranBot.score(b) - VeteranBot.score(a));

    const layout = new Map<string, { col: number; row: number }>();
    const taken = new Set<string>();
    const put = (u: UnitInstance, col: number, row: number): void => {
      layout.set(u.instanceId, { col, row });
      taken.add(`${col},${row}`);
    };
    const queue = [...melee, ...ranged];
    const first = queue.splice(0, ROW_ORDER.length);
    first.forEach((u, i) => put(u, isMelee(u) ? FRONT_COL : BACK_COL, ROW_ORDER[i]));
    for (const u of queue) {
      const cols = isMelee(u) ? [FRONT_COL, FRONT_COL - 1, FRONT_COL + 1] : [BACK_COL, BACK_COL - 1, BACK_COL + 1];
      search: for (const col of cols) {
        for (const row of ROW_ORDER) {
          if (!taken.has(`${col},${row}`)) {
            put(u, col, row);
            break search;
          }
        }
      }
    }

    const commands: RunCommand[] = [];
    for (const u of state.deployedUnits) {
      const want = layout.get(u.instanceId);
      if (!want || want.col !== u.deployedSlot?.col || want.row !== u.deployedSlot?.row) {
        commands.push({ type: 'UNDEPLOY_UNIT', unitId: u.instanceId });
      }
    }
    for (const [unitId, slot] of layout) {
      const current = state.deployedUnits.find((u) => u.instanceId === unitId)?.deployedSlot;
      if (!current || current.col !== slot.col || current.row !== slot.row) {
        commands.push({ type: 'DEPLOY_UNIT', unitId, col: slot.col, row: slot.row });
      }
    }
    return commands;
  }

  // ---------------------------------------------------------------- battle
  public decideBattleActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const combat = state.combatState;
    if (!combat || combat.valveUsed) return [];
    // the game only offers the slowing valve: pull it when someone is about to reach the boiler
    return combat.enemies.some((e) => !e.isDead && e.x < 1.5) ? [{ type: 'USE_VALVE', choice: 'slow' }] : [];
  }

  // ------------------------------------------------------------------ shop
  public decideShopActions(state: RunState, _rng: RngStreams): RunCommand[] {
    if (state.phase !== 'SHOP') return [];
    const skill = this.nextSkill(state);
    if (skill) return [{ type: 'BUY_SKILL', skillId: skill }];

    if (this.opts.gadgets) {
      const gadget = this.pickGadget(state);
      if (gadget) return [{ type: 'BUY_GADGET', gadgetId: gadget }];
      if (this.opts.symbols) {
        const edit = this.reelEdit(state);
        if (edit) return [edit];
      }
      // nothing worth buying on the shelf: restock while there are cogs to spare
      const reroll = EconomyManager.getRerollCost(state.economy, GadgetManager.discount(state));
      const passivesLeft = GadgetManager.pool(state, true).length > 0;
      if (
        passivesLeft &&
        this.rerollsThisShop < 6 &&
        state.economy.cogs - reroll >= this.nextSkillCost(state) + 60
      ) {
        this.rerollsThisShop++;
        return [{ type: 'REROLL_SHOP' }];
      }
    }

    if (this.opts.symbols) {
      const edit = this.reelEdit(state);
      if (edit) return [edit];
    }
    this.rerollsThisShop = 0;
    return [{ type: 'START_NEXT_WAVE' }];
  }

  // ------------------------------------------------------------------ cores
  /** Mirror Piston doubles horizontal lines; Recycler pays steam back for merges. */
  public chooseCore(choices: string[]): string {
    const preference = ['core_mirror_piston', 'core_recycler', 'core_pressure_valve'];
    return preference.find((id) => choices.includes(id)) ?? choices[0];
  }
}
