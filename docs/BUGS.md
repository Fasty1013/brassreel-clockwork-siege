# BRASSREEL: Defect & Softlock Registry

Owner: QA / Playtest Agent  
Purpose: Track issues discovered across Vitest runs, headless simulation batches, and browser playtests.

---

## Active Defect Register

| Bug ID | Severity | Discovery Phase | Subsystem | Description | Reproduction Steps | Status | Assignee |
|---|---|---|---|---|---|---|---|
| **BUG-001** | P1 | M4 | i18n | Missing translations for Quirks, Act 2 & 3 enemies/bosses, and wave titles | Run parity audit across content tables | **CLOSED (Fixed)** | Content Dev |
| **BUG-002** | P1 | M4 | Telemetry | Deaths clamped to wave 10 in telemetry aggregator during 30-wave simulation | Run 30-wave simulation batch | **CLOSED (Fixed)** | Balance Analyst |
| **BUG-003** | P2 | M5 | UI / Core | Missing Engine Core draft modal on wave 5, 10, 15, 20, 25 | Complete wave 5 in RunScene | **CLOSED (Fixed)** | UI / Core Dev |
| **BUG-004** | P2 | M5 | Packaging | Phaser 3 triggering chunk size warning in production build | Execute `npm run build` | **CLOSED (Fixed)** | Release Engineer |

---

## Defect Severity Classification
- **P0 - Blocker**: Hard crash, unhandled exception in core simulation, game softlock, seed desynchronization across identical seeds.
- **P1 - Critical**: Logic failure in payline evaluation, Smelt XP calculation error, broken Boss phase transition, untranslated string key in user view.
- **P2 - Moderate**: Minor balance deviation from statistical envelope (>10% win rate divergence), UI visual overlap, particle hitching.
- **P3 - Minor**: Cosmetic alignment discrepancy, sound mix balance nuance, non-critical typo in flavor lore.

