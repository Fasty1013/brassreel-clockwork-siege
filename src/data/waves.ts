import { WaveDefinition } from './schemas/waveSchema';

export const WAVES_DATA: WaveDefinition[] = [
  // ========================================================
  // ACT 1: SUBURBS OF NEW BRASSHOLM (WAVES 1 - 10)
  // ========================================================
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
      targetParam: 40,
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
  },

  // ========================================================
  // ACT 2: THE RUST SWAMPS (WAVES 11 - 20)
  // ========================================================
  {
    waveNumber: 11,
    actNumber: 2,
    titleKey: 'wave.title.11',
    rewardCogs: 36,
    spawns: [
      { enemyId: 'en_acid_drone', count: 6, spawnDelaySeconds: 1.5 },
      { enemyId: 'en_scrapper', count: 6, spawnDelaySeconds: 1.0 }
    ]
  },
  {
    waveNumber: 12,
    actNumber: 2,
    titleKey: 'wave.title.12',
    rewardCogs: 38,
    spawns: [
      { enemyId: 'en_rust_creeper', count: 6, spawnDelaySeconds: 1.2 },
      { enemyId: 'en_steam_rover', count: 3, spawnDelaySeconds: 2.5 }
    ]
  },
  {
    waveNumber: 13,
    actNumber: 2,
    titleKey: 'wave.title.13',
    rewardCogs: 40,
    spawns: [
      { enemyId: 'en_bog_stalker', count: 3, spawnDelaySeconds: 3.0 },
      { enemyId: 'en_acid_drone', count: 6, spawnDelaySeconds: 1.2 }
    ]
  },
  {
    waveNumber: 14,
    actNumber: 2,
    titleKey: 'wave.title.14',
    rewardCogs: 42,
    spawns: [
      { enemyId: 'en_toxic_leech', count: 5, spawnDelaySeconds: 1.5 },
      { enemyId: 'en_rust_creeper', count: 6, spawnDelaySeconds: 1.0 },
      { enemyId: 'en_scrap_sniper', count: 4, spawnDelaySeconds: 2.0 }
    ]
  },
  {
    waveNumber: 15,
    actNumber: 2,
    titleKey: 'wave.title.15',
    rewardCogs: 55,
    isInspection: true,
    inspectionChallenge: {
      type: 'speed_trial',
      targetParam: 45,
      bonusCogs: 30,
      bonusCore: true,
      penaltyBoilerDmg: 2
    },
    spawns: [
      { enemyId: 'en_bog_stalker', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_acid_drone', count: 8, spawnDelaySeconds: 0.9 },
      { enemyId: 'en_rust_creeper', count: 6, spawnDelaySeconds: 1.0 }
    ]
  },
  {
    waveNumber: 16,
    actNumber: 2,
    titleKey: 'wave.title.16',
    rewardCogs: 45,
    spawns: [
      { enemyId: 'en_acid_drone', count: 8, spawnDelaySeconds: 1.0 },
      { enemyId: 'en_toxic_leech', count: 4, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_boiler_raider', count: 6, spawnDelaySeconds: 1.5 }
    ]
  },
  {
    waveNumber: 17,
    actNumber: 2,
    titleKey: 'wave.title.17',
    rewardCogs: 48,
    spawns: [
      { enemyId: 'en_bog_stalker', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_heavy_borer', count: 3, spawnDelaySeconds: 3.0 },
      { enemyId: 'en_rust_creeper', count: 8, spawnDelaySeconds: 0.9 }
    ]
  },
  {
    waveNumber: 18,
    actNumber: 2,
    titleKey: 'wave.title.18',
    rewardCogs: 50,
    spawns: [
      { enemyId: 'en_spire_golem', count: 3, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_toxic_leech', count: 6, spawnDelaySeconds: 1.5 },
      { enemyId: 'en_acid_drone', count: 8, spawnDelaySeconds: 1.0 }
    ]
  },
  {
    waveNumber: 19,
    actNumber: 2,
    titleKey: 'wave.title.19',
    rewardCogs: 55,
    spawns: [
      { enemyId: 'en_bog_stalker', count: 5, spawnDelaySeconds: 2.2 },
      { enemyId: 'en_rust_creeper', count: 10, spawnDelaySeconds: 0.8 },
      { enemyId: 'en_mortar_crawler', count: 4, spawnDelaySeconds: 2.5 }
    ]
  },
  {
    waveNumber: 20,
    actNumber: 2,
    titleKey: 'wave.title.20',
    rewardCogs: 80,
    isBoss: true,
    spawns: [
      { enemyId: 'boss_corrosion_empress', count: 1, spawnDelaySeconds: 0.1, rowLane: 2 },
      { enemyId: 'en_acid_drone', count: 8, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_rust_creeper', count: 6, spawnDelaySeconds: 3.0 }
    ]
  },

  // ========================================================
  // ACT 3: BARON'S CITADEL (WAVES 21 - 30)
  // ========================================================
  {
    waveNumber: 21,
    actNumber: 3,
    titleKey: 'wave.title.21',
    rewardCogs: 60,
    spawns: [
      { enemyId: 'en_clockwork_executioner', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_boiler_raider', count: 8, spawnDelaySeconds: 1.2 }
    ]
  },
  {
    waveNumber: 22,
    actNumber: 3,
    titleKey: 'wave.title.22',
    rewardCogs: 65,
    spawns: [
      { enemyId: 'en_siege_engine', count: 3, spawnDelaySeconds: 3.5 },
      { enemyId: 'en_shock_prowler', count: 6, spawnDelaySeconds: 1.5 }
    ]
  },
  {
    waveNumber: 23,
    actNumber: 3,
    titleKey: 'wave.title.23',
    rewardCogs: 70,
    spawns: [
      { enemyId: 'en_dreadnought', count: 2, spawnDelaySeconds: 5.0 },
      { enemyId: 'en_clockwork_executioner', count: 4, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_scrap_sniper', count: 6, spawnDelaySeconds: 1.5 }
    ]
  },
  {
    waveNumber: 24,
    actNumber: 3,
    titleKey: 'wave.title.24',
    rewardCogs: 75,
    spawns: [
      { enemyId: 'en_lightning_spire', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_siege_engine', count: 3, spawnDelaySeconds: 3.0 },
      { enemyId: 'en_dreadnought', count: 2, spawnDelaySeconds: 4.5 }
    ]
  },
  {
    waveNumber: 25,
    actNumber: 3,
    titleKey: 'wave.title.25',
    rewardCogs: 95,
    isInspection: true,
    inspectionChallenge: {
      type: 'speed_trial',
      targetParam: 50,
      bonusCogs: 40,
      bonusCore: true,
      penaltyBoilerDmg: 2
    },
    spawns: [
      { enemyId: 'en_clockwork_executioner', count: 6, spawnDelaySeconds: 1.8 },
      { enemyId: 'en_lightning_spire', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_siege_engine', count: 4, spawnDelaySeconds: 2.5 }
    ]
  },
  {
    waveNumber: 26,
    actNumber: 3,
    titleKey: 'wave.title.26',
    rewardCogs: 80,
    spawns: [
      { enemyId: 'en_dreadnought', count: 3, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_clockwork_executioner', count: 5, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_spire_golem', count: 3, spawnDelaySeconds: 3.5 }
    ]
  },
  {
    waveNumber: 27,
    actNumber: 3,
    titleKey: 'wave.title.27',
    rewardCogs: 85,
    spawns: [
      { enemyId: 'en_siege_engine', count: 4, spawnDelaySeconds: 2.8 },
      { enemyId: 'en_lightning_spire', count: 5, spawnDelaySeconds: 2.0 },
      { enemyId: 'en_heavy_borer', count: 4, spawnDelaySeconds: 3.0 }
    ]
  },
  {
    waveNumber: 28,
    actNumber: 3,
    titleKey: 'wave.title.28',
    rewardCogs: 90,
    spawns: [
      { enemyId: 'en_dreadnought', count: 4, spawnDelaySeconds: 3.5 },
      { enemyId: 'en_clockwork_executioner', count: 6, spawnDelaySeconds: 1.8 },
      { enemyId: 'en_shock_prowler', count: 6, spawnDelaySeconds: 1.5 }
    ]
  },
  {
    waveNumber: 29,
    actNumber: 3,
    titleKey: 'wave.title.29',
    rewardCogs: 100,
    spawns: [
      { enemyId: 'en_dreadnought', count: 3, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_siege_engine', count: 4, spawnDelaySeconds: 2.5 },
      { enemyId: 'en_clockwork_executioner', count: 6, spawnDelaySeconds: 1.5 },
      { enemyId: 'en_lightning_spire', count: 4, spawnDelaySeconds: 2.0 }
    ]
  },
  {
    waveNumber: 30,
    actNumber: 3,
    titleKey: 'wave.title.30',
    rewardCogs: 150,
    isBoss: true,
    spawns: [
      { enemyId: 'boss_iron_colossus', count: 1, spawnDelaySeconds: 0.1, rowLane: 2 },
      { enemyId: 'en_clockwork_executioner', count: 4, spawnDelaySeconds: 4.0 },
      { enemyId: 'en_siege_engine', count: 3, spawnDelaySeconds: 5.0 }
    ]
  }
];
