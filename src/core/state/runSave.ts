import type { RunState } from './RunState';
import { PrngManager, type RngStreams } from '../prng/prngManager';
import { UnitFactory } from '../units/unitFactory';

/**
 * The run in progress, kept on the device between app launches.
 *
 * Phones close apps in the background whenever they need memory, and the back gesture
 * used to close the game outright: the run was lost. The run is saved while it waits
 * between waves (PREP); a battle in progress is not saved, so after a restart the
 * player is back at the preparation before that battle.
 */

const KEY = 'brassreel_run';
const VERSION = 1;

export interface SavedRun {
  v: number;
  state: RunState;
  rng: Record<string, [number, number, number, number]>;
  /** Regulator parts recovered in this run (shown at the end of it) */
  parts: string[];
  savedAt: number;
}

/** Storage used by the save; the browser's localStorage by default (tests pass their own). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): KeyValueStore | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export class RunSave {
  /** Snapshot of a run between waves (anything else is ignored). Returns whether it was saved. */
  public static save(state: RunState, rng: RngStreams, parts: string[], store = defaultStore()): boolean {
    if (!store || state.phase !== 'PREP') return false;
    const snapshot: SavedRun = {
      v: VERSION,
      // the battle and the last spin's animation data are not part of a preparation
      state: { ...state, combatState: undefined, lastSpinResult: undefined },
      rng: PrngManager.serializeStreams(rng),
      parts: [...parts],
      savedAt: Date.now()
    };
    try {
      store.setItem(KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false; // full or blocked storage: the run just is not kept
    }
  }

  /** The saved run, or null if there is none or it cannot be read. */
  public static load(store = defaultStore()): SavedRun | null {
    if (!store) return null;
    try {
      const raw = store.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SavedRun;
      const ok =
        data && data.v === VERSION && data.state && data.state.phase === 'PREP' &&
        typeof data.state.waveNumber === 'number' && data.rng && Array.isArray(data.rng.reel);
      return ok ? data : null;
    } catch {
      return null;
    }
  }

  /** State and random streams to continue a saved run with. */
  public static restore(saved: SavedRun): { state: RunState; rng: RngStreams; parts: string[] } {
    // a fresh app starts numbering robots at 1: continue after the saved ones
    UnitFactory.continueAfter([...saved.state.reserveBench, ...saved.state.deployedUnits].map((u) => u.instanceId));
    return {
      state: saved.state,
      rng: PrngManager.deserializeStreams(saved.rng),
      parts: [...(saved.parts ?? [])]
    };
  }

  public static clear(store = defaultStore()): void {
    try {
      store?.removeItem(KEY);
    } catch {
      // nothing to clear
    }
  }
}
