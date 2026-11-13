import { describe, it, expect } from 'vitest';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';
import { EventBus } from '@core/events/events';
import { CombatEngine } from '@core/combat/combatEngine';
import { BALANCE } from '@data/balance';

describe('Deep Reducer Transitions & Game Loop Suite', () => {
  it('charges cogs for every spin, raising the price within a wave', () => {
    const rng = PrngManager.createStreams('EXTRA_SPIN_TEST');
    const state = RunStateManager.createInitialState('EXTRA_SPIN_TEST');
    const bus = new EventBus();
    state.economy.cogs = 100;
    const base = BALANCE.SPIN_COST_BASE;
    const step = BALANCE.SPIN_COST_STEP;

    // the very first spin already costs cogs
    let spent = 0;
    for (let i = 0; i < BALANCE.COOL_SPINS_PER_WAVE; i++) {
      const price = RunStateManager.spinCost(state);
      expect(price).toBe(base + step * i);
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
      spent += price;
      expect(state.economy.cogs).toBe(100 - spent);
      expect(state.heat.currentHeat).toBe(0); // cool spins do not heat
    }

    // past the cool spins every spin also adds heat
    const price = RunStateManager.spinCost(state);
    RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    expect(state.economy.cogs).toBe(100 - spent - price);
    expect(state.heat.currentHeat).toBe(BALANCE.EXTRA_SPIN_HEAT_ADD);
  });

  it('refuses a spin the player cannot afford', () => {
    const rng = PrngManager.createStreams('POOR_SPIN');
    const state = RunStateManager.createInitialState('POOR_SPIN');
    state.economy.cogs = BALANCE.SPIN_COST_BASE - 1;
    const before = [...state.reelIndices];
    RunReducer.dispatch(state, { type: 'SPIN' }, rng);
    expect(state.economy.cogs).toBe(BALANCE.SPIN_COST_BASE - 1);
    expect(state.reelIndices).toEqual(before);
    expect(state.spinsThisWave).toBe(0);
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

describe('Reserve bench capacity', () => {
  it('melts summons into cogs once the bench is full', () => {
    const rng = PrngManager.createStreams('BENCH_FULL');
    const state = RunStateManager.createInitialState('BENCH_FULL');
    const bus = new EventBus();
    let overflow = 0;
    bus.on('bench_overflow', () => overflow++);
    while (state.reserveBench.length < BALANCE.BENCH_CAPACITY) {
      state.reserveBench.push(UnitFactory.createUnit('unit_scrap_bot', rng.loot));
    }
    // spin until a line hits; every summon must be converted, the bench must not grow
    for (let i = 0; i < 40 && overflow === 0; i++) {
      state.economy.cogs = 1000;
      state.spinsThisWave = 0;
      const before = state.economy.cogs;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
      if (overflow > 0) expect(state.economy.cogs).toBeGreaterThan(before - RunStateManager.spinCost({ ...state, spinsThisWave: 0 }));
    }
    expect(overflow).toBeGreaterThan(0);
    expect(state.reserveBench.length).toBe(BALANCE.BENCH_CAPACITY);
  });

  it('refuses to send a robot back to a full bench', () => {
    const rng = PrngManager.createStreams('BENCH_UNDEPLOY');
    const state = RunStateManager.createInitialState('BENCH_UNDEPLOY');
    const fielded = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    fielded.deployedSlot = { col: 1, row: 1 };
    state.deployedUnits.push(fielded);
    while (state.reserveBench.length < BALANCE.BENCH_CAPACITY) {
      state.reserveBench.push(UnitFactory.createUnit('unit_scrap_bot', rng.loot));
    }
    RunReducer.dispatch(state, { type: 'UNDEPLOY_UNIT', unitId: fielded.instanceId }, rng);
    expect(state.deployedUnits).toContain(fielded);
    expect(state.reserveBench.length).toBe(BALANCE.BENCH_CAPACITY);
  });
});

describe('Jammed spins', () => {
  it('a jam spends the cogs, keeps the reels and leaves no stale win behind', () => {
    const rng = PrngManager.createStreams('JAM_CLEAR');
    const state = RunStateManager.createInitialState('JAM_CLEAR');
    const bus = new EventBus();
    let jammed = false;
    bus.on('jam_triggered', () => { jammed = true; });
    for (let i = 0; i < 60 && !jammed; i++) {
      state.economy.cogs = 1000;
      state.spinsThisWave = BALANCE.COOL_SPINS_PER_WAVE;
      state.heat.currentHeat = 100;
      state.heldReels = [false, false, false];
      const before = [...state.reelIndices];
      const bench = state.reserveBench.length;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
      if (jammed) {
        expect(state.reelIndices).toEqual(before);
        expect(state.reserveBench.length).toBe(bench);
        expect(state.lastSpinResult).toBeUndefined();
        expect(state.economy.cogs).toBeLessThan(1000);
      }
    }
    expect(jammed).toBe(true);
    expect(RunStateManager.nextJamChance(state)).toBeGreaterThan(0);
  });
});
