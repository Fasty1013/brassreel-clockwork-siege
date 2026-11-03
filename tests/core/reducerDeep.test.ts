import { describe, it, expect } from 'vitest';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';
import { EventBus } from '@core/events/events';
import { CombatEngine } from '@core/combat/combatEngine';

describe('Deep Reducer Transitions & Game Loop Suite', () => {
  it('performs extra spins, consuming steam and accumulating heat', () => {
    const rng = PrngManager.createStreams('EXTRA_SPIN_TEST');
    const state = RunStateManager.createInitialState('EXTRA_SPIN_TEST');
    const bus = new EventBus();

    // Consume all 3 free spins
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    expect(state.freeSpinsLeft).toBe(0);

    const initialSteam = state.economy.steam;
    const initialHeat = state.heat.currentHeat;

    // 4th Spin = Overdrive Spin (costs 1 steam, adds +20 heat)
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);

    expect(state.economy.steam).toBe(initialSteam - 1);
    expect(state.heat.currentHeat).toBe(initialHeat + 20);
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
