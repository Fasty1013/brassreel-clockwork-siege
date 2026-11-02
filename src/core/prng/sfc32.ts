/**
 * SFC32 (Small Fast Chaotic) 32-bit PRNG
 * Deterministic pseudo-random number generator with period ~2^128.
 */
export class PRNG {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seedA: number, seedB: number, seedC: number, seedD: number) {
    this.a = seedA >>> 0;
    this.b = seedB >>> 0;
    this.c = seedC >>> 0;
    this.d = seedD >>> 0;
  }

  /**
   * Initializes PRNG from a string seed using a 128-bit MurmurHash3-like avalanche.
   */
  public static fromSeed(seed: string): PRNG {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c64e6d;
    let h3 = 0x12345678;
    let h4 = 0x87654321;

    for (let i = 0; i < seed.length; i++) {
      const ch = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761) >>> 0;
      h2 = Math.imul(h2 ^ ch, 1597334677) >>> 0;
      h3 = Math.imul(h3 ^ ch, 2246822507) >>> 0;
      h4 = Math.imul(h4 ^ ch, 3266489909) >>> 0;
    }

    // Avalanche pass
    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
    h3 = (h3 ^ (h3 >>> 16)) >>> 0;
    h4 = (h4 ^ (h4 >>> 15)) >>> 0;

    const prng = new PRNG(h1, h2, h3, h4);
    // Warm up 12 cycles
    for (let i = 0; i < 12; i++) {
      prng.next();
    }
    return prng;
  }

  /**
   * Generates next raw 32-bit unsigned integer.
   */
  public nextInt(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;

    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /**
   * Returns a float in [0, 1).
   */
  public next(): number {
    return this.nextInt() / 4294967296;
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  public nextRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Picks a random element from an array.
   */
  public pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /**
   * Shuffles an array deterministically in place.
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  /**
   * Serializes state for snapshotting.
   */
  public serialize(): [number, number, number, number] {
    return [this.a, this.b, this.c, this.d];
  }

  /**
   * Restores state from snapshot.
   */
  public static deserialize(state: [number, number, number, number]): PRNG {
    return new PRNG(state[0], state[1], state[2], state[3]);
  }
}

