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
  }
};

