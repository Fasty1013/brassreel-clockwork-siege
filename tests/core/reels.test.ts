import { describe, it, expect } from 'vitest';
import { ReelManager, Grid3x3, ReelSymbol } from '@core/reels/reels';
import { PRNG } from '@core/prng/sfc32';

describe('Reels, Paylines, and Wild Evaluation Suite', () => {
  it('detects 3-in-a-row on horizontal row 0', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    const grid: Grid3x3 = [
      [s('cog'), s('spring'), s('fuse')],
      [s('cog'), s('fuse'), s('coil')],
      [s('cog'), s('coil'), s('crown')]
    ];

    const result = ReelManager.evaluateGrid(grid);
    expect(result.lineHits.some((h) => h.paylineId === 0 && h.matchType === 'faction_three' && h.faction === 'cog')).toBe(true);
  });

  it('substitutes Golden Gear (Wild) on diagonal lines', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    // Diagonal TL-BR: (0,0)=spring, (1,1)=wild, (2,2)=spring
    const grid: Grid3x3 = [
      [s('spring'), s('fuse'), s('fuse')],
      [s('cog'), s('wild'), s('coil')],
      [s('coil'), s('fuse'), s('spring')]
    ];

    const result = ReelManager.evaluateGrid(grid);
    const diagHit = result.lineHits.find((h) => h.paylineId === 6);
    expect(diagHit).toBeDefined();
    expect(diagHit?.matchType).toBe('faction_three');
    expect(diagHit?.faction).toBe('spring');
    expect(diagHit?.wildCount).toBe(1);
  });

  it('triggers JACKPOT when 3 Crowns appear on a line', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    // Diagonal BL-TR: (0,2)=crown, (1,1)=crown, (2,0)=crown
    const grid: Grid3x3 = [
      [s('cog'), s('fuse'), s('crown')],
      [s('spring'), s('crown'), s('coil')],
      [s('crown'), s('fuse'), s('spring')]
    ];

    const result = ReelManager.evaluateGrid(grid);
    expect(result.isJackpot).toBe(true);
    const jackpotHit = result.lineHits.find((h) => h.paylineId === 7);
    expect(jackpotHit?.matchType).toBe('jackpot');
  });

  it('counts 2-of-a-kind pairs but never pays out for them (only 3 in a row wins)', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    // Row 1: fuse, fuse, spring -> only a pair, no triple anywhere
    const grid: Grid3x3 = [
      [s('cog'), s('fuse'), s('crown')],
      [s('spring'), s('fuse'), s('coil')],
      [s('coil'), s('spring'), s('fuse')]
    ];

    const result = ReelManager.evaluateGrid(grid);
    expect(result.pairsCount).toBeGreaterThan(0);
    expect(result.lineHits.length).toBe(0);
    expect(result.totalSummonsToTrigger.length).toBe(0);
  });

  it('respects reel HOLD during spin', () => {
    const s: (sym: any) => ReelSymbol = (sym) => ({ symbol: sym, isGilded: false });
    const stripA = [s('cog'), s('spring'), s('fuse'), s('coil')];
    const stripB = [s('cog'), s('spring'), s('fuse'), s('coil')];
    const stripC = [s('cog'), s('spring'), s('fuse'), s('coil')];

    const rng = PRNG.fromSeed('HOLD_TEST_SEED');
    const initialIndices: [number, number, number] = [2, 1, 3];
    // Hold reel 0 (index 2)
    const heldReels: [boolean, boolean, boolean] = [true, false, false];

    const nextIndices = ReelManager.spinReels([stripA, stripB, stripC], initialIndices, heldReels, rng);
    expect(nextIndices[0]).toBe(2); // Held in place!
  });
});


describe('spin end with held or jammed reels (lever never froze)', () => {
  it('the spin ends on the last reel that turns', () => {
    expect(ReelManager.lastSpinningReel([false, false, false])).toBe(2);
    expect(ReelManager.lastSpinningReel([false, false, true])).toBe(1);
    expect(ReelManager.lastSpinningReel([false, true, true])).toBe(0);
    expect(ReelManager.lastSpinningReel([true, false, true])).toBe(1);
    expect(ReelManager.lastSpinningReel([true, true, true])).toBe(-1);
  });

  it('a jam that locks the right reel still leaves a spin that can finish', async () => {
    const { RunStateManager } = await import('@core/state/RunState');
    const { RunReducer } = await import('@core/state/reducer');
    const { PrngManager } = await import('@core/prng/prngManager');
    const { EventBus } = await import('@core/events/events');
    // the reported case: wave 7, no free spins, heat 90%, steam left
    for (let seed = 0; seed < 200; seed++) {
      const state = RunStateManager.createInitialState(`jam${seed}`);
      const rng = PrngManager.createStreams(`jam${seed}`);
      const bus = new EventBus();
      let locked = -1;
      bus.on('jam_triggered', (d) => (locked = d.lockedReelIndex ?? -1));
      state.waveNumber = 7;
      state.freeSpinsLeft = 0;
      state.economy.steam = 5;
      state.heat.currentHeat = 90;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
      if (locked !== 2) continue;
      // the right reel is jammed for the next spin: the animation must end on reel 1
      expect(state.heldReels[2]).toBe(true);
      expect(ReelManager.lastSpinningReel(state.heldReels)).toBe(1);
      return;
    }
    throw new Error('no seed jammed the right reel');
  });
});
