# Workflow: /release-build

Production release workflow to prepare and verify deployable builds.

## Release Checklist

1. **Pre-flight Quality Check**
   - [x] Clean git working tree or staged changes verified.
   - [x] `npm run typecheck` passes with zero errors.
   - [x] `npm run test` passes 100% of tests (75/75 passed).
   - [x] Core coverage remains $\ge 90\%$ (90.66% lines, 97.56% functions).
   - [x] Simulator validation: 10,000 runs without crash (63.36s, 16.95% winrate).

2. **Bundle & Compilation**
   - [x] `npm run build` compiles without warnings into `/dist`.
   - [x] Assets in `/dist/assets` are correctly bundled, code-split (vendor phaser separated), and hashed.
   - [x] `dist/index.html` loads locally in preview mode (`npm run preview`).

3. **Runtime Verification**
   - [x] Pixel-art scaling operates smoothly at 1920×1080 and maintains aspect ratio on resizing (`Phaser.Scale.FIT`).
   - [x] Audio synthesizers trigger without audio context clipping or console warnings (`SoundManager.ts`).
   - [x] i18n switches cleanly between English and Russian with zero untranslated key fallbacks (368/368 keys verified).
   - [x] LocalStorage save/load correctly stores and retrieves meta-progression data (`MetaManager.ts`).

4. **Deliverables Assembly**
   - [x] Generate summary report of the milestone in `/docs` (`RELEASE.md`, `CONTROLS.md`, `m5_release_readiness_report.md`).
   - [x] Take and archive screenshots of core gameplay loops (7/7 in `docs/screenshots/`).
   - [x] Record simulator telemetry benchmarks (`docs/simulation_10k_report.json`).

