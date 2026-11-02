export type CoreEventType =
  | 'spin_start'
  | 'reel_stopped'
  | 'line_hit'
  | 'jackpot'
  | 'unit_summoned'
  | 'unit_smelted'
  | 'evolution_ready'
  | 'jam_triggered'
  | 'heat_changed'
  | 'boiler_damaged'
  | 'combat_tick'
  | 'enemy_spawned'
  | 'enemy_killed'
  | 'unit_killed'
  | 'wave_started'
  | 'wave_completed'
  | 'inspection_completed'
  | 'gadget_bought'
  | 'run_victory'
  | 'run_defeat';

export interface CoreEventPayloads {
  spin_start: { freeSpinsLeft: number; heat: number };
  reel_stopped: { reelIndex: number; symbols: [string, string, string] };
  line_hit: {
    lineIndex: number;
    symbol: string;
    indices: [number, number, number];
    isJackpot: boolean;
    isWild: boolean;
  };
  jackpot: { choices: string[] };
  unit_summoned: { unitInstanceId: string; unitDefId: string; isGilded: boolean };
  unit_smelted: { targetId: string; sacrificeId: string; xpAdded: number; newTotalXp: number };
  evolution_ready: { unitInstanceId: string; branchA: string; branchB: string };
  jam_triggered: { heat: number; damagedUnitId?: string; lockedReelIndex: number };
  heat_changed: { currentHeat: number; delta: number };
  boiler_damaged: { currentHp: number; damage: number; maxHp: number };
  combat_tick: { tick: number; activeUnits: number; activeEnemies: number };
  enemy_spawned: { enemyId: string; instanceId: string; lane: number };
  enemy_killed: { enemyId: string; instanceId: string; bountyCogs: number };
  unit_killed: { unitId: string; instanceId: string };
  wave_started: { waveNumber: number; actNumber: number };
  wave_completed: { waveNumber: number; rewardCogs: number };
  inspection_completed: { success: boolean; bonusCogs: number; penaltyDmg: number };
  gadget_bought: { gadgetId: string };
  run_victory: { totalWavesCleared: number; finalCogs: number };
  run_defeat: { waveFailed: number };
}

export type EventCallback<T extends CoreEventType> = (payload: CoreEventPayloads[T]) => void;

export class EventBus {
  private listeners: Map<CoreEventType, Set<EventCallback<any>>> = new Map();

  public on<T extends CoreEventType>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off<T extends CoreEventType>(event: T, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public emit<T extends CoreEventType>(event: T, payload: CoreEventPayloads[T]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        cb(payload);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

