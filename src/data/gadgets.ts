import { GadgetDefinition } from './schemas/gadgetSchema';

export const GADGETS_DATA: Record<string, GadgetDefinition> = {
  // --- PASSIVES (1-20) ---
  gadget_brass_knuckles: {
    id: 'gadget_brass_knuckles',
    nameKey: 'gadget.brass_knuckles.name',
    descKey: 'gadget.brass_knuckles.desc',
    type: 'passive',
    cost: 18,
    effectType: 'faction_damage_buff',
    params: { faction: 1, damagePct: 0.15 } // 1 = Cog
  },
  gadget_sharpening_stone: {
    id: 'gadget_sharpening_stone',
    nameKey: 'gadget.sharpening_stone.name',
    descKey: 'gadget.sharpening_stone.desc',
    type: 'passive',
    cost: 18,
    effectType: 'faction_range_buff',
    params: { faction: 2, rangeBonus: 1 } // 2 = Spring
  },
  gadget_gunpowder_flask: {
    id: 'gadget_gunpowder_flask',
    nameKey: 'gadget.gunpowder_flask.name',
    descKey: 'gadget.gunpowder_flask.desc',
    type: 'passive',
    cost: 18,
    effectType: 'faction_damage_buff',
    params: { faction: 3, damagePct: 0.25 } // 3 = Fuse
  },
  gadget_copper_coil: {
    id: 'gadget_copper_coil',
    nameKey: 'gadget.copper_coil.name',
    descKey: 'gadget.copper_coil.desc',
    type: 'passive',
    cost: 18,
    effectType: 'shock_duration_buff',
    params: { durationBonusSeconds: 3 }
  },
  gadget_toolkit: {
    id: 'gadget_toolkit',
    nameKey: 'gadget.toolkit.name',
    descKey: 'gadget.toolkit.desc',
    type: 'passive',
    cost: 25,
    effectType: 'expand_field_capacity',
    params: { extraCapacity: 2 }
  },
  gadget_oil_can: {
    id: 'gadget_oil_can',
    nameKey: 'gadget.oil_can.name',
    descKey: 'gadget.oil_can.desc',
    type: 'passive',
    cost: 20,
    effectType: 'global_attack_speed',
    params: { speedPct: 0.1 }
  },
  gadget_iron_plates: {
    id: 'gadget_iron_plates',
    nameKey: 'gadget.iron_plates.name',
    descKey: 'gadget.iron_plates.desc',
    type: 'passive',
    cost: 20,
    effectType: 'expand_boiler_hp',
    params: { hpBonus: 2 }
  },
  gadget_steam_gauge: {
    id: 'gadget_steam_gauge',
    nameKey: 'gadget.steam_gauge.name',
    descKey: 'gadget.steam_gauge.desc',
    type: 'passive',
    cost: 22,
    effectType: 'faster_cooling',
    params: { coolingBonus: 20 }
  },
  gadget_magnet_arm: {
    id: 'gadget_magnet_arm',
    nameKey: 'gadget.magnet_arm.name',
    descKey: 'gadget.magnet_arm.desc',
    type: 'passive',
    cost: 15,
    effectType: 'bonus_bounty_cogs',
    params: { extraCogs: 1 }
  },
  gadget_lucky_coin: {
    id: 'gadget_lucky_coin',
    nameKey: 'gadget.lucky_coin.name',
    descKey: 'gadget.lucky_coin.desc',
    type: 'passive',
    cost: 24,
    effectType: 'boost_wild_chance',
    params: { bonusPct: 0.2 }
  },
  gadget_pressure_spring: {
    id: 'gadget_pressure_spring',
    nameKey: 'gadget.pressure_spring.name',
    descKey: 'gadget.pressure_spring.desc',
    type: 'passive',
    cost: 20,
    effectType: 'knockback_boost',
    params: { extraTiles: 1 }
  },
  gadget_insulated_gloves: {
    id: 'gadget_insulated_gloves',
    nameKey: 'gadget.insulated_gloves.name',
    descKey: 'gadget.insulated_gloves.desc',
    type: 'passive',
    cost: 22,
    effectType: 'prevent_reel_lock_on_jam',
    params: { enabled: 1 }
  },
  gadget_cog_wrench: {
    id: 'gadget_cog_wrench',
    nameKey: 'gadget.cog_wrench.name',
    descKey: 'gadget.cog_wrench.desc',
    type: 'passive',
    cost: 20,
    effectType: 'bonus_smelt_xp',
    params: { bonusXp: 1 }
  },
  gadget_lens_array: {
    id: 'gadget_lens_array',
    nameKey: 'gadget.lens_array.name',
    descKey: 'gadget.lens_array.desc',
    type: 'passive',
    cost: 25,
    effectType: 'global_crit_chance',
    params: { critChancePct: 0.15 }
  },
  gadget_reinforced_boiler: {
    id: 'gadget_reinforced_boiler',
    nameKey: 'gadget.reinforced_boiler.name',
    descKey: 'gadget.reinforced_boiler.desc',
    type: 'passive',
    cost: 28,
    effectType: 'reduce_leak_damage',
    params: { reduction: 1 }
  },
  gadget_steam_battery: {
    id: 'gadget_steam_battery',
    nameKey: 'gadget.steam_battery.name',
    descKey: 'gadget.steam_battery.desc',
    type: 'passive',
    cost: 25,
    effectType: 'expand_steam_cap',
    params: { extraCap: 3 }
  },
  gadget_discount_coupon: {
    id: 'gadget_discount_coupon',
    nameKey: 'gadget.discount_coupon.name',
    descKey: 'gadget.discount_coupon.desc',
    type: 'passive',
    cost: 20,
    effectType: 'shop_discount',
    params: { discountPct: 0.2 }
  },
  gadget_golden_key: {
    id: 'gadget_golden_key',
    nameKey: 'gadget.golden_key.name',
    descKey: 'gadget.golden_key.desc',
    type: 'passive',
    cost: 30,
    effectType: 'core_draft_bonus',
    params: { extraChoice: 1 }
  },
  gadget_chrono_gear: {
    id: 'gadget_chrono_gear',
    nameKey: 'gadget.chrono_gear.name',
    descKey: 'gadget.chrono_gear.desc',
    type: 'passive',
    cost: 30,
    effectType: 'boss_emergency_reset',
    params: { enabled: 1 }
  },
  gadget_scrap_magnet: {
    id: 'gadget_scrap_magnet',
    nameKey: 'gadget.scrap_magnet.name',
    descKey: 'gadget.scrap_magnet.desc',
    type: 'passive',
    cost: 22,
    effectType: 'upgrade_scrap_bots',
    params: { intervalSummon: 3 }
  },

  // --- CONSUMABLES (21-30) ---
  gadget_spare_gasket: {
    id: 'gadget_spare_gasket',
    nameKey: 'gadget.spare_gasket.name',
    descKey: 'gadget.spare_gasket.desc',
    type: 'consumable',
    cost: 8,
    effectType: 'negate_jam',
    params: { charges: 1 }
  },
  gadget_steam_flask: {
    id: 'gadget_steam_flask',
    nameKey: 'gadget.steam_flask.name',
    descKey: 'gadget.steam_flask.desc',
    type: 'consumable',
    cost: 10,
    effectType: 'restore_steam',
    params: { amount: 3 }
  },
  gadget_emergency_coolant: {
    id: 'gadget_emergency_coolant',
    nameKey: 'gadget.emergency_coolant.name',
    descKey: 'gadget.emergency_coolant.desc',
    type: 'consumable',
    cost: 12,
    effectType: 'reset_heat',
    params: { targetHeat: 0 }
  },
  gadget_reel_reroll: {
    id: 'gadget_reel_reroll',
    nameKey: 'gadget.reel_reroll.name',
    descKey: 'gadget.reel_reroll.desc',
    type: 'consumable',
    cost: 8,
    effectType: 'free_reel_spin',
    params: { spins: 1 }
  },
  gadget_overcharge_vial: {
    id: 'gadget_overcharge_vial',
    nameKey: 'gadget.overcharge_vial.name',
    descKey: 'gadget.overcharge_vial.desc',
    type: 'consumable',
    cost: 14,
    effectType: 'battle_damage_surge',
    params: { multiplier: 2.0, durationSeconds: 8 }
  },
  gadget_repair_kit: {
    id: 'gadget_repair_kit',
    nameKey: 'gadget.repair_kit.name',
    descKey: 'gadget.repair_kit.desc',
    type: 'consumable',
    cost: 16,
    effectType: 'heal_boiler',
    params: { hpAmount: 2 }
  },
  gadget_bribe_token: {
    id: 'gadget_bribe_token',
    nameKey: 'gadget.bribe_token.name',
    descKey: 'gadget.bribe_token.desc',
    type: 'consumable',
    cost: 10,
    effectType: 'reroll_shop_rare',
    params: { guaranteedRarity: 2 }
  },
  gadget_sentry_kit: {
    id: 'gadget_sentry_kit',
    nameKey: 'gadget.sentry_kit.name',
    descKey: 'gadget.sentry_kit.desc',
    type: 'consumable',
    cost: 15,
    effectType: 'spawn_temporary_turret',
    params: { durationWaves: 1 }
  },
  gadget_shock_grenade: {
    id: 'gadget_shock_grenade',
    nameKey: 'gadget.shock_grenade.name',
    descKey: 'gadget.shock_grenade.desc',
    type: 'consumable',
    cost: 12,
    effectType: 'stun_front_enemies',
    params: { enemyCount: 3, stunSeconds: 4 }
  },
  gadget_golden_ticket: {
    id: 'gadget_golden_ticket',
    nameKey: 'gadget.golden_ticket.name',
    descKey: 'gadget.golden_ticket.desc',
    type: 'consumable',
    cost: 18,
    effectType: 'gild_random_symbol',
    params: { reelIndex: 1 }
  }
};

