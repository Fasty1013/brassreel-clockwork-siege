# BRASSREEL: Clockwork Siege – Overview for Claude Code

**Tagline**: *Steampunk slot‑machine defence where you spin, summon pixel heroes, and battle in a vivid 2‑D arena.*

---

## 1. Core Gameplay Loop
1. **Spin the slot‑machine** – press *Spin*; the three reels stop on symbols.
2. **Match symbols** – each matching line generates a **unit summon** or a **resource reward**.
3. **Deploy the unit** – drag the summoned hero onto the meadow (left panel) or let the auto‑placement place it.
4. **Combat phase** – enemies enter from the right, units fight using jump‑hop movement, projectile attacks and melee strikes.
5. **Repeat** – after the battle ends you can spin again; the goal is to survive progressively harder waves and defeat the final boss.

---

## 2. Factions & Key Units
- **Cog Faction** – *Cog Knight* (heavy melee, shield bash).
- **Spring Faction** – *Spring Archer* (ranged, high‑arc arrows).
- **Enemy Types**
  - *Scrapper Enemy* – steel‑clad melee bots.
  - *Drone Enemy* – floating flyers that fire laser bursts.
- **Projectiles** – arrows, bomb shells, slash arcs, scrap debris.

---

## 3. Visual‑Art Approach
- **Pixel‑art style** – native canvas **640 × 360**, integer‑scaled ×3 to 1920 × 1080 (nearest‑neighbor). 32‑color procedural palette.
- **Sprite sizes** – units: 32 × 32 (elite 48 × 48, boss 96‑128). Icons: 28 × 28. 1 px dark contour with a subtle top‑left highlight.
- **Animation** – "jump‑hop" walk, vertical hop on attack, white flash on hit, slash‑arc effect, scrap‑debris particles.
- **UI composition** – dark violet‑gray frame, bright parchment‑style battle window, slot‑machine on the left, HUD on top‑center, minimal overlay.

---

## 4. Technical Stack
- **Engine**: **Phaser 3.88** (WebGL/Canvas fallback).
- **Language**: **TypeScript** (compiled with Vite).
- **Launcher**: Windows .NET **TcpListener** (replaces HttpListener) serving the game at `http://127.0.0.1:38888/`.
- **Procedural Assets**: `src/fx/proceduralAssets.ts` generates all textures at runtime — no external image files.
- **Deterministic Core**: `src/core/` — SFC32 seeded RNG, EventBus, deterministic game logic. **Do not modify.**
- **Tests**: Vitest, 75 tests in `tests/`.
- **QA**: `tools/qa/verifyPlayability.ts` — automated screenshot verification of all game states.

---

## 5. Key Source Files
| File | Purpose |
|------|---------|
| `src/scenes/BootScene.ts` | Asset registration, animation definitions |
| `src/scenes/MenuScene.ts` | Main menu UI |
| `src/scenes/RunScene.ts` | Main gameplay loop: spin → deploy → combat |
| `src/ui/ReelView.ts` | Slot‑machine reel rendering |
| `src/ui/UnitCard.ts` | Unit selection & deployment cards |
| `src/ui/HUD.ts` | Top HUD (gold, HP, wave counter) |
| `src/ui/GridView.ts` | Battle grid rendering |
| `src/art/palette.ts` | 32‑color palette constants |
| `src/art/characters/cogKnight.ts` | Cog Knight procedural sprite |
| `src/art/characters/springArcher.ts` | Spring Archer procedural sprite |
| `src/art/characters/scrapperEnemy.ts` | Scrapper Enemy procedural sprite |
| `src/art/characters/droneEnemy.ts` | Drone Enemy procedural sprite |
| `src/art/projectiles.ts` | Arrow, bomb, slash‑arc, scrap textures |
| `src/fx/proceduralAssets.ts` | Central procedural asset generator |
| `src/data/units.ts` | Unit stat definitions |
| `src/core/` | Deterministic game engine (DO NOT MODIFY) |

---

## 6. Build & Run
```bash
npm install          # install deps
npm run build        # production build → dist/
npm run dev          # Vite dev server (hot reload)
npm test             # run all Vitest tests
npx tsx tools/qa/verifyPlayability.ts  # QA screenshot check
```

Windows launcher: compile `Launcher.cs` with `csc`, run `BRASSREEL.exe` → serves on `http://127.0.0.1:38888/`.

---

## 7. Reference Assets
- **Reference video**: `docs/reference/gameplay.mp4` — target look, feel, and animation quality (game: *Slotbound*).
- **Asset inventory**: `ASSET_INVENTORY.md` — full list of procedural asset definitions.
- **Architecture**: `ARCHITECTURE.md` — system architecture documentation.

---

## 8. Rules for Modification
1. **DO NOT touch `src/core/`** — deterministic game logic is frozen.
2. **Presentation layer only** — you may change rendering, art, animation, UI, and sound.
3. **Stay 2‑D / Phaser** — no 3‑D, no engine changes.
4. **Procedural art** — all sprites must remain procedural (no external `.png` files).
5. **Run tests after every change** — `npm test` must pass with 0 failures.

