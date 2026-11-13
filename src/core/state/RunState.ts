import { BALANCE } from '@data/balance';
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
  freeSpinsLeft: number;
  /** paid spins already bought this wave — each one raises the next price */
  paidSpinsThisWave: number;
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
  /** Cogs the next spin costs: 0 while free spins remain, then BASE, BASE+STEP, … within a wave. */
  public static spinCost(state: RunState): number {
    if (state.freeSpinsLeft > 0) return 0;
    return BALANCE.EXTRA_SPIN_COG_BASE + BALANCE.EXTRA_SPIN_COG_STEP * (state.paidSpinsThisWave ?? 0);
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
      freeSpinsLeft: BALANCE.FREE_SPINS_PER_WAVE,
      paidSpinsThisWave: 0,
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

