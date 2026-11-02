import { EngineCoreDefinition, CoreTag } from '@data/schemas/coreSchema';
import { CORES_DATA } from '@data/cores';

export class CoreEngine {
  private activeCoreIds: string[] = [];

  constructor(initialCoreIds: string[] = []) {
    this.activeCoreIds = [...initialCoreIds];
  }

  public getActiveCores(): EngineCoreDefinition[] {
    return this.activeCoreIds.map((id) => CORES_DATA[id]).filter(Boolean);
  }

  public equipCore(coreId: string): boolean {
    if (this.activeCoreIds.length >= 3) {
      return false; // Max 3 cores
    }
    if (!CORES_DATA[coreId] || this.activeCoreIds.includes(coreId)) {
      return false;
    }
    this.activeCoreIds.push(coreId);
    return true;
  }

  public unequipCore(coreId: string): void {
    this.activeCoreIds = this.activeCoreIds.filter((id) => id !== coreId);
  }

  public hasModifier(ruleModifier: string): boolean {
    return this.getActiveCores().some((c) => c.ruleModifier === ruleModifier);
  }

  public getModifierParam(ruleModifier: string, paramKey: string, defaultValue = 0): number {
    const core = this.getActiveCores().find((c) => c.ruleModifier === ruleModifier);
    if (!core || core.params[paramKey] === undefined) {
      return defaultValue;
    }
    return core.params[paramKey];
  }

  /**
   * Computes active Tag Resonances (tags shared by >= 2 equipped cores).
   */
  public getActiveTagResonances(): CoreTag[] {
    const tagCounts = new Map<CoreTag, number>();
    for (const core of this.getActiveCores()) {
      for (const tag of core.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    const resonances: CoreTag[] = [];
    for (const [tag, count] of tagCounts.entries()) {
      if (count >= 2) {
        resonances.push(tag);
      }
    }
    return resonances;
  }

  public hasTagResonance(tag: CoreTag): boolean {
    return this.getActiveTagResonances().includes(tag);
  }
}

