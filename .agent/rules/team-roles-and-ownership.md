# Agent Team Roles & File Ownership Rules

BRASSREEL: Clockwork Siege is built using a multi-agent specialized team. Each agent has strict domain ownership, responsibility boundaries, and quality requirements.

## 1. Team Roster & Ownership Matrix

| Agent Role | Primary Focus | File / Directory Ownership | Cross-Discipline Interfaces |
|---|---|---|---|
| **1. Lead Architect** | System design, orchestration, build pipeline, code review, governance | `/docs/ARCHITECTURE.md`, `/.agent/**`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, root configs | Reviews all changes; approves schema modifications |
| **2. Game Designer** | Mechanics specification, mathematical curves, unit trees, core & gadget design | `/docs/GDD.md`, content design specs | Hands off content tables to Content Dev via `/docs/HANDOFF.md` |
| **3. Core Engine Dev** | Deterministic game logic, RNG streams, reel simulation, payline evaluation, Smelt, Engine Cores | `/src/core` (except combat/waves), `/tests/core` | Emits events via `EventBus`; exposes pure state reducers |
| **4. Combat & AI Dev** | Real-time auto-battle simulation, spatial grid, targeting, projectiles, AoE, statuses, Boss phases, Inspections | `/src/core/combat`, `/src/core/waves`, `/tests/combat` | Consumes units from core; reports combat results to RunState |
| **5. Content Dev** | Data schemas (Zod/TS), content catalogs (units, mods, cores, gadgets, enemies), i18n catalogs | `/src/data/**` (except balance overrides) | Implements GDD tables with strict validation; maintains `en.json` and `ru.json` |
| **6. UI/UX Dev (Phaser)** | Phaser 3 scenes, visual ReelView, drag-and-drop interaction, unit cards, tooltips, HUD, shop, evolution modal | `/src/scenes/**`, `/src/ui/**` | Reads pure state; dispatches Commands/Events; never mutates core directly |
| **7. Art & VFX** | Procedural pixel-art generators, sprite sheets, particle systems, payline highlighting, Jackpot Show effects | `/src/fx/**`, `/public/assets/**` | Subscribes to `EventBus` signals (`lineHit`, `jackpot`, `smelt`, `jam`) |
| **8. Audio Dev** | Procedural WebAudio sound synthesizers (cogs, steam, bell, sparks), audio bus, volume mixer | `/src/audio/**` | Subscribes to `EventBus` sound triggers; zero external audio asset dependency |
| **9. QA / Playtest Agent** | Vitest test suites, e2e headless test harness, browser playtest scripts, seed determinism audits | `/tests/e2e/**`, `/docs/BUGS.md` | Validates every milestone; monitors softlocks and desyncs |
| **10. Balance Analyst** | Headless CLI simulator, bot AI policies (Random, Greedy, Smart), Monte Carlo batch runs, telemetry | `/tools/sim/**`, `/docs/BALANCE.md`, `/src/data/balance.ts` | Runs 5000+ simulations; tunes only `/src/data/balance.ts` |

---

## 2. Strict Collaboration Principles

1. **Zero Direct Cross-Border Edits**: No agent may modify files outside their designated ownership list. If an agent requires changes in another domain, they must post a formal ticket in `/docs/HANDOFF.md`.
2. **Deterministic Core Isolation**: `/src/core` MUST NEVER import Phaser, DOM APIs, `window`, or browser globals. Core logic must run identically in Node.js CLI and in browser runtime.
3. **Command / Reducer Pattern**: All state mutations pass through deterministic action dispatches. Pure state transitions take `(State, Action, PRNG) => NextState`.
4. **Independent PRNG Streams**: Systems (reels, combat, loot, shop) consume their own dedicated PRNG seed stream derived deterministically from the master seed, preventing action desynchronization.
5. **Quality Gates on Every Step**:
   - `npm run typecheck` must pass with zero TypeScript errors under `strict: true`.
   - `npm test` must pass all unit and property tests.
   - Core coverage must remain $\ge 90\%$.
6. **Localization Completeness**: Hardcoded user-visible strings are strictly forbidden. Every label, tooltip, description, and alert must use an i18n key present in both `en.json` and `ru.json`.

