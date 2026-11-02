import { BALANCE } from '@data/balance';
import { UNITS_DATA } from '@data/units';
import { UnitInstance, UnitFactory } from '../units/unitFactory';

export interface SmeltResult {
  target: UnitInstance;
  xpGained: number;
  totalXp: number;
  evolutionAvailable: boolean;
  evolutionBranchA?: string;
  evolutionBranchB?: string;
}

export class SmeltManager {
  /**
   * Merges sacrifice into target.
   * Mod inheritance can be performed by specifying sacrificeModIndex and targetModIndexToReplace.
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
    // 1. Calculate XP gain
    let xpGain: number = BALANCE.SMELT_BASE_XP;
    if (target.faction === sacrifice.faction) {
      xpGain = BALANCE.SMELT_SAME_FACTION_XP;
    } else if (options?.cogWrenchBonus) {
      xpGain = BALANCE.SMELT_SAME_FACTION_XP;
    }

    if (options?.furnaceBellowsBonus) {
      xpGain += 1;
    }

    target.smeltXp += xpGain;

    // 2. Mod inheritance (transfer 1 mod)
    if (
      options?.sacrificeModIndex !== undefined &&
      options?.targetModIndexToReplace !== undefined &&
      sacrifice.mods[options.sacrificeModIndex] &&
      target.mods[options.targetModIndexToReplace]
    ) {
      target.mods[options.targetModIndexToReplace] = sacrifice.mods[options.sacrificeModIndex];
      // Recompute stats with newly inherited mod
      const def = UNITS_DATA[target.defId];
      if (def) {
        const stats = UnitFactory.computeEffectiveStats(def, target.mods, 1.0, target.isGilded);
        target.maxHp = stats.maxHp;
        target.currentHp = Math.min(target.currentHp, target.maxHp);
        target.damage = stats.damage;
        target.attackSpeed = stats.attackSpeed;
        target.attackRange = stats.attackRange;
        target.armor = stats.armor;
      }
    }

    // 3. Check for Star rank evolution readiness
    const def = UNITS_DATA[target.defId];
    let evolutionAvailable = false;
    let branchA = def?.evolutionBranchA;
    let branchB = def?.evolutionBranchB;

    if (target.starRank === 1 && target.smeltXp >= BALANCE.XP_FOR_STAR_2 && branchA && branchB) {
      evolutionAvailable = true;
    } else if (target.starRank === 2 && target.smeltXp >= BALANCE.XP_FOR_STAR_3 && branchA && branchB) {
      evolutionAvailable = true;
    }

    return {
      target,
      xpGained: xpGain,
      totalXp: target.smeltXp,
      evolutionAvailable,
      evolutionBranchA: branchA,
      evolutionBranchB: branchB
    };
  }

  /**
   * Applies selected evolution branch to unit.
   */
  public static evolveUnit(unit: UnitInstance, chosenBranchDefId: string): UnitInstance {
    const newDef = UNITS_DATA[chosenBranchDefId];
    if (!newDef) {
      throw new Error(`Evolution branch definition not found: ${chosenBranchDefId}`);
    }

    unit.defId = chosenBranchDefId;
    unit.tier = newDef.tier;
    unit.starRank = (unit.starRank + 1) as 2 | 3;
    unit.quirkId = newDef.quirkId;

    // Recompute stats for new archetype while retaining rolled mods
    const stats = UnitFactory.computeEffectiveStats(newDef, unit.mods, 1.0, unit.isGilded);
    unit.maxHp = stats.maxHp;
    unit.currentHp = stats.maxHp; // Full heal upon evolving
    unit.damage = stats.damage;
    unit.attackSpeed = stats.attackSpeed;
    unit.attackRange = stats.attackRange;
    unit.armor = stats.armor;
    unit.moveSpeed = stats.moveSpeed;

    return unit;
  }
}
