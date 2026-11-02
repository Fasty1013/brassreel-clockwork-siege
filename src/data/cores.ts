import { EngineCoreDefinition } from './schemas/coreSchema';

export const CORES_DATA: Record<string, EngineCoreDefinition> = {
  core_mirror_piston: {
    id: 'core_mirror_piston',
    nameKey: 'core.mirror_piston.name',
    descKey: 'core.mirror_piston.desc',
    tags: ['reel', 'combo'],
    actTier: 1,
    ruleModifier: 'mirror_horizontal_lines',
    params: { multiplier: 2 }
  },
  core_lucky_cam: {
    id: 'core_lucky_cam',
    nameKey: 'core.lucky_cam.name',
    descKey: 'core.lucky_cam.desc',
    tags: ['reel', 'wild'],
    actTier: 1,
    ruleModifier: 'boost_center_crown',
    params: { weightMultiplier: 2.0 }
  },
  core_recycler: {
    id: 'core_recycler',
    nameKey: 'core.recycler.name',
    descKey: 'core.recycler.desc',
    tags: ['smelt', 'economy'],
    actTier: 1,
    ruleModifier: 'smelt_refund_steam',
    params: { steamAmount: 1 }
  },
  core_pressure_valve: {
    id: 'core_pressure_valve',
    nameKey: 'core.pressure_valve.name',
    descKey: 'core.pressure_valve.desc',
    tags: ['heat', 'defense'],
    actTier: 1,
    ruleModifier: 'expand_heat_capacity',
    params: { maxHeat: 120, jamChanceReductionPct: 0.1 }
  },
  core_diagonal_dynamo: {
    id: 'core_diagonal_dynamo',
    nameKey: 'core.diagonal_dynamo.name',
    descKey: 'core.diagonal_dynamo.desc',
    tags: ['reel', 'combo'],
    actTier: 1,
    ruleModifier: 'upgrade_diagonal_tier',
    params: { bonusTier: 1 }
  },
  core_hollow_spring: {
    id: 'core_hollow_spring',
    nameKey: 'core.hollow_spring.name',
    descKey: 'core.hollow_spring.desc',
    tags: ['reel', 'fodder'],
    actTier: 1,
    ruleModifier: 'pair_upgrade_chance',
    params: { chancePct: 0.25 }
  },
  core_steam_forge: {
    id: 'core_steam_forge',
    nameKey: 'core.steam_forge.name',
    descKey: 'core.steam_forge.desc',
    tags: ['overclock', 'heat'],
    actTier: 1,
    ruleModifier: 'overdrive_damage_buff',
    params: { bonusSteamPerWave: 1, damageBuffPct: 0.15 }
  },
  core_brass_ratchet: {
    id: 'core_brass_ratchet',
    nameKey: 'core.brass_ratchet.name',
    descKey: 'core.brass_ratchet.desc',
    tags: ['reel', 'skill'],
    actTier: 1,
    ruleModifier: 'extra_nudge_charge',
    params: { charges: 1 }
  },
  core_gilded_flywheel: {
    id: 'core_gilded_flywheel',
    nameKey: 'core.gilded_flywheel.name',
    descKey: 'core.gilded_flywheel.desc',
    tags: ['economy', 'wild'],
    actTier: 1,
    ruleModifier: 'discount_gilded_symbols',
    params: { discountPct: 0.5 }
  },
  core_furnace_bellows: {
    id: 'core_furnace_bellows',
    nameKey: 'core.furnace_bellows.name',
    descKey: 'core.furnace_bellows.desc',
    tags: ['heat', 'smelt'],
    actTier: 1,
    ruleModifier: 'heat_smelt_bonus',
    params: { heatThreshold: 50, bonusXp: 1 }
  },
  core_chain_cam: {
    id: 'core_chain_cam',
    nameKey: 'core.chain_cam.name',
    descKey: 'core.chain_cam.desc',
    tags: ['reel', 'wild'],
    actTier: 2,
    ruleModifier: 'omni_center_wild',
    params: { enabled: 1 }
  },
  core_scrap_boiler: {
    id: 'core_scrap_boiler',
    nameKey: 'core.scrap_boiler.name',
    descKey: 'core.scrap_boiler.desc',
    tags: ['smelt', 'defense'],
    actTier: 2,
    ruleModifier: 'scrap_heal_boiler',
    params: { hpGain: 1 }
  },
  core_clockwork_relay: {
    id: 'core_clockwork_relay',
    nameKey: 'core.clockwork_relay.name',
    descKey: 'core.clockwork_relay.desc',
    tags: ['combo', 'overclock'],
    actTier: 2,
    ruleModifier: 'combo_cdr',
    params: { cdrPerLinePct: 0.1 }
  },
  core_overdrive_clutch: {
    id: 'core_overdrive_clutch',
    nameKey: 'core.overdrive_clutch.name',
    descKey: 'core.overdrive_clutch.desc',
    tags: ['heat', 'skill'],
    actTier: 2,
    ruleModifier: 'safe_jam',
    params: { noUnitDamage: 1 }
  },
  core_cog_catalyst: {
    id: 'core_cog_catalyst',
    nameKey: 'core.cog_catalyst.name',
    descKey: 'core.cog_catalyst.desc',
    tags: ['faction', 'defense'],
    actTier: 2,
    ruleModifier: 'buff_cog_faction',
    params: { hpBuffPct: 0.25 }
  },
  core_spring_barrel: {
    id: 'core_spring_barrel',
    nameKey: 'core.spring_barrel.name',
    descKey: 'core.spring_barrel.desc',
    tags: ['faction', 'reel'],
    actTier: 2,
    ruleModifier: 'duplicate_spring_summon',
    params: { duplicateChance: 0.5 }
  },
  core_fuse_initiator: {
    id: 'core_fuse_initiator',
    nameKey: 'core.fuse_initiator.name',
    descKey: 'core.fuse_initiator.desc',
    tags: ['faction', 'overclock'],
    actTier: 3,
    ruleModifier: 'buff_fuse_aoe',
    params: { blastRadiusPct: 0.5 }
  },
  core_coil_resonator: {
    id: 'core_coil_resonator',
    nameKey: 'core.coil_resonator.name',
    descKey: 'core.coil_resonator.desc',
    tags: ['faction', 'combo'],
    actTier: 3,
    ruleModifier: 'buff_coil_jumps',
    params: { extraBounces: 2 }
  },
  core_grand_regulator: {
    id: 'core_grand_regulator',
    nameKey: 'core.grand_regulator.name',
    descKey: 'core.grand_regulator.desc',
    tags: ['wild', 'economy'],
    actTier: 3,
    ruleModifier: 'jackpot_windfall',
    params: { bonusCogs: 50, bonusSteam: 2 }
  },
  core_perpetual_cam: {
    id: 'core_perpetual_cam',
    nameKey: 'core.perpetual_cam.name',
    descKey: 'core.perpetual_cam.desc',
    tags: ['skill', 'reel'],
    actTier: 3,
    ruleModifier: 'retain_holds',
    params: { maxHolds: 4 }
  }
};

