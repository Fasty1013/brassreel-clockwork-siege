import { describe, it, expect } from 'vitest';
import { RunStateManager, RunState } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager, RngStreams } from '@core/prng/prngManager';
import { ReelManager } from '@core/reels/reels';
import { BALANCE } from '@data/balance';

function shop(): { state: RunState; rng: RngStreams } {
  const rng = PrngManager.createStreams('reels');
  const state = RunStateManager.createInitialState('reels');
  state.phase = 'RESULT';
  RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
  state.economy.cogs = 1000;
  return { state, rng };
}

describe('workshop reel editing', () => {
  it('adds a symbol to the chosen reel', () => {
    const { state, rng } = shop();
    RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 2, symbol: 'coil' }, rng);
    expect(state.reelStrips[2].at(-1)?.symbol).toBe('coil');
    expect(state.reelStrips[0]).toHaveLength(10);
    expect(state.economy.cogs).toBe(1000 - BALANCE.COST_ADD_SYMBOL);
  });

  it('gilds and removes the chosen symbol, not the first one', () => {
    const { state, rng } = shop();
    const target = state.reelStrips[0][4];
    RunReducer.dispatch(state, { type: 'GILD_SYMBOL', reelIndex: 0, symbolIndex: 4 }, rng);
    expect(target.isGilded).toBe(true);
    expect(state.reelStrips[0][0].isGilded).toBe(false);

    const before = state.reelStrips[2].map((s) => s.symbol);
    RunReducer.dispatch(state, { type: 'REMOVE_SYMBOL', reelIndex: 2, symbolIndex: 7 }, rng);
    expect(state.reelStrips[2].map((s) => s.symbol)).toEqual([...before.slice(0, 7), ...before.slice(8)]);
  });

  it('does not charge for gilding a symbol twice', () => {
    const { state, rng } = shop();
    RunReducer.dispatch(state, { type: 'GILD_SYMBOL', reelIndex: 1, symbolIndex: 2 }, rng);
    const cogs = state.economy.cogs;
    RunReducer.dispatch(state, { type: 'GILD_SYMBOL', reelIndex: 1, symbolIndex: 2 }, rng);
    expect(state.economy.cogs).toBe(cogs);
  });

  it('keeps every strip between the length limits', () => {
    const { state, rng } = shop();
    for (let i = 0; i < 30; i++) RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'cog' }, rng);
    expect(state.reelStrips[0]).toHaveLength(BALANCE.MAX_STRIP_LENGTH);
    for (let i = 0; i < 30; i++) RunReducer.dispatch(state, { type: 'REMOVE_SYMBOL', reelIndex: 1, symbolIndex: 0 }, rng);
    expect(state.reelStrips[1]).toHaveLength(BALANCE.MIN_STRIP_LENGTH);
  });

  it('keeps the reel window valid after the stop symbol is removed', () => {
    const { state, rng } = shop();
    state.reelIndices[2] = state.reelStrips[2].length - 1;
    RunReducer.dispatch(state, { type: 'REMOVE_SYMBOL', reelIndex: 2, symbolIndex: 0 }, rng);
    const grid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
    expect(grid.flat().every(Boolean)).toBe(true);
  });

  it('only works in the workshop and only sells reel symbols', () => {
    const { state, rng } = shop();
    RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'crown' }, rng);
    RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'wild' }, rng);
    expect(state.economy.cogs).toBe(1000);
    state.phase = 'PREP';
    RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'cog' }, rng);
    RunReducer.dispatch(state, { type: 'GILD_SYMBOL', reelIndex: 0, symbolIndex: 0 }, rng);
    RunReducer.dispatch(state, { type: 'REMOVE_SYMBOL', reelIndex: 0, symbolIndex: 0 }, rng);
    expect(state.economy.cogs).toBe(1000);
    expect(state.reelStrips[0]).toHaveLength(10);
  });
});
