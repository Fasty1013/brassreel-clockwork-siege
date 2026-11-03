# BRASSREEL: Clockwork Siege — Comprehensive Asset Inventory & Replacement Matrix

**Version:** 2.0.0 (Visual Overhaul — Planning P0)  
**Target Reference:** *Slotbound* (`/docs/reference/gameplay.mp4`)  
**Resolution Standard:** Native 640×360 canvas with integer ×3 nearest-neighbor scaling to 1920×1080.  
**Core Rule:** Zero primitive geometric placeholders (rectangles, circles, solid fills) in final delivery. Every entity is authentic 2D pixel art with frame-by-frame animation (8–12 FPS).

---

## 1. Placeholder Audit & Replacement Matrix

### 1.1 Slot Machine Chassis & Controls
| Entity | Current Placeholder | Reference Equivalent | Target Art Specification | Required Frames & States | Native Size | Priority | Method |
|---|---|---|---|---|:---:|:---:|:---:|
| **Slot Chassis** | Flat rectangle `0x1f1610` with single border | Ornate purple/stone casing with horn skull and ropes | Heavy dark-iron steampunk furnace cabinet, brass rivets, pipe fittings, pressure dials, top crown-boiler | `idle` (quivering steam, flickering vacuum lamps), `overheat` (cherry-red furnace glow), `jam` (black smoke venting) | 160×280 px | **P1** | **B / D** |
| **Top Crown-Boiler** | Text `★ GORN-SLOT 3×3 ★` | Carved horn skull & bone teeth | Steampunk brass boiler dome with twin exhaust stacks, pressure manometer, valve wheel | `idle` (pulsing steam wisps 4f), `vent` (heavy steam eruption 6f) | 140×56 px | **P1** | **B / D** |
| **Slot Reels (×3)** | 3 separate containers with plain lines | 3 vertical parchment strips with clipped ends | 3 light parchment-grey textured mechanical reels, top & bottom drop shadows | `idle`, `spin_blur` (motion-blurred strip), `stop_overshoot` (3f bounce down and lock) | 36×140 px (each) | **P1** | **B / D** |
| **Slot Lever** | Button rectangle `КРУТИТЬ` | Red ball handle on white metal crank | Brass articulated lever arm with polished ruby/red ball knob, mounted on right side of cabinet | `rest` (up), `anticipation` (pulled back 4f), `release_spring` (violent rebound with sparks 5f) | 28×80 px | **P1** | **B / D** |
| **Nudge Buttons (×3)** | Plain grey rectangles `СДВИГ БАРАБАНА` | Downward arrow buttons under each reel | Brass wedge arrow buttons with beveled edges and cog teeth | `normal`, `hover`, `pressed`, `highlight` (flashing white/gold border during almost-win) | 28×18 px | **P1** | **B / D** |
| **Hold Chains (×3)** | Grey buttons `HOLD` | Heavy padlock and chains | Heavy forged iron chains wrapping the reel with brass padlock | `unlocked` (hidden), `locking_chain` (chains wrap with clink 4f), `locked` (padlock clamped) | 36×120 px | **P2** | **B / D** |
| **Spin Counter & Cost Badges** | Text string `(ПАР: 1, +20 HEAT)` | Left spin bag badge, center gold cost badge | Embossed brass cartouches: left = steam gauge spin counter, center = golden coin purse cost badge, right = paytable book button | `idle`, `pulse_cost` (shakes on spin), `insufficient` (red blink) | 36×16 px | **P1** | **B / D** |
| **Paytable Book Button** | Non-existent (no paytable modal) | Open tome icon in top-right of slot frame | Small leather-bound engineer manual with brass bookmark | `normal`, `hover`, `open_modal` | 18×18 px | **P2** | **B / D** |
| **Lower Machine Shelf** | Pitch black empty space | Dark stone shelf with item pedestals | Riveted brass utility shelf holding equipped Engine Cores and passive relics | `empty_slot` (engraved brass socket), `filled_slot` (socketed core pulsing) | 140×44 px | **P2** | **B / D** |

---

### 1.2 Slot Reel Symbols (28×28 Native px)
*All symbols drawn with 1px dark contour, 3–4 tonal shades, high-contrast silhouette readable at a glance.*

| Symbol Key | Current Placeholder | Reference Equivalent | Target Steampunk Pixel-Art Design | Animations / States | Priority | Method |
|---|---|---|---|---|:---:|:---:|
| `sym_cog` | 2D canvas circle with 8 teeth | Shield icon (blue/white) | Heavy 8-spoke brass cogwheel with polished bronze rim, center copper axle, metallic specular glint | `idle` (static), `spin_blur` (stretched), `win_bounce` (squash 1.25× + gold sparkle burst 4f) | **P1** | **B / D** |
| `sym_spring` | Coiled green spiral arc | Recurve Bow icon | Tempered emerald-lacquered clockwork recurve bow with taught silver wire and gear cams | `idle`, `spin_blur`, `win_bounce` (quivers and releases green motes 4f) | **P1** | **B / D** |
| `sym_fuse` | Red circle with orange dot | Magic Staff / Fire icon | Cast-iron demolition grenade with glowing sulfur fuse, ember sparks and brass casing | `idle` (fuse smoking 3f), `spin_blur`, `win_bounce` (fiery ember burst 4f) | **P1** | **B / D** |
| `sym_coil` | Blue zig-zag stroke | Wizard Hat icon (blue/gold) | Twin cobalt capacitor prongs with crackling cyan electrostatic plasma ball | `idle` (plasma flicker 3f), `spin_blur`, `win_bounce` (electric arc flash 4f) | **P1** | **B / D** |
| `sym_wild` | Yellow joker diamond | Knight Horse Head icon | Ornate golden automaton jester mask with ruby ocular lenses and brass jester bells | `idle` (gleam 4f), `spin_blur`, `win_bounce`, `transform` (flips with gold halo into target symbol 5f) | **P1** | **B / D** |
| `sym_crown` | Orange crown polygon | Imperial Gold Crown | Imperial triple-crested clockwork crown set with sapphire and ruby gears, radiant gold frame | `idle` (pulsing shimmer 4f), `spin_blur`, `win_bounce` (jackpot coin fountain trigger) | **P1** | **B / D** |
| `sym_*_gilded` | Golden circle border | Golden rim | Luminous gilded golden filigree border around symbol + continuous golden particle halo | `ambient_gild_sparkle` (loop 6f) | **P2** | **B / D** |

---

### 1.3 Battle Window & Environmental Backdrop
| Component | Current Placeholder | Reference Equivalent | Target Art Specification | Required Dimensions / Grid | Priority | Method |
|---|---|---|---|---|:---:|:---:|
| **Battle Window Frame** | None (canvas is open borderless void) | Beige parchment frame with torn corners, rivets, drop shadow | Ornate ivory-brass parchment border, reinforced iron corner brackets, engraved steam pressure scale | Window: x 140–620, y 22–330 (Native px) | **P1** | **B / D** |
| **Window Backdrop (Act 1: Slag Heaps)** | Flat black `#14100c` | Sunny day: bright blue sky, golden cream sun, fluffy white clouds, 3-tier green trees, lush meadow | Bright sunny outskirts of New Brassholm: cyan sky, golden-cream sun, chunky white steam-clouds, distant brass clock towers, 3-tier lush trees, green meadow with rusty rails | Drawn on coarse **320×180 grid** (×6 on screen) for authentic chunky retro contrast | **P1** | **A / B** |
| **Window Backdrop (Act 2: Rust Swamps)** | Flat black `#14100c` | Sunset / evening sky | Murky amber sunset, toxic mist, silhouetted rusted cranes, weeping willow trees, murky peat turf | 320×180 grid (sunset orange/purple palette) | **P5** | **A / B** |
| **Window Backdrop (Act 3: Baron's Citadel)** | Flat black `#14100c` | Night sky | Stormy midnight purple, lightning flashes, towering gothic brass smokestacks, cobblestone iron courtyard | 320×180 grid (dark violet/gold lamps palette) | **P5** | **A / B** |
| **Battlefield Grid** | 8×5 harsh bordered brown rectangles | Completely invisible meadow; units stand freely with shadows | **Zero visible grid lines during combat.** Subtle grid cell tile highlight ONLY appears when dragging a unit to deploy | 8 columns × 5 rows (Col width 45 px, row depth 14 px, y-sorted) | **P1** | **B / D** |
| **Wave Ribbon Banner** | Plain text `Волна 1/30` | Dark purple ribbon with diamond ends and numbers `1 2 3 4` | Dark iron ribbon banner with diamond tips, brass wave numbers `1 2 3 4 5`, current wave enlarged and glowing | 120×18 px (centered top of battle window) | **P1** | **B / D** |
| **Guide Niche & Avatar** | None | Top-left alcove with hooded silhouette | Top-left arched brass niche housing **Foreman Cogsworth** (brass automaton master with glowing ocular monocle) | `idle` (head tilt, monocle blink 4f), `talk` (mouthplate articulation 4f) | 32×32 px (niche 38×38 px) | **P1** | **B / D** |
| **Start Battle Button** | Cyan flat rectangle `в БОЙ ▶` | Round black skull button in bottom-right | Heavy round cast-iron valve button with brass cog skull emblem, spring-loaded bevel | `normal`, `hover` (steam hisses), `pressed` (sinks 2px), `pulse` (heartbeat pulse when ready) | 36×36 px (round) | **P1** | **B / D** |
| **Window Side Icons** | Plain text / scattered UI | Vertical icons on right edge (stats, shop sack, cancel cross) | 3 stamped brass round icon tabs: Stats Chart, Gold Supply Sack, Dismiss/Back cross | `normal`, `hover`, `active` | 18×18 px (each) | **P2** | **B / D** |

---

### 1.4 Top Floating HUD
| Widget | Current Placeholder | Reference Equivalent | Target Art Specification | States & Animations | Native Size | Priority | Method |
|---|---|---|---|---|:---:|:---:|
| **Gold / Cogs Badge** | Text `Шестерни: 25` | Pill `[Gold icon] 350` | Stamped brass coin pill with spinning brass cog icon, ticking number display | `idle`, `coin_tally` (bounces up when collecting bounty) | 54×14 px | **P1** | **B / D** |
| **Boiler Pressure HP** | Text `Давление котла: 10/10` | Pill `[Heart icon] 5` | Polished brass boiler vessel pill with ruby pressure dial (10/10) | `idle`, `damaged` (shakes, vents red steam) | 54×14 px | **P1** | **B / D** |
| **Unit Capacity** | None (untracked in HUD) | Pill `[Man icon] 2/5` | Tiny brass automaton silhouette with capacity fraction `X/Y` | `normal`, `full` (warning amber) | 42×14 px | **P1** | **B / D** |
| **Steam Reservoir** | Text `Пар: 3/5` | Pill `[Blue Crystal icon] 0` | Glass cylinder tube with boiling cyan steam vapor | `idle`, `consume_steam` (drops with bubble burst) | 46×14 px | **P1** | **B / D** |
| **Wave / Boss Countdown** | Text `[Акт 1]` | Pill `[Swords] until 5 left` | Cross-wrench badge showing waves until inspection / boss | `normal`, `boss_alert` (flashing skull) | 68×14 px | **P1** | **B / D** |

---

### 1.5 Playable Automaton Defenders (32×32 Native px)
*Every unit is a character with helmet, weapon, armor plates, steam pipes, shadow beneath feet, and frame-by-frame animation (8–12 FPS).*

| Unit Key | Unit Name | Faction | Tier | Current Placeholder | Target Pixel-Art Design & Weaponry | Required Animation States (Frames) | Priority | Method |
|---|---|:---:|:---:|---|---|---|:---:|:---:|
| `tex_scrap_bot` | Scrap Bot | Scrap | 0 | Grey rectangle with red dot | Asymmetric tinplate scrapper with rusty cleaver, mismatched iron legs, wobbly antenna | `idle` (4f), `move` (6f hop), `attack` (5f slash), `hit` (2f), `death` (6f scrap scatter) | **P1** | **B / D** |
| `tex_cog_knight` | Cog Knight | Cog | 1 | Small grey square with dot | Sturdy brass vanguard with heavy broadsword, round rivet shield, polished visor | `idle` (4f breathing), `move` (6f jump-walk), `attack` (5f sword slash + white arc), `hit` (2f), `death` (6f) | **P1 (BENCHMARK)** | **B / D** |
| `tex_spring_archer` | Spring Archer | Spring | 1 | Small green square with dot | Slender verdigris copper ranger with coiled clockwork recurve bow, feathered cap, gear quiver | `idle` (4f), `move` (6f), `attack` (5f draw & arrow release), `hit` (2f), `death` (6f) | **P1** | **B / D** |
| `tex_fuse_sapper` | Fuse Sapper | Fuse | 1 | Small red square with dot | Leather-aproned demolitionist with burning matchcord, iron bomb canister, protective goggles | `idle` (4f), `move` (6f), `attack` (5f fuse light & throw), `hit` (2f), `death` (6f) | **P1** | **B / D** |
| `tex_coil_sparker` | Coil Sparker | Coil | 1 | Small blue square with dot | Robed electrostatic mechanist with dual copper wand prongs, crackling plasma aura | `idle` (4f), `move` (6f), `attack` (5f arc discharge), `cast` (5f), `hit` (2f), `death` (6f) | **P1** | **B / D** |
| `tex_cog_bulwark` | Cog Bulwark | Cog | 2 | Square with shield outline | Tower-shield heavy tank with massive interlocking brass plates | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_cog_ramhead` | Cog Ramhead | Cog | 2 | Square with horn outline | Pneumatic battering-ram automaton with piston horn | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_spring_sharpshooter`| Sharpshooter | Spring | 2 | Green square with scope | Long-barrel brass sniper rifle with monocular scope | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_spring_repeater` | Spring Repeater | Spring | 2 | Green square with cross | Triple-barrel rotary clockwork crossbow | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_fuse_pyromancer` | Pyromancer | Fuse | 2 | Red square with flame | High-pressure kerosene bellows and flame projector nozzle | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_fuse_demolitionist`| Demolitionist | Fuse | 2 | Red square with bomb | Twin dynamite bundles and reinforced blast apron | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_coil_conduit` | Arc Conduit | Coil | 2 | Blue square with rod | Dual Tesla resonator rods channeling bouncing lightning | Same 6 states (modular doll extension) | **P3** | **B / D** |
| `tex_coil_dynamo` | Coil Dynamo | Coil | 2 | Blue square with ring | Rotating magnetic flywheel projecting electrostatic shield | Same 6 states (modular doll extension) | **P3** | **B / D** |
| *Tier 3 & Legendaries* | (16 Tier 3 + 3 Grand Automatons) | All | 3 | Colored squares with star text | Elaborate 48×48 px armored titans, glowing auras, dual-wielding, ornate crests | Same 6 states per unit (assembled via modular doll system) | **P5** | **B / D** |

---

### 1.6 Adversaries & Siegebringers (Enemies & Bosses)
| Enemy Key | Name | Act | Role | Current Placeholder | Target Pixel-Art Design | Required Animation States | Priority | Method |
|---|---|:---:|---|---|---|---|:---:|:---:|
| `tex_en_scrapper` | Scrapper Marauder | 1 | Swarm Melee | Green/grey square | Bipedal rust-junk marauder with jagged scrap cleaver and leather hood | `idle` (4f), `move` (6f hop), `attack` (5f cleave), `hit` (2f), `death` (6f scrap scatter) | **P1** | **B / D** |
| `tex_en_steam_rover` | Steam Rover | 1 | Fast Buggy | Grey square with wheel | Low tricycle steam buggy with smoking exhaust pipe and spiked grill | `idle` (4f), `move` (4f wheel roll), `attack` (4f ram), `hit` (2f), `death` (6f) | **P3** | **B / D** |
| `tex_en_beetle` | Clockwork Beetle | 1 | Armored Wall | Grey beetle polygon | Thick cast-iron scarab with snapping hydraulic pincers | `idle` (4f), `move` (6f scuttle), `attack` (5f clamp), `hit` (2f), `death` (6f) | **P3** | **B / D** |
| `tex_en_sniper` | Scrap Sniper | 1 | Ranged | Grey square with line | Scavenged rifleman with red optical scope and camouflage cloaking | `idle` (4f), `move` (6f), `attack` (5f shoot), `hit` (2f), `death` (6f) | **P3** | **B / D** |
| `tex_en_shield_drone` | Shield Drone | 1 | Buffer | Floating blue circle | Hovering quad-rotor brass gyrocopter projecting kinetic barrier | `idle` (4f rotor spin), `move` (4f tilt), `cast` (4f pulse), `hit` (2f), `death` (6f) | **P3** | **B / D** |
| `tex_en_hound` | Piston Hound | 1 | Fast Flanker | Grey dog polygon | Quadrupedal steel canine with pneumatic jaws and razor teeth | `idle` (4f pant), `move` (6f gallop), `attack` (5f bite lunge), `hit` (2f), `death` (6f) | **P3** | **B / D** |
| `tex_boss_steam_baron`| **The Steam Baron** | 1 | Act 1 Boss | 64×64 circle with mustache | Locomotive-armored war baron with top hat, cigar smoke, spinning Gatling arm | **Phase 1:** `idle` (6f), `walk` (6f), `gatling` (8f), `steam_sweep` (6f), `hit` (2f); **Phase 2 (Overheat):** red hot hull, venting jets, charge attack | **P3** | **B / D** |
| *Act 2 & 3 Enemies* | (8 Mobs + 2 Bosses) | 2 & 3 | Various | Primitive polygons | Toxic insectoids, acid drones, citadel knights, siege engines, Iron Colossus | Standard 6 states per enemy (assembled in P5) | **P5** | **B / D** |

---

### 1.7 UI Panels, Modals, Dialogue & VFX
| Component | Current Implementation | Reference Equivalent | Target Art Specification | Priority | Method |
|---|---|---|---|:---:|:---:|
| **Slide-Out Unit Panel** | None (simple popup text) | Dark purple panel sliding from left over slot machine | Ornate 9-slice dark slate panel with brass trim, unit portrait, LV pip bar, 5 square mod sockets | **P4** | **B / D** |
| **Tutorial Dialogue Bubble** | None (no tutorial) | Dark pink/purple rounded speech bubble with pointer to guide | Dark mulberry speech bubble with cream border, pointing tail to Cogsworth, white pixel font, `Click to continue` prompt | **P4** | **B / D** |
| **Spotlight Dimmer** | None | Screen dims to 40% except highlighted element | Full-screen masking overlay `#0a080d` with cut-out hole and glowing border around target | **P2** | **Phaser Graphics** |
| **Summon Cell Highlight** | None | Square cell lights up green with sparkles | 45×14 px diamond/square ground patch glowing `#b5e48c` with rising pixel sparkles | **P2** | **B / D** |
| **Token Flying Arc** | None | Coin/symbol flies from slot to cell | 16×16 px circular faction token trailing colored pixel particles along a bezier arc | **P2** | **B / D** |
| **White Silhouette Spawn** | None | Unit spawns as white silhouette then reveals | 3-frame spawn: pure white silhouette → squash bounce → full color with smoke ring | **P2** | **B / D** |
| **Payline Vector Lines** | Canvas vector stroke | Neon pixel line tracing winning symbols | Crisp 2px pixelated neon line with moving white glint dash | **P2** | **B / D** |
| **Hit Flash & Damage Numbers** | Red floating text `-[N]` | White silhouette flash on sprite + tiny pixel numbers | 2-frame pure white sprite flash (`setTintFill(0xffffff)`), floating 8px pixel numbers with drop shadow | **P1** | **B / D** |
| **Sword Slash / Weapon Arc** | None | White crescent slash arc (2–3 frames) | Crescent 3-frame white/light-cyan slash swoosh attached to weapon tip | **P1** | **B / D** |
| **Jackpot Coin Rain** | None | Cascade of pixel coins bouncing off frame | 150+ pooled gold and bronze coin particles with gravity, ground bounce, and sparkle glints | **P2** | **ParticleKit** |
| **Foundry Shop Modal** | Full-screen brown panel with text buttons | Shopkeeper modal with card shelves and coin purse | Steampunk workshop interior with wooden shelf, 3 gadget cards with hover tilt, reel strip editor | **P4** | **B / D** |

---

## 2. Technical Production Methods Matrix

| Method Code | Description | Scope in BRASSREEL Overhaul | Tools & Pipeline |
|---|---|---|---|
| **A** | **AI Generation + Strict Pixel Pipeline** | High-density backgrounds, complex organic landscape layers | Midjourney / Stable Diffusion pixel prompt → `/tools/sprites` (downsample, palette quantize, 1px contour) |
| **B (Primary)** | **Modular Doll Pixel-Matrix Engine** | All 36 units, 24 enemies, UI 9-slice frames, chassis, icons | Hand-crafted base body doll + swappable weapon/armor layers + indexed palette swapper → Sprite Atlas |
| **C** | **CC0 Verified Clean Base** | Initial motion curves, walk cycles reference | Kenney / OpenGameArt CC0 sprite reference curves (recolored and re-dressed) |
| **D** | **External Artist / Aseprite Drop-in** | Final boss sheets, hero character art | Direct `.aseprite` / `.png` atlas drop into `/assets/art/` via automated JSON tag importer |
