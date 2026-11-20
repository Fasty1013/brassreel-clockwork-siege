export interface QuirkDefinition {
  id: string;
  nameKey: string;
  descKey: string;
  effectType:
    | 'damage_reduction'
    | 'shield_aura'
    | 'reflect'
    | 'stun_charge'
    | 'cleave'
    | 'ricochet'
    | 'pierce'
    | 'crit_execute'
    | 'burst_fire'
    | 'speed_stack'
    | 'death_explosion'
    | 'molten_pool'
    | 'thermal_vuln'
    | 'knockback'
    | 'proximity_mines'
    | 'chain_lightning'
    | 'thunderbolt'
    | 'speed_aura'
    | 'steam_shroud'
    | 'solar_beam'
    | 'time_dilation'
    | 'scrap_scavenge'
    // healer line (faction 'wrench'): every wrench robot heals; these add to it
    | 'field_repair'   // plain healing
    | 'heal_all'       // the heal also mends every other wounded ally in reach
    | 'heal_shield'    // healing past full health becomes a shield
    | 'heal_aoe'       // the heal also mends every ally around the target
    | 'revive'         // brings back the first fallen ally once per battle
    | 'guard_aura'     // allies around take less damage
    | 'regen_aura';    // allies around regenerate health
  params: Record<string, number>;
}

export const QUIRKS_DATA: Record<string, QuirkDefinition> = {
  quirk_scrap_plating: {
    id: 'quirk_scrap_plating',
    nameKey: 'quirk.scrap_plating.name',
    descKey: 'quirk.scrap_plating.desc',
    effectType: 'scrap_scavenge',
    params: { cogChance: 0.2, cogs: 1 }
  },
  quirk_iron_plating: {
    id: 'quirk_iron_plating',
    nameKey: 'quirk.iron_plating.name',
    descKey: 'quirk.iron_plating.desc',
    effectType: 'damage_reduction',
    params: { damageReductionPct: 0.15 }
  },
  quirk_fortress_barricade: {
    id: 'quirk_fortress_barricade',
    nameKey: 'quirk.fortress_barricade.name',
    descKey: 'quirk.fortress_barricade.desc',
    effectType: 'shield_aura',
    params: { shieldPctOfHp: 0.25, intervalSeconds: 8, radiusTiles: 1.5 }
  },
  quirk_damage_reflection: {
    id: 'quirk_damage_reflection',
    nameKey: 'quirk.damage_reflection.name',
    descKey: 'quirk.damage_reflection.desc',
    effectType: 'reflect',
    params: { reflectPct: 0.3 }
  },
  quirk_impact_charge: {
    id: 'quirk_impact_charge',
    nameKey: 'quirk.impact_charge.name',
    descKey: 'quirk.impact_charge.desc',
    effectType: 'stun_charge',
    params: { everyNthHit: 3, stunSeconds: 1.5, bossStunSeconds: 0.5 }
  },
  quirk_siege_cleave: {
    id: 'quirk_siege_cleave',
    nameKey: 'quirk.siege_cleave.name',
    descKey: 'quirk.siege_cleave.desc',
    effectType: 'cleave',
    params: { cleavePct: 0.4 }
  },
  quirk_recoil_spring: {
    id: 'quirk_recoil_spring',
    nameKey: 'quirk.recoil_spring.name',
    descKey: 'quirk.recoil_spring.desc',
    effectType: 'ricochet',
    params: { chancePct: 0.2, damagePct: 0.6 }
  },
  quirk_infinite_pierce: {
    id: 'quirk_infinite_pierce',
    nameKey: 'quirk.infinite_pierce.name',
    descKey: 'quirk.infinite_pierce.desc',
    effectType: 'pierce',
    params: { maxTargets: 3 }
  },
  quirk_high_ground_crit: {
    id: 'quirk_high_ground_crit',
    nameKey: 'quirk.high_ground_crit.name',
    descKey: 'quirk.high_ground_crit.desc',
    effectType: 'crit_execute',
    params: { thresholdPct: 0.7, damageMult: 1.75 }
  },
  quirk_triple_burst: {
    id: 'quirk_triple_burst',
    nameKey: 'quirk.triple_burst.name',
    descKey: 'quirk.triple_burst.desc',
    effectType: 'burst_fire',
    params: { extraBolts: 2, damagePct: 0.4 }
  },
  quirk_focus_acceleration: {
    id: 'quirk_focus_acceleration',
    nameKey: 'quirk.focus_acceleration.name',
    descKey: 'quirk.focus_acceleration.desc',
    effectType: 'speed_stack',
    params: { speedPerHitPct: 0.1, maxStacks: 10 }
  },
  quirk_death_explosion: {
    id: 'quirk_death_explosion',
    nameKey: 'quirk.death_explosion.name',
    descKey: 'quirk.death_explosion.desc',
    effectType: 'death_explosion',
    params: { damageMult: 3, radiusTiles: 1.5 }
  },
  quirk_molten_pool: {
    id: 'quirk_molten_pool',
    nameKey: 'quirk.molten_pool.name',
    descKey: 'quirk.molten_pool.desc',
    effectType: 'molten_pool',
    params: { burnPctOfDamage: 0.4, durationSeconds: 4, radiusTiles: 1 }
  },
  quirk_thermal_vulnerability: {
    id: 'quirk_thermal_vulnerability',
    nameKey: 'quirk.thermal_vulnerability.name',
    descKey: 'quirk.thermal_vulnerability.desc',
    effectType: 'thermal_vuln',
    params: { bonusDamagePct: 0.25, durationSeconds: 4 }
  },
  quirk_concussive_knockback: {
    id: 'quirk_concussive_knockback',
    nameKey: 'quirk.concussive_knockback.name',
    descKey: 'quirk.concussive_knockback.desc',
    effectType: 'knockback',
    params: { tiles: 0.5 }
  },
  quirk_proximity_mines: {
    id: 'quirk_proximity_mines',
    nameKey: 'quirk.proximity_mines.name',
    descKey: 'quirk.proximity_mines.desc',
    effectType: 'proximity_mines',
    params: { rangeTiles: 1.5, damageMult: 2 }
  },
  quirk_electric_conduction: {
    id: 'quirk_electric_conduction',
    nameKey: 'quirk.electric_conduction.name',
    descKey: 'quirk.electric_conduction.desc',
    effectType: 'chain_lightning',
    params: { maxJumps: 1, damageRatio: 0.5 }
  },
  quirk_five_fold_chain: {
    id: 'quirk_five_fold_chain',
    nameKey: 'quirk.five_fold_chain.name',
    descKey: 'quirk.five_fold_chain.desc',
    effectType: 'chain_lightning',
    params: { maxJumps: 4, damageRatio: 0.75 }
  },
  quirk_thunderbolt_strike: {
    id: 'quirk_thunderbolt_strike',
    nameKey: 'quirk.thunderbolt_strike.name',
    descKey: 'quirk.thunderbolt_strike.desc',
    effectType: 'thunderbolt',
    params: { hitInterval: 4, damageMult: 4, stunSeconds: 1.5, bossStunSeconds: 0.5 }
  },
  quirk_kinetic_shield_aura: {
    id: 'quirk_kinetic_shield_aura',
    nameKey: 'quirk.kinetic_shield_aura.name',
    descKey: 'quirk.kinetic_shield_aura.desc',
    effectType: 'shield_aura',
    params: { shieldPctOfHp: 0.2, intervalSeconds: 6, radiusTiles: 1.5 }
  },
  quirk_overclock_field: {
    id: 'quirk_overclock_field',
    nameKey: 'quirk.overclock_field.name',
    descKey: 'quirk.overclock_field.desc',
    effectType: 'speed_aura',
    params: { speedBuffPct: 0.25, radiusTiles: 1.5 }
  },
  quirk_steam_aegis: {
    id: 'quirk_steam_aegis',
    nameKey: 'quirk.steam_aegis.name',
    descKey: 'quirk.steam_aegis.desc',
    effectType: 'steam_shroud',
    params: { damageReductionPct: 0.2, reflectPct: 0.2 }
  },
  quirk_solar_beam: {
    id: 'quirk_solar_beam',
    nameKey: 'quirk.solar_beam.name',
    descKey: 'quirk.solar_beam.desc',
    effectType: 'solar_beam',
    params: { armorShredPct: 0.5, bonusDamagePct: 0.25 }
  },
  quirk_time_dilation: {
    id: 'quirk_time_dilation',
    nameKey: 'quirk.time_dilation.name',
    descKey: 'quirk.time_dilation.desc',
    effectType: 'time_dilation',
    params: { slowPct: 0.4 }
  },

  // --- level-3 evolutions: each branch has its own quirk (a lighter take on its level-5 forms) ---
  quirk_steel_bulwark: {
    id: 'quirk_steel_bulwark',
    nameKey: 'quirk.steel_bulwark.name',
    descKey: 'quirk.steel_bulwark.desc',
    effectType: 'shield_aura',
    params: { shieldPctOfHp: 0.15, intervalSeconds: 10, radiusTiles: 1.5 }
  },
  quirk_ram_strike: {
    id: 'quirk_ram_strike',
    nameKey: 'quirk.ram_strike.name',
    descKey: 'quirk.ram_strike.desc',
    effectType: 'stun_charge',
    params: { everyNthHit: 4, stunSeconds: 1, bossStunSeconds: 0.3 }
  },
  quirk_through_shot: {
    id: 'quirk_through_shot',
    nameKey: 'quirk.through_shot.name',
    descKey: 'quirk.through_shot.desc',
    effectType: 'pierce',
    params: { maxTargets: 2 }
  },
  quirk_double_shot: {
    id: 'quirk_double_shot',
    nameKey: 'quirk.double_shot.name',
    descKey: 'quirk.double_shot.desc',
    effectType: 'burst_fire',
    params: { extraBolts: 1, damagePct: 0.35 }
  },
  quirk_ignite: {
    id: 'quirk_ignite',
    nameKey: 'quirk.ignite.name',
    descKey: 'quirk.ignite.desc',
    effectType: 'molten_pool',
    params: { burnPctOfDamage: 0.25, durationSeconds: 3, radiusTiles: 0.6 }
  },
  quirk_shrapnel: {
    id: 'quirk_shrapnel',
    nameKey: 'quirk.shrapnel.name',
    descKey: 'quirk.shrapnel.desc',
    effectType: 'cleave',
    params: { cleavePct: 0.3 }
  },
  quirk_double_arc: {
    id: 'quirk_double_arc',
    nameKey: 'quirk.double_arc.name',
    descKey: 'quirk.double_arc.desc',
    effectType: 'chain_lightning',
    params: { maxJumps: 2, damageRatio: 0.6 }
  },
  quirk_recharge_field: {
    id: 'quirk_recharge_field',
    nameKey: 'quirk.recharge_field.name',
    descKey: 'quirk.recharge_field.desc',
    effectType: 'speed_aura',
    params: { speedBuffPct: 0.12, radiusTiles: 1.5 }
  },

  // --- healer line (wrench): heal power = the robot's damage × healMult ---
  quirk_field_repair: {
    id: 'quirk_field_repair',
    nameKey: 'quirk.field_repair.name',
    descKey: 'quirk.field_repair.desc',
    effectType: 'field_repair',
    params: { healMult: 1.2 }
  },
  quirk_heal_chain: {
    id: 'quirk_heal_chain',
    nameKey: 'quirk.heal_chain.name',
    descKey: 'quirk.heal_chain.desc',
    effectType: 'heal_aoe',
    params: { healMult: 1.3, splashPct: 0.5, radiusTiles: 1.2 }
  },
  quirk_heal_shield: {
    id: 'quirk_heal_shield',
    nameKey: 'quirk.heal_shield.name',
    descKey: 'quirk.heal_shield.desc',
    effectType: 'heal_shield',
    params: { healMult: 1.3, maxShieldPctOfHp: 0.3 }
  },
  quirk_heal_aoe: {
    id: 'quirk_heal_aoe',
    nameKey: 'quirk.heal_aoe.name',
    descKey: 'quirk.heal_aoe.desc',
    effectType: 'heal_all',
    params: { healMult: 1.4, allPct: 0.6 }
  },
  quirk_revive: {
    id: 'quirk_revive',
    nameKey: 'quirk.revive.name',
    descKey: 'quirk.revive.desc',
    effectType: 'revive',
    params: { healMult: 1.4, revives: 1, reviveHpPct: 0.5 }
  },
  quirk_guard_aura: {
    id: 'quirk_guard_aura',
    nameKey: 'quirk.guard_aura.name',
    descKey: 'quirk.guard_aura.desc',
    effectType: 'guard_aura',
    params: { healMult: 1.4, damageReductionPct: 0.2, radiusTiles: 1.5 }
  },
  quirk_regen_aura: {
    id: 'quirk_regen_aura',
    nameKey: 'quirk.regen_aura.name',
    descKey: 'quirk.regen_aura.desc',
    effectType: 'regen_aura',
    params: { healMult: 1.4, regenPctPerSec: 0.025, radiusTiles: 1.5 }
  }
};

