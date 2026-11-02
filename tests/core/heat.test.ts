import { describe, it, expect } from 'vitest';
import { HeatManager } from '@core/heat/heat';
import { PRNG } from '@core/prng/sfc32';

describe('Heat Gauge & Jam Risk Dynamics Suite', () => {
  it('returns 0% jam chance at or below 60 Heat', () => {
    expect(HeatManager.getJamChance(0)).toBe(0);
    expect(HeatManager.getJamChance(30)).toBe(0);
    expect(HeatManager.getJamChance(60)).toBe(0);
  });

  it('scales jam chance linearly from 61 to 100 Heat', () => {
    // 80 heat: (80 - 60) * 0.00875 = 0.175 (17.5%)
    const chance80 = HeatManager.getJamChance(80);
    expect(chance80).toBeCloseTo(0.175, 4);

    // 100 heat: (100 - 60) * 0.00875 = 0.35 (35%)
    const chance100 = HeatManager.getJamChance(100);
    expect(chance100).toBeCloseTo(0.35, 4);
  });

  it('scales Wild and Crown weights with Heat tiers', () => {
    const cold = HeatManager.getHeatMultipliers(15);
    expect(cold.wildMult).toBe(1.0);
    expect(cold.crownMult).toBe(1.0);

    const warm = HeatManager.getHeatMultipliers(35);
    expect(warm.wildMult).toBe(1.5);

    const hot = HeatManager.getHeatMultipliers(55);
    expect(hot.wildMult).toBe(2.0);
    expect(hot.crownMult).toBe(1.5);

    const overdrive = HeatManager.getHeatMultipliers(85);
    expect(overdrive.wildMult).toBe(3.0);
    expect(overdrive.crownMult).toBe(3.0);
  });

  it('cools down heat by 30 at end of wave', () => {
    const state = HeatManager.createInitialState();
    state.currentHeat = 70;
    const cooled = HeatManager.coolDownAtWaveEnd(state);
    expect(cooled).toBe(40);

    state.currentHeat = 20;
    const cooledToZero = HeatManager.coolDownAtWaveEnd(state);
    expect(cooledToZero).toBe(0);
  });

  it('consumes Jam Protection charges without triggering Jam', () => {
    const state = HeatManager.createInitialState();
    state.currentHeat = 100;
    state.jamProtectionCharges = 1;

    const rng = PRNG.fromSeed('JAM_SEED_FORCE');
    const result = HeatManager.rollForJam(state, rng);

    expect(result.isJammed).toBe(false);
    expect(state.jamProtectionCharges).toBe(0);
  });
});

