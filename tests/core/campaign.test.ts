import { describe, it, expect } from 'vitest';
import { CampaignManager } from '@core/campaign/campaign';
import { MetaManager } from '@core/meta/metaManager';
import { MetaStateSchema } from '@core/meta/metaSchema';
import { WaveController } from '@core/waves/waveController';
import { CombatEngine } from '@core/combat/combatEngine';
import { PRNG } from '@core/prng/sfc32';
import { BALANCE, enemyWaveScale } from '@data/balance';
import { CHAPTERS, SPEAKERS, STORY_SCENES, WAVE_LINES, THREAT_LEVELS, chapterForWave } from '@data/story';

describe('campaign story data', () => {
  it('every chapter points at existing scenes and every line at a known speaker', () => {
    for (const ch of CHAPTERS) {
      for (const id of [ch.intro, ch.bossTaunt, ch.outro]) expect(STORY_SCENES[id]).toBeDefined();
    }
    for (const sc of Object.values(STORY_SCENES)) {
      expect(sc.lines.length).toBeGreaterThan(0);
      for (const line of sc.lines) expect(SPEAKERS[line.speaker]).toBeDefined();
    }
  });

  it('has a radio line for every wave and maps waves to chapters', () => {
    expect(WAVE_LINES).toHaveLength(30);
    expect(chapterForWave(1).act).toBe(1);
    expect(chapterForWave(10).act).toBe(1);
    expect(chapterForWave(11).act).toBe(2);
    expect(chapterForWave(30).act).toBe(3);
  });
});

describe('campaign progress', () => {
  it('old saves without campaign data still load', () => {
    const parsed = MetaStateSchema.parse({ refinedCogs: 5 });
    expect(parsed.campaign.parts).toEqual([]);
    expect(parsed.campaign.threatUnlocked).toBe(0);
  });

  it('a boss pays its part reward only the first time', () => {
    const meta = MetaManager.createDefaultState();
    const first = CampaignManager.recordBossDefeat(meta, 1);
    expect(first.firstTime).toBe(true);
    expect(meta.refinedCogs).toBe(CHAPTERS[0].firstClearReward);
    const again = CampaignManager.recordBossDefeat(meta, 1);
    expect(again.firstTime).toBe(false);
    expect(meta.refinedCogs).toBe(CHAPTERS[0].firstClearReward);
    expect(CampaignManager.partsFound(meta)).toBe(1);
  });

  it('story scenes are marked as seen once', () => {
    const meta = MetaManager.createDefaultState();
    CampaignManager.markSeen(meta, 'ch1_intro');
    CampaignManager.markSeen(meta, 'ch1_intro');
    expect(meta.campaign.scenesSeen).toEqual(['ch1_intro']);
  });

  it('a victory unlocks the next threat level, a defeat does not', () => {
    const meta = MetaManager.createDefaultState();
    expect(CampaignManager.recordRunEnd(meta, 0, 17, false).unlockedThreat).toBeNull();
    expect(meta.campaign.bestWaveByThreat['0']).toBe(17);
    expect(CampaignManager.recordRunEnd(meta, 0, 30, true).unlockedThreat).toBe(1);
    expect(CampaignManager.selectThreat(meta, 2)).toBe(false);
    expect(CampaignManager.selectThreat(meta, 1)).toBe(true);
    expect(CampaignManager.activeThreat(meta)).toBe(1);
    for (let t = 1; t <= THREAT_LEVELS.length; t++) CampaignManager.recordRunEnd(meta, t, 30, true);
    expect(meta.campaign.threatUnlocked).toBe(CampaignManager.MAX_THREAT);
  });

  it('threat makes enemies stronger', () => {
    const plain = new WaveController(5, 0).scale();
    const hard = new WaveController(5, 2).scale();
    expect(plain).toEqual(enemyWaveScale(5));
    expect(hard.hp).toBeCloseTo(plain.hp * (1 + 2 * BALANCE.THREAT_ENEMY_STEP));

    const state = CombatEngine.initCombatState([], 10);
    const wc = new WaveController(1, 3);
    wc.initWaveSpawns(PRNG.fromSeed('t'));
    wc.update(state, 0.6, PRNG.fromSeed('t'));
    wc.update(state, 0.05, PRNG.fromSeed('t'));
    const e = state.enemies[0];
    expect(e.maxHp).toBe(Math.round(e.def.hp * (1 + 3 * BALANCE.THREAT_ENEMY_STEP)));
  });
});
