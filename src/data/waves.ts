import { WaveDefinition } from './schemas/waveSchema';

export const WAVES_DATA: WaveDefinition[] = [
  {
    waveNumber: 1,
    actNumber: 1,
    titleKey: 'wave.title.1',
    rewardCogs: 18,
    spawns: [
      { enemyId: 'en_scrapper', count: 6, spawnDelaySeconds: 1.5 }
    ]
  },
  {
    waveNumber: 2,
    actNumber: 1,
    titleKey: 'wave.title.2',
    rewardCogs: 20,
    spawns: [
      { enemyId: 'en_scrapper', count: 5, spawnDelaySeconds: 1.2 },
      { enemyId: 'en_steam_rover', count: 2, spawnDelaySeconds: 3.0 }
    ]
  },
  {
    waveNumber: 3,
    actNumber: 1,
    titleKey: 'wave.title.3',
    rewardCogs: 22,
    spawns: [
      { enemyId: 'en_scrapper', count: 6, spawnDelaySeconds: 1.0 },
      { enemyId: 'en_clockwork_beetle', count: 3, spawnDelaySeconds: 2.5 }
    ]
  },
  {
    waveNumber: 4,
    actNumber: 1,
    titleKey: 'wave.title.4',
    rewardCogs: 24,
    spawns: [
      { enemyId: 'en_scrap_sniper', count: 4, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_piston_hound', count: 4, spawnDelaySeconds: 1.5 },
      { enemyId: 'en_steam_rover', count: 2, spawnDelaySeconds: 3.5 }
    ]
  },
  {
    waveNumber: 5,
    actNumber: 1,
    titleKey: 'wave.title.5',
    rewardCogs: 35,
    isInspection: true,
    inspectionChallenge: {
      type: 'speed_trial',
      targetParam: 40, // Defeat within 40 seconds
      bonusCogs: 20,
      bonusCore: true,
      penaltyBoilerDmg: 1
    },
    spawns: [
      { enemyId: 'en_scrapper', count: 8, spawnDelaySeconds: 0.8 },
      { enemyId: 'en_shield_drone', count: 2, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_clockwork_beetle', count: 3, spawnDelaySeconds: 2.5 }
    ]
  },
  {
    waveNumber: 6,
    actNumber: 1,
    titleKey: 'wave.title.6',
    rewardCogs: 26,
    spawns: [
      { enemyId: 'en_steam_bomber', count: 4, spawnDelaySeconds: 1.8 },
      { enemyId: 'en_scrapper', count: 8, spawnDelaySeconds: 0.9 },
      { enemyId: 'en_steam_rover', count: 3, spawnDelaySeconds: 2.2 }
    ]
  },
  {
    waveNumber: 7,
    actNumber: 1,
    titleKey: 'wave.title.7',
    rewardCogs: 28,
    spawns: [
      { enemyId: 'en_heavy_borer', count: 2, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_mortar_crawler', count: 3, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_piston_hound', count: 6, spawnDelaySeconds: 1.0 }
    ]
  },
  {
    waveNumber: 8,
    actNumber: 1,
    titleKey: 'wave.title.8',
    rewardCogs: 30,
    spawns: [
      { enemyId: 'en_shock_prowler', count: 4, spawnDelaySeconds: 1.8 },
      { enemyId: 'en_boiler_raider', count: 6, spawnDelaySeconds: 1.2 },
      { enemyId: 'en_shield_drone', count: 3, spawnDelaySeconds: 2.0 }
    ]
  },
  {
    waveNumber: 9,
    actNumber: 1,
    titleKey: 'wave.title.9',
    rewardCogs: 32,
    spawns: [
      { enemyId: 'en_spire_golem', count: 2, spawnDelaySeconds: 5.0 },
      { enemyId: 'en_heavy_borer', count: 3, spawnDelaySeconds: 3.0 },
      { enemyId: 'en_clockwork_beetle', count: 6, spawnDelaySeconds: 1.2 },
      { enemyId: 'en_scrap_sniper', count: 4, spawnDelaySeconds: 2.0 }
    ]
  },
  {
    waveNumber: 10,
    actNumber: 1,
    titleKey: 'wave.title.10',
    rewardCogs: 50,
    isBoss: true,
    spawns: [
      { enemyId: 'boss_steam_baron', count: 1, spawnDelaySeconds: 0.1, rowLane: 2 },
      { enemyId: 'en_shield_drone', count: 4, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_scrapper', count: 6, spawnDelaySeconds: 2.5 }
    ]
  }
];

