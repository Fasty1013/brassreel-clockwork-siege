# BRASSREEL: Defect & Softlock Registry

Owner: QA / Playtest Agent  
Purpose: Track issues discovered across Vitest runs, headless simulation batches, and browser playtests.

---

## Active Defect Register

| Bug ID | Severity | Discovery Phase | Subsystem | Description | Reproduction Steps | Status | Assignee |
|---|---|---|---|---|---|---|---|
| *None* | — | M0 | — | Initial baseline clean. All schemas and documents established. | — | Closed | QA Agent |

---

## Defect Severity Classification
- **P0 - Blocker**: Hard crash, unhandled exception in core simulation, game softlock, seed desynchronization across identical seeds.
- **P1 - Critical**: Logic failure in payline evaluation, Smelt XP calculation error, broken Boss phase transition, untranslated string key in user view.
- **P2 - Moderate**: Minor balance deviation from statistical envelope (>10% win rate divergence), UI visual overlap, particle hitching.
- **P3 - Minor**: Cosmetic alignment discrepancy, sound mix balance nuance, non-critical typo in flavor lore.

