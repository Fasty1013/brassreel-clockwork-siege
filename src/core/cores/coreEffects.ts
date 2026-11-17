import { BALANCE } from '@data/balance';
import type { RunState } from '../state/RunState';
import type { CombatSimulationState } from '../combat/combatEngine';
import type { SlotSymbol } from '../reels/reels';
import type { UnitInstance } from '../units/unitFactory';
import { CoreEngine } from './coreEngine';
import { HeatManager } from '../heat/heat';
import { EconomyManager } from '../economy/economy';
import { GadgetManager } from '../gadgets/gadgets';
import { UnitFactory } from '../units/unitFactory';
import { SmeltManager } from '../smelt/smelt';
import { PRNG } from '../prng/sfc32';

/** Engine-core effects that live outside the spin evaluation itself (kept together for one place to read). */
export class CoreEffects {
  private static engine(state: RunState): CoreEngine {
    return new CoreEngine(state.activeCores);
  }

  /**
   * Weight of a symbol landing in the window: heat makes wilds and crowns more frequent
   * (HeatManager.getHeatMultipliers); Lucky Cam doubles crowns on the centre reel.
   * Returns undefined when every symbol weighs the same (plain uniform stop).
   */
  public static symbolWeights(state: RunState): ((reel: number, symbol: SlotSymbol) => number) | undefined {
    const { wildMult, crownMult } = HeatManager.getHeatMultipliers(state.heat.currentHeat);
    const engine = this.engine(state);
    const luckyCam = engine.hasModifier('boost_center_crown')
      ? engine.getModifierParam('boost_center_crown', 'weightMultiplier', 2)
      : 1;
    if (wildMult === 1 && crownMult === 1 && luckyCam === 1) return undefined;
    return (reel, symbol) => {
      if (symbol === 'wild') return wildMult;
      if (symbol === 'crown') return crownMult * (reel === 1 ? luckyCam : 1);
      return 1;
    };
  }

  /** Pressure Valve: heat goes up to 120 instead of 100. */
  public static maxHeat(state: RunState): number {
    const engine = this.engine(state);
    return engine.hasModifier('expand_heat_capacity')
      ? engine.getModifierParam('expand_heat_capacity', 'maxHeat', BALANCE.MAX_HEAT_BASE)
      : BALANCE.MAX_HEAT_BASE;
  }

  /** Workshop gild price with the gadget discount and Gilded Flywheel (−50%). */
  public static gildCost(state: RunState): number {
    const engine = this.engine(state);
    const flywheel = engine.hasModifier('discount_gilded_symbols')
      ? engine.getModifierParam('discount_gilded_symbols', 'discountPct', 0.5)
      : 0;
    const discount = 1 - (1 - GadgetManager.discount(state)) * (1 - flywheel);
    return EconomyManager.getGildSymbolCost(discount);
  }

  /** Grand Regulator: a jackpot also pays cogs and steam. */
  public static onJackpot(state: RunState): void {
    const engine = this.engine(state);
    if (!engine.hasModifier('jackpot_windfall')) return;
    EconomyManager.addCogs(state.economy, engine.getModifierParam('jackpot_windfall', 'bonusCogs', 50));
    EconomyManager.addSteam(state.economy, engine.getModifierParam('jackpot_windfall', 'bonusSteam', 2));
  }

  /** Spring Barrel: a line of Springs gives this many extra archers. */
  public static extraSpringSummons(state: RunState): number {
    const engine = this.engine(state);
    return engine.hasModifier('duplicate_spring_summon')
      ? engine.getModifierParam('duplicate_spring_summon', 'extraUnits', 1)
      : 0;
  }

  /** Hollow Spring: chance that a spin without a 3-in-a-row turns its first pair into a robot. */
  public static pairSummonChance(state: RunState): number {
    const engine = this.engine(state);
    return engine.hasModifier('pair_upgrade_chance') ? engine.getModifierParam('pair_upgrade_chance', 'chancePct', 0.25) : 0;
  }

  /**
   * After a merge: Scrap Boiler repairs the boiler, Furnace Bellows teaches one more mod
   * when the merge happens hot (heat above the threshold).
   */
  public static onMerge(state: RunState, target: UnitInstance, rng: PRNG): void {
    const engine = this.engine(state);
    if (engine.hasModifier('scrap_heal_boiler')) {
      const hp = engine.getModifierParam('scrap_heal_boiler', 'hpGain', 1);
      state.boilerHp = Math.min(state.maxBoilerHp, state.boilerHp + hp);
    }
    if (
      engine.hasModifier('heat_smelt_bonus') &&
      state.heat.currentHeat > engine.getModifierParam('heat_smelt_bonus', 'heatThreshold', 50)
    ) {
      const owned = new Set(target.mods.map((m) => m.id));
      const [mod] = UnitFactory.rollMods(1, target.isGilded, rng).filter((m) => !owned.has(m.id));
      if (mod) {
        target.mods.push(mod);
        SmeltManager.applyLevelStats(target);
      }
    }
  }

  /**
   * New wave charges. `leftoverHolds` are the holds not used last wave (Perpetual Cam keeps them,
   * up to its cap). Steam Forge adds steam, Brass Ratchet a nudge.
   */
  public static onWaveStart(state: RunState, leftoverHolds: number): void {
    const engine = this.engine(state);
    if (engine.hasModifier('retain_holds')) {
      const cap = engine.getModifierParam('retain_holds', 'maxHolds', 4);
      state.holdsLeft = Math.max(state.holdsLeft, Math.min(cap, state.holdsLeft + leftoverHolds));
    }
    if (engine.hasModifier('extra_nudge_charge')) {
      state.nudgesLeft += engine.getModifierParam('extra_nudge_charge', 'charges', 1);
    }
    if (engine.hasModifier('overdrive_damage_buff')) {
      EconomyManager.addSteam(state.economy, engine.getModifierParam('overdrive_damage_buff', 'bonusSteamPerWave', 1));
    }
    state.comboSpinsThisWave = 0;
  }

  /**
   * Battle-start buffs on the combat copies of the robots:
   * - Cog Catalyst: Cog robots +25% health;
   * - Steam Forge: +15% damage to everyone if the battle starts in overdrive (heat above 60);
   * - Clockwork Relay: +10% attack speed per spin of this wave that hit 2+ lines (up to 3 spins);
   * and the in-battle rules read by the combat engine (Fuse Initiator, Coil Resonator).
   */
  public static applyBattleStart(state: RunState, combat: CombatSimulationState): void {
    const engine = this.engine(state);
    const cogHp = engine.hasModifier('buff_cog_faction') ? engine.getModifierParam('buff_cog_faction', 'hpBuffPct', 0.25) : 0;
    const overdrive =
      engine.hasModifier('overdrive_damage_buff') && state.heat.currentHeat > BALANCE.HEAT_JAM_THRESHOLD
        ? engine.getModifierParam('overdrive_damage_buff', 'damageBuffPct', 0.15)
        : 0;
    const relaySpins = engine.hasModifier('combo_cdr')
      ? Math.min(engine.getModifierParam('combo_cdr', 'maxSpins', 3), state.comboSpinsThisWave ?? 0)
      : 0;
    const relay = relaySpins * engine.getModifierParam('combo_cdr', 'cdrPerLinePct', 0.1);

    for (const u of combat.units) {
      if (cogHp > 0 && u.sourceUnit.faction === 'cog') {
        u.maxHp = Math.round(u.maxHp * (1 + cogHp));
        u.hp = Math.round(u.hp * (1 + cogHp));
      }
      if (overdrive > 0) u.damage = Math.round(u.damage * (1 + overdrive));
      if (relay > 0) u.attackSpeed = Math.round(u.attackSpeed * (1 + relay) * 100) / 100;
    }

    combat.coreMods = {
      fuseRadiusMult: engine.hasModifier('buff_fuse_aoe')
        ? 1 + engine.getModifierParam('buff_fuse_aoe', 'blastRadiusPct', 0.5)
        : 1,
      coilExtraJumps: engine.hasModifier('buff_coil_jumps') ? engine.getModifierParam('buff_coil_jumps', 'extraBounces', 2) : 0
    };
  }

  /** Overdrive Clutch: a jam neither hurts a robot nor locks a reel. */
  public static safeJam(state: RunState): boolean {
    return this.engine(state).hasModifier('safe_jam');
  }

  /** Diagonal Dynamo: robots from diagonal lines arrive at this level. */
  public static diagonalLevel(state: RunState): number {
    const engine = this.engine(state);
    return engine.hasModifier('upgrade_diagonal_tier')
      ? 1 + engine.getModifierParam('upgrade_diagonal_tier', 'bonusTier', 1)
      : 1;
  }
}
