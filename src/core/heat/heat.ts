import { BALANCE } from '@data/balance';
import { PRNG } from '../prng/sfc32';

export interface HeatState {
  currentHeat: number;
  maxHeat: number;
  jamProtectionCharges: number;
  isReelLockedFromJam: [boolean, boolean, boolean];
}

export class HeatManager {
  public static createInitialState(): HeatState {
    return {
      currentHeat: 0,
      maxHeat: BALANCE.MAX_HEAT_BASE,
      jamProtectionCharges: 0,
      isReelLockedFromJam: [false, false, false]
    };
  }

  /**
   * Calculates Jam probability in [0, 1].
   */
  public static getJamChance(heat: number, jamReductionPct = 0): number {
    if (heat <= BALANCE.HEAT_JAM_THRESHOLD) {
      return 0;
    }
    const rawChance = (heat - BALANCE.HEAT_JAM_THRESHOLD) * BALANCE.JAM_SLOPE;
    const finalChance = Math.max(0, rawChance - jamReductionPct);
    return Math.min(1.0, finalChance);
  }

  /**
   * Gets weight multipliers for Wild and Crown symbols based on Heat tier.
   */
  public static getHeatMultipliers(heat: number): { wildMult: number; crownMult: number } {
    if (heat <= 20) {
      return { wildMult: 1.0, crownMult: 1.0 };
    }
    if (heat <= 40) {
      return { wildMult: 1.5, crownMult: 1.0 };
    }
    if (heat <= 60) {
      return { wildMult: 2.0, crownMult: 1.5 };
    }
    // Overdrive (61 - 100+)
    return { wildMult: 3.0, crownMult: 3.0 };
  }

  /**
   * Checks if an extra spin triggers a Jam.
   */
  public static rollForJam(
    state: HeatState,
    rng: PRNG,
    jamReductionPct = 0
  ): { isJammed: boolean; lockedReelIndex?: number; damagePct?: number } {
    if (state.jamProtectionCharges > 0) {
      state.jamProtectionCharges--;
      return { isJammed: false };
    }

    const jamChance = this.getJamChance(state.currentHeat, jamReductionPct);
    if (jamChance <= 0) {
      return { isJammed: false };
    }

    const roll = rng.next();
    if (roll < jamChance) {
      // Jam triggered!
      const lockedReel = rng.nextRange(0, 2);
      return {
        isJammed: true,
        lockedReelIndex: lockedReel,
        damagePct: 0.25 // 25% max HP damage to a random unit
      };
    }

    return { isJammed: false };
  }

  /**
   * Applies wave cooldown reduction to heat.
   */
  public static coolDownAtWaveEnd(state: HeatState, extraCooling = 0): number {
    const totalCooling = BALANCE.WAVE_HEAT_COOLDOWN + extraCooling;
    state.currentHeat = Math.max(0, state.currentHeat - totalCooling);
    state.isReelLockedFromJam = [false, false, false];
    return state.currentHeat;
  }
}

