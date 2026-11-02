# Workflow: /release-build

Production release workflow to prepare and verify deployable builds.

## Release Checklist

1. **Pre-flight Quality Check**
   - [ ] Clean git working tree or staged changes verified.
   - [ ] `npm run typecheck` passes with zero errors.
   - [ ] `npm run test` passes 100% of tests.
   - [ ] Core coverage remains $\ge 90\%$.
   - [ ] Simulator validation: 1,000 runs without crash.

2. **Bundle & Compilation**
   - [ ] `npm run build` compiles without warnings into `/dist`.
   - [ ] Assets in `/dist/assets` are correctly bundled and hashed.
   - [ ] `dist/index.html` loads locally in preview mode (`npm run preview`).

3. **Runtime Verification**
   - [ ] Pixel-art scaling operates smoothly at 1920×1080 and maintains aspect ratio on resizing.
   - [ ] Audio synthesizers trigger without audio context clipping or console warnings.
   - [ ] i18n switches cleanly between English and Russian with zero untranslated key fallbacks (`[MISSING: ...]`).
   - [ ] LocalStorage save/load correctly stores and retrieves meta-progression data.

4. **Deliverables Assembly**
   - [ ] Generate summary report of the milestone in `/docs`.
   - [ ] Take and archive screenshots of core gameplay loops.
   - [ ] Record simulator telemetry benchmarks.

