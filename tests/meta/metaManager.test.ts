import { describe, it, expect } from 'vitest';
import { MetaManager } from '../../src/core/meta/metaManager';
import { RunStateManager } from '../../src/core/state/RunState';

describe('MetaManager Foundry Archives', () => {
  it('creates clean default meta state', () => {
    const meta = MetaManager.createDefaultState();
    expect(meta.refinedCogs).toBe(0);
    expect(meta.totalRuns).toBe(0);
    expect(meta.highestWaveReached).toBe(0);
    expect(meta.unlockedUpgrades).toEqual({});
  });

  it('correctly checks affordability and buys upgrades', () => {
    const meta = MetaManager.createDefaultState();
    meta.refinedCogs = 20;

    // boiler_reinforcement rank 1 costs 15
    expect(MetaManager.canBuyUpgrade(meta, 'boiler_reinforcement')).toBe(true);
    const bought = MetaManager.buyUpgrade(meta, 'boiler_reinforcement');
    expect(bought).toBe(true);
    expect(meta.refinedCogs).toBe(5);
    expect(MetaManager.getUpgradeRank(meta, 'boiler_reinforcement')).toBe(1);

    // Cannot afford rank 2 (costs 30)
    expect(MetaManager.canBuyUpgrade(meta, 'boiler_reinforcement')).toBe(false);
  });

  it('applies meta upgrades to initial RunState', () => {
    const meta = MetaManager.createDefaultState();
    meta.unlockedUpgrades['boiler_reinforcement'] = 2;
    meta.unlockedUpgrades['steam_manifold'] = 1;
    meta.unlockedUpgrades['gear_calibration'] = 1;
    meta.unlockedUpgrades['precision_escapement'] = 1;
    meta.unlockedUpgrades['gilded_starter'] = 1;

    const run = RunStateManager.createInitialState('TEST_SEED');
    const baseHp = run.boilerHp;
    const baseSteam = run.economy.steam;
    const baseHolds = run.holdsLeft;
    const baseNudges = run.nudgesLeft;

    MetaManager.applyMetaToRun(run, meta);

    expect(run.boilerHp).toBe(baseHp + 2);
    expect(run.maxBoilerHp).toBe(baseHp + 2);
    expect(run.economy.steam).toBe(baseSteam + 1);
    expect(run.holdsLeft).toBe(baseHolds + 1);
    expect(run.nudgesLeft).toBe(baseNudges + 1);
    expect(run.reelStrips[1][1].isGilded).toBe(true);
  });

  it('records run outcomes and awards Refined Cogs', () => {
    const meta = MetaManager.createDefaultState();
    const run = RunStateManager.createInitialState('TEST_SEED');
    run.waveNumber = 10;

    const res = MetaManager.recordRunResults(meta, run, true);
    expect(res.refinedCogsEarned).toBe(30); // 10 waves + 20 victory
    expect(meta.refinedCogs).toBe(30);
    expect(meta.totalRuns).toBe(1);
    expect(meta.totalVictories).toBe(1);
    expect(meta.highestWaveReached).toBe(10);
  });
});

