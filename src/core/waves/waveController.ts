import { WAVES_DATA } from '@data/waves';
import { WaveDefinition } from '@data/schemas/waveSchema';
import { CombatEngine, CombatSimulationState } from '../combat/combatEngine';
import { PRNG } from '../prng/sfc32';

export interface PendingSpawn {
  enemyId: string;
  spawnTime: number;
  row: number;
}

export class WaveController {
  private waveIndex: number;
  private pendingSpawns: PendingSpawn[] = [];
  private spawnSequence = 1;
  private valveWasUsed = false;
  private minEnemyXReached = 8.0;

  constructor(waveNumber = 1) {
    this.waveIndex = waveNumber - 1;
  }

  public getCurrentWaveDef(): WaveDefinition {
    return WAVES_DATA[this.waveIndex] ?? WAVES_DATA[0];
  }

  public initWaveSpawns(rng: PRNG): void {
    const waveDef = this.getCurrentWaveDef();
    this.pendingSpawns = [];
    this.spawnSequence = 1;
    this.valveWasUsed = false;
    this.minEnemyXReached = 8.0;

    let currentTime = 0.5; // Initial lead-in
    for (const group of waveDef.spawns) {
      for (let i = 0; i < group.count; i++) {
        const lane = group.rowLane !== undefined ? group.rowLane : rng.nextRange(0, 4);
        this.pendingSpawns.push({
          enemyId: group.enemyId,
          spawnTime: currentTime,
          row: lane
        });
        currentTime += group.spawnDelaySeconds;
      }
    }
  }

  /**
   * Ticks wave spawner and updates combat simulation.
   */
  public update(combatState: CombatSimulationState, dt: number, rng: PRNG): void {
    if (combatState.valveUsed) {
      this.valveWasUsed = true;
    }

    // Spawn enemies whose time has come
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const spawn = this.pendingSpawns[i];
      if (combatState.elapsedSeconds >= spawn.spawnTime) {
        CombatEngine.spawnEnemy(combatState, spawn.enemyId, spawn.row, this.spawnSequence++);
        this.pendingSpawns.splice(i, 1);
      }
    }

    if (this.pendingSpawns.length === 0) {
      combatState.allEnemiesSpawned = true;
    }

    // Advance combat simulation step
    CombatEngine.step(combatState, dt, rng);

    // Track minimum enemy X reached for inspection conditions
    for (const e of combatState.enemies) {
      if (e.x < this.minEnemyXReached) {
        this.minEnemyXReached = e.x;
      }
    }
  }

  /**
   * Resolves Inspection wave challenge (Wave 5).
   */
  public evaluateInspectionChallenge(
    combatState: CombatSimulationState,
    initialDeployedCount: number
  ): {
    success: boolean;
    bonusCogs: number;
    penaltyDmg: number;
  } {
    const waveDef = this.getCurrentWaveDef();
    if (!waveDef.isInspection || !waveDef.inspectionChallenge) {
      return { success: true, bonusCogs: 0, penaltyDmg: 0 };
    }

    const challenge = waveDef.inspectionChallenge;
    let success = false;

    switch (challenge.type) {
      case 'speed_trial':
        success = combatState.elapsedSeconds <= challenge.targetParam;
        break;
      case 'iron_perimeter':
        success = this.minEnemyXReached >= 3.0;
        break;
      case 'full_assembly':
        success = initialDeployedCount >= challenge.targetParam;
        break;
      case 'manual_labor':
        success = !this.valveWasUsed;
        break;
      default:
        success = true;
    }

    return {
      success,
      bonusCogs: success ? challenge.bonusCogs : 0,
      penaltyDmg: success ? 0 : (challenge.penaltyBoilerDmg ?? 1)
    };
  }
}
