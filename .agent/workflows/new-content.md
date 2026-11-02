# Workflow: /new-content

Use this workflow whenever adding or modifying content: Units, Rolled Mods, Engine Cores, Gadgets, Enemies, Boss mechanics, or Inspection challenges.

## Steps

1. **GDD Alignment (Game Designer)**
   - Verify design entry in `/docs/GDD.md`.
   - Specify base stats, tier, tags, scaling formulas, and edge cases.
   - Hand off to Content Dev via `/docs/HANDOFF.md`.

2. **Schema & Data Definition (Content Dev)**
   - Add data definition in `/src/data/<category>.ts` matching the respective schema in `/src/data/schemas/`.
   - Validate structure using Zod schema parser (`validateContent()`).
   - Add both English (`/src/data/i18n/en.json`) and Russian (`/src/data/i18n/ru.json`) localization strings:
     - `name`: Short display title.
     - `desc`: Full functional description with variable interpolations.
     - `flavor`: Atmospheric lore snippet.

3. **Core Integration & Unit Testing (Core Engine Dev / Combat Dev)**
   - If mechanic requires custom logic (e.g., new status effect, new line evaluation rule), implement handler in `/src/core`.
   - Write targeted unit test in `/tests/core` or `/tests/combat` verifying:
     - Correct state modification when triggered.
     - Correct interaction with other systems (e.g. Wild substitution, Mod inheritance).
     - Deterministic execution across repeated seed runs.

4. **Visual & Audio Hookup (UI / Art / Audio Dev)**
   - Register procedural sprite / icon generator in `/src/fx/proceduralAssets.ts`.
   - Add specific sound event binding if applicable in `/src/audio/sfxGenerator.ts`.
   - Verify tooltip rendering in `/src/ui/Tooltip.ts`.

5. **Headless Simulator Smoke Test (Balance Analyst)**
   - Execute: `npm run sim -- --runs 500 --bot smart`
   - Confirm zero unhandled exceptions, zero undefined stat lookups, and valid winrate metrics.

6. **Quality Gate Verification**
   - Run `npm run typecheck`
   - Run `npm test`
   - Update `/docs/HANDOFF.md` with completion log.

