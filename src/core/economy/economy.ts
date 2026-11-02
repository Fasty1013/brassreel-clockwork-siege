import { BALANCE } from '@data/balance';
import { GADGETS_DATA } from '@data/gadgets';
import { GadgetDefinition } from '@data/schemas/gadgetSchema';
import { ReelSymbol, SlotSymbol } from '../reels/reels';
import { PRNG } from '../prng/sfc32';

export interface EconomyState {
  cogs: number;
  steam: number;
  maxSteam: number;
  removalsCount: number;
  freeRerollAvailable: boolean;
  activeGadgets: string[];
}

export class EconomyManager {
  public static createInitialState(): EconomyState {
    return {
      cogs: BALANCE.INITIAL_COGS,
      steam: BALANCE.INITIAL_STEAM,
      maxSteam: BALANCE.MAX_STEAM_CAP,
      removalsCount: 0,
      freeRerollAvailable: false,
      activeGadgets: []
    };
  }

  public static getRemoveSymbolCost(state: EconomyState, discountPct = 0): number {
    const rawCost = BALANCE.COST_REMOVE_SYMBOL_BASE + state.removalsCount * BALANCE.COST_REMOVE_SYMBOL_INCREMENT;
    return Math.max(1, Math.round(rawCost * (1 - discountPct)));
  }

  public static getAddSymbolCost(discountPct = 0): number {
    return Math.max(1, Math.round(BALANCE.COST_ADD_SYMBOL * (1 - discountPct)));
  }

  public static getGildSymbolCost(discountPct = 0): number {
    return Math.max(1, Math.round(BALANCE.COST_GILD_SYMBOL * (1 - discountPct)));
  }

  public static getRerollCost(state: EconomyState, discountPct = 0): number {
    if (state.freeRerollAvailable) {
      return 0;
    }
    return Math.max(1, Math.round(BALANCE.COST_SHOP_REROLL * (1 - discountPct)));
  }

  public static canAfford(state: EconomyState, cogsCost: number): boolean {
    return state.cogs >= cogsCost;
  }

  public static spendCogs(state: EconomyState, cogsCost: number): boolean {
    if (state.cogs < cogsCost) {
      return false;
    }
    state.cogs -= cogsCost;
    return true;
  }

  public static addCogs(state: EconomyState, amount: number): void {
    state.cogs += amount;
  }

  public static addSteam(state: EconomyState, amount: number): void {
    state.steam = Math.min(state.maxSteam, state.steam + amount);
  }

  public static spendSteam(state: EconomyState, amount = 1): boolean {
    if (state.steam < amount) {
      return false;
    }
    state.steam -= amount;
    return true;
  }

  /**
   * Generates shop offers (3 gadgets + symbols).
   */
  public static generateShopOffers(
    state: EconomyState,
    rng: PRNG
  ): {
    offeredGadgets: GadgetDefinition[];
    offeredSymbols: SlotSymbol[];
  } {
    const allGadgets = Object.values(GADGETS_DATA).filter((g) => !state.activeGadgets.includes(g.id));
    const offeredGadgets: GadgetDefinition[] = [];
    const usedGadgetIds = new Set<string>();

    for (let i = 0; i < 3 && allGadgets.length > 0; i++) {
      const available = allGadgets.filter((g) => !usedGadgetIds.has(g.id));
      if (available.length > 0) {
        const picked = rng.pick(available);
        usedGadgetIds.add(picked.id);
        offeredGadgets.push(picked);
      }
    }

    const standardSymbols: SlotSymbol[] = ['cog', 'spring', 'fuse', 'coil'];
    const offeredSymbols: SlotSymbol[] = [];
    for (let i = 0; i < 3; i++) {
      offeredSymbols.push(rng.pick(standardSymbols));
    }

    return {
      offeredGadgets,
      offeredSymbols
    };
  }

  /**
   * Adds symbol to reel strip.
   */
  public static addSymbolToStrip(
    strip: ReelSymbol[],
    symbol: SlotSymbol,
    isGilded = false
  ): void {
    strip.push({ symbol, isGilded });
  }

  /**
   * Removes symbol at index from reel strip.
   */
  public static removeSymbolFromStrip(
    strip: ReelSymbol[],
    index: number
  ): boolean {
    if (strip.length <= 3) {
      return false; // Minimum 3 symbols to avoid breaking reel
    }
    if (index >= 0 && index < strip.length) {
      strip.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Upgrades symbol at index to Gilded.
   */
  public static gildSymbolOnStrip(
    strip: ReelSymbol[],
    index: number
  ): boolean {
    if (index >= 0 && index < strip.length) {
      strip[index].isGilded = true;
      return true;
    }
    return false;
  }
}

