# BRASSREEL: Clockwork Siege — Game Design Document (GDD)

Version: 1.0.0 (Milestone M0)  
Owner: Game Designer  

---

## 1. High Concept & Fantasy

**BRASSREEL: Clockwork Siege** is a roguelite auto-battler tower defense game powered by a mechanical 3×3 slot machine.
You are the Master Foundryman of *New Brassholm*, the last bastioned factory-city standing in the Rust Wastes. In the center of your citadel hums **The Boiler** — a pressurized steam heart that powers the city's defenses. Outside the iron gates, hordes of rogue scrap marauders and clockwork automatons march to crack the pressure hull.

To defend the gates, you operate the **Furnace Slot** — a massive brass casino forge that stamps out clockwork soldiers, turrets, and war engines on every pull of the lever. Success is not pure luck: through tactical reel deck-building, symbol manipulation (Hold, Nudge), heat management, and the **Smelt** crucible, you forge jackpot spins into an invincible defensive line.

---

## 2. Core Game Loop

```
+--------------------------------------------------------------------------+
|                                RUN LIFECYCLE                             |
|                           3 Acts × 10 Waves = 30 Waves                   |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
| 1. PREPARATION PHASE (Turn-based, Unhurried)                            |
|  - 3 Free Spins + Extra Spins (costs 1 Steam & adds +20 Heat)           |
|  - Skill usage: HOLD (2 charges), NUDGE (1 charge)                       |
|  - Payline Evaluation: Units summoned to Reserve Bench                   |
|  - SMELT Crucible: Merge units, choose evolution branches, transfer mods |
|  - Grid Deployment: Drag & drop units onto 8×5 defense zone (Cols 0-3)   |
|  - Shop & Reel Customization: Buy/Remove/Gild symbols, buy Gadgets       |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
| 2. BATTLE PHASE (Real-time Auto-Battler)                                 |
|  - Speed controls: 1× / 2× / 4× and Pause                                |
|  - Units auto-target, engage, cast quirks, and fire projectiles          |
|  - Player Intervention: Emergency Valve (1 charge per wave):             |
|      Option A: "Pressure Relief" -> Slow all enemies by 60% for 5 sec    |
|      Option B: "Boiler Patch" -> Restore +3 Boiler HP                    |
|  - Enemies breach Column 0 -> Leak (-1 Boiler HP; Boss leaks -3 HP)     |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
| 3. RESULT PHASE (Rewards & Progression)                                  |
|  - Victory Cogs awarded based on wave clear and enemies crushed          |
|  - Gadget Choice: Draft 1 of 3 offered Gadgets                           |
|  - Wave 5: Inspection Condition resolved (Bonus reward or Penalty)       |
|  - Wave 10: Act Boss defeated -> Engine Core drafted & next Act unlocked|
|  - Defeat Condition: Boiler HP reaches 0 -> Permadeath & Meta-Score      |
+--------------------------------------------------------------------------+
```

---

## 3. The 3×3 Slot Machine & Reel Mechanics

### 3.1 Reel Anatomy & Deck Building
- The slot machine features **3 Columns (Reels)** and **3 Rows**, displaying 9 symbols per spin.
- Each reel has its own circular **Reel Strip** (deck).
- Players start with a balanced starter deck on each reel:
  - Reel 1: 3 Cog, 2 Spring, 2 Fuse, 1 Coil, 1 Golden Gear, 1 Crown (10 symbols)
  - Reel 2: 2 Cog, 3 Spring, 1 Fuse, 2 Coil, 1 Golden Gear, 1 Crown (10 symbols)
  - Reel 3: 2 Cog, 1 Spring, 3 Fuse, 2 Coil, 1 Golden Gear, 1 Crown (10 symbols)
- **Deck Customization** in the Shop:
  - **Add Symbol**: Purchase and insert a chosen symbol into any reel strip (Cost: 15 Cogs).
  - **Remove Symbol (Thinning)**: Purge an unwanted symbol from a reel strip (Cost: 20 Cogs, +5 per removal).
  - **Gild Symbol**: Upgrade a standard symbol to "Gilded" (Summoned unit gains +25% base stats and rolls an extra Rare/Epic mod; Cost: 25 Cogs).

### 3.2 Symbols
1. **Cog (Brown / Brass)**: Summons Cog faction melee defenders & tanks.
2. **Spring (Green / Copper)**: Summons Spring faction rapid ranged archers & snipers.
3. **Fuse (Red / Crimson)**: Summons Fuse faction explosive bombers & pyromancers.
4. **Coil (Cyan / Electric)**: Summons Coil faction chain-lightning casters & barrier buffers.
5. **Golden Gear (Wild)**: Substitutes for Cog, Spring, Fuse, or Coil to complete 3-in-a-row paylines.
6. **Crown (Gold / Jackpot)**: Does not substitute as Wild. 3 Crowns on any payline triggers the **Grand Automaton Jackpot**.

### 3.3 The 8 Paylines
The machine evaluates 8 discrete paylines across the $3 \times 3$ matrix:
- **Horizontal**: Line 1 (Row 0), Line 2 (Row 1), Line 3 (Row 2).
- **Vertical**: Line 4 (Col 0), Line 5 (Col 1), Line 6 (Col 2).
- **Diagonal**: Line 7 (Top-Left to Bottom-Right), Line 8 (Bottom-Left to Top-Right).

### 3.4 Payout & Summon Rules
- **3-of-a-Kind (Matching Faction, Wild valid)**: Summons a **Tier 1 Unit** of that faction.
- **2-of-a-Kind (Pair)**: Summons a **Scrap Bot (Tier 0)**. There are *no completely dead spins* — scrap is fuel for smelting.
- **3 Crowns (Jackpot)**: Triggers the **Jackpot Celebration**. Player selects 1 of 3 legendary **Grand Automatons** to summon instantly.
- **Multi-Line Combos**: If a spin hits multiple paylines simultaneously, combo multipliers activate:
  - 2 Lines: All summoned units receive +15% HP & Damage.
  - 3 Lines: All summoned units receive +30% HP & Damage and start with +1 Smelt XP.
  - 4+ Lines: "Mega Forge Combo" -> +50% stats, +1 Smelt XP, and +10 bonus Cogs.

### 3.5 Skill Over Pure RNG
1. **HOLD (Lock Reel)**:
   - Lock 1 reel in place. On the next spin, that reel does not rotate; only the other two spin.
   - Uses 1 Hold Charge (2 charges granted per wave).
2. **NUDGE (Shift Reel)**:
   - Shift any one reel by 1 position UP or DOWN to complete a line.
   - 1 Nudge charge per wave (upgradable via Engine Cores).
3. **PUSH YOUR LUCK / Heat Gauge (0 - 100)**:
   - Players receive **3 Free Spins** per wave.
   - Extra spins cost **1 Steam** and generate **+20 Heat**.
   - **Heat Benefits**:
     - Heat 20–40 (Warm): Wild weight $\times 1.5$.
     - Heat 41–60 (Hot): Wild weight $\times 2.0$, Crown weight $\times 1.5$.
     - Heat 61–100 (Overdrive): Wild & Crown weights $\times 3.0$.
   - **Jam Risk**:
     - When Heat $> 60$, every spin checks for a **Mechanical Jam**.
     - Jam Chance: $(Heat - 60) \times 0.875\%$ (reaches $35\%$ at 100 Heat).
     - **Jam Penalty**: The spin fails to summon, a random deployed unit takes $25\%$ max HP damage, and one random reel is jammed (locked) for the next spin.
   - At wave conclusion, Heat cools down by $-30$.

---

## 4. Units & Evolution System

### 4.1 Smelt Crucible (Merging)
- During PREP, the player can drag any unit onto another unit to perform **Smelt**.
- The sacrifice unit is destroyed, transferring its essence to the target:
  - Base XP granted: $+1\text{ XP}$.
  - Same Faction Bonus: $+2\text{ XP}$ (double efficiency).
- **Mod Inheritance**: The player selects 1 Rolled Mod from the sacrifice unit to replace one of the target's existing mods.

### 4.2 Star Ranks & Evolution Branches
- **★1 (Recruit)**: Baseline unit. 0 to 2 XP.
- **★2 (Specialist)**: Unlocks at **3 XP**. Triggers an **Evolution Choice** between 2 distinct class archetypes.
- **★3 (Masterwork)**: Unlocks at **6 XP**. Triggers a **Final Evolution Choice** (2 paths per ★2 archetype, yielding 4 final forms per faction).

```
                            [ Tier 1 Unit ]
                             (★1 Recruit)
                                  |
                   +--------------+--------------+
                   | (3 XP)                      | (3 XP)
             [ Branch A ]                  [ Branch B ]
             (★2 Archetype 1)              (★2 Archetype 2)
                   |                             |
             +-----+-----+                 +-----+-----+
             | (6 XP)    | (6 XP)          | (6 XP)    | (6 XP)
          [ A1 ]       [ A2 ]           [ B1 ]       [ B2 ]
         (★3 Final)   (★3 Final)       (★3 Final)   (★3 Final)
```

### 4.3 Complete Playable Unit Catalog

#### Faction 1: Cog (Brass/Tank/Melee)
- **Quirk (Iron Plating)**: Takes 15% reduced damage from physical attacks.
- **★1 Cog Knight**: Melee frontline. Cleaves adjacent enemy.
  - **★2 Branch A: Bulwark (Shield Tank)**
    - *★3 Final A1: Fortress Golem*: Deploys an impassable energy barricade absorbing 600 damage.
    - *★3 Final A2: Aegis Bastion*: Reflects 35% of damage taken back to attackers.
  - **★2 Branch B: Ramhead (Impact Bruiser)**
    - *★3 Final B1: Steam Juggernaut*: Charges forward 2 tiles on combat start, stunning enemies for 2 sec.
    - *★3 Final B2: Siegebreaker*: Basic attacks deal 40% cleave damage to an entire 3x1 column.

#### Faction 2: Spring (Copper/Ranged/Precision)
- **Quirk (Recoil Spring)**: 20% chance on hit for projectile to ricochet to a secondary target.
- **★1 Spring Archer**: Fast single-target ranged attacker (Range: 5).
  - **★2 Branch A: Sharpshooter (Long-Range Sniper)**
    - *★3 Final A1: Clockwork Ballista*: Infinite range in lane; shots pierce through up to 3 enemies.
    - *★3 Final A2: Eagle-Eye Sentinel*: Crits on targets above 70% HP for 250% damage.
  - **★2 Branch B: Repeater (Rapid Fire)**
    - *★3 Final B1: Volley Array*: Fires 3 rapid bolts every 1.2 seconds.
    - *★3 Final B2: Chrono Marksman*: Each consecutive attack against the same target increases attack speed by 10% (stacks to 100%).

#### Faction 3: Fuse (Crimson/Bomber/AoE)
- **Quirk (Combustion Spark)**: On death, explodes dealing 120 damage to all adjacent enemies.
- **★1 Fuse Sapper**: Throws timed explosive bomb at densest enemy cluster (Range: 4, Splash: 1.5 tiles).
  - **★2 Branch A: Pyromancer (Thermal/DoT)**
    - *★3 Final A1: Magma Mortar*: Leaves a burning pool of molten slag dealing 40 fire damage/sec for 6 sec.
    - *★3 Final A2: Hellfire Foundry*: Enemies burning from fire take 25% increased damage from all sources.
  - **★2 Branch B: Demolitionist (Concussive Blast)**
    - *★3 Final B1: Blast Dynamo*: Bomb explosions knock enemies back 1 tile.
    - *★3 Final B2: Doom Barricade*: Plants 3 explosive landmines in front line that detonate on contact.

#### Faction 4: Coil (Electric/Support/Chain)
- **Quirk (Conduction)**: Attacks arc electric voltage to 1 additional target for 50% damage.
- **★1 Coil Sparker**: Medium range caster firing electrical sparks (Range: 4).
  - **★2 Branch A: Conduit (Chain Master)**
    - *★3 Final A1: Tesla Titan*: Arcs lightning through up to 5 enemies, applying Shock (enemies take bonus damage when hit).
    - *★3 Final A2: Storm Conductor*: Every 4th attack calls down a lightning bolt dealing 300 damage and stunning for 1.5 sec.
  - **★2 Branch B: Dynamo (Energy Buffer)**
    - *★3 Final B1: Shield Galvanizer*: Grants a 150 HP kinetic shield to adjacent allies every 6 seconds.
    - *★3 Final B2: Overload Core*: Allies in adjacent tiles gain +30% attack speed.

#### Tier 0 & Legendary Units
- **Tier 0 Scrap Bot**: Fragile clockwork worker. Melee attack (15 dmg, 80 HP). Primary utility: fodder for Smelt (+1 XP).
- **Legendary Jackpot Automatons (Draft 1 of 3 on 3 Crowns)**:
  1. **Steam Leviathan**: Colossal 3-tile automaton (1800 HP). Cleaves entire front line and emits continuous steam scalding nearby foes.
  2. **Solarion Sun-Forge**: Emits a continuous directed laser beam melting boss armor and boosting all ally damage by 25%.
  3. **Chrono Warden**: Emits a time-dilation field slowing all enemies on screen by 45% and accelerating ally cooldowns by 50%.

---

## 5. Rolled Mods (40 Mods)

When any unit is summoned, it randomly rolls 2 to 3 mods from the Mod Matrix based on rarity weights:
- Common: 70%, Rare: 25%, Epic: 5%.

| ID | Name | Rarity | Stat / Effect |
|---|---|---|---|
| `mod_iron_gears` | Iron Gears | Common | +15% Base Damage |
| `mod_tempered_chassis` | Tempered Chassis | Common | +20% Maximum HP |
| `mod_lubricated_joints` | Lubricated Joints | Common | +15% Attack Speed |
| `mod_sharpened_teeth` | Sharpened Teeth | Common | +10% Critical Strike Chance |
| `mod_reinforced_rivets` | Reinforced Rivets | Common | +5 Flat Armor |
| `mod_calibrated_lens` | Calibrated Lens | Common | +1 Attack Range (Ranged only) |
| `mod_copper_wire` | Copper Wire | Common | +15% Status Effect Duration |
| `mod_steam_injector` | Steam Injector | Common | First attack deals +50% damage |
| `mod_heavy_flywheel` | Heavy Flywheel | Common | +25% Knockback distance |
| `mod_scrap_collector` | Scrap Collector | Common | Generates +1 Cog when this unit scores a kill |
| `mod_spark_plug` | Spark Plug | Common | 10% chance on hit to Shock target |
| `mod_damped_spring` | Damped Spring | Common | Takes 10% less damage from Ranged attacks |
| `mod_brass_casing` | Brass Casing | Common | +8% Dodge Chance |
| `mod_oil_flask` | Oil Flask | Common | Basic attacks slow enemy movement by 15% for 2s |
| `mod_spiked_plating` | Spiked Plating | Common | Returns 12 damage when struck in melee |
| `mod_pressure_gauge` | Pressure Gauge | Rare | Damage increases by up to +30% as HP drops |
| `mod_pyrite_core` | Pyrite Core | Rare | +25% Critical Damage (+50% total on crit) |
| `mod_hydraulic_ram` | Hydraulic Ram | Rare | Crits stun target for 1.0 second |
| `mod_boiler_siphon` | Boiler Siphon | Rare | Heals 12% of damage dealt |
| `mod_kinetic_capacitor` | Kinetic Capacitor| Rare | Stores 20% of damage taken, releases as blast at 5 charges |
| `mod_thermite_coat` | Thermite Coat | Rare | Attacks apply Burn (30 fire damage over 3s) |
| `mod_arc_repeater` | Arc Repeater | Rare | Chain attacks jump to +1 additional target |
| `mod_plated_shield` | Plated Shield | Rare | Starts combat with a 100 HP temporary barrier |
| `mod_clockwork_haste`| Clockwork Haste| Rare | After scoring a kill, +50% attack speed for 4s |
| `mod_armor_piercer` | Armor Piercer | Rare | Attacks ignore 50% of target armor |
| `mod_cleaving_blade` | Cleaving Blade | Rare | Melee attacks deal 35% splash to adjacent tiles |
| `mod_shrapnel_shell` | Shrapnel Shell | Rare | Bombs release 4 piercing shrapnel needles |
| `mod_galvanic_surge` | Galvanic Surge | Rare | Shocked enemies take +25% damage from all allies |
| `mod_supercharged_coil`| Supercharged | Rare | Every 5th attack deals 200% electrical damage |
| `mod_lead_ballast` | Lead Ballast | Rare | Immune to stuns and knockbacks |
| `mod_chronometer` | Chronometer | Epic | Attack speed increased by 35% permanently |
| `mod_overclock_reg` | Overclock Core | Epic | +40% Damage, but loses 1% HP per second in battle |
| `mod_aegis_plating` | Aegis Plating | Epic | +15 Flat Armor and 25% damage reflection |
| `mod_doomsday_fuse` | Doomsday Fuse | Epic | Death explosion damage increased by 250% |
| `mod_chain_lightning`| Voltaic Cascade | Epic | Chain lightning jumps unlimited times if targets die |
| `mod_vampiric_valves`| Steam Vampire | Epic | 25% Lifesteal and overheal converts to shield |
| `mod_titan_piston` | Titan Piston | Epic | Basic attacks strike all enemies in current tile lane |
| `mod_miracle_spring` | Miracle Spring | Epic | Survives lethal blow once per wave with 1 HP and 3s invulnerability |
| `mod_omni_catalyst` | Omni Catalyst | Epic | Inherits the faction traits of all 4 factions |
| `mod_jackpot_resonance`| Jackpot Touch | Epic | 5% chance on attack to drop 2 Cogs |

---

## 6. Engine Cores (20 Cores)

Engine Cores alter fundamental machine rules. Players have **3 Core Slots**, unlocking at **Act 1 (Wave 1)**, **Act 2 (Wave 11)**, and **Act 3 (Wave 21)**.
Each Core has 1–2 **Synergy Tags**. Equipping 2 Cores with the same tag triggers a **Tag Resonance** bonus.

| ID | Name | Tags | Core Ability |
|---|---|---|---|
| `core_mirror_piston` | Mirror Piston | Reel, Combo | Horizontal paylines are evaluated twice. |
| `core_lucky_cam` | Lucky Cam | Reel, Wild | Crown symbol weight is multiplied by 2.0 on the central reel. |
| `core_recycler` | Recycler | Smelt, Economy | Performing a Smelt restores +1 Steam. |
| `core_pressure_valve` | Pressure Valve | Heat, Defense | Max Heat increased to 120; Jam chance reduced by 10%. |
| `core_diagonal_dynamo`| Diagonal Dynamo| Reel, Combo | Diagonal paylines summon units 1 Tier higher. |
| `core_hollow_spring` | Hollow Spring | Reel, Fodder | Pairs (2-of-a-kind) have a 25% chance to summon Tier 1 instead of Scrap Bot. |
| `core_steam_forge` | Steam Forge | Overclock, Heat| Gain +1 Steam per wave; all units deal +15% damage during Overdrive. |
| `core_brass_ratchet` | Brass Ratchet | Reel, Skill | Gain +1 extra Nudge charge per wave. |
| `core_gilded_flywheel`| Gilded Flywheel| Economy, Wild | Gilded symbols appear naturally in the shop at 50% discount. |
| `core_furnace_bellows`| Furnace Bellows| Heat, Smelt | Smelt grants +1 extra XP if performed while Heat $> 50$. |
| `core_chain_cam` | Chain Cam | Reel, Wild | Golden Gear (Wild) on the center slot counts for all 8 paylines. |
| `core_scrap_boiler` | Scrap Boiler | Smelt, Defense | Sacrificing a Scrap Bot heals The Boiler for +1 HP (up to max 10). |
| `core_clockwork_relay`| Clockwork Relay| Combo, Overclock| Each line hit beyond the first reduces all unit attack cooldowns by 10%. |
| `core_overdrive_clutch`| Overdrive Clutch| Heat, Skill | Jams no longer damage units; jammed reels unlock automatically after 2s. |
| `core_cog_catalyst` | Cog Catalyst | Faction, Defense| All Cog faction units gain +25% HP and taunt nearby enemies. |
| `core_spring_barrel` | Spring Barrel | Faction, Reel | 3 Spring symbols on a line summon 2 Spring Archers instead of 1. |
| `core_fuse_initiator` | Fuse Initiator | Faction, Overclock| Fuse bombs have 50% increased blast radius and ignite targets. |
| `core_coil_resonator` | Coil Resonator | Faction, Combo | Coil units' lightning arcs bounce to 2 additional targets. |
| `core_grand_regulator`| Grand Regulator| Wild, Economy | Scoring a Jackpot awards an additional +50 Cogs and 2 Steam. |
| `core_perpetual_cam` | Perpetual Cam | Skill, Reel | Hold charges carry over between waves if unused (up to max 4). |

### Tag Resonances
- **Reel Resonance (2+ Reel cores)**: Spin cost in Steam reduced by 1 every 2nd extra spin.
- **Heat Resonance (2+ Heat cores)**: Jam chance cannot exceed 20%.
- **Smelt Resonance (2+ Smelt cores)**: Smelting transfers 2 Rolled Mods instead of 1.
- **Overclock Resonance (2+ Overclock cores)**: Unit attack speed increased by 15% globally.
- **Economy Resonance (2+ Economy cores)**: Shop rerolls cost 0 Cogs for the first reroll each wave.

---

## 7. Gadgets (30 Gadgets)

Gadgets are utility items found in the Shop or earned after wave clears:

| ID | Name | Type | Cost | Effect |
|---|---|---|---|---|
| `gadget_brass_knuckles` | Brass Knuckles | Passive | 18 Cogs | Cog faction units deal +15% damage. |
| `gadget_sharpening_stone`| Precision Scope | Passive | 18 Cogs | Spring faction units gain +1 Attack Range. |
| `gadget_gunpowder_flask`| Black Powder | Passive | 18 Cogs | Fuse faction explosions deal +25% damage. |
| `gadget_copper_coil` | Superconductor | Passive | 18 Cogs | Coil faction shock effects last 3 seconds longer. |
| `gadget_toolkit` | Master Toolkit | Passive | 25 Cogs | Increases field unit capacity from 12 to 14. |
| `gadget_oil_can` | Polished Gears | Passive | 20 Cogs | All units gain +10% attack speed. |
| `gadget_iron_plates` | Barricade Plates | Passive | 20 Cogs | Boiler HP maximum increased from 10 to 12. |
| `gadget_steam_gauge` | Heavy Regulator | Passive | 22 Cogs | Heat decay at wave end increased from -30 to -50. |
| `gadget_magnet_arm` | Scrapper's Magnet| Passive | 15 Cogs | Defeated enemies drop +1 bonus Cog. |
| `gadget_lucky_coin` | Tarnished Coin | Passive | 24 Cogs | Wild symbol weight in slot machine increased by +20%. |
| `gadget_pressure_spring`| Recoil Buffer | Passive | 20 Cogs | Knockback effects against enemies increased by 1 tile. |
| `gadget_insulated_gloves`| Safety Grip | Passive | 22 Cogs | Heat jams do not lock reels. |
| `gadget_cog_wrench` | Forge Wrench | Passive | 20 Cogs | Smelt XP gained from different factions increased from 1 to 2. |
| `gadget_lens_array` | Prismatic Lens | Passive | 25 Cogs | Units have +15% Critical Hit Chance. |
| `gadget_reinforced_boiler`| Steel Rivets | Passive | 28 Cogs | Enemy breaches deal -1 less Boiler HP damage (min 1). |
| `gadget_steam_battery` | High-Cap Boiler | Passive | 25 Cogs | Steam capacity increased from 5 to 8. |
| `gadget_discount_coupon`| Merchant's Mark | Passive | 20 Cogs | All shop prices reduced by 20%. |
| `gadget_golden_key` | Master Key | Passive | 30 Cogs | Next Core offer presents 4 choices instead of 3. |
| `gadget_chrono_gear` | Chrono Gear | Passive | 30 Cogs | Emergency Valve cooldown resets immediately on boss waves. |
| `gadget_scrap_magnet` | Scrap Compactor | Passive | 22 Cogs | Every 3rd Scrap Bot summoned spawns at ★2 rank. |
| `gadget_spare_gasket` | Spare Gasket | Consumable | 8 Cogs | Negates the next Mechanical Jam. |
| `gadget_steam_flask` | Steam Flask | Consumable | 10 Cogs | Restores +3 Steam immediately. |
| `gadget_emergency_coolant`| Dry Ice Canister| Consumable | 12 Cogs | Reduces Heat to 0 instantly. |
| `gadget_reel_reroll` | Reel Reroll | Consumable | 8 Cogs | Respins 1 chosen reel for free. |
| `gadget_overcharge_vial`| Nitro Injector | Consumable | 14 Cogs | Next battle phase: All units deal double damage for 8s. |
| `gadget_repair_kit` | Boiler Patch | Consumable | 16 Cogs | Restores +2 Boiler HP immediately. |
| `gadget_bribe_token` | Smuggler's Mark | Consumable | 10 Cogs | Rerolls the current Shop stock with guaranteed Rare gadget. |
| `gadget_sentry_kit` | Portable Turret | Consumable | 15 Cogs | Spawns a temporary gatling turret on the field for 1 wave. |
| `gadget_shock_grenade` | Stun Mine | Consumable | 12 Cogs | Stuns the first 3 enemies that cross Column 4 for 4 seconds. |
| `gadget_golden_ticket` | Gilded Stamp | Consumable | 18 Cogs | Automatically turns 1 random symbol on Reel 2 into Gilded. |

---

## 8. Enemies & Boss Encounter (Act 1)

### 8.1 Enemy Archetypes (12 Enemies)

| ID | Name | HP | Spd | Dmg | Attack Type & Trait |
|---|---|---|---|---|---|
| `en_scrapper` | Scrap Marauder | 110 | 1.0 | 12 | Melee swarmer. Fast, spawns in packs. |
| `en_steam_rover` | Steam Rover | 240 | 0.8 | 20 | Armored clockwork buggy. Charges front row. |
| `en_clockwork_beetle`| Brass Beetle | 320 | 0.6 | 15 | Heavy shell. Has 10 Armor (reduces physical hits). |
| `en_scrap_sniper` | Rust Sharpshooter| 90 | 0.7 | 35 | Ranged (Range: 6). Targets farthest player backline unit. |
| `en_shield_drone` | Shield Drone | 180 | 0.9 | 8 | Flying. Projects a 120 HP bubble over nearest ally. |
| `en_piston_hound` | Piston Hound | 140 | 1.4 | 18 | Very fast leaper. Jumps over first unit encountered. |
| `en_mortar_crawler`| Mortar Crawler | 200 | 0.5 | 45 | Fires high-arching bombs at player backline. |
| `en_steam_bomber` | Volatile Sapper | 130 | 1.1 | 80 | Kamikaze. Explodes on contact dealing heavy AoE damage. |
| `en_heavy_borer` | Heavy Borer | 450 | 0.5 | 30 | Siege drill. Deals triple damage to deployed barricades. |
| `en_shock_prowler` | Arc Prowler | 220 | 1.0 | 22 | Stuns hit units for 1 second every 3 attacks. |
| `en_spire_golem` | Spire Golem | 600 | 0.4 | 40 | Mini-boss tank. Emits shockwaves damaging entire row. |
| `en_boiler_raider` | Boiler Raider | 160 | 1.2 | 25 | Infiltrator. If not killed within 15s, speeds up by +50%. |

### 8.2 Act 1 Boss: The Steam Baron (Wave 10)
- **Base HP**: $3200$.
- **Appearance**: A colossal brass walking tank locomotive with twin smokestacks and a giant cowcatcher drill.
- **Phase 1: Iron Wall (100% to 50% HP)**:
  - Deploys 2 `Shield Drones` every 12 seconds.
  - Fires sweeping steam volleys across Rows 1 and 3 dealing 40 damage.
- **Phase 2: Overheated Fury (50% to 0% HP)**:
  - Sheds external armor (moves 40% faster).
  - Vents superheated steam onto random $2 \times 2$ grid zones: tiles become hazardous for 6 seconds, dealing 25 fire damage/sec to stationed units.
  - Initiates **Locomotive Charge**: charges forward 2 tiles, knocking back all defenders in the central lane.

---

## 9. Special Waves & Inspection Mechanics

### Wave 5: Inspection Wave
Every 5th wave of an Act presents an **Inspection Challenge** set by the High Foundry Council. Players see the objective at the start of PREP:
- **Challenge Variations**:
  1. *Speed Trial*: "Defeat the wave within 35 seconds."
  2. *Iron Perimeter*: "Do not let any enemy cross Column 3."
  3. *Full Assembly*: "Have at least 6 units deployed on the field when battle begins."
  4. *Manual Labor*: "Complete the battle without using the Emergency Valve."
  5. *Monofaction*: "Deploy at least 3 units belonging to the same faction."
- **Rewards (Success)**: Draft 1 of 3 Engine Cores + 20 Cogs.
- **Penalties (Failure)**: Boiler loses -1 HP, and Wild symbols are disabled for the next wave.

---

## 10. Battlefield & Spatial Grid Mechanics

- **Grid Size**: $8 \text{ Columns} \times 5 \text{ Rows}$.
  - `Col 0 to 3`: **Player Territory** (defenders can be placed and moved during PREP).
  - `Col 4 to 7`: **No Man's Land & Enemy Approach Zone**.
  - `Col 0 Border`: **The Boiler Gates**.
- **Field Capacity**: Maximum 12 active units (expandable to 14 via `Master Toolkit`).
- **Emergency Valve (Active Ability, 1 use per wave)**:
  - Triggerable at any time during BATTLE.
  - **Relief Valve**: Vents steam across the entire battlefield, slowing all enemy movement and attack speed by 60% for 5 seconds.
  - **Seal Patch**: Sacrifices steam pressure to reinforce The Boiler, repairing +3 Boiler HP immediately.
- **Boiler Health**: 10 Pressure Points.
  - Standard enemy breach = $-1\text{ HP}$.
  - Boss breach = $-3\text{ HP}$.
  - Permadeath at 0 HP.

---

## 11. Economy & Shop System

- **Cogs (Gold)**:
  - Earned by killing enemies (1-3 Cogs based on enemy tier), clearing waves (+15 to +30 Cogs), and scoring high slot combos.
  - Spent in the Shop:
    - Add Symbol to Reel Strip: 15 Cogs
    - Remove Symbol (Thinning): 20 Cogs (+5 per consecutive removal)
    - Gild Symbol: 25 Cogs
    - Buy Gadget: 15 to 30 Cogs
    - Reroll Shop Offer: 5 Cogs
- **Steam (Energy)**:
  - Starts at 3 Steam. Restores $+2\text{ Steam}$ at the start of each wave (up to max 5).
  - Spent to purchase extra spins during PREP (1 Steam = 1 Extra Spin + 20 Heat).

