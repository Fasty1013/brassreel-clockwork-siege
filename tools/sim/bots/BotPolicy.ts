import { RunState } from '@core/state/RunState';
import { RunCommand } from '@core/state/reducer';
import { RngStreams } from '@core/prng/prngManager';

export interface BotPolicy {
  name: string;
  /**
   * Interactive bots are asked again after every batch of commands until they
   * return an empty list (prep) or leave the phase (shop), so they can react to
   * what the reels gave. Other bots plan the whole phase up front.
   */
  interactive?: boolean;
  decidePrepActions(state: RunState, rng: RngStreams): RunCommand[];
  decideBattleActions(state: RunState, rng: RngStreams): RunCommand[];
  decideShopActions(state: RunState, rng: RngStreams): RunCommand[];
  /** Pick one of the offered engine cores. Bots without it never equip a core. */
  chooseCore?(choices: string[], state: RunState): string;
}
