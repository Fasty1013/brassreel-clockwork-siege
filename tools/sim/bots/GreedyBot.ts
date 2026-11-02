import { BotPolicy } from './BotPolicy';
import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';

export class GreedyBot implements BotPolicy {
  public name = 'GreedyBot';

  public decidePrepActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];

    // Always use all free spins
    const freeSpins = state.freeSpinsLeft;
    for (let i = 0; i < freeSpins; i++) {
      commands.push({ type: 'SPIN' });
    }

    // Push 1 extra spin if steam is available
    if (state.economy.steam >= 2 && state.heat.currentHeat < 40) {
      commands.push({ type: 'SPIN' });
    }

    // Smelt same faction units greedily
    const bench = [...state.reserveBench];
    for (let i = 0; i < bench.length; i++) {
      for (let j = i + 1; j < bench.length; j++) {
        if (bench[i].faction === bench[j].faction && bench[i].starRank === 1) {
          commands.push({
            type: 'SMELT_UNITS',
            targetId: bench[i].instanceId,
            sacrificeId: bench[j].instanceId
          });
          break;
        }
      }
    }

    // Choose evolution if ready
    if (state.pendingEvolutionUnitId) {
      commands.push({
        type: 'CHOOSE_EVOLUTION',
        unitId: state.pendingEvolutionUnitId,
        chosenBranchDefId: 'unit_cog_bulwark'
      });
    }

    // Deploy all available units greedily from front to back
    let slotIndex = state.deployedUnits.length;
    for (const unit of state.reserveBench) {
      if (slotIndex >= 12) break;
      const col = slotIndex % 4;
      const row = Math.floor(slotIndex / 4);
      commands.push({
        type: 'DEPLOY_UNIT',
        unitId: unit.instanceId,
        col,
        row
      });
      slotIndex++;
    }

    return commands;
  }

  public decideBattleActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];
    // Use emergency valve if Boiler HP <= 5
    if (state.boilerHp <= 5 && !state.combatState?.valveUsed) {
      commands.push({ type: 'USE_VALVE', choice: 'heal' });
    }
    return commands;
  }

  public decideShopActions(state: RunState, _rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];
    // Buy cheapest symbol if affordable
    if (state.economy.cogs >= 15) {
      commands.push({ type: 'BUY_SYMBOL', reelIndex: 0, symbol: 'cog' });
    }
    commands.push({ type: 'START_NEXT_WAVE' });
    return commands;
  }
}
