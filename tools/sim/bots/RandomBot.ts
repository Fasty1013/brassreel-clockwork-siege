import { BotPolicy } from './BotPolicy';
import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';

export class RandomBot implements BotPolicy {
  public name = 'RandomBot';

  public decidePrepActions(state: RunState, rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];

    // Spin 1 to 3 times randomly
    const spins = rng.loot.nextRange(1, Math.max(1, state.freeSpinsLeft));
    for (let i = 0; i < spins; i++) {
      commands.push({ type: 'SPIN' });
    }

    // Deploy some random units from bench to random valid slots
    for (const unit of state.reserveBench) {
      if (rng.loot.next() < 0.6 && state.deployedUnits.length < 8) {
        const col = rng.loot.nextRange(0, 3);
        const row = rng.loot.nextRange(0, 4);
        commands.push({
          type: 'DEPLOY_UNIT',
          unitId: unit.instanceId,
          col,
          row
        });
      }
    }

    return commands;
  }

  public decideBattleActions(state: RunState, rng: RngStreams): RunCommand[] {
    const commands: RunCommand[] = [];
    // 10% chance to randomly panic and use emergency valve
    if (!state.combatState?.valveUsed && rng.combat.next() < 0.1) {
      commands.push({ type: 'USE_VALVE', choice: rng.combat.next() < 0.5 ? 'slow' : 'heal' });
    }
    return commands;
  }

  public decideShopActions(_state: RunState, _rng: RngStreams): RunCommand[] {
    // Random bot skips shop mostly
    return [{ type: 'START_NEXT_WAVE' }];
  }
}

