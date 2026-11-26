import { describe, expect, it } from 'vitest';
import { RunStateManager } from '@core/state/RunState';
import { JACKPOT_LEGENDARIES, RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';

function stateWithJackpot() {
  const state = RunStateManager.createInitialState('JACKPOT');
  const rng = PrngManager.createStreams('JACKPOT');
  const legendary = UnitFactory.createUnit(JACKPOT_LEGENDARIES[0], rng.loot, { customStarRank: 3 });
  state.reserveBench.push(legendary);
  state.pendingJackpot = { unitId: legendary.instanceId, choices: [...JACKPOT_LEGENDARIES] };
  return { state, rng, legendary };
}

describe('jackpot choice', () => {
  it('swaps the summoned legendary for the chosen one, same level', () => {
    const { state, rng } = stateWithJackpot();
    RunReducer.dispatch(state, { type: 'CHOOSE_JACKPOT', defId: JACKPOT_LEGENDARIES[2] }, rng);
    expect(state.pendingJackpot).toBeUndefined();
    expect(state.reserveBench).toHaveLength(1);
    expect(state.reserveBench[0].defId).toBe(JACKPOT_LEGENDARIES[2]);
    expect(state.reserveBench[0].starRank).toBe(3);
  });

  it('keeps a deployed legendary on its cell', () => {
    const { state, rng, legendary } = stateWithJackpot();
    state.reserveBench = [];
    legendary.deployedSlot = { col: 2, row: 3 };
    state.deployedUnits.push(legendary);
    RunReducer.dispatch(state, { type: 'CHOOSE_JACKPOT', defId: JACKPOT_LEGENDARIES[1] }, rng);
    expect(state.deployedUnits[0].defId).toBe(JACKPOT_LEGENDARIES[1]);
    expect(state.deployedUnits[0].deployedSlot).toEqual({ col: 2, row: 3 });
  });

  it('keeps the first legendary when it is chosen, ignores anything else', () => {
    const { state, rng, legendary } = stateWithJackpot();
    RunReducer.dispatch(state, { type: 'CHOOSE_JACKPOT', defId: JACKPOT_LEGENDARIES[0] }, rng);
    expect(state.reserveBench[0]).toBe(legendary);
    const again = stateWithJackpot();
    RunReducer.dispatch(again.state, { type: 'CHOOSE_JACKPOT', defId: 'unit_cog_knight' }, again.rng);
    expect(again.state.reserveBench[0].defId).toBe(JACKPOT_LEGENDARIES[0]);
    expect(again.state.pendingJackpot).toBeUndefined();
  });
});
