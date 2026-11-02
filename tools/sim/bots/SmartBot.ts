import { BotPolicy } from './BotPolicy';
import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';
import { ReelManager } from '@core/reels/reels';

export class SmartBot implements BotPolicy {
  public name = 'SmartBot';

  public decidePrepActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];

    // 1. Evaluate current 3x3 grid for potential Nudges
    if (state.nudgesLeft > 0) {
      // Check if nudging any reel by +1 or -1 completes a 3-in-a-row
      for (let r = 0; r < 3; r++) {
        const originalIndex = state.reelIndices[r];
        const len = state.reelStrips[r].length;

        // Try +1
        state.reelIndices[r] = (originalIndex + 1) % len;
        let testGrid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
        let evalRes = ReelManager.evaluateGrid(testGrid);
        if (evalRes.factionHitsCount > 0 || evalRes.isJackpot) {
          commands.push({ type: 'NUDGE_REEL', reelIndex: r, direction: 1 });
          break;
        }

        // Try -1
        state.reelIndices[r] = (originalIndex - 1 + len) % len;
        testGrid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
        evalRes = ReelManager.evaluateGrid(testGrid);
        if (evalRes.factionHitsCount > 0 || evalRes.isJackpot) {
          commands.push({ type: 'NUDGE_REEL', reelIndex: r, direction: -1 });
          break;
        }

        state.reelIndices[r] = originalIndex; // Revert
      }
    }

    // 2. Execute Free Spins
    const freeSpins = state.freeSpinsLeft;
    for (let i = 0; i < freeSpins; i++) {
      commands.push({ type: 'SPIN' });
    }

    // 3. Push Your Luck: Overdrive Spin only if Heat <= 40 and Steam >= 2
    if (state.heat.currentHeat <= 40 && state.economy.steam >= 2) {
      commands.push({ type: 'SPIN' });
    }

    // 4. Smart Smelting: Sacrifice Scrap Bots and duplicate T1 units to level up key tanks & marksmen
    const bench = [...state.reserveBench];
    const scrapBots = bench.filter((u) => u.defId === 'unit_scrap_bot');
    const carries = bench.filter((u) => u.defId !== 'unit_scrap_bot').sort((a, b) => b.starRank - a.starRank || b.smeltXp - a.smeltXp);

    if (carries.length > 0 && scrapBots.length > 0) {
      const primaryTarget = carries[0];
      for (const scrap of scrapBots) {
        commands.push({
          type: 'SMELT_UNITS',
          targetId: primaryTarget.instanceId,
          sacrificeId: scrap.instanceId
        });
      }
    }

    // 5. Choose Evolution if ready
    if (state.pendingEvolutionUnitId) {
      // Pick tank branch for melee, sniper for ranged
      commands.push({
        type: 'CHOOSE_EVOLUTION',
        unitId: state.pendingEvolutionUnitId,
        chosenBranchDefId: 'unit_cog_bulwark'
      });
    }

    // 6. Tactical Deployment (Melee in cols 0-1, Ranged in cols 2-3)
    let tankSlot = 0;
    let rangedSlot = 0;

    for (const unit of state.reserveBench) {
      if (state.deployedUnits.length >= 12) break;

      if (unit.faction === 'cog' || unit.faction === 'scrap' || unit.attackRange === 1) {
        // Frontline slot (Col 0 or 1, Row 0-4)
        if (tankSlot < 10) {
          const col = tankSlot % 2; // cols 0 or 1
          const row = Math.floor(tankSlot / 2);
          commands.push({
            type: 'DEPLOY_UNIT',
            unitId: unit.instanceId,
            col,
            row
          });
          tankSlot++;
        }
      } else {
        // Backline slot (Col 2 or 3, Row 0-4)
        if (rangedSlot < 10) {
          const col = 2 + (rangedSlot % 2); // cols 2 or 3
          const row = Math.floor(rangedSlot / 2);
          commands.push({
            type: 'DEPLOY_UNIT',
            unitId: unit.instanceId,
            col,
            row
          });
          rangedSlot++;
        }
      }
    }

    return commands;
  }

  public decideBattleActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];
    if (!state.combatState?.valveUsed) {
      // If boss enters Phase 2, or Boiler HP drops below 6 -> slow them down
      const boss = state.combatState?.enemies.find((e) => e.isBoss);
      if ((boss && boss.bossPhase === 2) || state.boilerHp <= 5) {
        commands.push({ type: 'USE_VALVE', choice: 'slow' });
      }
    }
    return commands;
  }

  public decideShopActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];

    // Buy Gilded upgrade if affordable
    if (state.economy.cogs >= 45) {
      commands.push({ type: 'GILD_SYMBOL', reelIndex: 1, symbolIndex: 0 });
    }

    commands.push({ type: 'START_NEXT_WAVE' });
    return commands;
  }
}
