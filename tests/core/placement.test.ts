import { describe, it, expect } from 'vitest';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';

function setup(n = 3) {
  const rng = PrngManager.createStreams('PLACEMENT_SEED');
  const state = RunStateManager.createInitialState('PLACEMENT_SEED');
  const units = Array.from({ length: n }, () => UnitFactory.createUnit('unit_cog_knight', rng.loot));
  state.reserveBench.push(...units);
  const deploy = (id: string, col: number, row: number) =>
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: id, col, row }, rng);
  return { rng, state, units, deploy };
}

describe('Free placement (any cell, any time except battle)', () => {
  it('places a robot on any column of the grid, including the far right', () => {
    const { state, units, deploy } = setup(1);
    deploy(units[0].instanceId, 7, 4);
    expect(units[0].deployedSlot).toEqual({ col: 7, row: 4 });
    expect(state.deployedUnits).toHaveLength(1);
  });

  it('rejects cells outside the grid', () => {
    const { state, units, deploy } = setup(1);
    deploy(units[0].instanceId, 8, 0);
    deploy(units[0].instanceId, 0, 5);
    expect(state.deployedUnits).toHaveLength(0);
  });

  it('moves a robot that is already on the field to an empty cell', () => {
    const { units, deploy } = setup(1);
    deploy(units[0].instanceId, 0, 0);
    deploy(units[0].instanceId, 5, 2);
    expect(units[0].deployedSlot).toEqual({ col: 5, row: 2 });
  });

  it('swaps two robots on the field', () => {
    const { units, deploy } = setup(2);
    deploy(units[0].instanceId, 0, 0);
    deploy(units[1].instanceId, 3, 3);
    deploy(units[0].instanceId, 3, 3);
    expect(units[0].deployedSlot).toEqual({ col: 3, row: 3 });
    expect(units[1].deployedSlot).toEqual({ col: 0, row: 0 });
  });

  it('a bench robot dropped on an occupied cell sends the occupant to the bench', () => {
    const { state, units, deploy } = setup(2);
    deploy(units[0].instanceId, 1, 1);
    deploy(units[1].instanceId, 1, 1);
    expect(units[1].deployedSlot).toEqual({ col: 1, row: 1 });
    expect(units[0].deployedSlot).toBeUndefined();
    expect(state.reserveBench.map((u) => u.instanceId)).toContain(units[0].instanceId);
    expect(state.deployedUnits).toHaveLength(1);
  });

  it('allows arranging after a wave (RESULT / SHOP) but not during battle', () => {
    const { state, units, deploy } = setup(1);
    state.phase = 'RESULT';
    deploy(units[0].instanceId, 2, 2);
    expect(units[0].deployedSlot).toEqual({ col: 2, row: 2 });

    state.phase = 'SHOP';
    deploy(units[0].instanceId, 6, 1);
    expect(units[0].deployedSlot).toEqual({ col: 6, row: 1 });

    state.phase = 'BATTLE';
    deploy(units[0].instanceId, 0, 0);
    expect(units[0].deployedSlot).toEqual({ col: 6, row: 1 });
  });
});
