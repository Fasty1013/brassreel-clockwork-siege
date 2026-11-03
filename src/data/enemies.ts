import { EnemyDefinition } from './schemas/enemySchema';

export const ENEMIES_DATA: Record<string, EnemyDefinition> = {
  en_scrapper: {
    id: 'en_scrapper',
    nameKey: 'enemy.scrapper.name',
    descKey: 'enemy.scrapper.desc',
    hp: 110,
    damage: 12,
    attackSpeed: 1.0,
    moveSpeed: 1.0,
    attackRange: 1,
    armor: 1,
    bountyCogs: 2,
    spriteKey: 'tex_en_scrapper'
  },
  en_steam_rover: {
    id: 'en_steam_rover',
    nameKey: 'enemy.steam_rover.name',
    descKey: 'enemy.steam_rover.desc',
    hp: 240,
    damage: 20,
    attackSpeed: 0.8,
    moveSpeed: 0.8,
    attackRange: 1,
    armor: 4,
    bountyCogs: 3,
    spriteKey: 'tex_en_steam_rover'
  },
  en_clockwork_beetle: {
    id: 'en_clockwork_beetle',
    nameKey: 'enemy.clockwork_beetle.name',
    descKey: 'enemy.clockwork_beetle.desc',
    hp: 320,
    damage: 15,
    attackSpeed: 0.6,
    moveSpeed: 0.6,
    attackRange: 1,
    armor: 10,
    bountyCogs: 4,
    spriteKey: 'tex_en_beetle'
  },
  en_scrap_sniper: {
    id: 'en_scrap_sniper',
    nameKey: 'enemy.scrap_sniper.name',
    descKey: 'enemy.scrap_sniper.desc',
    hp: 90,
    damage: 35,
    attackSpeed: 0.7,
    moveSpeed: 0.7,
    attackRange: 6,
    armor: 1,
    bountyCogs: 3,
    spriteKey: 'tex_en_sniper'
  },
  en_shield_drone: {
    id: 'en_shield_drone',
    nameKey: 'enemy.shield_drone.name',
    descKey: 'enemy.shield_drone.desc',
    hp: 180,
    damage: 8,
    attackSpeed: 0.9,
    moveSpeed: 0.9,
    attackRange: 3,
    armor: 3,
    bountyCogs: 3,
    spriteKey: 'tex_en_shield_drone'
  },
  en_piston_hound: {
    id: 'en_piston_hound',
    nameKey: 'enemy.piston_hound.name',
    descKey: 'enemy.piston_hound.desc',
    hp: 140,
    damage: 18,
    attackSpeed: 1.4,
    moveSpeed: 1.4,
    attackRange: 1,
    armor: 2,
    bountyCogs: 3,
    spriteKey: 'tex_en_hound'
  },
  en_mortar_crawler: {
    id: 'en_mortar_crawler',
    nameKey: 'enemy.mortar_crawler.name',
    descKey: 'enemy.mortar_crawler.desc',
    hp: 200,
    damage: 45,
    attackSpeed: 0.5,
    moveSpeed: 0.5,
    attackRange: 5,
    armor: 3,
    bountyCogs: 4,
    spriteKey: 'tex_en_mortar'
  },
  en_steam_bomber: {
    id: 'en_steam_bomber',
    nameKey: 'enemy.steam_bomber.name',
    descKey: 'enemy.steam_bomber.desc',
    hp: 130,
    damage: 80,
    attackSpeed: 1.1,
    moveSpeed: 1.1,
    attackRange: 1,
    armor: 2,
    bountyCogs: 3,
    spriteKey: 'tex_en_bomber'
  },
  en_heavy_borer: {
    id: 'en_heavy_borer',
    nameKey: 'enemy.heavy_borer.name',
    descKey: 'enemy.heavy_borer.desc',
    hp: 450,
    damage: 30,
    attackSpeed: 0.5,
    moveSpeed: 0.5,
    attackRange: 1,
    armor: 8,
    bountyCogs: 5,
    spriteKey: 'tex_en_borer'
  },
  en_shock_prowler: {
    id: 'en_shock_prowler',
    nameKey: 'enemy.shock_prowler.name',
    descKey: 'enemy.shock_prowler.desc',
    hp: 220,
    damage: 22,
    attackSpeed: 1.0,
    moveSpeed: 1.0,
    attackRange: 1,
    armor: 4,
    bountyCogs: 4,
    spriteKey: 'tex_en_prowler'
  },
  en_spire_golem: {
    id: 'en_spire_golem',
    nameKey: 'enemy.spire_golem.name',
    descKey: 'enemy.spire_golem.desc',
    hp: 600,
    damage: 40,
    attackSpeed: 0.45,
    moveSpeed: 0.4,
    attackRange: 1,
    armor: 12,
    bountyCogs: 6,
    spriteKey: 'tex_en_golem'
  },
  en_boiler_raider: {
    id: 'en_boiler_raider',
    nameKey: 'enemy.boiler_raider.name',
    descKey: 'enemy.boiler_raider.desc',
    hp: 160,
    damage: 25,
    attackSpeed: 1.2,
    moveSpeed: 1.2,
    attackRange: 1,
    armor: 3,
    bountyCogs: 4,
    spriteKey: 'tex_en_raider'
  },

  // --- ACT 1 BOSS: THE STEAM BARON ---
  boss_steam_baron: {
    id: 'boss_steam_baron',
    nameKey: 'enemy.steam_baron.name',
    descKey: 'enemy.steam_baron.desc',
    hp: 3200,
    damage: 60,
    attackSpeed: 0.7,
    moveSpeed: 0.4,
    attackRange: 2,
    armor: 15,
    bountyCogs: 30,
    isBoss: true,
    bossPhases: [
      {
        thresholdHpPct: 1.0,
        nameKey: 'boss.steam_baron.phase1',
        abilities: ['summon_shield_drones', 'steam_sweep']
      },
      {
        thresholdHpPct: 0.5,
        nameKey: 'boss.steam_baron.phase2',
        abilities: ['locomotive_charge', 'hazard_vent']
      }
    ],
    spriteKey: 'tex_boss_steam_baron'
  },

  // --- ACT 2: RUST SWAMPS ENEMIES & BOSS ---
  en_acid_drone: {
    id: 'en_acid_drone',
    nameKey: 'enemy.acid_drone.name',
    descKey: 'enemy.acid_drone.desc',
    hp: 180,
    damage: 28,
    attackSpeed: 1.1,
    moveSpeed: 1.1,
    attackRange: 3,
    armor: 2,
    bountyCogs: 4,
    spriteKey: 'tex_en_acid_drone'
  },
  en_rust_creeper: {
    id: 'en_rust_creeper',
    nameKey: 'enemy.rust_creeper.name',
    descKey: 'enemy.rust_creeper.desc',
    hp: 140,
    damage: 55,
    attackSpeed: 1.0,
    moveSpeed: 1.3,
    attackRange: 1,
    armor: 1,
    bountyCogs: 3,
    spriteKey: 'tex_en_rust_creeper'
  },
  en_bog_stalker: {
    id: 'en_bog_stalker',
    nameKey: 'enemy.bog_stalker.name',
    descKey: 'enemy.bog_stalker.desc',
    hp: 550,
    damage: 32,
    attackSpeed: 0.6,
    moveSpeed: 0.6,
    attackRange: 1,
    armor: 12,
    bountyCogs: 6,
    spriteKey: 'tex_en_bog_stalker'
  },
  en_toxic_leech: {
    id: 'en_toxic_leech',
    nameKey: 'enemy.toxic_leech.name',
    descKey: 'enemy.toxic_leech.desc',
    hp: 220,
    damage: 20,
    attackSpeed: 0.9,
    moveSpeed: 0.9,
    attackRange: 2,
    armor: 3,
    bountyCogs: 4,
    spriteKey: 'tex_en_toxic_leech'
  },
  boss_corrosion_empress: {
    id: 'boss_corrosion_empress',
    nameKey: 'boss.corrosion_empress.name',
    descKey: 'boss.corrosion_empress.desc',
    hp: 6500,
    damage: 85,
    attackSpeed: 0.8,
    moveSpeed: 0.35,
    attackRange: 3,
    armor: 20,
    bountyCogs: 50,
    isBoss: true,
    bossPhases: [
      {
        thresholdHpPct: 1.0,
        nameKey: 'boss.corrosion_empress.phase1',
        abilities: ['acid_salvo', 'corrosive_mist']
      },
      {
        thresholdHpPct: 0.45,
        nameKey: 'boss.corrosion_empress.phase2',
        abilities: ['swarm_hatch', 'acid_surge']
      }
    ],
    spriteKey: 'tex_boss_corrosion_empress'
  },

  // --- ACT 3: BARON'S CITADEL ENEMIES & FINAL BOSS ---
  en_clockwork_executioner: {
    id: 'en_clockwork_executioner',
    nameKey: 'enemy.clockwork_executioner.name',
    descKey: 'enemy.clockwork_executioner.desc',
    hp: 700,
    damage: 90,
    attackSpeed: 0.7,
    moveSpeed: 0.7,
    attackRange: 1,
    armor: 14,
    bountyCogs: 8,
    spriteKey: 'tex_en_clockwork_executioner'
  },
  en_siege_engine: {
    id: 'en_siege_engine',
    nameKey: 'enemy.siege_engine.name',
    descKey: 'enemy.siege_engine.desc',
    hp: 600,
    damage: 110,
    attackSpeed: 0.35,
    moveSpeed: 0.35,
    attackRange: 5,
    armor: 18,
    bountyCogs: 10,
    spriteKey: 'tex_en_siege_engine'
  },
  en_dreadnought: {
    id: 'en_dreadnought',
    nameKey: 'enemy.dreadnought.name',
    descKey: 'enemy.dreadnought.desc',
    hp: 1200,
    damage: 45,
    attackSpeed: 0.4,
    moveSpeed: 0.4,
    attackRange: 1,
    armor: 25,
    bountyCogs: 12,
    spriteKey: 'tex_en_dreadnought'
  },
  en_lightning_spire: {
    id: 'en_lightning_spire',
    nameKey: 'enemy.lightning_spire.name',
    descKey: 'enemy.lightning_spire.desc',
    hp: 450,
    damage: 40,
    attackSpeed: 0.8,
    moveSpeed: 0.8,
    attackRange: 3,
    armor: 8,
    bountyCogs: 7,
    spriteKey: 'tex_en_lightning_spire'
  },
  boss_iron_colossus: {
    id: 'boss_iron_colossus',
    nameKey: 'boss.iron_colossus.name',
    descKey: 'boss.iron_colossus.desc',
    hp: 12000,
    damage: 150,
    attackSpeed: 0.6,
    moveSpeed: 0.25,
    attackRange: 3,
    armor: 30,
    bountyCogs: 100,
    isBoss: true,
    bossPhases: [
      {
        thresholdHpPct: 1.0,
        nameKey: 'boss.iron_colossus.phase1',
        abilities: ['titan_hammer', 'quake_stomp']
      },
      {
        thresholdHpPct: 0.65,
        nameKey: 'boss.iron_colossus.phase2',
        abilities: ['gatling_barrage', 'rocket_salvo']
      },
      {
        thresholdHpPct: 0.3,
        nameKey: 'boss.iron_colossus.phase3',
        abilities: ['core_overdrive', 'meltdown_nova']
      }
    ],
    spriteKey: 'tex_boss_iron_colossus'
  }
};

