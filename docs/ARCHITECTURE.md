# BRASSREEL: Clockwork Siege — Architecture Specification

Version: 1.0.0 (Milestone M0)  
Owner: Lead Architect  

---

## 1. Architectural Philosophy

BRASSREEL is built on strict architectural boundaries separating **Pure Simulation Logic** from **Rendering / Presentation**. The game is designed to run in two environments:
1. **Interactive Client**: Phaser 3 (WebGL/Canvas) inside modern desktop/mobile browsers (with eventual Tauri/Electron distribution).
2. **Headless Simulator / Test Runner**: Pure Node.js CLI runtime executing thousands of runs in seconds for balance audits, property-based tests, and automated regressions.

```
       +-----------------------------------------------------------+
       |                     Interactive Web UI                    |
       |  (Phaser 3 Scenes, ReelView, UnitCard, FX, WebAudio SFX)  |
       +-----------------------------+-----------------------------+
                                     | Dispatches Commands
                                     | Subscribes to Events
                                     v
       +-----------------------------------------------------------+
       |               Pure Game Core (/src/core)                  |
       |  State Reducers | Deterministic RNG | Spatial Combat      |
       |  Reels & Paylines | Smelt & Mods | Economy | Waves        |
       +-----------------------------+-----------------------------+
                                     ^
                                     | Consumed Headlessly
                                     | (No Phaser / No DOM)
       +-----------------------------+-----------------------------+
       |             Headless Simulator (/tools/sim)               |
       |  Bot Policies (Random, Greedy, Smart) | Monte Carlo Tests  |
       +-----------------------------------------------------------+
```

### Core Invariants
- **Zero DOM/Phaser in Core**: No file in `/src/core` may import Phaser, reference `window`, `document`, or use browser-only globals.
- **Strict Determinism**: Given the same seed string and input command sequence, every action (reel spin, payline evaluation, unit roll, combat tick, enemy spawn, damage calculation) produces the identical bit-exact state.
- **Separated PRNG Streams**: A single master run seed seeds independent PRNG streams (`reel`, `combat`, `loot`, `shop`). Spinning reels does not alter combat roll sequences; shop rerolling does not alter reel spin stops.
- **Data-Driven Design**: All game statistics, units, mods, quirks, cores, gadgets, enemies, and waves are declared as TypeScript records validated by Zod schemas in `/src/data`.

---

## 2. Directory Structure

```
/
├── .agent/
│   ├── rules/                 # Team roles, permissions, boundaries
│   └── workflows/             # Standardized operational processes
├── docs/
│   ├── ARCHITECTURE.md        # Technical architecture (this document)
│   ├── GDD.md                 # Game design document
│   ├── BALANCE.md             # Mathematical targets and balance logs
│   ├── CONTENT_GUIDE.md       # Guide for adding data-driven content
│   ├── HANDOFF.md             # Inter-agent task board
│   └── BUGS.md                # QA defect registry
├── src/
│   ├── core/                  # PURE DETERMINISTIC GAME SIMULATION
│   │   ├── prng/              # Multi-stream PRNG (mulberry32 / sfc32)
│   │   ├── events/            # Typed EventBus
│   │   ├── state/             # RunState, gameState transitions, reducers
│   │   ├── reels/             # ReelStrip, Spin evaluator, Payline matching, Wilds
│   │   ├── heat/              # Heat gauge, Jam mechanics, risk/reward curves
│   │   ├── units/             # Unit instances, Rolled Mods generator, Quirks
│   │   ├── smelt/             # Smelt merge, XP thresholds, branch selection
│   │   ├── cores/             # Engine Core triggers, tag synergy checks
│   │   ├── gadgets/           # Gadget effect handlers
│   │   ├── economy/           # Cogs, Steam, shop purchase transitions
│   │   ├── combat/            # 8x5 battlefield, spatial grid, targeting, ticks
│   │   └── waves/             # Wave lifecycle, Inspection rules, Boss AI
│   ├── data/                  # DATA-DRIVEN TABLES & SCHEMAS
│   │   ├── schemas/           # Zod schema definitions
│   │   ├── balance.ts         # Numeric constants, curve parameters
│   │   ├── units.ts           # 4 Factions x 3 Tiers + Branches (32 units)
│   │   ├── mods.ts            # 40 Rolled Mod definitions
│   │   ├── quirks.ts          # Unit archetype quirks
│   │   ├── cores.ts           # 20 Engine Cores + tags
│   │   ├── gadgets.ts         # 30 Gadgets
│   │   ├── enemies.ts         # 12 Enemies + Boss phases
│   │   ├── waves.ts           # Wave encounter tables (Waves 1-10)
│   │   └── i18n/              # en.json, ru.json localization dictionaries
│   ├── scenes/                # PHASER 3 SCENE LIFECYCLE
│   │   ├── BootScene.ts       # Asset caching, procedural texture baking
│   │   ├── MenuScene.ts       # Title screen, settings, seed input
│   │   ├── RunScene.ts        # Primary orchestrator (PREP / BATTLE / RESULT)
│   │   ├── ShopScene.ts       # Reel strip customization, gadget shop
│   │   └── GameOverScene.ts   # Run summary, meta-progression rewards
│   ├── ui/                    # VISUAL UI COMPONENTS (PHASER CONTAINERS)
│   │   ├── ReelView.ts        # 3x3 animated reels with sequential stop
│   │   ├── UnitCard.ts        # Unit card with stats, stars, mod badges
│   │   ├── GridView.ts        # 8x5 battlefield grid with drag-and-drop slots
│   │   ├── Tooltip.ts         # Rich hover tooltip with i18n text & stats
│   │   ├── HeatMeter.ts       # Pressure/steam gauge with jam alert threshold
│   │   ├── CoreBar.ts         # Active Engine Cores display
│   │   └── EvolutionModal.ts  # Branch choice dialog on star rank up
│   ├── fx/                    # VISUAL JUICE & PARTICLES
│   │   ├── proceduralAssets.ts# Canvas-based pixel sprite generator
│   │   ├── lineHighlighter.ts # Golden payline visual tracing
│   │   ├── jackpotShow.ts     # Screen shake, flash, slow-mo, confetti
│   │   └── combatFx.ts        # Projectile trails, slash sparks, steam clouds
│   └── audio/                 # PROCEDURAL AUDIO SYNTHESIZERS
│       ├── audioBus.ts        # Master WebAudio manager & volume bus
│       ├── sfxGenerator.ts    # Procedural cogs, steam, bells, hits, jams
│       └── synthMusic.ts      # Looped atmospheric clockwork soundbed
├── tools/
│   └── sim/                   # HEADLESS CLI SIMULATOR
│       ├── runner.ts          # CLI entry point (Node.js)
│       ├── bots/              # RandomBot, GreedyBot, SmartBot
│       └── telemetry.ts       # Metric aggregator and JSON reporter
├── tests/
│   ├── core/                  # Core logic & property tests (Vitest)
│   ├── combat/                # Combat simulation tests (Vitest)
│   └── e2e/                   # Determinism and browser scenario tests
├── index.html                 # Web entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Deterministic PRNG Stream Architecture

To guarantee that player choices in the shop or Prep phase do not alter combat outcomes, a hierarchical PRNG tree is employed.

```
                     Master Run Seed (e.g., "BRASS-9821")
                                      |
                     +----------------+----------------+
                     |                |                |
                Reel Stream     Combat Stream     Loot Stream
                     |                |                |
             - Strip Spin       - Target Pick    - Rolled Mods
             - Jam Checks       - Hit Variation  - Shop Stock
             - Payline Order    - Status Procs   - Gadget Drops
```

### Algorithm
We use **SFC32** (Small Fast Chaotic 32-bit PRNG) initialized via a 128-bit hash (MurmurHash3) from seed strings.
- Fast execution in V8 engine (>100M numbers/sec).
- Period $\approx 2^{128}$.
- Predictable serialization: an active PRNG instance can serialize its 4 internal state integers `[a, b, c, d]` for snapshotting.

---

## 4. State Management: Command & EventBus Architecture

State mutation follows a unidirectional flow:

```
[ User Input / Bot Action ]
             |
             v
      [ Dispatch Command ]
             |
             v
  [ Pure Core Reducer ] <--- [ Isolated PRNG Stream ]
             |
             +---> Emits Typed Events via [ EventBus ]
             |           |
             |           +---> Phaser Scene updates visuals
             |           +---> Particle FX triggers bursts
             |           +---> WebAudio triggers sound synthesis
             |
             v
      [ New Immutable RunState ]
```

### Typed EventBus Events
- `spin_start`: Reels begin spinning.
- `reel_stopped`: Individual reel locks into final symbol display.
- `line_hit`: Payline evaluated with symbol type, matching indices, and combo tier.
- `jackpot`: 3 Crowns matched; triggers cinematic Jackpot sequence.
- `unit_summoned`: Unit created and placed in player reserve/bench.
- `unit_smelted`: Sacrifice absorbed; XP granted; mod transferred; evolution triggered if threshold met.
- `jam_triggered`: Reel jammed; unit damaged; heat consequence fired.
- `combat_tick`: Simulation step executed with projectile and damage events.
- `boiler_damaged`: Boiler HP decreased; leak alert.
- `wave_completed`: Wave victory; rewards calculated.

---

## 5. Combat Engine Architecture

The battlefield is an $8 \times 5$ discrete grid:
- **Columns 0 to 3**: Player deployable defensive zone.
- **Columns 4 to 7**: Combat transit and enemy approach zone. Enemies spawn on column 7 and march leftward towards column 0.
- **Boiler Gate**: Column 0 border. Any enemy crossing column 0 deals damage directly to Boiler HP (Regular: $-1$, Boss: $-3$) and is consumed.

### Simulation Tick Loop
Combat runs in discrete time-steps (ticks = $50\text{ ms}$, i.e., $20\text{ ticks/sec}$):
1. **Status Update**: Tick down active status durations (Stun, Burn, Slow, Armor Buff).
2. **Aggro & Target Acquisition**:
   - Melee units seek nearest opposing unit in same or adjacent row.
   - Ranged units seek nearest unit within attack range radius.
   - Enemies prioritize target blocking their lane; if unobstructed, move leftward at speed.
3. **Attack Execution**:
   - Attack cooldown timers tick down.
   - On readiness: unit initiates attack animation, spawns projectile or applies instant melee strike.
   - Damage formula: $\text{Damage} = \max(1, (\text{Base} + \text{ModAtk}) \times \text{Multiplier} - \text{Armor})$.
4. **Collision & AoE Resolution**: Projectiles advance; explode on contact applying splash radius damage and status procs.
5. **Death & Scrap Yield**: Destroyed units drop Cogs and emit death events.

---

## 6. Procedural Assets & Sound Architecture

To ensure 100% original, copyright-clean, and self-contained distribution without external asset load bottlenecks:
1. **Procedural Pixel-Art Generator (`/src/fx/proceduralAssets.ts`)**:
   - Renders 16x16, 32x32, and 64x64 pixel sprites dynamically on HTML5 offscreen canvases at boot time.
   - Textures are uploaded to Phaser's `TextureManager` (e.g., `tex_cog_t1`, `tex_spring_t2`, `tex_boss_baron`).
   - Distinct brass, iron, copper, neon-amber, and cobalt palettes create a unified steampunk casino aesthetic.
2. **Procedural WebAudio Synthesizer (`/src/audio/sfxGenerator.ts`)**:
   - Generates all sound effects mathematically via WebAudio `AudioContext`:
     - *Reel Tick*: Bandpass filtered square wave impulse ($1200\text{ Hz}$).
     - *Reel Clunk / Stop*: Low frequency damped sine wave ($120\text{ Hz} \to 40\text{ Hz}$).
     - *Coin Payout*: High resonant bell tones ($1800\text{ Hz} + 2400\text{ Hz}$).
     - *Steam Vent*: Pink noise burst with envelope sweep.
     - *Jam Spark*: Electric FM-modulated noise chirp.
     - *Jackpot Chime*: Pentatonic brass chime arpeggio.

---

## 7. Internationalization (i18n)

- All user-facing strings are keyed dictionaries stored in `/src/data/i18n/en.json` and `/src/data/i18n/ru.json`.
- A lightweight translation helper `t(key: string, params?: Record<string, string | number>): string` handles lookups and variable interpolations.
- Zero raw Russian or English strings permitted in scene or UI component code.

