import { describe, it, expect } from 'vitest';
import { ReelManager, Grid3x3, ReelSymbol } from '@core/reels/reels';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { EventBus } from '@core/events/events';
import { UnitFactory } from '@core/units/unitFactory';
import { HeatManager } from '@core/heat/heat';
import { SmeltManager } from '@core/smelt/smelt';
import { EconomyManager } from '@core/economy/economy';

describe('QA Hardening: Critical Edge Cases Suite', () => {
  it('correctly evaluates all 8 paylines hitting simultaneously (Full Screen of Cogs)', () => {
    // 3x3 grid filled with Cog
    const cogSym: ReelSymbol = { symbol: 'cog', isGilded: false };
    const fullGrid: Grid3x3 = [
      [cogSym, cogSym, cogSym],
      [cogSym, cogSym, cogSym],
      [cogSym, cogSym, cogSym]
    ];

    const result = ReelManager.evaluateGrid(fullGrid);

    // 3 horizontal + 3 vertical + 2 diagonal = 8 line hits
    expect(result.lineHits.length).toBe(8);
    expect(result.factionHitsCount).toBe(8);
    expect(result.isJackpot).toBe(false);
    expect(result.pairsCount).toBe(0);
    expect(result.totalSummonsToTrigger.length).toBe(8);
    for (const summon of result.totalSummonsToTrigger) {
      expect(summon.faction).toBe('cog');
      expect(summon.tier).toBe(1);
    }
  });

  it('correctly evaluates all 8 paylines as Jackpot when 3x3 grid is filled with Crowns', () => {
    const crownSym: ReelSymbol = { symbol: 'crown', isGilded: false };
    const fullGrid: Grid3x3 = [
      [crownSym, crownSym, crownSym],
      [crownSym, crownSym, crownSym],
      [crownSym, crownSym, crownSym]
    ];

    const result = ReelManager.evaluateGrid(fullGrid);
    expect(result.lineHits.length).toBe(8);
    expect(result.isJackpot).toBe(true);
    for (const hit of result.lineHits) {
      expect(hit.matchType).toBe('jackpot');
    }
  });

  it('handles Jam risk and damage scaling at 100% Heat', () => {
    const heatState = HeatManager.createInitialState();
    heatState.currentHeat = 100;

    // Jam chance at 100% heat is 35%
    const jamChance = HeatManager.getJamChance(heatState.currentHeat);
    expect(jamChance).toBeCloseTo(0.35, 2);

    // At 50% heat, jam chance is 0%
    heatState.currentHeat = 50;
    expect(HeatManager.getJamChance(heatState.currentHeat)).toBe(0);

    // Check Jam damage and reel lock in Reducer
    const rng = PrngManager.createStreams('JAM_TEST_100');
    const state = RunStateManager.createInitialState('JAM_TEST_100');
    state.heat.currentHeat = 100;
    state.freeSpinsLeft = 0;
    state.economy.steam = 5;

    const unit = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    state.deployedUnits.push(unit);
    const initialHp = unit.currentHp;

    const bus = new EventBus();
    let jamTriggered = false;
    bus.on('jam_triggered', () => {
      jamTriggered = true;
    });

    // Spin multiple times with 100 heat until jam triggers
    for (let i = 0; i < 20 && !jamTriggered; i++) {
      state.freeSpinsLeft = 1;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    }

    if (jamTriggered) {
      // Either a reel was locked or unit received spark damage
      const hasLockedReel = state.heldReels.some((h) => h);
      const tookDamage = unit.currentHp < initialHp;
      expect(hasLockedReel || tookDamage).toBe(true);
    }
  });

  it('strictly enforces single Emergency Valve usage per wave', () => {
    const rng = PrngManager.createStreams('VALVE_EDGE_TEST');
    const state = RunStateManager.createInitialState('VALVE_EDGE_TEST');

    // Deploy a unit and start battle
    const defender = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    defender.deployedSlot = { col: 0, row: 2 };
    state.deployedUnits.push(defender);

    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    expect(state.phase).toBe('BATTLE');
    expect(state.combatState?.valveUsed).toBe(false);

    // 1st Valve use: Slow enemies
    RunReducer.dispatch(state, { type: 'USE_VALVE', choice: 'slow' }, rng);
    expect(state.combatState?.valveUsed).toBe(true);
    expect(state.combatState?.valveSlowRemaining).toBeGreaterThan(0);

    const timerAfterFirst = state.combatState?.valveSlowRemaining;

    // 2nd Valve use in same wave: should be ignored!
    RunReducer.dispatch(state, { type: 'USE_VALVE', choice: 'heal' }, rng);
    expect(state.combatState?.valveSlowRemaining).toBe(timerAfterFirst);
  });

  it('prevents removing symbols below minimum reel strip length (3 symbols)', () => {
    const state = RunStateManager.createInitialState('DECK_MIN_TEST');
    state.economy.cogs = 5000;

    // Shorten Reel 0 down to 3 symbols
    state.reelStrips[0] = state.reelStrips[0].slice(0, 3);
    expect(state.reelStrips[0].length).toBe(3);

    // Try to remove a 4th symbol
    const initialLen = state.reelStrips[0].length;
    const removed = EconomyManager.removeSymbolFromStrip(state.reelStrips[0], 0);

    // Should NOT allow removing below 3
    expect(removed).toBe(false);
    expect(state.reelStrips[0].length).toBe(initialLen);
  });

  it('refuses to merge a level-3 unit with a level-1 unit', () => {
    const rng = PrngManager.createStreams('SMELT_MAX_STAR');
    const unitA = UnitFactory.createUnit('unit_cog_knight', rng.loot, { customStarRank: 3 });
    const unitB = UnitFactory.createUnit('unit_cog_knight', rng.loot);

    const smeltResult = SmeltManager.smelt(unitA, unitB);
    expect(smeltResult.evolutionAvailable).toBe(false);
    expect(unitA.starRank).toBe(3);
  });

  it('merges only units of the same line and level', () => {
    const rng = PrngManager.createStreams('SMELT_XP_CHECK');
    const cogA = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    const cogB = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    const springC = UnitFactory.createUnit('unit_spring_archer', rng.loot);

    expect(SmeltManager.smelt(springC, cogA).merged).toBe(false);
    expect(SmeltManager.smelt(cogA, cogB).merged).toBe(true);
    expect(cogA.starRank).toBe(2);
  });
});
