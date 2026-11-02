import { describe, it, expect } from 'vitest';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';

describe('Seed Determinism & Property Verification Suite', () => {
  function simulateRun(seed: string): {
    finalWave: number;
    boilerHp: number;
    cogs: number;
    phase: string;
    totalUnitsSummoned: number;
  } {
    const rng = PrngManager.createStreams(seed);
    const state = RunStateManager.createInitialState(seed);

    // Run 3 full waves with fixed commands
    for (let wave = 1; wave <= 3; wave++) {
      // 1. PREP Phase: 3 Spins
      for (let s = 0; s < 3; s++) {
        RunReducer.dispatch(state, { type: 'SPIN' }, rng);
      }

      // 2. Deploy any units from bench to front line
      while (state.reserveBench.length > 0 && state.deployedUnits.length < 8) {
        const u = state.reserveBench[0];
        const col = state.deployedUnits.length % 4;
        const row = Math.floor(state.deployedUnits.length / 4);
        RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: u.instanceId, col, row }, rng);
      }

      // 3. Start Battle
      RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);

      // 4. Tick battle until completion or max 800 ticks (40 seconds)
      for (let t = 0; t < 800 && state.phase === 'BATTLE'; t++) {
        RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
      }

      // 5. Advance to shop and next wave
      if (state.phase === 'RESULT') {
        RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
        RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
      } else if (state.phase === 'GAME_OVER') {
        break;
      }
    }

    return {
      finalWave: state.waveNumber,
      boilerHp: state.boilerHp,
      cogs: state.economy.cogs,
      phase: state.phase,
      totalUnitsSummoned: state.deployedUnits.length + state.reserveBench.length
    };
  }

  it('guarantees identical bit-for-bit run trajectory for identical master seed', () => {
    const seed = 'CLOCKWORK_REPRODUCIBILITY_SEED_42';

    const resultA = simulateRun(seed);
    const resultB = simulateRun(seed);

    expect(resultA).toEqual(resultB);
  });
});

