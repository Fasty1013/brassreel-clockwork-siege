/**
 * In-run skill tree, bought with cogs between waves.
 * 4 branches × 3 tiers; a node unlocks once the node above it has rank 1.
 */

export type SkillBranch = 'logistics' | 'armor' | 'arsenal' | 'mechanics';

export type SkillEffect =
  | 'unit_cap'      // +N robots on the field
  | 'wave_cogs'     // +N cogs for every won wave
  | 'hp_pct'        // +N% robot health
  | 'armor'         // +N robot armor
  | 'boiler_hp'     // +N max boiler HP (and heals that much)
  | 'dmg_pct'       // +N% robot damage
  | 'atkspd_pct'    // +N% robot attack speed
  | 'free_spin'     // +N free spins per wave
  | 'hold'          // +N reel holds per wave
  | 'nudge';        // +N reel nudges per wave

export interface SkillNode {
  id: string;
  branch: SkillBranch;
  tier: 0 | 1 | 2;
  name: string;
  /** description of ONE rank; `{n}` is replaced by the per-rank value */
  desc: string;
  effect: SkillEffect;
  perRank: number;
  maxRank: number;
  /** cost of rank 1, 2, 3... */
  costs: number[];
  requires?: string;
}

export const SKILL_BRANCHES: Array<{ id: SkillBranch; name: string; color: string }> = [
  { id: 'logistics', name: 'Логистика', color: '#ffd166' },
  { id: 'armor', name: 'Броня', color: '#5ae0d0' },
  { id: 'arsenal', name: 'Арсенал', color: '#ff8a7a' },
  { id: 'mechanics', name: 'Механика', color: '#8fb8ff' }
];

export const SKILLS: SkillNode[] = [
  // ---- Logistics
  { id: 'log_hangar', branch: 'logistics', tier: 0, name: 'Расширенный ангар', desc: '+{n} робот на поле', effect: 'unit_cap', perRank: 1, maxRank: 3, costs: [15, 25, 40] },
  { id: 'log_salvage', branch: 'logistics', tier: 1, name: 'Трофейщики', desc: '+{n} шестерней за каждую выигранную волну', effect: 'wave_cogs', perRank: 5, maxRank: 3, costs: [20, 30, 45], requires: 'log_hangar' },
  { id: 'log_command', branch: 'logistics', tier: 2, name: 'Командный узел', desc: '+{n} робот на поле', effect: 'unit_cap', perRank: 1, maxRank: 2, costs: [60, 90], requires: 'log_salvage' },

  // ---- Armor
  { id: 'arm_plating', branch: 'armor', tier: 0, name: 'Клёпаная обшивка', desc: '+{n}% здоровья всем роботам', effect: 'hp_pct', perRank: 10, maxRank: 3, costs: [15, 25, 40] },
  { id: 'arm_plates', branch: 'armor', tier: 1, name: 'Стальные пластины', desc: '+{n} брони всем роботам', effect: 'armor', perRank: 2, maxRank: 3, costs: [20, 35, 50], requires: 'arm_plating' },
  { id: 'arm_boiler', branch: 'armor', tier: 2, name: 'Усиленный котёл', desc: '+{n} к прочности котла', effect: 'boiler_hp', perRank: 3, maxRank: 2, costs: [30, 50], requires: 'arm_plates' },

  // ---- Arsenal
  { id: 'ars_whetstone', branch: 'arsenal', tier: 0, name: 'Заточка', desc: '+{n}% урона всем роботам', effect: 'dmg_pct', perRank: 10, maxRank: 3, costs: [15, 25, 40] },
  { id: 'ars_grease', branch: 'arsenal', tier: 1, name: 'Смазка шестерён', desc: '+{n}% скорости атаки', effect: 'atkspd_pct', perRank: 8, maxRank: 3, costs: [20, 35, 50], requires: 'ars_whetstone' },
  { id: 'ars_overheat', branch: 'arsenal', tier: 2, name: 'Перегрев стволов', desc: '+{n}% урона всем роботам', effect: 'dmg_pct', perRank: 20, maxRank: 2, costs: [60, 90], requires: 'ars_grease' },

  // ---- Mechanics
  { id: 'mech_spin', branch: 'mechanics', tier: 0, name: 'Лишний оборот', desc: '+{n} бесплатная прокрутка за волну', effect: 'free_spin', perRank: 1, maxRank: 2, costs: [25, 45] },
  { id: 'mech_hold', branch: 'mechanics', tier: 1, name: 'Стопор', desc: '+{n} удержание барабана за волну', effect: 'hold', perRank: 1, maxRank: 2, costs: [20, 35], requires: 'mech_spin' },
  { id: 'mech_nudge', branch: 'mechanics', tier: 2, name: 'Толкатель', desc: '+{n} сдвиг барабана за волну', effect: 'nudge', perRank: 1, maxRank: 2, costs: [25, 40], requires: 'mech_hold' }
];

export const SKILLS_BY_ID: Record<string, SkillNode> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
