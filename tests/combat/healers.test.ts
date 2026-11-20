import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatSimulationState, CombatUnit } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { ReelManager, Grid3x3, ReelSymbol } from '@core/reels/reels';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager } from '@core/prng/prngManager';
import { PRNG } from '@core/prng/sfc32';
import { UNITS_DATA } from '@data/units';
import { BALANCE } from '@data/balance';

function field(units: Array<[string, number, number]>, seed = 'heal'): { state: CombatSimulationState; rng: PRNG } {
  const rng = PRNG.fromSeed(seed);
  const list = units.map(([defId, col, row]) => {
    const u = UnitFactory.createUnit(defId, rng);
    u.mods = [];
    u.deployedSlot = { col, row };
    return u;
  });
  return { state: CombatEngine.initCombatState(list, 10), rng };
}

const run = (state: CombatSimulationState, rng: PRNG, seconds: number): void => {
  for (let i = 0; i < seconds * 20; i++) CombatEngine.step(state, 0.05, rng);
};

const hurt = (u: CombatUnit, share: number): void => {
  u.hp = Math.round(u.maxHp * share);
};

describe('every robot has a quirk of its own', () => {
  it('no two robots share a quirk', () => {
    const quirks = Object.values(UNITS_DATA).map((u) => u.quirkId);
    expect(new Set(quirks).size).toBe(quirks.length);
  });

  it('the two level-3 branches of every line differ from each other and from the base robot', () => {
    for (const base of Object.values(UNITS_DATA).filter((u) => u.tier === 1)) {
      const a = UNITS_DATA[base.evolutionBranchA!];
      const b = UNITS_DATA[base.evolutionBranchB!];
      expect(new Set([base.quirkId, a.quirkId, b.quirkId]).size).toBe(3);
    }
  });
});

describe('healer line', () => {
  it('three wrenches in a line summon a Mender Bot', () => {
    const s = (sym: ReelSymbol['symbol']): ReelSymbol => ({ symbol: sym, isGilded: false });
    const grid: Grid3x3 = [
      [s('wrench'), s('cog'), s('fuse')],
      [s('wrench'), s('coil'), s('crown')],
      [s('wrench'), s('fuse'), s('coil')]
    ];
    const res = ReelManager.evaluateGrid(grid);
    expect(res.totalSummonsToTrigger.map((x) => x.faction)).toContain('wrench');

    const state = RunStateManager.createInitialState('wrench');
    const rng = PrngManager.createStreams('wrench');
    state.reelStrips = grid.map((col) => [...col, ...col]) as typeof state.reelStrips;
    state.reelIndices = [0, 0, 0];
    state.heldReels = [true, true, true];
    RunReducer.dispatch(state, { type: 'SPIN' }, rng);
    expect(state.reserveBench.map((u) => u.defId)).toContain('unit_wrench_mender');
  });

  it('the Mender heals the most damaged ally in reach instead of attacking', () => {
    const { state, rng } = field([['unit_wrench_mender', 1, 2], ['unit_cog_knight', 2, 2], ['unit_cog_knight', 2, 3]]);
    const [, a, b] = state.units;
    hurt(a, 0.5);
    hurt(b, 0.2);
    const before = b.hp;
    run(state, rng, 1.2);
    expect(b.hp).toBeGreaterThan(before);
  });

  it('a healer does not reach allies two lanes away', () => {
    const { state, rng } = field([['unit_wrench_mender', 1, 0], ['unit_cog_knight', 1, 2]]);
    const far = state.units[1];
    hurt(far, 0.3);
    const before = far.hp;
    run(state, rng, 2);
    expect(far.hp).toBe(before);
  });

  it('a healer never attacks, even with nobody to heal', () => {
    const { state, rng } = field([['unit_wrench_mender', 1, 2]]);
    const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
    e.x = 3;
    e.moveSpeed = 0;
    e.damage = 0;
    run(state, rng, 3);
    expect(e.hp).toBe(e.maxHp);
    expect(state.units[0].x).toBe(1.5); // and does not walk to the enemy
  });

  it('healing grows with the healer level', () => {
    const healed = (level: 1 | 3 | 5): number => {
      const rng = PRNG.fromSeed('level');
      const mender = UnitFactory.createUnit('unit_wrench_mender', rng, { customStarRank: level });
      mender.mods = [];
      mender.deployedSlot = { col: 1, row: 2 };
      const knight = UnitFactory.createUnit('unit_cog_knight', rng);
      knight.mods = [];
      knight.deployedSlot = { col: 2, row: 2 };
      const state = CombatEngine.initCombatState([mender, knight], 10);
      const k = state.units[1];
      k.maxHp = 100_000;
      k.hp = 1;
      run(state, rng, 1.2);
      return k.hp - 1;
    };
    expect(healed(3)).toBeGreaterThan(healed(1) * 1.5);
    expect(healed(5)).toBeGreaterThan(healed(3) * 1.3);
  });

  it('the Medic also mends a second wounded robot', () => {
    const { state, rng } = field([['unit_wrench_medic', 1, 2], ['unit_cog_knight', 2, 2], ['unit_cog_knight', 2, 1]]);
    const [, a, b] = state.units;
    hurt(a, 0.3);
    hurt(b, 0.5);
    const [ha, hb] = [a.hp, b.hp];
    run(state, rng, 1.2);
    expect(a.hp).toBeGreaterThan(ha);
    expect(b.hp).toBeGreaterThan(hb);
  });

  it('the Welder turns healing past full health into a shield', () => {
    const { state, rng } = field([['unit_wrench_welder', 1, 2], ['unit_cog_knight', 2, 2]]);
    const knight = state.units[1];
    knight.hp = knight.maxHp - 1;
    run(state, rng, 1.2);
    expect(knight.hp).toBe(knight.maxHp);
    expect(knight.shield).toBeGreaterThan(0);
    expect(knight.shield).toBeLessThanOrEqual(Math.round(knight.maxHp * 0.3));
  });

  it('the Field Medic heals robots around its patient too', () => {
    const { state, rng } = field([['unit_wrench_field_medic', 1, 2], ['unit_cog_knight', 2, 2], ['unit_cog_knight', 3, 2]]);
    const [, a, b] = state.units;
    hurt(a, 0.2);
    hurt(b, 0.6);
    const hb = b.hp;
    run(state, rng, 1.1);
    expect(b.hp).toBeGreaterThan(hb);
  });

  it('the Phoenix brings the first fallen robot back once', () => {
    const { state, rng } = field([['unit_wrench_phoenix', 0, 2], ['unit_cog_knight', 2, 2], ['unit_cog_knight', 2, 3]]);
    const [, a, b] = state.units;
    a.hp = 0;
    a.isDead = true;
    run(state, rng, 0.05);
    expect(a.isDead).toBe(false);
    expect(a.hp).toBe(Math.round(a.maxHp * 0.5));
    b.hp = 0;
    b.isDead = true;
    run(state, rng, 0.05);
    expect(state.units).not.toContain(b);
  });

  it('the Plating Mech spares robots next to it some damage', () => {
    const taken = (withGuard: boolean): number => {
      const units: Array<[string, number, number]> = [['unit_cog_bulwark', 3, 2]];
      if (withGuard) units.push(['unit_wrench_plating', 2, 2]);
      const { state, rng } = field(units, 'guard');
      const tank = state.units[0];
      tank.armor = 0;
      tank.hp = tank.maxHp = 1_000_000;
      const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 2, 1);
      e.hp = e.maxHp = 1_000_000;
      e.x = 4.2;
      e.moveSpeed = 0;
      for (const u of state.units) u.damage = 0;
      run(state, rng, 3);
      return tank.maxHp - tank.hp;
    };
    expect(taken(true)).toBeLessThan(taken(false) * 0.85);
  });

  it('the Regen Mech makes robots around it regain health', () => {
    const { state, rng } = field([['unit_wrench_regenerator', 1, 2], ['unit_cog_knight', 2, 2], ['unit_cog_knight', 2, 4]]);
    const [regen, near, far] = state.units;
    regen.damage = 0; // healing power 0: only the aura acts
    hurt(near, 0.5);
    hurt(far, 0.5);
    const [hn, hf] = [near.hp, far.hp];
    run(state, rng, 2);
    expect(near.hp).toBeGreaterThan(hn);
    expect(far.hp).toBe(hf);
  });
});

describe('no endless stand-offs with healers', () => {
  it('a healer does not heal itself', () => {
    const { state, rng } = field([['unit_wrench_mender', 1, 2]]);
    const mender = state.units[0];
    mender.hp = Math.round(mender.maxHp / 2);
    const before = mender.hp;
    run(state, rng, 2);
    expect(mender.hp).toBe(before);
  });

  it('enemies grow frenzied in a long battle', () => {
    const { state } = field([]);
    state.elapsedSeconds = BALANCE.ENRAGE_AFTER_S - 1;
    expect(CombatEngine.enrage(state)).toBe(1);
    state.elapsedSeconds = BALANCE.ENRAGE_AFTER_S + 1;
    expect(CombatEngine.enrage(state)).toBe(1 + BALANCE.ENRAGE_STEP);
    state.elapsedSeconds = BALANCE.ENRAGE_AFTER_S + 2 * BALANCE.ENRAGE_EVERY_S + 1;
    expect(CombatEngine.enrage(state)).toBe(1 + 3 * BALANCE.ENRAGE_STEP);
  });

  it('a lone healer facing an enemy it cannot kill does not hold out for ever', () => {
    const { state, rng } = field([['unit_wrench_plating', 3, 1]], 'standoff');
    const e = CombatEngine.spawnEnemy(state, 'en_lightning_spire', 1, 1);
    e.hp = e.maxHp = 1_000_000;
    e.damage = Math.round(state.units[0].maxHp / 20);
    state.allEnemiesSpawned = true;
    let ticks = 0;
    while (!state.isVictory && !state.isDefeat && ticks < 20 * 300) {
      CombatEngine.step(state, 0.05, rng);
      ticks++;
    }
    expect(state.isVictory || state.isDefeat).toBe(true);
  });
});

describe('a lane held only by healers', () => {
  it('cannot hold an enemy back for ever: the frenzy breaks through', () => {
    const { state, rng } = field([['unit_wrench_mender', 2, 4], ['unit_wrench_welder', 2, 3]], 'healers-only');
    const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 4, 1);
    e.damage = 5;
    state.allEnemiesSpawned = true;
    let ticks = 0;
    while (!state.isVictory && !state.isDefeat && ticks < 20 * 240) {
      CombatEngine.step(state, 0.05, rng);
      ticks++;
    }
    expect(state.isVictory || state.isDefeat).toBe(true);
    expect(state.elapsedSeconds).toBeLessThan(240);
  });
});
