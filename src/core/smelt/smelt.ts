import { BALANCE } from '@data/balance';
import { UNITS_DATA } from '@data/units';
import { UnitInstance, UnitFactory, UnitLevel } from '../units/unitFactory';
import { PRNG } from '../prng/sfc32';

export type MergeRejectReason = 'different_archetype' | 'different_level' | 'max_level' | 'same_unit';

export interface SmeltResult {
  target: UnitInstance;
  /** true when the two units were fused and the sacrifice must be removed */
  merged: boolean;
  rejectReason?: MergeRejectReason;
  /** level of the target after the merge */
  newLevel: number;
  /** kept for the event payload: one merge = one "xp" */
  xpGained: number;
  totalXp: number;
  evolutionAvailable: boolean;
  evolutionBranchA?: string;
  evolutionBranchB?: string;
}

export class SmeltManager {
  /**
   * Can these two units be merged?
   * Rule: same archetype line (faction — knight, bulwark and golem are all one
   * cog line) AND the same level, and not already at max level.
   */
  public static canMerge(target: UnitInstance, sacrifice: UnitInstance): MergeRejectReason | null {
    if (target.instanceId === sacrifice.instanceId) return 'same_unit';
    if (target.faction !== sacrifice.faction) return 'different_archetype';
    if (target.starRank !== sacrifice.starRank) return 'different_level';
    if (target.starRank >= BALANCE.MAX_UNIT_LEVEL) return 'max_level';
    return null;
  }

  /** Recompute stats from the unit's definition, mods and level. */
  public static applyLevelStats(unit: UnitInstance, fullHeal = true): void {
    const def = UNITS_DATA[unit.defId];
    if (!def) return;
    const stats = UnitFactory.computeEffectiveStats(def, unit.mods, 1.0, unit.isGilded);
    const mult = 1 + BALANCE.LEVEL_STAT_BONUS * (unit.starRank - 1);
    unit.maxHp = Math.round(stats.maxHp * mult);
    unit.damage = Math.round(stats.damage * mult);
    unit.attackSpeed = stats.attackSpeed;
    unit.attackRange = stats.attackRange;
    unit.armor = stats.armor;
    unit.moveSpeed = stats.moveSpeed;
    unit.currentHp = fullHeal ? unit.maxHp : Math.min(unit.currentHp, unit.maxHp);
  }

  /**
   * Merges `sacrifice` into `target`: level N + level N = level N+1 (max 5).
   * Optionally one rolled mod is inherited from the sacrifice.
   * Reaching level 3 or 5 unlocks an evolution choice when the archetype has branches.
   */
  public static smelt(
    target: UnitInstance,
    sacrifice: UnitInstance,
    options?: {
      sacrificeModIndex?: number;
      targetModIndexToReplace?: number;
      furnaceBellowsBonus?: boolean;
      cogWrenchBonus?: boolean;
    }
  ): SmeltResult {
    const reject = this.canMerge(target, sacrifice);
    if (reject) {
      return {
        target,
        merged: false,
        rejectReason: reject,
        newLevel: target.starRank,
        xpGained: 0,
        totalXp: target.smeltXp,
        evolutionAvailable: false
      };
    }

    // Mod inheritance (transfer 1 mod)
    if (
      options?.sacrificeModIndex !== undefined &&
      options?.targetModIndexToReplace !== undefined &&
      sacrifice.mods[options.sacrificeModIndex] &&
      target.mods[options.targetModIndexToReplace]
    ) {
      target.mods[options.targetModIndexToReplace] = sacrifice.mods[options.sacrificeModIndex];
    }

    target.starRank = (target.starRank + 1) as UnitLevel;
    target.smeltXp += 1;
    target.isGilded = target.isGilded || sacrifice.isGilded;
    this.applyLevelStats(target);

    const def = UNITS_DATA[target.defId];
    const branchA = def?.evolutionBranchA;
    const branchB = def?.evolutionBranchB;
    const evolutionAvailable =
      !!branchA && !!branchB && BALANCE.EVOLUTION_LEVELS.includes(target.starRank);

    return {
      target,
      merged: true,
      newLevel: target.starRank,
      xpGained: 1,
      totalXp: target.smeltXp,
      evolutionAvailable,
      evolutionBranchA: branchA,
      evolutionBranchB: branchB
    };
  }

  /**
   * Applies the selected evolution branch (class change at level 3 and 5).
   * The unit keeps its level, its stats are recomputed for the stronger class,
   * and — when an rng is given — it learns one extra random mod, so every
   * evolution also makes the robot more versatile.
   */
  public static evolveUnit(unit: UnitInstance, chosenBranchDefId: string, rng?: PRNG): UnitInstance {
    const newDef = UNITS_DATA[chosenBranchDefId];
    if (!newDef) {
      throw new Error(`Evolution branch definition not found: ${chosenBranchDefId}`);
    }

    unit.defId = chosenBranchDefId;
    unit.tier = newDef.tier;
    unit.quirkId = newDef.quirkId;
    if (rng) {
      const owned = new Set(unit.mods.map((m) => m.id));
      for (let attempt = 0; attempt < 6; attempt++) {
        const [mod] = UnitFactory.rollMods(1, unit.isGilded, rng);
        if (mod && !owned.has(mod.id)) {
          unit.mods.push(mod);
          break;
        }
      }
    }
    this.applyLevelStats(unit);
    return unit;
  }
}
