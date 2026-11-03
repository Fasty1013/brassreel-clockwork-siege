import { MetaState, MetaStateSchema } from './metaSchema';
import { META_UPGRADES } from './metaUpgrades';
import { RunState } from '../state/RunState';

export const META_STORAGE_KEY = 'brassreel_meta_state_v1';

export class MetaManager {
  public static createDefaultState(): MetaState {
    return {
      version: 1,
      refinedCogs: 0,
      lifetimeCogsEarned: 0,
      totalRuns: 0,
      totalVictories: 0,
      highestWaveReached: 0,
      unlockedUpgrades: {},
      codex: {
        seenUnits: [],
        seenMods: [],
        seenEnemies: [],
        seenCores: []
      }
    };
  }

  public static load(): MetaState {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.createDefaultState();
    }

    try {
      const raw = localStorage.getItem(META_STORAGE_KEY);
      if (!raw) return this.createDefaultState();

      const parsed = JSON.parse(raw);
      const validated = MetaStateSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
      return this.createDefaultState();
    } catch {
      return this.createDefaultState();
    }
  }

  public static save(state: MetaState): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota or disabled safeguard
    }
  }

  public static getUpgradeRank(state: MetaState, upgradeId: string): number {
    return state.unlockedUpgrades[upgradeId] ?? 0;
  }

  public static canBuyUpgrade(state: MetaState, upgradeId: string): boolean {
    const def = META_UPGRADES[upgradeId];
    if (!def) return false;

    const currentRank = this.getUpgradeRank(state, upgradeId);
    if (currentRank >= def.maxRank) return false;

    const cost = def.costPerRank[currentRank];
    return state.refinedCogs >= cost;
  }

  public static buyUpgrade(state: MetaState, upgradeId: string): boolean {
    const def = META_UPGRADES[upgradeId];
    if (!def || !this.canBuyUpgrade(state, upgradeId)) return false;

    const currentRank = this.getUpgradeRank(state, upgradeId);
    const cost = def.costPerRank[currentRank];

    state.refinedCogs -= cost;
    state.unlockedUpgrades[upgradeId] = currentRank + 1;
    this.save(state);
    return true;
  }

  /**
   * Applies unlocked meta-upgrades to an incoming RunState before start
   */
  public static applyMetaToRun(runState: RunState, meta: MetaState): void {
    // 1. Boiler reinforcement (+1 HP per rank)
    const boilerRank = this.getUpgradeRank(meta, 'boiler_reinforcement');
    if (boilerRank > 0) {
      runState.maxBoilerHp += boilerRank;
      runState.boilerHp += boilerRank;
    }

    // 2. Steam manifold (+1 Steam per rank)
    const steamRank = this.getUpgradeRank(meta, 'steam_manifold');
    if (steamRank > 0) {
      runState.economy.steam += steamRank;
      runState.economy.maxSteam += steamRank;
    }

    // 3. Gear calibration (+1 Hold per rank)
    const holdRank = this.getUpgradeRank(meta, 'gear_calibration');
    if (holdRank > 0) {
      runState.holdsLeft += holdRank;
    }

    // 4. Precision escapement (+1 Nudge per rank)
    const nudgeRank = this.getUpgradeRank(meta, 'precision_escapement');
    if (nudgeRank > 0) {
      runState.nudgesLeft += nudgeRank;
    }

    // 5. Gilded starter (Gilds central symbol on Reel 2)
    const gildedRank = this.getUpgradeRank(meta, 'gilded_starter');
    if (gildedRank > 0 && runState.reelStrips[1] && runState.reelStrips[1][1]) {
      runState.reelStrips[1][1].isGilded = true;
    }
  }

  /**
   * Awards meta-progression currency and updates archive records
   */
  public static recordRunResults(
    meta: MetaState,
    runState: RunState,
    victory: boolean
  ): { refinedCogsEarned: number } {
    meta.totalRuns++;
    if (victory) meta.totalVictories++;

    meta.highestWaveReached = Math.max(meta.highestWaveReached, runState.waveNumber);

    // Currency calculation: 1 Refined Cog per wave completed + 20 for Act 1 victory, +50 for Act 3 victory
    let earned = runState.waveNumber;
    if (victory) {
      earned += runState.waveNumber >= 30 ? 50 : 20;
    }

    meta.refinedCogs += earned;
    meta.lifetimeCogsEarned += earned;

    // Update Codex with deployed units and active cores
    const allUnits = [...runState.deployedUnits, ...runState.reserveBench];
    for (const u of allUnits) {
      if (!meta.codex.seenUnits.includes(u.defId)) {
        meta.codex.seenUnits.push(u.defId);
      }
      for (const m of u.mods) {
        if (!meta.codex.seenMods.includes(m.id)) {
          meta.codex.seenMods.push(m.id);
        }
      }
    }

    for (const c of runState.activeCores) {
      if (!meta.codex.seenCores.includes(c)) {
        meta.codex.seenCores.push(c);
      }
    }

    this.save(meta);
    return { refinedCogsEarned: earned };
  }
}

