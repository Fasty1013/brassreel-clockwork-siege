import { BALANCE } from '@data/balance';
import { SKILLS } from '@data/skills';
import { UNITS_DATA } from '@data/units';
import { BotPolicy } from './BotPolicy';
import { RunState, RunStateManager } from '@core/state/RunState';
import { RunCommand, RunReducer } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';
import { SkillManager } from '@core/skills/skills';
import { SmeltManager } from '@core/smelt/smelt';
import { UnitInstance } from '@core/units/unitFactory';
import { EventBus } from '@core/events/events';

/** Cells for the front line (melee) and the back line (shooters), most important first. */
const ROW_ORDER = [2, 1, 3, 0, 4];
const FRONT_CELLS = [3, 4].flatMap((col) => ROW_ORDER.map((row) => ({ col, row })));
const BACK_CELLS = [1, 2, 0].flatMap((col) => ROW_ORDER.map((row) => ({ col, row })));

export interface HumanBotOptions {
  /** 0 = plays every prep carefully, 1 = skips most of the optional decisions */
  sloppiness?: number;
  name?: string;
}

/**
 * Plays the way a person does: reacts to every spin, merges everything that can
 * be merged, buys skills, keeps the strongest robots on the field in a sensible
 * formation. Unlike the other bots it dispatches commands itself, because each
 * decision depends on the result of the previous one.
 */
export class HumanBot implements BotPolicy {
  public name: string;
  public bus?: EventBus;
  private sloppiness: number;

  constructor(options: HumanBotOptions = {}) {
    this.sloppiness = options.sloppiness ?? 0;
    this.name = options.name ?? (this.sloppiness > 0 ? 'CasualBot' : 'HumanBot');
  }

  public decidePrepActions(state: RunState, rng: RngStreams): RunCommand[] {
    const careless = (): boolean => this.sloppiness > 0 && rng.shop.next() < this.sloppiness;
    const send = (cmd: RunCommand): void => {
      RunReducer.dispatch(state, cmd, rng, this.bus);
    };

    this.mergeAll(state, rng, send);
    if (!careless()) this.buySkills(state, send);

    // Spin: always the cool spins, then hot ones while they are safe and affordable
    const maxSpins = BALANCE.COOL_SPINS_PER_WAVE + (careless() ? 0 : 3);
    for (let i = 0; i < maxSpins; i++) {
      const cost = RunStateManager.spinCost(state);
      const hot = RunStateManager.coolSpinsLeft(state) <= 0;
      if (cost > state.economy.cogs) break;
      if (hot && (RunStateManager.nextJamChance(state) > 0 || state.economy.cogs - cost < 20)) break;
      send({ type: 'SPIN' });
      this.mergeAll(state, rng, send);
    }

    if (!careless()) this.buySkills(state, send);
    this.arrange(state, send, careless());
    return [];
  }

  public decideBattleActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const combat = state.combatState;
    if (!combat || combat.valveUsed) return [];
    if (state.boilerHp <= state.maxBoilerHp - BALANCE.VALVE_HEAL_BOILER_HP) {
      return [{ type: 'USE_VALVE', choice: 'heal' }];
    }
    return [];
  }

  public decideShopActions(_state: RunState, _rng: RngStreams): RunCommand[] {
    return [{ type: 'START_NEXT_WAVE' }];
  }

  /** Merge every pair that can be merged, picking evolution branches as they come up. */
  private mergeAll(state: RunState, rng: RngStreams, send: (cmd: RunCommand) => void): void {
    for (let guard = 0; guard < 40; guard++) {
      const all = [...state.deployedUnits, ...state.reserveBench];
      let merged = false;
      outer: for (const target of all) {
        for (const sacrifice of all) {
          if (SmeltManager.canMerge(target, sacrifice) !== null) continue;
          send({ type: 'SMELT_UNITS', targetId: target.instanceId, sacrificeId: sacrifice.instanceId });
          merged = true;
          break outer;
        }
      }
      if (state.pendingEvolutionUnitId) {
        const unit = all.find((u) => u.instanceId === state.pendingEvolutionUnitId);
        const def = unit ? UNITS_DATA[unit.defId] : undefined;
        const branch = rng.shop.next() < 0.5 ? def?.evolutionBranchA : def?.evolutionBranchB;
        if (unit && branch) {
          send({ type: 'CHOOSE_EVOLUTION', unitId: unit.instanceId, chosenBranchDefId: branch });
        } else {
          state.pendingEvolutionUnitId = undefined;
        }
      }
      if (!merged) break;
    }
  }

  /** Buy the cheapest useful skill while a cushion for the next spins remains. */
  private buySkills(state: RunState, send: (cmd: RunCommand) => void): void {
    const reserve = 12;
    for (let guard = 0; guard < 12; guard++) {
      const total = state.deployedUnits.length + state.reserveBench.length;
      const options = SKILLS.filter((s) => s.branch !== 'mechanics')
        .filter((s) => SkillManager.canBuy(state, s.id, true) === null)
        // more field places are pointless while there is nobody to put there
        .filter((s) => s.effect !== 'unit_cap' || total > SkillManager.unitCap(state))
        .map((s) => ({ id: s.id, cost: SkillManager.nextCost(state, s.id) ?? Infinity, cap: s.effect === 'unit_cap' }))
        .filter((s) => state.economy.cogs - s.cost >= reserve)
        .sort((a, b) => Number(b.cap) - Number(a.cap) || a.cost - b.cost);
      if (options.length === 0) return;
      send({ type: 'BUY_SKILL', skillId: options[0].id });
    }
  }

  private static power(u: UnitInstance): number {
    return u.maxHp * 0.5 + u.damage * u.attackSpeed * 6;
  }

  /** Put the strongest robots on the field: melee in front, shooters behind. */
  private arrange(state: RunState, send: (cmd: RunCommand) => void, careless: boolean): void {
    const cap = SkillManager.unitCap(state);
    const ranked = [...state.deployedUnits, ...state.reserveBench].sort((a, b) => HumanBot.power(b) - HumanBot.power(a));
    const wanted = ranked.slice(0, cap);
    const wantedIds = new Set(wanted.map((u) => u.instanceId));

    // bring the chosen ones in, swapping out the weakest robots when the field is full
    const evictees = state.deployedUnits.filter((u) => !wantedIds.has(u.instanceId));
    for (const unit of wanted) {
      if (unit.deployedSlot) continue;
      const out = evictees.pop();
      if (out?.deployedSlot) {
        send({ type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: out.deployedSlot.col, row: out.deployedSlot.row });
      } else {
        const free = this.freeCell(state);
        if (free) send({ type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: free.col, row: free.row });
      }
    }
    if (careless) return; // a careless player leaves the robots wherever they landed

    const onField = state.deployedUnits.filter((u) => wantedIds.has(u.instanceId));
    const melee = onField.filter((u) => u.attackRange <= 2).sort((a, b) => b.maxHp - a.maxHp);
    const ranged = onField.filter((u) => u.attackRange > 2).sort((a, b) => b.damage - a.damage);
    const front = [...FRONT_CELLS];
    const back = [...BACK_CELLS];
    for (const unit of melee) {
      const cell = front.shift();
      if (cell) send({ type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: cell.col, row: cell.row });
    }
    for (const unit of ranged) {
      const cell = back.shift();
      if (cell) send({ type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: cell.col, row: cell.row });
    }
  }

  private freeCell(state: RunState): { col: number; row: number } | null {
    for (const cell of [...BACK_CELLS, ...FRONT_CELLS]) {
      if (!state.deployedUnits.some((u) => u.deployedSlot?.col === cell.col && u.deployedSlot?.row === cell.row)) {
        return cell;
      }
    }
    return null;
  }
}
