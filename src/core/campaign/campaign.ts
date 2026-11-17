import { BALANCE } from '@data/balance';
import { CHAPTERS, Chapter, THREAT_LEVELS } from '@data/story';
import type { MetaState } from '../meta/metaSchema';

export interface BossClearResult {
  chapter: Chapter;
  /** the part was recovered for the first time on this profile */
  firstTime: boolean;
  /** refined cogs granted for the first recovery */
  reward: number;
}

export interface CampaignRunResult {
  /** threat level that became available thanks to this run */
  unlockedThreat: number | null;
  /** refined cogs multiplier of the run's threat level */
  rewardMult: number;
}

/** Campaign «Великий Регулятор»: parts, story scenes seen and threat levels. */
export class CampaignManager {
  public static readonly MAX_THREAT = THREAT_LEVELS.length - 1;

  public static chapterByAct(act: number): Chapter {
    return CHAPTERS[Math.min(2, Math.max(0, act - 1))];
  }

  public static hasPart(meta: MetaState, partId: string): boolean {
    return meta.campaign.parts.includes(partId);
  }

  public static partsFound(meta: MetaState): number {
    return CHAPTERS.filter((c) => this.hasPart(meta, c.part.id)).length;
  }

  public static isComplete(meta: MetaState): boolean {
    return this.partsFound(meta) === CHAPTERS.length;
  }

  public static seen(meta: MetaState, sceneId: string): boolean {
    return meta.campaign.scenesSeen.includes(sceneId);
  }

  public static markSeen(meta: MetaState, sceneId: string): void {
    if (!this.seen(meta, sceneId)) meta.campaign.scenesSeen.push(sceneId);
  }

  public static rewardMult(threat: number): number {
    return 1 + BALANCE.THREAT_REWARD_STEP * threat;
  }

  /** Threat level for the next run, never above what is unlocked. */
  public static activeThreat(meta: MetaState): number {
    return Math.min(meta.campaign.selectedThreat, meta.campaign.threatUnlocked);
  }

  public static selectThreat(meta: MetaState, level: number): boolean {
    if (level < 0 || level > meta.campaign.threatUnlocked) return false;
    meta.campaign.selectedThreat = level;
    return true;
  }

  /** A chapter boss fell: recover its part (first time pays refined cogs). */
  public static recordBossDefeat(meta: MetaState, act: number): BossClearResult {
    const chapter = this.chapterByAct(act);
    const firstTime = !this.hasPart(meta, chapter.part.id);
    let reward = 0;
    if (firstTime) {
      meta.campaign.parts.push(chapter.part.id);
      reward = chapter.firstClearReward;
      meta.refinedCogs += reward;
      meta.lifetimeCogsEarned += reward;
    }
    return { chapter, firstTime, reward };
  }

  /** End of a run: best wave per threat, and the next threat level after a full victory. */
  public static recordRunEnd(meta: MetaState, threat: number, wave: number, victory: boolean): CampaignRunResult {
    const key = String(threat);
    meta.campaign.bestWaveByThreat[key] = Math.max(meta.campaign.bestWaveByThreat[key] ?? 0, wave);
    let unlockedThreat: number | null = null;
    if (victory) {
      meta.campaign.bestThreatCleared = Math.max(meta.campaign.bestThreatCleared, threat);
      const next = threat + 1;
      if (next <= this.MAX_THREAT && next > meta.campaign.threatUnlocked) {
        meta.campaign.threatUnlocked = next;
        unlockedThreat = next;
      }
    }
    return { unlockedThreat, rewardMult: this.rewardMult(threat) };
  }
}
