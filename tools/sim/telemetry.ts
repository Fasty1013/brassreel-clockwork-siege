export interface SimulationRunMetrics {
  runId: number;
  seed: string;
  botName: string;
  clearedWave10: boolean;
  wavesCleared: number;
  finalCogs: number;
  totalSpins: number;
  totalLineHits: number;
  totalJackpots: number;
  totalJams: number;
  averageBattleSeconds: number;
}

export interface SimulationBatchSummary {
  botName: string;
  totalRuns: number;
  victories: number;
  defeats: number;
  winRatePct: number;
  averageWaveReached: number;
  deathsByWave: Record<number, number>;
  totalSpins: number;
  totalLineHits: number;
  hitRatePct: number;
  jackpotCount: number;
  totalJams: number;
  avgDurationPerWaveS: number;
}

export class TelemetryAggregator {
  private runs: SimulationRunMetrics[] = [];

  public recordRun(metrics: SimulationRunMetrics): void {
    this.runs.push(metrics);
  }

  public getSummary(botName: string): SimulationBatchSummary {
    const totalRuns = this.runs.length;
    if (totalRuns === 0) {
      return {
        botName,
        totalRuns: 0,
        victories: 0,
        defeats: 0,
        winRatePct: 0,
        averageWaveReached: 0,
        deathsByWave: {},
        totalSpins: 0,
        totalLineHits: 0,
        hitRatePct: 0,
        jackpotCount: 0,
        totalJams: 0,
        avgDurationPerWaveS: 0
      };
    }

    const victories = this.runs.filter((r) => r.clearedWave10).length;
    const defeats = totalRuns - victories;
    const winRatePct = Number(((victories / totalRuns) * 100).toFixed(2));

    let sumWaves = 0;
    let sumSpins = 0;
    let sumLineHits = 0;
    let sumJackpots = 0;
    let sumJams = 0;
    let sumBattleSeconds = 0;
    const deathsByWave: Record<number, number> = {};

    for (let w = 1; w <= 10; w++) {
      deathsByWave[w] = 0;
    }

    for (const r of this.runs) {
      sumWaves += r.wavesCleared;
      sumSpins += r.totalSpins;
      sumLineHits += r.totalLineHits;
      sumJackpots += r.totalJackpots;
      sumJams += r.totalJams;
      sumBattleSeconds += r.averageBattleSeconds;

      if (!r.clearedWave10) {
        const deathWave = Math.min(10, r.wavesCleared + 1);
        deathsByWave[deathWave] = (deathsByWave[deathWave] ?? 0) + 1;
      }
    }

    const averageWaveReached = Number((sumWaves / totalRuns).toFixed(2));
    const hitRatePct = sumSpins > 0 ? Number(((sumLineHits / sumSpins) * 100).toFixed(2)) : 0;
    const avgDurationPerWaveS = Number((sumBattleSeconds / totalRuns).toFixed(1));

    return {
      botName,
      totalRuns,
      victories,
      defeats,
      winRatePct,
      averageWaveReached,
      deathsByWave,
      totalSpins: sumSpins,
      totalLineHits: sumLineHits,
      hitRatePct,
      jackpotCount: sumJackpots,
      totalJams: sumJams,
      avgDurationPerWaveS
    };
  }
}

