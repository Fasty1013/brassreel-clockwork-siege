import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { RunStateManager, type RunState } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager, type RngStreams } from '@core/prng/prngManager';
import { RunSave, type KeyValueStore } from '@core/state/runSave';
import { UnitFactory } from '@core/units/unitFactory';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

/** One wave: spins, deploy, battle to the end, shop, next wave. */
function playWave(state: RunState, rng: RngStreams): void {
  for (let s = 0; s < 3; s++) RunReducer.dispatch(state, { type: 'SPIN' }, rng);
  while (state.reserveBench.length > 0 && state.deployedUnits.length < BALANCE.BASE_UNIT_CAP) {
    const u = state.reserveBench[0];
    const n = state.deployedUnits.length;
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: u.instanceId, col: n % 4, row: Math.floor(n / 4) }, rng);
  }
  RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
  for (let t = 0; t < 1200 && state.phase === 'BATTLE'; t++) RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
  if (state.phase === 'RESULT') {
    RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
  }
}

const summary = (s: RunState) => ({
  wave: s.waveNumber, phase: s.phase, hp: s.boilerHp, cogs: s.economy.cogs, steam: s.economy.steam,
  units: [...s.reserveBench, ...s.deployedUnits].map((u) => `${u.defId}:${u.starRank}`).sort(),
  reels: s.reelIndices
});

describe('run save', () => {
  it('a restored run continues exactly like the original', () => {
    const seed = 'SAVE_TEST_7';
    const state = RunStateManager.createInitialState(seed);
    const rng = PrngManager.createStreams(seed);
    playWave(state, rng);
    playWave(state, rng);
    expect(state.phase).toBe('PREP');

    const store = memoryStore();
    expect(RunSave.save(state, rng, ['flywheel'], store)).toBe(true);
    const saved = RunSave.load(store);
    expect(saved).not.toBeNull();
    // the app was closed: robot numbering starts over in a new process
    UnitFactory.resetSequence();
    const restored = RunSave.restore(saved!);
    expect(restored.parts).toEqual(['flywheel']);

    playWave(state, rng);
    playWave(state, rng);
    playWave(restored.state, restored.rng);
    playWave(restored.state, restored.rng);
    expect(summary(restored.state)).toEqual(summary(state));
    // robots made after the restart do not reuse the saved robots' numbers
    const ids = [...restored.state.reserveBench, ...restored.state.deployedUnits].map((u) => u.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps only runs waiting between waves', () => {
    const state = RunStateManager.createInitialState('S2');
    const rng = PrngManager.createStreams('S2');
    const store = memoryStore();
    state.phase = 'BATTLE';
    expect(RunSave.save(state, rng, [], store)).toBe(false);
    expect(RunSave.load(store)).toBeNull();
  });

  it('ignores broken or old saves and can be cleared', () => {
    const store = memoryStore();
    store.setItem('brassreel_run', '{not json');
    expect(RunSave.load(store)).toBeNull();
    store.setItem('brassreel_run', JSON.stringify({ v: 0, state: {} }));
    expect(RunSave.load(store)).toBeNull();
    const state = RunStateManager.createInitialState('S3');
    RunSave.save(state, PrngManager.createStreams('S3'), [], store);
    expect(RunSave.load(store)).not.toBeNull();
    RunSave.clear(store);
    expect(RunSave.load(store)).toBeNull();
  });
});
