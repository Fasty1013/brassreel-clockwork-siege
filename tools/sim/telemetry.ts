/** State of a run right before a battle starts. */
export interface WaveSnapshot {
  wave: number;
  boilerHp: number;
  fieldUnits: number;
  /** sum of the levels of the robots on the field */
  fieldLevels: number;
  benchUnits: number;
  cogs: number;
  skillRanks: number;
}

export type WaveAverages = Omit<WaveSnapshot, 'wave'>;

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
  /** mean length of one battle in this run */
  averageBattleSeconds: number;
  /** a battle did not finish within the tick limit */
  stalled?: boolean;
  snapshots?: WaveSnapshot[];
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
  stalledRuns: number;
  /** share of runs that started the given wave */
  reachedWavePct: Record<number, number>;
  /** averages over the runs that started the given wave */
  waveAverages: Record<number, WaveAverages>;
}

export class TelemetryAggregator {
  private runs: SimulationRunMetrics[] = [];

  public recordRun(metrics: SimulationRunMetrics): void {
    this.runs.push(metrics);
  }

  public getSummary(botName: string, maxWaves = 10): SimulationBatchSummary {
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
        avgDurationPerWaveS: 0,
        stalledRuns: 0,
        reachedWavePct: {},
        waveAverages: {}
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

    for (let w = 1; w <= maxWaves; w++) {
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
        const deathWave = Math.min(maxWaves, r.wavesCleared + 1);
        deathsByWave[deathWave] = (deathsByWave[deathWave] ?? 0) + 1;
      }
    }

    const reached: Record<number, number> = {};
    const sums: Record<number, WaveAverages> = {};
    for (const r of this.runs) {
      for (const snap of r.snapshots ?? []) {
        reached[snap.wave] = (reached[snap.wave] ?? 0) + 1;
        const acc = (sums[snap.wave] ??= { boilerHp: 0, fieldUnits: 0, fieldLevels: 0, benchUnits: 0, cogs: 0, skillRanks: 0 });
        acc.boilerHp += snap.boilerHp;
        acc.fieldUnits += snap.fieldUnits;
        acc.fieldLevels += snap.fieldLevels;
        acc.benchUnits += snap.benchUnits;
        acc.cogs += snap.cogs;
        acc.skillRanks += snap.skillRanks;
      }
    }
    const reachedWavePct: Record<number, number> = {};
    const waveAverages: Record<number, WaveAverages> = {};
    for (const [waveKey, count] of Object.entries(reached)) {
      const w = Number(waveKey);
      reachedWavePct[w] = Number(((count / totalRuns) * 100).toFixed(1));
      const acc = sums[w];
      const avg = (v: number): number => Number((v / count).toFixed(2));
      waveAverages[w] = {
        boilerHp: avg(acc.boilerHp),
        fieldUnits: avg(acc.fieldUnits),
        fieldLevels: avg(acc.fieldLevels),
        benchUnits: avg(acc.benchUnits),
        cogs: avg(acc.cogs),
        skillRanks: avg(acc.skillRanks)
      };
    }
    const stalledRuns = this.runs.filter((r) => r.stalled).length;

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
      avgDurationPerWaveS,
      stalledRuns,
      reachedWavePct,
      waveAverages
    };
  }
}

