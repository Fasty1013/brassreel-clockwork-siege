# Workflow: /qa-pass

Use this workflow to ensure code quality, eliminate softlocks, prevent seed desynchronization, and certify milestone builds.

## QA Verification Suite

1. **Static Analysis & Type Integrity**
   ```powershell
   npm run typecheck
   npm run lint
   ```
   - Must return zero warnings and zero errors.

2. **Core Unit & Property Testing**
   ```powershell
   npm run test -- --coverage
   ```
   - All tests in `/tests/core` and `/tests/combat` must pass.
   - Code coverage for `/src/core` must exceed $\ge 90\%$.

3. **Deterministic PRNG Verification**
   - Execute seed reproducibility test (`/tests/core/seedDeterminism.test.ts`):
     - Run Seed `0xCAFEBABE` through 10 full waves twice.
     - Verify every reel stop, payline hit, combat tick, enemy death, and reward generation is bit-for-bit identical across runs.

4. **Headless Stress & Softlock Hunting**
   - Run 1,000 randomized bot games with extreme edge cases (all holds used, maximum Heat jams, empty bench, full field, rapid smelt spam).
   - Verify zero unhandled exceptions, infinite loops, or game stalls.

5. **Visual & Browser E2E Inspection**
   - Launch Vite dev server.
   - Run automated browser agent / playtest scenario (`/tests/e2e/playtest.spec.ts`).
   - Validate UI transitions:
     - Title -> Prep -> Spin animation -> Unit Card hover -> Drag to field -> Start Battle -> Result -> Shop -> Wave Advance.
     - Capture screenshots of every scene state.

6. **Defect Tracking**
   - Log any regression, visual glitch, or logic error in `/docs/BUGS.md` with repro steps and severity.

