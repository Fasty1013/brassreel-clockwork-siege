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
    | 'scrap_scavenge';
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
    params: { reductionPct: 0.15 }
  },
  quirk_fortress_barricade: {
    id: 'quirk_fortress_barricade',
    nameKey: 'quirk.fortress_barricade.name',
    descKey: 'quirk.fortress_barricade.desc',
    effectType: 'shield_aura',
    params: { shieldAmount: 250, intervalSeconds: 8 }
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
    params: { stunSeconds: 2.0 }
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
    params: { thresholdPct: 0.7, critDmgPct: 2.5 }
  },
  quirk_triple_burst: {
    id: 'quirk_triple_burst',
    nameKey: 'quirk.triple_burst.name',
    descKey: 'quirk.triple_burst.desc',
    effectType: 'burst_fire',
    params: { boltCount: 3, delayBetweenMs: 150 }
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
    params: { blastDamage: 120, radiusTiles: 1.5 }
  },
  quirk_molten_pool: {
    id: 'quirk_molten_pool',
    nameKey: 'quirk.molten_pool.name',
    descKey: 'quirk.molten_pool.desc',
    effectType: 'molten_pool',
    params: { dps: 35, durationSeconds: 4 }
  },
  quirk_thermal_vulnerability: {
    id: 'quirk_thermal_vulnerability',
    nameKey: 'quirk.thermal_vulnerability.name',
    descKey: 'quirk.thermal_vulnerability.desc',
    effectType: 'thermal_vuln',
    params: { bonusDamagePct: 0.25 }
  },
  quirk_concussive_knockback: {
    id: 'quirk_concussive_knockback',
    nameKey: 'quirk.concussive_knockback.name',
    descKey: 'quirk.concussive_knockback.desc',
    effectType: 'knockback',
    params: { tiles: 1 }
  },
  quirk_proximity_mines: {
    id: 'quirk_proximity_mines',
    nameKey: 'quirk.proximity_mines.name',
    descKey: 'quirk.proximity_mines.desc',
    effectType: 'proximity_mines',
    params: { mineCount: 2, damage: 150 }
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
    params: { hitInterval: 4, damage: 300, stunSeconds: 1.5 }
  },
  quirk_kinetic_shield_aura: {
    id: 'quirk_kinetic_shield_aura',
    nameKey: 'quirk.kinetic_shield_aura.name',
    descKey: 'quirk.kinetic_shield_aura.desc',
    effectType: 'shield_aura',
    params: { shieldAmount: 120, intervalSeconds: 6 }
  },
  quirk_overclock_field: {
    id: 'quirk_overclock_field',
    nameKey: 'quirk.overclock_field.name',
    descKey: 'quirk.overclock_field.desc',
    effectType: 'speed_aura',
    params: { speedBuffPct: 0.25 }
  },
  quirk_steam_aegis: {
    id: 'quirk_steam_aegis',
    nameKey: 'quirk.steam_aegis.name',
    descKey: 'quirk.steam_aegis.desc',
    effectType: 'steam_shroud',
    params: { damageDebuffPct: 0.2, cleavePct: 0.3 }
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
  }
};

