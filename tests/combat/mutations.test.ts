import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { EnemyEvolution, FormationReport } from '@core/waves/enemyEvolution';
import { UnitFactory, UnitInstance } from '@core/units/unitFactory';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { PRNG } from '@core/prng/sfc32';
import { BALANCE } from '@data/balance';

function robot(defId: string, col: number, row: number, rng: PRNG): UnitInstance {
  const u = UnitFactory.createUnit(defId, rng);
  u.mods = [];
  u.deployedSlot = { col, row };
  return u;
}

function field(units: Array<[string, number, number]>, seed = 'mutations'): { state: CombatSimulationState; rng: PRNG } {
  const rng = PRNG.fromSeed(seed);
  return { state: CombatEngine.initCombatState(units.map(([d, c, r]) => robot(d, c, r, rng)), 10), rng };
}

const run = (state: CombatSimulationState, rng: PRNG, seconds: number): void => {
  for (let i = 0; i < seconds * 20 && !state.isVictory && !state.isDefeat; i++) CombatEngine.step(state, 0.05, rng);
};

describe('formation report', () => {
  it('counts empty lanes, single lanes, touching robots and exposed shooters', () => {
    const rng = PRNG.fromSeed('report');
    const report = EnemyEvolution.analyzeFormation([
      robot('unit_cog_knight', 3, 2, rng),
      robot('unit_spring_archer', 1, 2, rng), // covered by the knight
      robot('unit_spring_archer', 3, 3, rng), // alone in its lane, touches the knight
      robot('unit_cog_knight', 3, 0, rng)
    ]);
    expect(report).toEqual({ emptyRows: 2, clumpedPairs: 1, exposedShooters: 1, singleRows: 2 });
  });
});

describe('wave evolution plan', () => {
  it('no mutations in the first waves', () => {
    expect(EnemyEvolution.planWave(1, undefined, PRNG.fromSeed('p')).mutations).toHaveLength(0);
    expect(EnemyEvolution.planWave(BALANCE.MUTATION_FIRST_WAVE - 1, undefined, PRNG.fromSeed('p')).mutations).toHaveLength(0);
  });

  it('enemies grow every act: more kinds, higher tier, more mutants', () => {
    const p1 = EnemyEvolution.planWave(5, undefined, PRNG.fromSeed('p'));
    const p2 = EnemyEvolution.planWave(15, undefined, PRNG.fromSeed('p'));
    const p3 = EnemyEvolution.planWave(25, undefined, PRNG.fromSeed('p'));
    expect(p1.mutations.map((m) => m.tier)).toEqual([1, 1]);
    expect(p2.mutations).toHaveLength(3);
    expect(p3.mutations).toHaveLength(4);
    expect(p3.mutations.every((m) => m.tier === 3)).toBe(true);
    expect(p1.chance).toBeLessThan(p2.chance);
    expect(p2.chance).toBeLessThanOrEqual(p3.chance);
    expect(p1.doubleChance).toBe(0);
    expect(p3.doubleChance).toBeGreaterThan(p2.doubleChance);
  });

  it('leans toward mutations that punish the last formation', () => {
    const gaps: FormationReport = { emptyRows: 4, clumpedPairs: 0, exposedShooters: 0, singleRows: 1 };
    const count = (f: FormationReport | undefined): number => {
      let n = 0;
      for (let i = 0; i < 300; i++) {
        if (EnemyEvolution.planWave(5, f, PRNG.fromSeed(`adapt${i}`)).mutations.some((m) => m.id === 'flanker')) n++;
      }
      return n;
    };
    expect(count(gaps)).toBeGreaterThan(count(undefined) * 1.5);
    const plan = EnemyEvolution.planWave(5, gaps, PRNG.fromSeed('adapt-flag'));
    for (const id of plan.adaptedTo) expect(plan.mutations.some((m) => m.id === id)).toBe(true);
  });

  it('the reducer plans the next wave and remembers the formation', () => {
    const state = RunStateManager.createInitialState('plan');
    const rng = PrngManager.createStreams('plan');
    const u = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    u.deployedSlot = { col: 3, row: 2 };
    state.deployedUnits.push(u);
    state.waveNumber = BALANCE.MUTATION_FIRST_WAVE - 1;
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    expect(state.lastFormation?.emptyRows).toBe(4);
    state.phase = 'SHOP';
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
    expect(state.evolution?.wave).toBe(BALANCE.MUTATION_FIRST_WAVE);
    expect(state.evolution?.mutations.length).toBeGreaterThan(0);
  });
});

describe('mutations in battle', () => {
  it('armored enemies take less damage', () => {
    const hit = (armored: boolean): number => {
      const { state, rng } = field([['unit_spring_archer', 1, 2]], 'armor');
      const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
      e.x = 4;
      e.moveSpeed = 0;
      e.armor = 0;
      if (armored) EnemyEvolution.apply(e, [{ id: 'armored', tier: 3 }], state.units);
      run(state, rng, 3);
      return e.maxHp - e.hp;
    };
    expect(hit(true)).toBeLessThan(hit(false) * 0.7);
  });

  it('shielded enemies start with a shield', () => {
    const { state } = field([]);
    const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    EnemyEvolution.apply(e, [{ id: 'shielded', tier: 2 }], state.units);
    expect(e.shield).toBe(Math.round(e.maxHp * 0.4));
  });

  it('a leaper jumps the lone blocker and walks on; a second robot behind stops it', () => {
    const breaches = (twoDeep: boolean): number => {
      const units: Array<[string, number, number]> = [['unit_cog_bulwark', 4, 2]];
      if (twoDeep) units.push(['unit_cog_bulwark', 2, 2]);
      const { state, rng } = field(units, 'leap');
      for (const u of state.units) u.hp = u.maxHp = 1_000_000;
      const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
      e.hp = e.maxHp = 1_000_000;
      EnemyEvolution.apply(e, [{ id: 'leaper', tier: 1 }], state.units);
      run(state, rng, 30);
      return 10 - state.boilerHp;
    };
    expect(breaches(false)).toBe(1);
    expect(breaches(true)).toBe(0);
  });

  it('a bomber hurts robots around it when it dies, not robots far away', () => {
    const { state, rng } = field([['unit_cog_knight', 3, 2], ['unit_cog_knight', 3, 1], ['unit_cog_knight', 3, 4]], 'bomb');
    const [front, near, far] = state.units;
    for (const u of state.units) u.armor = 0;
    const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    e.hp = e.maxHp = 1;
    e.x = front.x + 0.5; // the robot one lane up is ~1.1 tiles away, inside the blast
    e.moveSpeed = 0;
    EnemyEvolution.apply(e, [{ id: 'bomber', tier: 3 }], state.units);
    run(state, rng, 2);
    expect(e.isDead || !state.enemies.includes(e)).toBe(true);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });

  it('a flanker leaves a held lane for the nearest empty one', () => {
    const { state } = field([['unit_cog_knight', 3, 2], ['unit_cog_knight', 3, 3]]);
    const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 2, 1);
    EnemyEvolution.apply(e, [{ id: 'flanker', tier: 1 }], state.units);
    expect(e.row).toBe(1);
    expect(e.y).toBe(1.5);
  });

  it('a sniper shoots the weakest robot in its lane, past the front one', () => {
    const { state, rng } = field([['unit_cog_bulwark', 4, 2], ['unit_spring_archer', 1, 2]], 'snipe');
    const [front, back] = state.units;
    front.hp = front.maxHp = 1_000_000;
    back.hp = back.maxHp = 500;
    for (const u of state.units) u.damage = 0;
    const e = CombatEngine.spawnEnemy(state, 'en_scrap_sniper', 2, 1);
    e.moveSpeed = 0;
    e.x = 6.5;
    EnemyEvolution.apply(e, [{ id: 'sniper', tier: 1 }], state.units);
    run(state, rng, 4);
    expect(back.hp).toBeLessThan(back.maxHp);
    expect(front.hp).toBe(front.maxHp);
  });

  it('bosses carry only boss-safe mutations, from act 2', () => {
    const p2 = EnemyEvolution.planWave(20, undefined, PRNG.fromSeed('boss'));
    const p1 = EnemyEvolution.planWave(10, undefined, PRNG.fromSeed('boss'));
    expect(EnemyEvolution.rollFor(p1, true, PRNG.fromSeed('b'))).toHaveLength(0);
    expect(EnemyEvolution.rollFor(p2, true, PRNG.fromSeed('b')).map((m) => m.id)).toEqual(['armored']);
  });
});
