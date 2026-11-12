import { UnitDefinition, Faction, UnitTier } from '@data/schemas/unitSchema';
import { ModDefinition } from '@data/schemas/modSchema';
import { UNITS_DATA } from '@data/units';
import { MODS_DATA } from '@data/mods';
import { PRNG } from '../prng/sfc32';

/** Unit level 1..5 (shown as stars). Two units of the same line and level merge into level + 1. */
export type UnitLevel = 1 | 2 | 3 | 4 | 5;

export interface UnitInstance {
  instanceId: string;
  defId: string;
  faction: Faction;
  tier: UnitTier;
  starRank: UnitLevel;
  smeltXp: number;
  currentHp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  attackRange: number;
  armor: number;
  moveSpeed: number;
  quirkId: string;
  mods: ModDefinition[];
  isGilded: boolean;
  deployedSlot?: { col: number; row: number };
}

let nextUnitSequence = 1;

export class UnitFactory {
  public static resetSequence(): void {
    nextUnitSequence = 1;
  }

  /**
   * Creates an active UnitInstance from definition with rolled mods and computed stats.
   */
  public static createUnit(
    defId: string,
    rng: PRNG,
    options?: {
      isGilded?: boolean;
      customStarRank?: UnitLevel;
      comboStatMult?: number;
    }
  ): UnitInstance {
    const def = UNITS_DATA[defId];
    if (!def) {
      throw new Error(`Unit definition not found: ${defId}`);
    }

    const instanceId = `unit_${nextUnitSequence++}_${def.faction}`;
    const isGilded = options?.isGilded ?? false;
    // every freshly summoned unit starts at level 1; levels only come from merging
    const starRank: UnitLevel = options?.customStarRank ?? 1;

    // Roll 2 or 3 mods
    const modCount = isGilded ? 3 : rng.next() < 0.5 ? 2 : 3;
    const rolledMods = this.rollMods(modCount, isGilded, rng);

    // Calculate aggregated stats
    const stats = this.computeEffectiveStats(def, rolledMods, options?.comboStatMult ?? 1.0, isGilded);
    const levelMult = 1 + 0.5 * (starRank - 1);
    stats.maxHp = Math.round(stats.maxHp * levelMult);
    stats.damage = Math.round(stats.damage * levelMult);

    return {
      instanceId,
      defId,
      faction: def.faction,
      tier: def.tier,
      starRank,
      smeltXp: 0,
      currentHp: stats.maxHp,
      maxHp: stats.maxHp,
      damage: stats.damage,
      attackSpeed: stats.attackSpeed,
      attackRange: stats.attackRange,
      armor: stats.armor,
      moveSpeed: stats.moveSpeed,
      quirkId: def.quirkId,
      mods: rolledMods,
      isGilded
    };
  }

  /**
   * Rolls unique mods based on rarity weights.
   */
  public static rollMods(count: number, isGilded: boolean, rng: PRNG): ModDefinition[] {
    const allMods = Object.values(MODS_DATA);
    const commonMods = allMods.filter((m) => m.rarity === 'common');
    const rareMods = allMods.filter((m) => m.rarity === 'rare');
    const epicMods = allMods.filter((m) => m.rarity === 'epic');

    const selectedMods: ModDefinition[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      const roll = rng.next();
      let pool = commonMods;

      if (isGilded) {
        // Gilded units have 50% Rare, 20% Epic, 30% Common
        if (roll < 0.2) {
          pool = epicMods;
        } else if (roll < 0.7) {
          pool = rareMods;
        } else {
          pool = commonMods;
        }
      } else {
        // Standard: 70% Common, 25% Rare, 5% Epic
        if (roll < 0.05) {
          pool = epicMods;
        } else if (roll < 0.3) {
          pool = rareMods;
        } else {
          pool = commonMods;
        }
      }

      const available = pool.filter((m) => !usedIds.has(m.id));
      if (available.length > 0) {
        const picked = rng.pick(available);
        usedIds.add(picked.id);
        selectedMods.push(picked);
      }
    }

    return selectedMods;
  }

  /**
   * Computes effective stats taking base + mods + combo multiplier into account.
   */
  public static computeEffectiveStats(
    def: UnitDefinition,
    mods: ModDefinition[],
    comboStatMult = 1.0,
    isGilded = false
  ): {
    maxHp: number;
    damage: number;
    attackSpeed: number;
    attackRange: number;
    armor: number;
    moveSpeed: number;
  } {
    let hpPct = 0;
    let dmgPct = 0;
    let spdPct = 0;
    let flatArmor = def.armor;
    let extraRange = 0;

    for (const mod of mods) {
      if (mod.statModifiers?.hpPct) hpPct += mod.statModifiers.hpPct;
      if (mod.statModifiers?.damagePct) dmgPct += mod.statModifiers.damagePct;
      if (mod.statModifiers?.attackSpeedPct) spdPct += mod.statModifiers.attackSpeedPct;
      if (mod.statModifiers?.flatArmor) flatArmor += mod.statModifiers.flatArmor;
      if (mod.statModifiers?.rangeTiles) extraRange += mod.statModifiers.rangeTiles;
    }

    // Gilded base bonus (+25% stats)
    const gildedMult = isGilded ? 1.25 : 1.0;

    const maxHp = Math.round(def.baseHp * (1 + hpPct) * comboStatMult * gildedMult);
    const damage = Math.round(def.baseDamage * (1 + dmgPct) * comboStatMult * gildedMult);
    const attackSpeed = Number((def.attackSpeed * (1 + spdPct) * gildedMult).toFixed(2));
    const attackRange = def.attackRange + extraRange;
    const armor = flatArmor;
    const moveSpeed = def.moveSpeed;

    return {
      maxHp,
      damage,
      attackSpeed,
      attackRange,
      armor,
      moveSpeed
    };
  }
}
