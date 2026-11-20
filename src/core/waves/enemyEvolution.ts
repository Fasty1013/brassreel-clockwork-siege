import { BALANCE } from '@data/balance';
import { MUTATIONS_DATA, MUTATION_IDS, BOSS_MUTATIONS, MutationId } from '@data/mutations';
import type { UnitInstance } from '../units/unitFactory';
import type { CombatEnemy, CombatUnit } from '../combat/combatEngine';
import { PRNG } from '../prng/sfc32';

/** A mutation an enemy carries, with its strength tier (1–3). */
export interface ActiveMutation {
  id: MutationId;
  tier: 1 | 2 | 3;
}

/** What the last battle's formation looked like (the enemies learn from it). */
export interface FormationReport {
  /** lanes with no robot: flankers slip through them */
  emptyRows: number;
  /** pairs of robots on touching cells: bombers hit both */
  clumpedPairs: number;
  /** shooters with no robot in front of them in their lane: leapers and snipers reach them */
  exposedShooters: number;
  /** lanes held by a single robot: a leaper jumps it and is through */
  singleRows: number;
}

/** The enemies' evolution for one wave, decided before it so the player can scout it. */
export interface EvolutionPlan {
  wave: number;
  /** mutations this wave's enemies may carry */
  mutations: ActiveMutation[];
  /** chance an ordinary enemy carries one of them… */
  chance: number;
  /** …and a second one */
  doubleChance: number;
  /** mutations picked because of the last formation (for the scouting line) */
  adaptedTo: MutationId[];
}

const MELEE_RANGE_MAX = 1.5;

export class EnemyEvolution {
  /** Reads the placed robots the way the enemies would. */
  public static analyzeFormation(units: UnitInstance[]): FormationReport {
    const placed = units.filter((u) => u.deployedSlot);
    const rows = new Map<number, UnitInstance[]>();
    for (const u of placed) {
      const r = u.deployedSlot!.row;
      rows.set(r, [...(rows.get(r) ?? []), u]);
    }
    let clumpedPairs = 0;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i].deployedSlot!;
        const b = placed[j].deployedSlot!;
        if (Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1) clumpedPairs++;
      }
    }
    let exposedShooters = 0;
    for (const u of placed) {
      if (u.attackRange <= MELEE_RANGE_MAX) continue;
      const lane = rows.get(u.deployedSlot!.row) ?? [];
      if (!lane.some((o) => o !== u && o.deployedSlot!.col > u.deployedSlot!.col)) exposedShooters++;
    }
    let emptyRows = 0;
    let singleRows = 0;
    for (let r = 0; r < BALANCE.GRID_ROWS; r++) {
      const n = rows.get(r)?.length ?? 0;
      if (n === 0) emptyRows++;
      else if (n === 1) singleRows++;
    }
    return { emptyRows, clumpedPairs, exposedShooters, singleRows };
  }

  /**
   * Plans the mutations of a wave. They appear from wave 3 and grow every wave: more kinds at once
   * (2 in act 1, 3 in act 2, 4 in act 3), stronger tiers (tier = act), and a higher share of
   * mutated enemies. Half of the picks lean toward what punishes the last formation.
   */
  public static planWave(wave: number, last: FormationReport | undefined, rng: PRNG): EvolutionPlan {
    const act = Math.min(3, Math.ceil(wave / 10)) as 1 | 2 | 3;
    const empty: EvolutionPlan = { wave, mutations: [], chance: 0, doubleChance: 0, adaptedTo: [] };
    if (wave < BALANCE.MUTATION_FIRST_WAVE) return empty;

    const kinds = Math.min(MUTATION_IDS.length, act + 1);
    const weights = this.weights(last);
    const base = this.weights(undefined);
    const picked: MutationId[] = [];
    const adaptedTo: MutationId[] = [];
    while (picked.length < kinds) {
      const pool = MUTATION_IDS.filter((id) => !picked.includes(id));
      const total = pool.reduce((s, id) => s + weights[id], 0);
      let roll = rng.next() * total;
      let choice = pool[pool.length - 1];
      for (const id of pool) {
        roll -= weights[id];
        if (roll < 0) {
          choice = id;
          break;
        }
      }
      picked.push(choice);
      if (weights[choice] > base[choice]) adaptedTo.push(choice);
    }

    const chance = Math.min(BALANCE.MUTATION_CHANCE_MAX, (wave - BALANCE.MUTATION_FIRST_WAVE + 1) * BALANCE.MUTATION_CHANCE_PER_WAVE);
    const doubleChance = wave <= 10 ? 0 : Math.min(BALANCE.MUTATION_CHANCE_MAX, (wave - 10) * BALANCE.MUTATION_DOUBLE_PER_WAVE);
    return { wave, mutations: picked.map((id) => ({ id, tier: act })), chance, doubleChance, adaptedTo };
  }

  /** Pick weights: every mutation 2, plus what the last formation invites. */
  private static weights(f: FormationReport | undefined): Record<MutationId, number> {
    const w: Record<MutationId, number> = { armored: 2, shielded: 2, leaper: 2, bomber: 2, flanker: 2, sniper: 2 };
    if (!f) return w;
    w.flanker += 3 * f.emptyRows;
    w.bomber += 1.5 * f.clumpedPairs;
    w.leaper += 2 * f.exposedShooters + f.singleRows;
    w.sniper += 2 * f.exposedShooters;
    return w;
  }

  /** The mutations one spawning enemy gets from the plan. */
  public static rollFor(plan: EvolutionPlan | undefined, isBoss: boolean, rng: PRNG): ActiveMutation[] {
    if (!plan || plan.mutations.length === 0) return [];
    const act = plan.mutations[0].tier;
    if (isBoss) {
      // bosses evolve from act 2: one boss-safe mutation, two in act 3
      const safe = BOSS_MUTATIONS.slice(0, act - 1);
      return safe.map((id) => ({ id, tier: act }));
    }
    const out: ActiveMutation[] = [];
    if (rng.next() < plan.chance) {
      const pool = [...plan.mutations];
      out.push(pool.splice(rng.nextRange(0, pool.length - 1), 1)[0]);
      if (pool.length > 0 && rng.next() < plan.doubleChance) out.push(pool[rng.nextRange(0, pool.length - 1)]);
    }
    return out;
  }

  /** Per-tier number of a mutation. */
  public static param(m: ActiveMutation, key: string): number {
    return MUTATIONS_DATA[m.id].params[key][m.tier - 1];
  }

  /**
   * Applies mutations to a freshly spawned enemy. A flanker spawning in a lane held by a robot
   * moves to the nearest lane without robots (if there is one).
   */
  public static apply(enemy: CombatEnemy, mutations: ActiveMutation[], units: CombatUnit[]): void {
    if (mutations.length === 0) return;
    enemy.mutations = mutations;
    for (const m of mutations) {
      switch (m.id) {
        case 'armored':
          enemy.damageTakenMult = (enemy.damageTakenMult ?? 1) * (1 - this.param(m, 'damageReductionPct'));
          break;
        case 'shielded':
          enemy.shield += Math.round(enemy.maxHp * this.param(m, 'shieldPctOfHp'));
          break;
        case 'leaper':
          enemy.leapsLeft = (enemy.leapsLeft ?? 0) + this.param(m, 'leaps');
          break;
        case 'bomber':
          enemy.deathBlast = { mult: this.param(m, 'blastDamageMult'), radius: this.param(m, 'radiusTiles') };
          break;
        case 'flanker': {
          enemy.moveSpeed *= 1 + this.param(m, 'speedPct');
          const held = (row: number): boolean => units.some((u) => !u.isDead && Math.abs(u.y - (row + 0.5)) < 0.6);
          if (held(enemy.row)) {
            for (const d of [1, -1, 2, -2, 3, -3, 4, -4]) {
              const r = enemy.row + d;
              if (r < 0 || r >= BALANCE.GRID_ROWS || held(r)) continue;
              enemy.row = r;
              enemy.y = r + 0.5;
              break;
            }
          }
          break;
        }
        case 'sniper':
          enemy.attackRange += this.param(m, 'bonusRange');
          enemy.damage = Math.round(enemy.damage * (1 + this.param(m, 'damagePct')));
          enemy.targetsWeakest = true;
          break;
      }
    }
  }
}
