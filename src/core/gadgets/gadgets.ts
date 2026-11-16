import { BALANCE } from '@data/balance';
import { GADGETS_DATA } from '@data/gadgets';
import { GadgetDefinition } from '@data/schemas/gadgetSchema';
import type { RunState } from '../state/RunState';
import type { CombatSimulationState, CombatUnit } from '../combat/combatEngine';
import { EconomyManager } from '../economy/economy';
import { PRNG } from '../prng/sfc32';

/** One-shot items bought in the workshop and spent later in the run. */
export interface ConsumableStock {
  /** cancels the next reel jam */
  gaskets: number;
  /** free spins added when the next wave starts */
  spinsNextWave: number;
  /** next battle: double damage for the first seconds */
  overcharges: number;
  /** next battle: a copy of the best shooter joins the field */
  turrets: number;
  /** next battle: the first enemies to arrive are stunned */
  grenades: number;
}

/** Battle-time effects of gadgets, copied into the combat state at battle start. */
export interface CombatGadgetMods {
  critChanceBonus: number;
  shockBonusSeconds: number;
  /** melee hits push non-boss enemies back by this many tiles */
  knockbackTiles: number;
  extraBountyCogs: number;
  /** leaks that cost no boiler pressure (first ones in the battle) */
  freeLeaks: number;
  /** extra valve uses beyond the first */
  extraValves: number;
  /** damage multiplier while surgeSeconds > 0 */
  surgeMultiplier: number;
  surgeSeconds: number;
  /** how many of the next spawned enemies get stunned */
  stunNextSpawns: number;
  stunSeconds: number;
}

export type GadgetBuyReject = 'unknown' | 'not_offered' | 'owned' | 'no_cogs' | 'wrong_phase';

const FACTION_BY_PARAM: Record<number, string> = { 1: 'cog', 2: 'spring', 3: 'fuse', 4: 'coil' };

export class GadgetManager {
  public static createStock(): ConsumableStock {
    return { gaskets: 0, spinsNextWave: 0, overcharges: 0, turrets: 0, grenades: 0 };
  }

  public static owns(state: RunState, id: string): boolean {
    return state.activeGadgets.includes(id);
  }

  public static ownedPassives(state: RunState): number {
    return state.activeGadgets.filter((id) => GADGETS_DATA[id]?.type === 'passive').length;
  }

  public static discount(state: RunState): number {
    return this.owns(state, 'gadget_discount_coupon') ? GADGETS_DATA.gadget_discount_coupon.params.discountPct : 0;
  }

  /**
   * Passive gadgets get dearer with every one already owned; consumables
   * get dearer as the run goes on. Both keep the workshop a cog sink late in the run.
   */
  public static price(state: RunState, id: string): number {
    const g = GADGETS_DATA[id];
    if (!g) return Infinity;
    const growth =
      g.type === 'passive'
        ? 1 + BALANCE.GADGET_PASSIVE_PRICE_STEP * this.ownedPassives(state)
        : 1 + BALANCE.GADGET_CONSUMABLE_PRICE_PER_WAVE * (state.waveNumber - 1);
    return Math.max(1, Math.round(g.cost * growth * (1 - this.discount(state))));
  }

  /** Gadgets that may appear in the workshop: passives not owned yet and every consumable. */
  public static pool(state: RunState, passivesOnly = false): GadgetDefinition[] {
    return Object.values(GADGETS_DATA).filter((g) =>
      g.type === 'passive' ? !this.owns(state, g.id) : !passivesOnly
    );
  }

  /** Draw `BALANCE.SHOP_GADGET_OFFERS` distinct gadgets into `state.shopOffers`. */
  public static rollOffers(state: RunState, rng: PRNG, passivesOnly = false): void {
    const pool = this.pool(state, passivesOnly);
    const offers: string[] = [];
    while (offers.length < BALANCE.SHOP_GADGET_OFFERS && pool.length > 0) {
      const i = rng.nextRange(0, pool.length - 1);
      offers.push(pool[i].id);
      pool.splice(i, 1);
    }
    state.shopOffers = offers;
  }

  public static canBuy(state: RunState, id: string): GadgetBuyReject | null {
    const g = GADGETS_DATA[id];
    if (!g) return 'unknown';
    if (state.phase !== 'SHOP') return 'wrong_phase';
    if (!state.shopOffers.includes(id)) return 'not_offered';
    if (g.type === 'passive' && this.owns(state, id)) return 'owned';
    if (!EconomyManager.canAfford(state.economy, this.price(state, id))) return 'no_cogs';
    return null;
  }

  /** Pay, take the offer off the shelf and apply what happens right away. */
  public static buy(state: RunState, id: string, rng: PRNG): boolean {
    if (this.canBuy(state, id) !== null) return false;
    const g = GADGETS_DATA[id];
    EconomyManager.spendCogs(state.economy, this.price(state, id));
    state.shopOffers = state.shopOffers.filter((o) => o !== id);
    if (g.type === 'passive') state.activeGadgets.push(id);
    this.applyOnBuy(state, g, rng);
    return true;
  }

  private static applyOnBuy(state: RunState, g: GadgetDefinition, rng: PRNG): void {
    const p = g.params;
    const stock = state.consumables;
    switch (g.effectType) {
      case 'expand_boiler_hp':
        state.maxBoilerHp += p.hpBonus;
        state.boilerHp += p.hpBonus;
        break;
      case 'expand_steam_cap':
        state.economy.maxSteam += p.extraCap;
        break;
      case 'add_wild_symbols':
        for (const strip of state.reelStrips) strip.push({ symbol: 'wild', isGilded: false });
        break;
      case 'negate_jam':
        stock.gaskets += p.charges;
        break;
      case 'restore_steam':
        EconomyManager.addSteam(state.economy, p.amount);
        break;
      case 'reset_heat':
        state.heat.currentHeat = p.targetHeat;
        break;
      case 'free_reel_spin':
        stock.spinsNextWave += p.spins;
        break;
      case 'battle_damage_surge':
        stock.overcharges += 1;
        break;
      case 'heal_boiler':
        state.boilerHp = Math.min(state.maxBoilerHp, state.boilerHp + p.hpAmount);
        break;
      case 'reroll_shop_upgrades':
        this.rollOffers(state, rng, true);
        break;
      case 'spawn_temporary_turret':
        stock.turrets += 1;
        break;
      case 'stun_front_enemies':
        stock.grenades += 1;
        break;
      case 'gild_random_symbol': {
        const strip = state.reelStrips[p.reelIndex] ?? state.reelStrips[1];
        const plain = strip.map((s, i) => ({ s, i })).filter(({ s }) => !s.isGilded && s.symbol !== 'crown');
        if (plain.length > 0) strip[rng.pick(plain).i].isGilded = true;
        break;
      }
      default:
        break; // passive effects are read where they apply
    }
  }

  // ------------------------------------------------------------ run effects
  public static unitCapBonus(state: RunState): number {
    return this.owns(state, 'gadget_toolkit') ? GADGETS_DATA.gadget_toolkit.params.extraCapacity : 0;
  }

  public static coolingBonus(state: RunState): number {
    return this.owns(state, 'gadget_steam_gauge') ? GADGETS_DATA.gadget_steam_gauge.params.coolingBonus : 0;
  }

  public static coreChoices(state: RunState): number {
    return 3 + (this.owns(state, 'gadget_golden_key') ? GADGETS_DATA.gadget_golden_key.params.extraChoice : 0);
  }

  /**
   * Spin without a single line: with the scrap press every
   * `intervalSummon`-th such spin summons a Scrap Bot.
   */
  public static scrapPressTriggers(state: RunState): boolean {
    if (!this.owns(state, 'gadget_scrap_magnet')) return false;
    state.dryStreak += 1;
    if (state.dryStreak >= GADGETS_DATA.gadget_scrap_magnet.params.intervalSummon) {
      state.dryStreak = 0;
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------ battle
  public static combatMods(state: RunState): CombatGadgetMods {
    const has = (id: string): boolean => this.owns(state, id);
    const param = (id: string, key: string): number => GADGETS_DATA[id].params[key];
    const surge = GADGETS_DATA.gadget_overcharge_vial.params;
    const grenade = GADGETS_DATA.gadget_shock_grenade.params;
    return {
      critChanceBonus: has('gadget_lens_array') ? param('gadget_lens_array', 'critChancePct') : 0,
      shockBonusSeconds: has('gadget_copper_coil') ? param('gadget_copper_coil', 'durationBonusSeconds') : 0,
      knockbackTiles: has('gadget_pressure_spring') ? param('gadget_pressure_spring', 'knockbackTiles') : 0,
      extraBountyCogs: has('gadget_magnet_arm') ? param('gadget_magnet_arm', 'extraCogs') : 0,
      freeLeaks: has('gadget_reinforced_boiler') ? param('gadget_reinforced_boiler', 'freeLeaks') : 0,
      extraValves: has('gadget_chrono_gear') ? param('gadget_chrono_gear', 'extraValves') : 0,
      surgeMultiplier: surge.multiplier,
      surgeSeconds: state.consumables.overcharges > 0 ? surge.durationSeconds : 0,
      stunNextSpawns: state.consumables.grenades > 0 ? grenade.enemyCount : 0,
      stunSeconds: grenade.stunSeconds
    };
  }

  /** Stat buffs on the combat copies of the robots and the one-battle consumables. */
  public static applyBattleStart(state: RunState, combat: CombatSimulationState): void {
    combat.gadgetMods = this.combatMods(state);
    if (state.consumables.overcharges > 0) state.consumables.overcharges--;
    if (state.consumables.grenades > 0) state.consumables.grenades--;

    const has = (id: string): boolean => this.owns(state, id);
    for (const u of combat.units) {
      const faction = u.sourceUnit.faction;
      for (const id of ['gadget_brass_knuckles', 'gadget_gunpowder_flask']) {
        const p = GADGETS_DATA[id].params;
        if (has(id) && FACTION_BY_PARAM[p.faction] === faction) u.damage = Math.round(u.damage * (1 + p.damagePct));
      }
      const stone = GADGETS_DATA.gadget_sharpening_stone.params;
      if (has('gadget_sharpening_stone') && FACTION_BY_PARAM[stone.faction] === faction) u.attackRange += stone.rangeBonus;
      if (has('gadget_oil_can')) {
        u.attackSpeed = Math.round(u.attackSpeed * (1 + GADGETS_DATA.gadget_oil_can.params.speedPct) * 100) / 100;
      }
    }

    if (state.consumables.turrets > 0) {
      state.consumables.turrets--;
      this.placeTurret(combat);
    }
  }

  /** A copy of the strongest shooter (or of the strongest robot) on a free cell behind the line. */
  private static placeTurret(combat: CombatSimulationState): void {
    if (combat.units.length === 0) return;
    const power = (u: CombatUnit): number => u.damage * u.attackSpeed;
    const shooters = combat.units.filter((u) => u.attackRange > 2);
    const model = [...(shooters.length > 0 ? shooters : combat.units)].sort((a, b) => power(b) - power(a))[0];
    const taken = new Set(combat.units.map((u) => `${u.col},${u.row}`));
    for (let col = 0; col < BALANCE.GRID_COLS; col++) {
      for (const row of [2, 1, 3, 0, 4]) {
        if (taken.has(`${col},${row}`)) continue;
        combat.units.push({
          ...model,
          id: `${model.id}_turret`,
          col,
          row,
          x: col + 0.5,
          y: row + 0.5,
          hp: model.maxHp,
          shield: 0,
          isDead: false,
          isTurret: true,
          statuses: { ...model.statuses }
        });
        return;
      }
    }
  }
}
