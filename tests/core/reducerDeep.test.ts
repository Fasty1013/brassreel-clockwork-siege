import { describe, it, expect } from 'vitest';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';
import { EventBus } from '@core/events/events';
import { CombatEngine } from '@core/combat/combatEngine';
import { BALANCE } from '@data/balance';

describe('Deep Reducer Transitions & Game Loop Suite', () => {
  it('charges cogs for paid spins, raising the price every paid spin of the wave', () => {
    const rng = PrngManager.createStreams('EXTRA_SPIN_TEST');
    const state = RunStateManager.createInitialState('EXTRA_SPIN_TEST');
    const bus = new EventBus();

    // Free spins cost nothing
    expect(RunStateManager.spinCost(state)).toBe(0);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    expect(state.freeSpinsLeft).toBe(0);

    state.economy.cogs = 100;
    const initialHeat = state.heat.currentHeat;
    const base = BALANCE.EXTRA_SPIN_COG_BASE;
    const step = BALANCE.EXTRA_SPIN_COG_STEP;

    // 1st paid spin: BASE cogs, +20 heat
    expect(RunStateManager.spinCost(state)).toBe(base);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    expect(state.economy.cogs).toBe(100 - base);
    expect(state.heat.currentHeat).toBe(initialHeat + BALANCE.EXTRA_SPIN_HEAT_ADD);

    // 2nd paid spin is STEP more expensive
    expect(RunStateManager.spinCost(state)).toBe(base + step);
    state.heat.currentHeat = 0; // keep jams out of the way
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    expect(state.economy.cogs).toBe(100 - base - (base + step));
    expect(RunStateManager.spinCost(state)).toBe(base + 2 * step);
  });

  it('refuses a paid spin the player cannot afford', () => {
    const rng = PrngManager.createStreams('POOR_SPIN');
    const state = RunStateManager.createInitialState('POOR_SPIN');
    state.freeSpinsLeft = 0;
    state.economy.cogs = BALANCE.EXTRA_SPIN_COG_BASE - 1;
    const before = [...state.reelIndices];
    RunReducer.dispatch(state, { type: 'SPIN' }, rng);
    expect(state.economy.cogs).toBe(BALANCE.EXTRA_SPIN_COG_BASE - 1);
    expect(state.reelIndices).toEqual(before);
    expect(state.paidSpinsThisWave).toBe(0);
  });

  it('handles hold toggle on and off', () => {
    const rng = PrngManager.createStreams('HOLD_TOGGLE');
    const state = RunStateManager.createInitialState('HOLD_TOGGLE');

    // Toggle ON reel 1
    RunReducer.dispatch(state, { type: 'HOLD_REEL', reelIndex: 1 }, rng);
    expect(state.heldReels[1]).toBe(true);
    expect(state.holdsLeft).toBe(1);

    // Toggle OFF reel 1
    RunReducer.dispatch(state, { type: 'HOLD_REEL', reelIndex: 1 }, rng);
    expect(state.heldReels[1]).toBe(false);
    expect(state.holdsLeft).toBe(2);
  });

  it('executes SMELT with mod transfer via reducer', () => {
    const rng = PrngManager.createStreams('SMELT_REDUCER');
    const state = RunStateManager.createInitialState('SMELT_REDUCER');
    const bus = new EventBus();

    const unitA = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    const unitB = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    state.reserveBench.push(unitA, unitB);

    const sacMod = unitB.mods[0];
    RunReducer.dispatch(
      state,
      {
        type: 'SMELT_UNITS',
        targetId: unitA.instanceId,
        sacrificeId: unitB.instanceId,
        sacrificeModIndex: 0,
        targetModIndexToReplace: 0
      },
      rng,
      bus
    );

    expect(state.reserveBench.length).toBe(1);
    expect(state.reserveBench[0].instanceId).toBe(unitA.instanceId);
    expect(state.reserveBench[0].mods[0].id).toBe(sacMod.id);
  });

  it('advances through wave 30 final boss clear to VICTORY phase', () => {
    const rng = PrngManager.createStreams('BOSS_VICTORY_TEST');
    const state = RunStateManager.createInitialState('BOSS_VICTORY_TEST');
    state.waveNumber = 30; // Final Boss wave

    // Deploy 5 high-powered long-range defenders
    for (let i = 0; i < 5; i++) {
      const titan = UnitFactory.createUnit('unit_legendary_solarion_sun_forge', rng.loot, { customStarRank: 3 });
      titan.deployedSlot = { col: 1, row: i };
      titan.damage = 5000;
      titan.attackRange = 8;
      titan.attackSpeed = 10.0;
      state.deployedUnits.push(titan);
    }

    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    expect(state.phase).toBe('BATTLE');

    // Run battle for up to 800 ticks (40 seconds of game time)
    for (let t = 0; t < 800 && state.phase === 'BATTLE'; t++) {
      RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
    }

    expect(state.phase).toBe('VICTORY');
  });

  it('triggers GAME_OVER phase in reducer when boiler reaches 0', () => {
    const rng = PrngManager.createStreams('GAME_OVER_TEST');
    const state = RunStateManager.createInitialState('GAME_OVER_TEST');
    state.boilerHp = 1;

    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    // Force enemy breach
    if (state.combatState) {
      CombatEngine.spawnEnemy(state.combatState, 'en_scrapper', 0, 99).x = 0.05;
    }

    RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.1 }, rng);
    expect(state.phase).toBe('GAME_OVER');
  });
});
