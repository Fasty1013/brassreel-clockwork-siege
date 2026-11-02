import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';

export interface BotPolicy {
  name: string;
  decidePrepActions(state: RunState, rng: RngStreams): RunCommand[];
  decideBattleActions(state: RunState, rng: RngStreams): RunCommand[];
  decideShopActions(state: RunState, rng: RngStreams): RunCommand[];
}

