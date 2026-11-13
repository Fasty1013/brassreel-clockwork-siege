import { BALANCE } from '@data/balance';
import { SkillManager } from '../skills/skills';
import { ReelSymbol, SpinResult, SlotSymbol } from '../reels/reels';
import { UnitInstance } from '../units/unitFactory';
import { HeatState, HeatManager } from '../heat/heat';
import { EconomyState, EconomyManager } from '../economy/economy';
import { CombatSimulationState } from '../combat/combatEngine';

export type RunPhase = 'PREP' | 'BATTLE' | 'RESULT' | 'SHOP' | 'GAME_OVER' | 'VICTORY';

export interface RunState {
  seed: string;
  actNumber: number;
  waveNumber: number;
  phase: RunPhase;
  boilerHp: number;
  maxBoilerHp: number;
  holdsLeft: number;
  nudgesLeft: number;
  /** spins made this wave — each one raises the next price */
  spinsThisWave: number;
  /** cogs paid for the most recent spin (for the UI) */
  lastSpinCost?: number;
  heldReels: [boolean, boolean, boolean];
  reelStrips: [ReelSymbol[], ReelSymbol[], ReelSymbol[]];
  reelIndices: [number, number, number];
  heat: HeatState;
  economy: EconomyState;
  reserveBench: UnitInstance[];
  deployedUnits: UnitInstance[];
  activeCores: string[];
  activeGadgets: string[];
  lastSpinResult?: SpinResult;
  combatState?: CombatSimulationState;
  pendingEvolutionUnitId?: string;
  /** in-run skill tree: node id -> bought rank */
  skills: Record<string, number>;
}

export class RunStateManager {
  /** Cogs the next spin costs: BASE, BASE+STEP, BASE+2·STEP… within a wave, minus skill discount. */
  public static spinCost(state: RunState): number {
    const raw = BALANCE.SPIN_COST_BASE + BALANCE.SPIN_COST_STEP * (state.spinsThisWave ?? 0);
    return Math.max(BALANCE.SPIN_COST_MIN, raw - SkillManager.spinDiscount(state));
  }

  /** Chance (0..1) that the NEXT spin jams: only spins past the cool ones heat up and can jam. */
  public static nextJamChance(state: RunState, jamReductionPct = 0): number {
    if (RunStateManager.coolSpinsLeft(state) > 0) return 0;
    const heat = Math.min(state.heat.maxHeat, state.heat.currentHeat + BALANCE.EXTRA_SPIN_HEAT_ADD);
    return HeatManager.getJamChance(heat, jamReductionPct);
  }

  /** How many more spins this wave leave the furnace cold (no heat, no jam risk). */
  public static coolSpinsLeft(state: RunState): number {
    return Math.max(0, BALANCE.COOL_SPINS_PER_WAVE - (state.spinsThisWave ?? 0));
  }

  public static createInitialState(seed: string): RunState {
    const strips: [ReelSymbol[], ReelSymbol[], ReelSymbol[]] = [
      BALANCE.STARTER_REEL_1.map((s) => ({ symbol: s as SlotSymbol, isGilded: false })),
      BALANCE.STARTER_REEL_2.map((s) => ({ symbol: s as SlotSymbol, isGilded: false })),
      BALANCE.STARTER_REEL_3.map((s) => ({ symbol: s as SlotSymbol, isGilded: false }))
    ];

    return {
      seed,
      actNumber: 1,
      waveNumber: 1,
      phase: 'PREP',
      boilerHp: BALANCE.INITIAL_BOILER_HP,
      maxBoilerHp: BALANCE.INITIAL_BOILER_HP,
      holdsLeft: BALANCE.BASE_HOLD_CHARGES,
      nudgesLeft: BALANCE.BASE_NUDGE_CHARGES,
      spinsThisWave: 0,
      heldReels: [false, false, false],
      reelStrips: strips,
      reelIndices: [0, 0, 0],
      heat: HeatManager.createInitialState(),
      economy: EconomyManager.createInitialState(),
      reserveBench: [],
      deployedUnits: [],
      activeCores: [],
      activeGadgets: [],
      skills: {}
    };
  }
}

