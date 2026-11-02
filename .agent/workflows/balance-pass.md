# Workflow: /balance-pass

Use this workflow to measure, audit, and adjust game balance against defined statistical targets.

## Target Metrics (Baseline)

- **Line Hit Rate**: $\ge 55\%$ of spins yield at least one unit summon (including Scrap Bot pairs).
- **Faction 3-of-a-Kind**: $15\% - 20\%$ of spins hit a pure 3-symbol payline.
- **Jackpot (3 Crowns)**: $\approx 1.5\%$ base chance; scales up to $\approx 4.0\%$ during high Heat (Overdrive).
- **Act 1 Winrates**:
  - `Random Bot`: $< 10\%$
  - `Greedy Bot`: $\approx 30\%$
  - `Smart Bot`: $50\% - 60\%$
- **Wave Pacing**: Average Battle phase duration $25 - 60\text{ s}$ at $1\times$ speed.
- **Faction Equity**: Faction win rates must be within $\pm 10$ percentage points of each other.
- **Synergy Dominance Cap**: No single Core + Unit combination may exceed $> 75\%$ win rate in isolation.

## Execution Steps

1. **Run Multi-Bot Batch Simulation (Balance Analyst)**
   ```powershell
   npm run sim -- --runs 5000 --bot random --output docs/sim-reports/random_report.json
   npm run sim -- --runs 5000 --bot greedy --output docs/sim-reports/greedy_report.json
   npm run sim -- --runs 5000 --bot smart  --output docs/sim-reports/smart_report.json
   ```

2. **Metric Analysis**
   - Extract winrates per Act and per Wave.
   - Analyze payline frequencies (P0 = Scrap pairs, P1 = 3-in-a-row, P2 = multi-line combos, P_jackpot = Crown jackpot).
   - Check Heat distribution, Jam occurrence rate, and Boiler HP leak points.
   - Identify underperforming and overperforming Cores, Units, and Gadgets.

3. **Data-Only Adjustments**
   - Apply numerical tweaks exclusively in `/src/data/balance.ts` or individual unit baseline stats.
   - NEVER alter game rules or core engine mechanics to fix numbers.

4. **Iterative Verification**
   - Re-run batch simulation with 2,000 runs to verify shift in curves.
   - Commit updated summary into `/docs/BALANCE.md`.

