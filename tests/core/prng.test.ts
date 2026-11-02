import { describe, it, expect } from 'vitest';
import { PRNG } from '@core/prng/sfc32';
import { PrngManager } from '@core/prng/prngManager';

describe('PRNG and Stream Isolation Suite', () => {
  it('generates deterministic sequence for identical seeds', () => {
    const prng1 = PRNG.fromSeed('BRASS_SEED_99');
    const prng2 = PRNG.fromSeed('BRASS_SEED_99');

    const seq1 = Array.from({ length: 50 }, () => prng1.next());
    const seq2 = Array.from({ length: 50 }, () => prng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('generates distinct sequences for different seeds', () => {
    const prngA = PRNG.fromSeed('SEED_ALPHA');
    const prngB = PRNG.fromSeed('SEED_BETA');

    const seqA = Array.from({ length: 20 }, () => prngA.next());
    const seqB = Array.from({ length: 20 }, () => prngB.next());

    expect(seqA).not.toEqual(seqB);
  });

  it('serializes and deserializes internal PRNG state precisely', () => {
    const prng = PRNG.fromSeed('SERIALIZE_TEST');
    // Burn 30 numbers
    for (let i = 0; i < 30; i++) prng.next();

    const snapshot = prng.serialize();
    const restored = PRNG.deserialize(snapshot);

    const next5Original = Array.from({ length: 5 }, () => prng.next());
    const next5Restored = Array.from({ length: 5 }, () => restored.next());

    expect(next5Original).toEqual(next5Restored);
  });

  it('isolates sub-streams so consuming reel stream does not shift combat stream', () => {
    const streams1 = PrngManager.createStreams('MASTER_RUN_1');
    const streams2 = PrngManager.createStreams('MASTER_RUN_1');

    // In streams1, consume 100 reel numbers
    for (let i = 0; i < 100; i++) {
      streams1.reel.next();
    }

    // Combat streams should remain completely synchronized
    const combatSeq1 = Array.from({ length: 20 }, () => streams1.combat.next());
    const combatSeq2 = Array.from({ length: 20 }, () => streams2.combat.next());

    expect(combatSeq1).toEqual(combatSeq2);
  });
});

