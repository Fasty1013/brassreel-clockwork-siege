import { ModDefinition } from './schemas/modSchema';

export const MODS_DATA: Record<string, ModDefinition> = {
  // --- COMMON MODS (1-15) ---
  mod_iron_gears: {
    id: 'mod_iron_gears',
    nameKey: 'mod.iron_gears.name',
    descKey: 'mod.iron_gears.desc',
    rarity: 'common',
    statModifiers: { damagePct: 0.15 }
  },
  mod_tempered_chassis: {
    id: 'mod_tempered_chassis',
    nameKey: 'mod.tempered_chassis.name',
    descKey: 'mod.tempered_chassis.desc',
    rarity: 'common',
    statModifiers: { hpPct: 0.2 }
  },
  mod_lubricated_joints: {
    id: 'mod_lubricated_joints',
    nameKey: 'mod.lubricated_joints.name',
    descKey: 'mod.lubricated_joints.desc',
    rarity: 'common',
    statModifiers: { attackSpeedPct: 0.15 }
  },
  mod_sharpened_teeth: {
    id: 'mod_sharpened_teeth',
    nameKey: 'mod.sharpened_teeth.name',
    descKey: 'mod.sharpened_teeth.desc',
    rarity: 'common',
    statModifiers: { critChancePct: 0.1 }
  },
  mod_reinforced_rivets: {
    id: 'mod_reinforced_rivets',
    nameKey: 'mod.reinforced_rivets.name',
    descKey: 'mod.reinforced_rivets.desc',
    rarity: 'common',
    statModifiers: { flatArmor: 5 }
  },
  mod_calibrated_lens: {
    id: 'mod_calibrated_lens',
    nameKey: 'mod.calibrated_lens.name',
    descKey: 'mod.calibrated_lens.desc',
    rarity: 'common',
    statModifiers: { rangeTiles: 1 }
  },
  mod_copper_wire: {
    id: 'mod_copper_wire',
    nameKey: 'mod.copper_wire.name',
    descKey: 'mod.copper_wire.desc',
    rarity: 'common',
    statModifiers: { damagePct: 0.08, attackSpeedPct: 0.08 }
  },
  mod_steam_injector: {
    id: 'mod_steam_injector',
    nameKey: 'mod.steam_injector.name',
    descKey: 'mod.steam_injector.desc',
    rarity: 'common',
    statModifiers: { damagePct: 0.12 }
  },
  mod_heavy_flywheel: {
    id: 'mod_heavy_flywheel',
    nameKey: 'mod.heavy_flywheel.name',
    descKey: 'mod.heavy_flywheel.desc',
    rarity: 'common',
    statModifiers: { knockbackTiles: 1 }
  },
  mod_scrap_collector: {
    id: 'mod_scrap_collector',
    nameKey: 'mod.scrap_collector.name',
    descKey: 'mod.scrap_collector.desc',
    rarity: 'common',
    triggerEffect: 'coin_drop',
    triggerParam: 1
  },
  mod_spark_plug: {
    id: 'mod_spark_plug',
    nameKey: 'mod.spark_plug.name',
    descKey: 'mod.spark_plug.desc',
    rarity: 'common',
    triggerEffect: 'shock',
    triggerParam: 0.15
  },
  mod_damped_spring: {
    id: 'mod_damped_spring',
    nameKey: 'mod.damped_spring.name',
    descKey: 'mod.damped_spring.desc',
    rarity: 'common',
    statModifiers: { flatArmor: 3, hpPct: 0.1 }
  },
  mod_brass_casing: {
    id: 'mod_brass_casing',
    nameKey: 'mod.brass_casing.name',
    descKey: 'mod.brass_casing.desc',
    rarity: 'common',
    statModifiers: { dodgePct: 0.08 }
  },
  mod_oil_flask: {
    id: 'mod_oil_flask',
    nameKey: 'mod.oil_flask.name',
    descKey: 'mod.oil_flask.desc',
    rarity: 'common',
    triggerEffect: 'burn',
    triggerParam: 15
  },
  mod_spiked_plating: {
    id: 'mod_spiked_plating',
    nameKey: 'mod.spiked_plating.name',
    descKey: 'mod.spiked_plating.desc',
    rarity: 'common',
    triggerEffect: 'reflect',
    triggerParam: 12
  },

  // --- RARE MODS (16-30) ---
  mod_pressure_gauge: {
    id: 'mod_pressure_gauge',
    nameKey: 'mod.pressure_gauge.name',
    descKey: 'mod.pressure_gauge.desc',
    rarity: 'rare',
    statModifiers: { damagePct: 0.25 }
  },
  mod_pyrite_core: {
    id: 'mod_pyrite_core',
    nameKey: 'mod.pyrite_core.name',
    descKey: 'mod.pyrite_core.desc',
    rarity: 'rare',
    statModifiers: { critChancePct: 0.15, critDamagePct: 0.5 }
  },
  mod_hydraulic_ram: {
    id: 'mod_hydraulic_ram',
    nameKey: 'mod.hydraulic_ram.name',
    descKey: 'mod.hydraulic_ram.desc',
    rarity: 'rare',
    triggerEffect: 'stun',
    triggerParam: 1.0
  },
  mod_boiler_siphon: {
    id: 'mod_boiler_siphon',
    nameKey: 'mod.boiler_siphon.name',
    descKey: 'mod.boiler_siphon.desc',
    rarity: 'rare',
    statModifiers: { lifestealPct: 0.15 }
  },
  mod_kinetic_capacitor: {
    id: 'mod_kinetic_capacitor',
    nameKey: 'mod.kinetic_capacitor.name',
    descKey: 'mod.kinetic_capacitor.desc',
    rarity: 'rare',
    statModifiers: { hpPct: 0.25, flatArmor: 6 }
  },
  mod_thermite_coat: {
    id: 'mod_thermite_coat',
    nameKey: 'mod.thermite_coat.name',
    descKey: 'mod.thermite_coat.desc',
    rarity: 'rare',
    triggerEffect: 'burn',
    triggerParam: 35
  },
  mod_arc_repeater: {
    id: 'mod_arc_repeater',
    nameKey: 'mod.arc_repeater.name',
    descKey: 'mod.arc_repeater.desc',
    rarity: 'rare',
    triggerEffect: 'shock',
    triggerParam: 0.4
  },
  mod_plated_shield: {
    id: 'mod_plated_shield',
    nameKey: 'mod.plated_shield.name',
    descKey: 'mod.plated_shield.desc',
    rarity: 'rare',
    statModifiers: { hpPct: 0.3 }
  },
  mod_clockwork_haste: {
    id: 'mod_clockwork_haste',
    nameKey: 'mod.clockwork_haste.name',
    descKey: 'mod.clockwork_haste.desc',
    rarity: 'rare',
    statModifiers: { attackSpeedPct: 0.3 }
  },
  mod_armor_piercer: {
    id: 'mod_armor_piercer',
    nameKey: 'mod.armor_piercer.name',
    descKey: 'mod.armor_piercer.desc',
    rarity: 'rare',
    statModifiers: { damagePct: 0.2 }
  },
  mod_cleaving_blade: {
    id: 'mod_cleaving_blade',
    nameKey: 'mod.cleaving_blade.name',
    descKey: 'mod.cleaving_blade.desc',
    rarity: 'rare',
    triggerEffect: 'cleave',
    triggerParam: 0.35
  },
  mod_shrapnel_shell: {
    id: 'mod_shrapnel_shell',
    nameKey: 'mod.shrapnel_shell.name',
    descKey: 'mod.shrapnel_shell.desc',
    rarity: 'rare',
    triggerEffect: 'ricochet',
    triggerParam: 0.3
  },
  mod_galvanic_surge: {
    id: 'mod_galvanic_surge',
    nameKey: 'mod.galvanic_surge.name',
    descKey: 'mod.galvanic_surge.desc',
    rarity: 'rare',
    statModifiers: { damagePct: 0.15, attackSpeedPct: 0.15 }
  },
  mod_supercharged_coil: {
    id: 'mod_supercharged_coil',
    nameKey: 'mod.supercharged_coil.name',
    descKey: 'mod.supercharged_coil.desc',
    rarity: 'rare',
    triggerEffect: 'shock',
    triggerParam: 0.5
  },
  mod_lead_ballast: {
    id: 'mod_lead_ballast',
    nameKey: 'mod.lead_ballast.name',
    descKey: 'mod.lead_ballast.desc',
    rarity: 'rare',
    statModifiers: { flatArmor: 10, hpPct: 0.15 }
  },

  // --- EPIC MODS (31-40) ---
  mod_chronometer: {
    id: 'mod_chronometer',
    nameKey: 'mod.chronometer.name',
    descKey: 'mod.chronometer.desc',
    rarity: 'epic',
    statModifiers: { attackSpeedPct: 0.45, damagePct: 0.15 }
  },
  mod_overclock_reg: {
    id: 'mod_overclock_reg',
    nameKey: 'mod.overclock_reg.name',
    descKey: 'mod.overclock_reg.desc',
    rarity: 'epic',
    statModifiers: { damagePct: 0.45, attackSpeedPct: 0.25 }
  },
  mod_aegis_plating: {
    id: 'mod_aegis_plating',
    nameKey: 'mod.aegis_plating.name',
    descKey: 'mod.aegis_plating.desc',
    rarity: 'epic',
    statModifiers: { flatArmor: 18, hpPct: 0.35 }
  },
  mod_doomsday_fuse: {
    id: 'mod_doomsday_fuse',
    nameKey: 'mod.doomsday_fuse.name',
    descKey: 'mod.doomsday_fuse.desc',
    rarity: 'epic',
    triggerEffect: 'burn',
    triggerParam: 100
  },
  mod_chain_lightning: {
    id: 'mod_chain_lightning',
    nameKey: 'mod.chain_lightning.name',
    descKey: 'mod.chain_lightning.desc',
    rarity: 'epic',
    triggerEffect: 'shock',
    triggerParam: 0.8
  },
  mod_vampiric_valves: {
    id: 'mod_vampiric_valves',
    nameKey: 'mod.vampiric_valves.name',
    descKey: 'mod.vampiric_valves.desc',
    rarity: 'epic',
    statModifiers: { lifestealPct: 0.3, hpPct: 0.2 }
  },
  mod_titan_piston: {
    id: 'mod_titan_piston',
    nameKey: 'mod.titan_piston.name',
    descKey: 'mod.titan_piston.desc',
    rarity: 'epic',
    triggerEffect: 'cleave',
    triggerParam: 0.6
  },
  mod_miracle_spring: {
    id: 'mod_miracle_spring',
    nameKey: 'mod.miracle_spring.name',
    descKey: 'mod.miracle_spring.desc',
    rarity: 'epic',
    statModifiers: { hpPct: 0.5, flatArmor: 8 }
  },
  mod_omni_catalyst: {
    id: 'mod_omni_catalyst',
    nameKey: 'mod.omni_catalyst.name',
    descKey: 'mod.omni_catalyst.desc',
    rarity: 'epic',
    statModifiers: { damagePct: 0.25, hpPct: 0.25, attackSpeedPct: 0.25 }
  },
  mod_jackpot_resonance: {
    id: 'mod_jackpot_resonance',
    nameKey: 'mod.jackpot_resonance.name',
    descKey: 'mod.jackpot_resonance.desc',
    rarity: 'epic',
    triggerEffect: 'coin_drop',
    triggerParam: 3
  }
};

