import { BALANCE } from '@data/balance';
import { ReelSymbol, SpinResult, SlotSymbol } from '../reels/reels';
import { UnitInstance } from '../units/unitFactory';
import { HeatState, HeatManager } from '../heat/heat';
import { EconomyState, EconomyManager } from '../economy/economy';
import { CombatSimulationState } from '../combat/combatEngine';
import { ConsumableStock, GadgetManager } from '../gadgets/gadgets';
import type { EvolutionPlan, FormationReport } from '../waves/enemyEvolution';

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
  /** jackpot robot just summoned and the legendaries it can still be swapped for (CHOOSE_JACKPOT) */
  pendingJackpot?: { unitId: string; choices: string[] };
  /** in-run skill tree: node id -> bought rank */
  skills: Record<string, number>;
  /** gadget ids currently on the workshop shelf */
  shopOffers: string[];
  /** consumable gadgets bought and not used yet */
  consumables: ConsumableStock;
  /** spins in a row without a winning line (scrap press) */
  dryStreak: number;
  /** enemy mutations planned for the current wave (shown before it) */
  evolution?: EvolutionPlan;
  /** formation of the last battle; the next waves evolve against it */
  lastFormation?: FormationReport;
  /** spins of this wave that hit 2+ lines (Clockwork Relay core) */
  comboSpinsThisWave?: number;
  /** campaign threat level (0 = normal); enemies get stronger per level */
  threat: number;
}

export class RunStateManager {
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
      heldReels: [false, false, false],
      reelStrips: strips,
      reelIndices: [0, 0, 0],
      heat: HeatManager.createInitialState(),
      economy: EconomyManager.createInitialState(),
      reserveBench: [],
      deployedUnits: [],
      activeCores: [],
      activeGadgets: [],
      skills: {},
      shopOffers: [],
      consumables: GadgetManager.createStock(),
      dryStreak: 0,
      threat: 0
    };
  }
}

