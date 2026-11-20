import { PRNG } from '../prng/sfc32';

export type SlotSymbol = 'cog' | 'spring' | 'fuse' | 'coil' | 'wrench' | 'wild' | 'crown';
/** the five robot lines a symbol can summon */
export type LineFaction = 'cog' | 'spring' | 'fuse' | 'coil' | 'wrench';

export interface ReelSymbol {
  symbol: SlotSymbol;
  isGilded: boolean;
}

export type Grid3x3 = [
  [ReelSymbol, ReelSymbol, ReelSymbol], // Col 0: Row 0, 1, 2
  [ReelSymbol, ReelSymbol, ReelSymbol], // Col 1: Row 0, 1, 2
  [ReelSymbol, ReelSymbol, ReelSymbol]  // Col 2: Row 0, 1, 2
];

export interface PaylineDefinition {
  id: number;
  name: string;
  coords: [[number, number], [number, number], [number, number]]; // [col, row]
  type: 'horizontal' | 'vertical' | 'diagonal';
}

export const PAYLINES: PaylineDefinition[] = [
  // 3 Horizontal lines
  { id: 0, name: 'Row 0', coords: [[0, 0], [1, 0], [2, 0]], type: 'horizontal' },
  { id: 1, name: 'Row 1', coords: [[0, 1], [1, 1], [2, 1]], type: 'horizontal' },
  { id: 2, name: 'Row 2', coords: [[0, 2], [1, 2], [2, 2]], type: 'horizontal' },

  // 3 Vertical lines
  { id: 3, name: 'Col 0', coords: [[0, 0], [0, 1], [0, 2]], type: 'vertical' },
  { id: 4, name: 'Col 1', coords: [[1, 0], [1, 1], [1, 2]], type: 'vertical' },
  { id: 5, name: 'Col 2', coords: [[2, 0], [2, 1], [2, 2]], type: 'vertical' },

  // 2 Diagonal lines
  { id: 6, name: 'Diag TL-BR', coords: [[0, 0], [1, 1], [2, 2]], type: 'diagonal' },
  { id: 7, name: 'Diag BL-TR', coords: [[0, 2], [1, 1], [2, 0]], type: 'diagonal' }
];

export interface LineEvaluationResult {
  paylineId: number;
  coords: [[number, number], [number, number], [number, number]];
  type: 'horizontal' | 'vertical' | 'diagonal';
  matchType: 'jackpot' | 'faction_three' | 'pair' | 'none';
  faction?: LineFaction;
  isGilded: boolean;
  wildCount: number;
}

export interface SpinResult {
  grid: Grid3x3;
  lineHits: LineEvaluationResult[];
  isJackpot: boolean;
  pairsCount: number;
  /** faction of the first 2-of-a-kind line (Hollow Spring) */
  pairFaction?: LineFaction;
  factionHitsCount: number;
  totalSummonsToTrigger: Array<{
    faction: LineFaction | 'scrap';
    tier: number;
    isGilded: boolean;
  }>;
}

export class ReelManager {
  /**
   * Generates a 3x3 window from 3 reel strips and their stop indices.
   */
  public static extractGrid(
    strips: [ReelSymbol[], ReelSymbol[], ReelSymbol[]],
    stopIndices: [number, number, number]
  ): Grid3x3 {
    const grid: Grid3x3 = [
      [strips[0][stopIndices[0]], strips[0][(stopIndices[0] + 1) % strips[0].length], strips[0][(stopIndices[0] + 2) % strips[0].length]],
      [strips[1][stopIndices[1]], strips[1][(stopIndices[1] + 1) % strips[1].length], strips[1][(stopIndices[1] + 2) % strips[1].length]],
      [strips[2][stopIndices[2]], strips[2][(stopIndices[2] + 1) % strips[2].length], strips[2][(stopIndices[2] + 2) % strips[2].length]]
    ];
    return grid;
  }

  /**
   * The last reel (left to right) that turns on a spin, or -1 when all are held/jammed.
   * The spin animation is over when this reel stops.
   */
  public static lastSpinningReel(heldReels: readonly boolean[]): number {
    for (let c = heldReels.length - 1; c >= 0; c--) if (!heldReels[c]) return c;
    return -1;
  }

  /**
   * Rolls new stop indices taking locked (held) reels into account.
   */
  public static spinReels(
    strips: [ReelSymbol[], ReelSymbol[], ReelSymbol[]],
    currentIndices: [number, number, number],
    heldReels: [boolean, boolean, boolean],
    rng: PRNG,
    symbolWeight?: (reel: number, symbol: SlotSymbol) => number
  ): [number, number, number] {
    const nextIndices: [number, number, number] = [...currentIndices];
    for (let c = 0; c < 3; c++) {
      if (!heldReels[c]) {
        nextIndices[c] = this.pickStop(strips[c], c, rng, symbolWeight);
      }
    }
    return nextIndices;
  }

  /**
   * Picks a stop position. Without weights every stop is equally likely. With weights a stop
   * counts 1 + Σ(weight − 1) over the 3 symbols it shows, so heavier symbols land in the window
   * more often. One random draw per reel either way.
   */
  public static pickStop(
    strip: ReelSymbol[],
    reel: number,
    rng: PRNG,
    symbolWeight?: (reel: number, symbol: SlotSymbol) => number
  ): number {
    const len = strip.length;
    if (!symbolWeight) return rng.nextRange(0, len - 1);
    const weights: number[] = [];
    for (let i = 0; i < len; i++) {
      let w = 1;
      for (let k = 0; k < 3; k++) w += symbolWeight(reel, strip[(i + k) % len].symbol) - 1;
      weights.push(w);
    }
    if (weights.every((w) => w === weights[0])) return rng.nextRange(0, len - 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng.next() * total;
    for (let i = 0; i < len; i++) {
      roll -= weights[i];
      if (roll < 0) return i;
    }
    return len - 1;
  }

  /**
   * Evaluates all 8 paylines across the 3x3 grid.
   */
  public static evaluateGrid(
    grid: Grid3x3,
    activeModifiers?: {
      mirrorHorizontal?: boolean;
      upgradeDiagonal?: boolean;
      /** Chain Cam: a wild in the centre completes every line through the centre that holds a faction symbol */
      omniCenterWild?: boolean;
    }
  ): SpinResult {
    const lineHits: LineEvaluationResult[] = [];
    let isJackpot = false;
    let pairsCount = 0;
    let pairFaction: SpinResult['pairFaction'];
    let factionHitsCount = 0;
    const summonsToTrigger: SpinResult['totalSummonsToTrigger'] = [];

    const centreWild = activeModifiers?.omniCenterWild === true && grid[1][1].symbol === 'wild';

    for (const payline of PAYLINES) {
      const symbolsOnLine: ReelSymbol[] = payline.coords.map(([c, r]) => grid[c][r]);
      let evalResult = this.evaluateLine(payline, symbolsOnLine);

      // Chain Cam: centre wild + one faction symbol on a line through the centre is a win
      if (centreWild && evalResult.matchType === 'pair' && payline.coords.some(([c, r]) => c === 1 && r === 1)) {
        evalResult = { ...evalResult, matchType: 'faction_three' };
      }

      if (evalResult.matchType === 'pair') {
        // pairs are not a win: only 3-in-a-row (row, column or diagonal) pays out
        pairsCount++;
        pairFaction ??= evalResult.faction;
        continue;
      }
      if (evalResult.matchType !== 'none') {
        lineHits.push(evalResult);

        // Apply mirror horizontal modifier if active
        if (activeModifiers?.mirrorHorizontal && payline.type === 'horizontal') {
          lineHits.push({ ...evalResult, paylineId: evalResult.paylineId + 100 });
        }
      }
    }

    for (const hit of lineHits) {
      if (hit.matchType === 'jackpot') {
        isJackpot = true;
      } else if (hit.matchType === 'faction_three' && hit.faction) {
        factionHitsCount++;
        let tier = 1;
        if (activeModifiers?.upgradeDiagonal && hit.type === 'diagonal') {
          tier = 2;
        }
        summonsToTrigger.push({
          faction: hit.faction,
          tier,
          isGilded: hit.isGilded
        });
      }
    }

    return {
      grid,
      lineHits,
      isJackpot,
      pairsCount,
      pairFaction,
      factionHitsCount,
      totalSummonsToTrigger: summonsToTrigger
    };
  }

  /**
   * Evaluates a single 3-symbol line.
   */
  public static evaluateLine(
    payline: PaylineDefinition,
    symbols: ReelSymbol[]
  ): LineEvaluationResult {
    const s0 = symbols[0].symbol;
    const s1 = symbols[1].symbol;
    const s2 = symbols[2].symbol;
    const isAnyGilded = symbols.some((s) => s.isGilded);
    const wildCount = symbols.filter((s) => s.symbol === 'wild').length;

    // 1. Triple Crown = Jackpot
    if (s0 === 'crown' && s1 === 'crown' && s2 === 'crown') {
      return {
        paylineId: payline.id,
        coords: payline.coords,
        type: payline.type,
        matchType: 'jackpot',
        isGilded: isAnyGilded,
        wildCount: 0
      };
    }

    // 2. Triple Wild = Counts as player's choice or Cog
    if (s0 === 'wild' && s1 === 'wild' && s2 === 'wild') {
      return {
        paylineId: payline.id,
        coords: payline.coords,
        type: payline.type,
        matchType: 'faction_three',
        faction: 'cog',
        isGilded: isAnyGilded,
        wildCount: 3
      };
    }

    // 3. Check for 3-of-a-kind with Wild substitution
    const factions: LineFaction[] = ['cog', 'spring', 'fuse', 'coil', 'wrench'];
    for (const f of factions) {
      const match0 = s0 === f || s0 === 'wild';
      const match1 = s1 === f || s1 === 'wild';
      const match2 = s2 === f || s2 === 'wild';

      if (match0 && match1 && match2) {
        return {
          paylineId: payline.id,
          coords: payline.coords,
          type: payline.type,
          matchType: 'faction_three',
          faction: f,
          isGilded: isAnyGilded,
          wildCount
        };
      }
    }

    // 4. Check for 2-of-a-kind (Pairs) for Scrap Bot
    for (const f of factions) {
      const count = [s0, s1, s2].filter((s) => s === f || s === 'wild').length;
      if (count === 2) {
        return {
          paylineId: payline.id,
          coords: payline.coords,
          type: payline.type,
          matchType: 'pair',
          faction: f,
          isGilded: isAnyGilded,
          wildCount
        };
      }
    }

    return {
      paylineId: payline.id,
      coords: payline.coords,
      type: payline.type,
      matchType: 'none',
      isGilded: false,
      wildCount
    };
  }
}
