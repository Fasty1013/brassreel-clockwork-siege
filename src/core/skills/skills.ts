import { BALANCE } from '@data/balance';
import { SkillEffect, SKILLS, SKILLS_BY_ID } from '@data/skills';
import { EconomyManager } from '../economy/economy';
import type { RunState } from '../state/RunState';
import type { CombatSimulationState } from '../combat/combatEngine';

export type SkillBuyReject = 'unknown' | 'max_rank' | 'locked' | 'no_cogs' | 'wrong_phase';

/** In-run skill tree: ranks live in `state.skills`, effects are summed on demand. */
export class SkillManager {
  public static rank(state: RunState, id: string): number {
    return state.skills?.[id] ?? 0;
  }

  /** Sum of an effect over every bought rank. */
  public static total(state: RunState, effect: SkillEffect): number {
    let sum = 0;
    for (const node of SKILLS) {
      if (node.effect === effect) sum += this.rank(state, node.id) * node.perRank;
    }
    return sum;
  }

  /** How many robots may stand on the field. */
  public static unitCap(state: RunState): number {
    return BALANCE.BASE_UNIT_CAP + this.total(state, 'unit_cap');
  }

  public static nextCost(state: RunState, id: string): number | null {
    const node = SKILLS_BY_ID[id];
    if (!node) return null;
    const r = this.rank(state, id);
    return r >= node.maxRank ? null : node.costs[r];
  }

  public static isUnlocked(state: RunState, id: string): boolean {
    const node = SKILLS_BY_ID[id];
    if (!node) return false;
    return !node.requires || this.rank(state, node.requires) > 0;
  }

  public static canBuy(state: RunState, id: string, phaseOk: boolean): SkillBuyReject | null {
    const node = SKILLS_BY_ID[id];
    if (!node) return 'unknown';
    if (!phaseOk) return 'wrong_phase';
    if (this.rank(state, id) >= node.maxRank) return 'max_rank';
    if (!this.isUnlocked(state, id)) return 'locked';
    const cost = this.nextCost(state, id) ?? Infinity;
    if (!EconomyManager.canAfford(state.economy, cost)) return 'no_cogs';
    return null;
  }

  /** Buy one rank and apply effects that should be felt immediately. */
  public static buy(state: RunState, id: string): boolean {
    const node = SKILLS_BY_ID[id];
    const cost = this.nextCost(state, id);
    if (!node || cost === null || !EconomyManager.spendCogs(state.economy, cost)) return false;
    state.skills[id] = this.rank(state, id) + 1;

    switch (node.effect) {
      case 'boiler_hp':
        state.maxBoilerHp += node.perRank;
        state.boilerHp += node.perRank;
        break;
      case 'free_spin':
        state.freeSpinsLeft += node.perRank;
        break;
      case 'hold':
        state.holdsLeft += node.perRank;
        break;
      case 'nudge':
        state.nudgesLeft += node.perRank;
        break;
      default:
        break;
    }
    return true;
  }

  /** Per-wave refills (added on top of the base values). */
  public static bonusSpins(state: RunState): number {
    return this.total(state, 'free_spin');
  }
  public static bonusHolds(state: RunState): number {
    return this.total(state, 'hold');
  }
  public static bonusNudges(state: RunState): number {
    return this.total(state, 'nudge');
  }
  public static bonusWaveCogs(state: RunState): number {
    return this.total(state, 'wave_cogs');
  }

  /** Buff the combat copies of the robots at the start of a battle. */
  public static applyCombatBuffs(state: RunState, combat: CombatSimulationState): void {
    const hp = 1 + this.total(state, 'hp_pct') / 100;
    const dmg = 1 + this.total(state, 'dmg_pct') / 100;
    const spd = 1 + this.total(state, 'atkspd_pct') / 100;
    const armor = this.total(state, 'armor');
    if (hp === 1 && dmg === 1 && spd === 1 && armor === 0) return;
    for (const u of combat.units) {
      u.maxHp = Math.round(u.maxHp * hp);
      u.hp = Math.round(u.hp * hp);
      u.damage = Math.round(u.damage * dmg);
      u.attackSpeed = Math.round(u.attackSpeed * spd * 100) / 100;
      u.armor += armor;
    }
  }
}
