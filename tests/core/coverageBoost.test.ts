import { describe, it, expect } from 'vitest';
import { EventBus } from '@core/events/events';
import { EconomyManager, EconomyState } from '@core/economy/economy';
import { PrngManager } from '@core/prng/prngManager';
import { PRNG } from '@core/prng/sfc32';
import { HeatManager, HeatState } from '@core/heat/heat';
import { ReelManager, Grid3x3, ReelSymbol } from '@core/reels/reels';
import { UnitFactory } from '@core/units/unitFactory';
import { SmeltManager } from '@core/smelt/smelt';
import { WaveController } from '@core/waves/waveController';
import { CombatEngine } from '@core/combat/combatEngine';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { CoreEngine } from '@core/cores/coreEngine';

describe('Coverage & Edge Case Verification Suite', () => {
  it('exercises EventBus fully (on, emit, off, clear)', () => {
    const bus = new EventBus();
    let hitCount = 0;
    const unsubscribe = bus.on('heat_changed', (payload) => {
      hitCount += payload.delta;
    });

    bus.emit('heat_changed', { currentHeat: 20, delta: 20 });
    expect(hitCount).toBe(20);

    unsubscribe();
    bus.emit('heat_changed', { currentHeat: 40, delta: 20 });
    expect(hitCount).toBe(20);

    bus.on('boiler_damaged', () => {});
    bus.clear();
  });

  it('exercises CoreEngine unequip, missing modifiers, and empty state', () => {
    const engine = new CoreEngine(['core_mirror_piston']);
    expect(engine.unequipCore('core_mirror_piston')).toBeUndefined();
    expect(engine.getActiveCores().length).toBe(0);
    expect(engine.hasModifier('nonexistent_modifier')).toBe(false);
    expect(engine.getModifierParam('nonexistent_modifier', 'param', 42)).toBe(42);
  });

  it('exercises PRNG shuffle method', () => {
    const prng = PRNG.fromSeed('SHUFFLE_TEST');
    const arr = [1, 2, 3, 4, 5];
    const shuffled = prng.shuffle([...arr]);
    expect(shuffled.length).toBe(5);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('exercises shield absorption in CombatEngine for both targets and units', () => {
    const rng = PRNG.fromSeed('SHIELD_TEST');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng);
    knight.deployedSlot = { col: 1, row: 2 };

    const state = CombatEngine.initCombatState([knight], 10);
    state.units[0].shield = 50;
    state.units[0].attackCooldown = 0;

    const enemy = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    enemy.shield = 50;
    enemy.x = 2.0;

    CombatEngine.step(state, 0.1, rng);
    expect(enemy.shield).toBeLessThan(50);

    enemy.attackCooldown = 0;
    CombatEngine.step(state, 0.1, rng);
    expect(state.units[0].shield).toBeLessThan(50);
  });

  it('exercises EconomyManager (costs, discounts, symbol operations, shop generation)', () => {
    const state: EconomyState = EconomyManager.createInitialState();
    expect(state.cogs).toBe(25);
    expect(state.steam).toBe(3);

    EconomyManager.addCogs(state, 50);
    expect(state.cogs).toBe(75);

    expect(EconomyManager.canAfford(state, 100)).toBe(false);
    expect(EconomyManager.canAfford(state, 50)).toBe(true);

    expect(EconomyManager.spendCogs(state, 100)).toBe(false);
    expect(EconomyManager.spendCogs(state, 25)).toBe(true);
    expect(state.cogs).toBe(50);

    EconomyManager.addSteam(state, 2);
    expect(state.steam).toBe(5);
    expect(EconomyManager.spendSteam(state, 2)).toBe(true);
    expect(state.steam).toBe(3);
    expect(EconomyManager.spendSteam(state, 10)).toBe(false);

    expect(EconomyManager.getAddSymbolCost(0.2)).toBe(12);
    expect(EconomyManager.getGildSymbolCost(0.2)).toBe(20);
    expect(EconomyManager.getRemoveSymbolCost(state, 0.2)).toBe(16);

    state.freeRerollAvailable = true;
    expect(EconomyManager.getRerollCost(state)).toBe(0);
    state.freeRerollAvailable = false;
    expect(EconomyManager.getRerollCost(state)).toBe(5);

    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    const strip: ReelSymbol[] = [s('cog'), s('spring'), s('fuse'), s('coil')];

    EconomyManager.addSymbolToStrip(strip, 'crown', true);
    expect(strip.length).toBe(5);
    expect(strip[4].isGilded).toBe(true);

    expect(EconomyManager.gildSymbolOnStrip(strip, 0)).toBe(true);
    expect(strip[0].isGilded).toBe(true);
    expect(EconomyManager.gildSymbolOnStrip(strip, 99)).toBe(false);

    expect(EconomyManager.removeSymbolFromStrip(strip, 1)).toBe(true);
    expect(strip.length).toBe(4);
    EconomyManager.removeSymbolFromStrip(strip, 0);
    expect(EconomyManager.removeSymbolFromStrip(strip, 0)).toBe(false);

    const rng = PRNG.fromSeed('SHOP_GEN_TEST');
    const offers = EconomyManager.generateShopOffers(state, rng);
    expect(offers.offeredGadgets.length).toBeGreaterThan(0);
    expect(offers.offeredSymbols.length).toBe(3);
  });

  it('exercises PrngManager stream serialization and deserialization', () => {
    const streams = PrngManager.createStreams('TEST_SEED');
    streams.reel.next();
    streams.combat.next();

    const serialized = PrngManager.serializeStreams(streams);
    const restored = PrngManager.deserializeStreams(serialized);

    expect(streams.reel.next()).toBe(restored.reel.next());
    expect(streams.combat.next()).toBe(restored.combat.next());
  });

  it('triggers and resolves Jam in HeatManager', () => {
    const state: HeatState = {
      currentHeat: 100,
      maxHeat: 100,
      jamProtectionCharges: 0,
      isReelLockedFromJam: [false, false, false]
    };

    let jamTriggered = false;
    for (let s = 0; s < 50; s++) {
      const rng = PRNG.fromSeed(`JAM_FORCE_${s}`);
      const res = HeatManager.rollForJam(state, rng);
      if (res.isJammed) {
        jamTriggered = true;
        expect(res.lockedReelIndex).toBeDefined();
        expect(res.damagePct).toBe(0.25);
        break;
      }
    }
    expect(jamTriggered).toBe(true);
  });

  it('evaluates Triple Wild and active modifier rules in ReelManager', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    const grid: Grid3x3 = [
      [s('wild'), s('spring'), s('fuse')],
      [s('wild'), s('fuse'), s('coil')],
      [s('wild'), s('coil'), s('crown')]
    ];

    const res = ReelManager.evaluateGrid(grid, {
      mirrorHorizontal: true,
      upgradeDiagonal: true,
      hollowSpringPairBonus: true,
      omniCenterWild: true
    });

    expect(res.lineHits.some((h) => h.wildCount === 3)).toBe(true);
  });

  it('exercises merge levels and two evolutions in SmeltManager', () => {
    const rng = PRNG.fromSeed('SMELT_FULL');
    const knight = UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 2 });
    const res = SmeltManager.smelt(knight, UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 2 }), {
      furnaceBellowsBonus: true,
      cogWrenchBonus: true
    });
    expect(res.merged).toBe(true);
    expect(res.evolutionAvailable).toBe(true);

    const bulwark = SmeltManager.evolveUnit(knight, 'unit_cog_bulwark');
    expect(bulwark.starRank).toBe(3);

    SmeltManager.smelt(bulwark, UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 3 }));
    const resFinal = SmeltManager.smelt(bulwark, UnitFactory.createUnit('unit_cog_knight', rng, { customStarRank: 4 }));
    expect(resFinal.evolutionAvailable).toBe(true);
    expect(resFinal.evolutionBranchA).toBe('unit_cog_fortress_golem');

    const golem = SmeltManager.evolveUnit(bulwark, 'unit_cog_fortress_golem');
    expect(golem.starRank).toBe(5);
  });

  it('evaluates all Inspection challenge types in WaveController', () => {
    const waveCtrl = new WaveController(5);
    const rng = PRNG.fromSeed('INSPECTION_TEST');
    waveCtrl.initWaveSpawns(rng);

    const combatState = CombatEngine.initCombatState([], 10);

    // Speed trial
    combatState.elapsedSeconds = 30;
    const resSpeedSuccess = waveCtrl.evaluateInspectionChallenge(combatState, 6);
    expect(resSpeedSuccess.success).toBe(true);

    combatState.elapsedSeconds = 50;
    const resSpeedFail = waveCtrl.evaluateInspectionChallenge(combatState, 6);
    expect(resSpeedFail.success).toBe(false);

    // Iron perimeter
    const wavePerimeter = new WaveController(1);
    (wavePerimeter as any).getCurrentWaveDef = () => ({
      isInspection: true,
      inspectionChallenge: { type: 'iron_perimeter', targetParam: 3, bonusCogs: 10, penaltyBoilerDmg: 1 }
    });
    (wavePerimeter as any).minEnemyXReached = 4.0;
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 5).success).toBe(true);
    (wavePerimeter as any).minEnemyXReached = 2.0;
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 5).success).toBe(false);

    // Full assembly
    (wavePerimeter as any).getCurrentWaveDef = () => ({
      isInspection: true,
      inspectionChallenge: { type: 'full_assembly', targetParam: 6, bonusCogs: 10, penaltyBoilerDmg: 1 }
    });
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 6).success).toBe(true);
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 4).success).toBe(false);

    // Manual labor
    (wavePerimeter as any).getCurrentWaveDef = () => ({
      isInspection: true,
      inspectionChallenge: { type: 'manual_labor', targetParam: 1, bonusCogs: 10, penaltyBoilerDmg: 1 }
    });
    (wavePerimeter as any).valveWasUsed = false;
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 4).success).toBe(true);
    (wavePerimeter as any).valveWasUsed = true;
    expect(wavePerimeter.evaluateInspectionChallenge(combatState, 4).success).toBe(false);
  });

  it('exercises RunReducer commands: Nudge, Undeploy, Valve, Shop actions, NextWave', () => {
    const rng = PrngManager.createStreams('REDUCER_TEST_SEED');
    const state = RunStateManager.createInitialState('REDUCER_TEST_SEED');

    // Nudge
    RunReducer.dispatch(state, { type: 'NUDGE_REEL', reelIndex: 0, direction: 1 }, rng);
    expect(state.nudgesLeft).toBe(0);

    // Spin
    RunReducer.dispatch(state, { type: 'SPIN' }, rng);
    expect(state.reserveBench.length).toBeGreaterThan(0);

    // Deploy & Undeploy
    const unit = state.reserveBench[0];
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: 0, row: 0 }, rng);
    expect(state.deployedUnits.length).toBe(1);
    expect(unit.deployedSlot).toEqual({ col: 0, row: 0 });

    // Invalid deploy out of bounds or occupied
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: 'fake', col: 99, row: 99 }, rng);
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: 'fake', col: 0, row: 0 }, rng);

    // Undeploy invalid
    RunReducer.dispatch(state, { type: 'UNDEPLOY_UNIT', unitId: 'nonexistent' }, rng);

    RunReducer.dispatch(state, { type: 'UNDEPLOY_UNIT', unitId: unit.instanceId }, rng);
    expect(state.deployedUnits.length).toBe(0);
    expect(state.reserveBench.length).toBeGreaterThan(0);

    // Re-deploy for battle
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: unit.instanceId, col: 0, row: 0 }, rng);

    // Start Battle & Use Valve
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    expect(state.phase).toBe('BATTLE');

    RunReducer.dispatch(state, { type: 'USE_VALVE', choice: 'heal' }, rng);
    expect(state.combatState?.valveUsed).toBe(true);

    // Advance to Victory in battle
    for (let t = 0; t < 600 && state.phase === 'BATTLE'; t++) {
      RunReducer.dispatch(state, { type: 'STEP_BATTLE', dt: 0.05 }, rng);
    }

    if (state.phase === 'RESULT') {
      RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
      expect(state.phase).toBe('SHOP');

      // Shop actions
      RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'fuse' }, rng);
      RunReducer.dispatch(state, { type: 'GILD_SYMBOL', reelIndex: 0, symbolIndex: 0 }, rng);
      RunReducer.dispatch(state, { type: 'BUY_GADGET', gadgetId: 'gadget_brass_knuckles' }, rng);
      RunReducer.dispatch(state, { type: 'REROLL_SHOP' }, rng);
      RunReducer.dispatch(state, { type: 'REMOVE_SYMBOL', reelIndex: 0, symbolIndex: 1 }, rng);

      // Start next wave
      RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
      expect(state.waveNumber).toBe(2);
      expect(state.phase).toBe('PREP');
    }
  });

  it('triggers Jam in RunReducer during high heat extra spin', () => {
    const rng = PrngManager.createStreams('REDUCER_JAM_SEED');
    const state = RunStateManager.createInitialState('REDUCER_JAM_SEED');
    const bus = new EventBus();

    // Deploy a unit so Jam can damage it
    const knight = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    knight.deployedSlot = { col: 0, row: 0 };
    state.deployedUnits.push(knight);

    state.freeSpinsLeft = 0;
    state.economy.steam = 5;
    state.heat.currentHeat = 100; // 100 Heat = 35% jam chance

    let jamHappened = false;
    for (let s = 0; s < 30; s++) {
      state.economy.steam = 5;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
      if (state.heldReels.some((h) => h === true)) {
        jamHappened = true;
        break;
      }
    }
    expect(jamHappened).toBe(true);
  });
});
