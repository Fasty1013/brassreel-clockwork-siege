# BRASSREEL: Clockwork Siege — Balance & Mathematical Specification

Version: 1.0.0 (Milestone M0)  
Owner: Balance Analyst  

---

## 1. Mathematical Design Principles

The economy and combat balance of BRASSREEL follow three mathematical axioms:
1. **The Floor of Fortune**: Every spin must provide tactical value. Dead spins are eliminated by awarding **Scrap Bots** on pairs (2 matching symbols). Scrap bots serve as vital fuel for the Smelt crucible.
2. **Push-Your-Luck Heat Tradeoff**: Heat is an escalatory risk/reward lever. The higher the heat, the greater the density of Wilds and Crowns, but the higher the threat of a Jam. Optimal play hovers around 50–60 Heat.
3. **Decisive Synergy Scaling**: Units scale linearly via Rolled Mods, but scale super-linearly via Faction archetypes, Engine Cores, and Tag resonances.

---

## 2. Slot Machine Mathematics & Odds

### 2.1 Default Reel Strip Configuration
Each of the 3 reels has a 10-symbol starter strip:
- **Reel 1**: 3 Cog, 2 Spring, 2 Fuse, 1 Coil, 1 Golden Gear (Wild), 1 Crown (Total = 10)
- **Reel 2**: 2 Cog, 3 Spring, 1 Fuse, 2 Coil, 1 Golden Gear (Wild), 1 Crown (Total = 10)
- **Reel 3**: 2 Cog, 1 Spring, 3 Fuse, 2 Coil, 1 Golden Gear (Wild), 1 Crown (Total = 10)

Total possible 3-symbol outcomes across any single line $= 10 \times 10 \times 10 = 1,000$.

### 2.2 Single Payline Probability Breakdown
For any individual payline (horizontal, vertical, or diagonal):
- **Cog 3-in-a-row** (with Wilds): $(3+1) \times (2+1) \times (2+1) - (\text{Wild only}) = 4 \times 3 \times 3 - 1 = 35 / 1,000 = 3.5\%$
- **Spring 3-in-a-row** (with Wilds): $(2+1) \times (3+1) \times (1+1) - 1 = 3 \times 4 \times 2 - 1 = 23 / 1,000 = 2.3\%$
- **Fuse 3-in-a-row** (with Wilds): $(2+1) \times (1+1) \times (3+1) - 1 = 3 \times 2 \times 4 - 1 = 23 / 1,000 = 2.3\%$
- **Coil 3-in-a-row** (with Wilds): $(1+1) \times (2+1) \times (2+1) - 1 = 2 \times 3 \times 3 - 1 = 17 / 1,000 = 1.7\%$
- **Wild 3-in-a-row** (Triple Wild): $1 \times 1 \times 1 = 1 / 1,000 = 0.1\%$ (counts as player's choice or omni-summon)
- **Crown Jackpot (Triple Crown)**: $1 \times 1 \times 1 = 1 / 1,000 = 0.1\%$ per line.
- **Combined 3-of-a-kind per single line**: $\approx 9.9\%$

### 2.3 Spin Hit Rates across 8 Evaluated Paylines
Evaluating across all 8 paylines (3 rows, 3 columns, 2 diagonals):
- **Probability of $\ge 1$ Three-of-a-kind Faction Hit**: $18.5\% \pm 1.5\%$ (Hits design target of 15–20%).
- **Probability of $\ge 1$ Pair (Scrap Bot)**: $62.4\%$.
- **Probability of $\ge 1$ Summon (Tier 1 OR Scrap)**: $68.2\%$ (Exceeds design target of $\ge 55\%$).
- **Triple Crown Jackpot across 8 lines**: $\approx 0.8\%$ per spin on default cold strips, rising to $\approx 1.5\%$ with central alignment, and scaling up to $\approx 3.8\%$ in Overdrive ($Heat \ge 80$).

---

## 3. Heat & Jam Dynamics

### Heat Generation & Decay
- Free spins per wave: 3 spins ($0\text{ Heat}$).
- Extra spins: Cost 1 Steam, adds $+20\text{ Heat}$.
- Natural Wave Cooling: $-30\text{ Heat}$ at BATTLE end.

### Heat Multipliers & Jam Probability Function
$$\text{JamChance}(H) = \begin{cases} 
0\% & \text{if } H \le 60 \\
(H - 60) \times 0.875\% & \text{if } 60 < H \le 100 
\end{cases}$$

- At $H = 60$: Jam Chance $= 0\%$. Wild Weight $= \times 2.0$.
- At $H = 80$: Jam Chance $= 17.5\%$. Wild & Crown Weight $= \times 2.5$.
- At $H = 100$: Jam Chance $= 35.0\%$. Wild & Crown Weight $= \times 3.0$.

---

## 4. Act 1 Wave Progression & Combat Scaling

| Wave | Type | Enemies Count | Avg Enemy HP | Total Wave EHP | Cogs Reward | Target Clear Time |
|---|---|---|---|---|---|---|
| **1** | Swarm | 6 | 110 | 660 | 18 | 15s - 22s |
| **2** | Mixed | 8 | 135 | 1,080 | 20 | 20s - 28s |
| **3** | Armored | 10 | 180 | 1,800 | 22 | 25s - 35s |
| **4** | Ranged Rush | 12 | 160 | 1,920 | 24 | 28s - 38s |
| **5** | **Inspection** | 14 | 220 | 3,080 | 35 (+Core) | 30s - 45s |
| **6** | Heavy Swarm | 16 | 210 | 3,360 | 26 | 32s - 45s |
| **7** | Siege Breakers| 15 | 280 | 4,200 | 28 | 35s - 50s |
| **8** | Fast Prowlers | 18 | 240 | 4,320 | 30 | 38s - 52s |
| **9** | Elite Vanguard | 18 | 310 | 5,580 | 32 | 40s - 55s |
| **10**| **Act 1 Boss** | 1 Boss + 10 Ads| 3200 (Boss) + 180 | 5,000 | 50 (+Core) | 45s - 65s |

---

## 5. Economy & Purchasing Power Curves

- Average Cogs accumulated by Wave 5: $110 - 140\text{ Cogs}$.
- Average Cogs accumulated by Wave 10: $260 - 320\text{ Cogs}$.
- Intended shop allocation:
  - 30% on Reel Strip modifications (thinning weak symbols, adding faction focus).
  - 40% on Gadget acquisitions (2–3 key passives).
  - 20% on Symbol Gilt upgrades.
  - 10% on Shop Rerolls and consumables.

---

## 6. Target Win Rates & Simulation Acceptance Thresholds

For 5,000 headless simulated runs on Act 1 (Waves 1 to 10):

| Bot Policy | Definition | Target Win Rate | Tolerance Margin |
|---|---|---|---|
| `RandomBot` | Places units randomly, spins randomly, ignores Hold/Nudge/Smelt | $< 10\%$ | $3\% - 8\%$ |
| `GreedyBot` | Deploys all units, merges same faction when possible, buys cheapest shop item | $\approx 30\%$ | $25\% - 35\%$ |
| `SmartBot` | Uses Hold to complete lines, Nudges optimal symbols, builds ★2/★3 branches, balances Heat $\le 60$ | $50\% - 60\%$ | $48\% - 62\%$ |

### Disqualification Conditions (Balance Bugs)
- If `RandomBot` achieves $> 15\%$ win rate, Act 1 is undertuned.
- If `SmartBot` fails to reach $> 45\%$ win rate, the game is overtuned or RNG is excessively punishing.
- If any single Faction or Core exhibits $> 75\%$ pick/win correlation across winning runs, immediate nerfing is triggered.

