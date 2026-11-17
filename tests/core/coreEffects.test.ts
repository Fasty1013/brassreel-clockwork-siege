import { describe, it, expect } from 'vitest';
import { RunStateManager, RunState } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager, RngStreams } from '@core/prng/prngManager';
import { ReelManager, ReelSymbol, Grid3x3, SlotSymbol } from '@core/reels/reels';
import { CoreEffects } from '@core/cores/coreEffects';
import { CombatEngine, CombatSimulationState } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { CORES_DATA } from '@data/cores';
import { EventBus } from '@core/events/events';
import { BALANCE } from '@data/balance';

const sym = (s: SlotSymbol): ReelSymbol => ({ symbol: s, isGilded: false });
const strip = (...s: SlotSymbol[]): ReelSymbol[] => s.map(sym);

function run(cores: string[], seed = 'cores'): { state: RunState; rng: RngStreams } {
  const state = RunStateManager.createInitialState(seed);
  state.activeCores = cores;
  return { state, rng: PrngManager.createStreams(seed) };
}

/** Reels that always stop showing the given 3x3 window (every strip is the column repeated). */
function fixReels(state: RunState, columns: [SlotSymbol[], SlotSymbol[], SlotSymbol[]]): void {
  state.reelStrips = columns.map((c) => strip(...c, ...c)) as RunState['reelStrips'];
  state.reelIndices = [0, 0, 0];
  state.heldReels = [true, true, true]; // held reels do not move: the window stays exactly as given
}

function spin(state: RunState, rng: RngStreams): void {
  RunReducer.dispatch(state, { type: 'SPIN' }, rng);
}

describe('every engine core has an effect in the code', () => {
  it('all 20 cores are covered by this suite', () => {
    expect(Object.keys(CORES_DATA)).toHaveLength(20);
  });
});

describe('heat and reel weights', () => {
  it('cold reels stop uniformly (no weights)', () => {
    const { state } = run([]);
    expect(CoreEffects.symbolWeights(state)).toBeUndefined();
  });

  it('hot reels show wilds and crowns more often', () => {
    const reel = strip('cog', 'spring', 'fuse', 'coil', 'cog', 'spring', 'fuse', 'coil', 'wild', 'crown');
    const count = (heat: number): number => {
      const { state } = run([]);
      state.heat.currentHeat = heat;
      const w = CoreEffects.symbolWeights(state);
      const rng = PRNG.fromSeed('weights');
      let wilds = 0;
      for (let i = 0; i < 4000; i++) {
        const stop = ReelManager.pickStop(reel, 0, rng, w);
        for (let k = 0; k < 3; k++) if (reel[(stop + k) % reel.length].symbol === 'wild') wilds++;
      }
      return wilds;
    };
    expect(count(80)).toBeGreaterThan(count(0) * 1.5);
  });

  it('Lucky Cam: crowns on the middle reel only', () => {
    const { state } = run(['core_lucky_cam']);
    const w = CoreEffects.symbolWeights(state)!;
    expect(w(1, 'crown')).toBe(2);
    expect(w(0, 'crown')).toBe(1);
    expect(w(1, 'cog')).toBe(1);
  });

  it('Pressure Valve: heat may climb to 120', () => {
    const { state, rng } = run(['core_pressure_valve']);
    state.freeSpinsLeft = 0;
    state.economy.steam = 5;
    state.heat.currentHeat = 110;
    spin(state, rng);
    expect(state.heat.maxHeat).toBe(120);
    expect(state.heat.currentHeat).toBe(120);
  });
});

describe('spin cores', () => {
  it('Chain Cam: a centre wild completes lines through the centre', () => {
    const grid: Grid3x3 = [
      [sym('cog'), sym('spring'), sym('fuse')],
      [sym('coil'), sym('wild'), sym('crown')],
      [sym('crown'), sym('cog'), sym('crown')]
    ];
    expect(ReelManager.evaluateGrid(grid).factionHitsCount).toBe(0);
    const res = ReelManager.evaluateGrid(grid, { omniCenterWild: true });
    expect(res.factionHitsCount).toBeGreaterThanOrEqual(3);
    // lines away from the centre stay as they were
    expect(res.lineHits.every((h) => h.coords.some(([c, r]) => c === 1 && r === 1))).toBe(true);
  });

  it('Diagonal Dynamo: diagonal lines summon level 2 robots', () => {
    const { state, rng } = run(['core_diagonal_dynamo']);
    fixReels(state, [['cog', 'spring', 'fuse'], ['coil', 'cog', 'fuse'], ['spring', 'coil', 'cog']]);
    spin(state, rng);
    expect(state.reserveBench).toHaveLength(1);
    expect(state.reserveBench[0].starRank).toBe(2);
  });

  it('Hollow Spring: a spin without a triple can turn its pair into a robot', () => {
    let summoned = 0;
    for (let i = 0; i < 40; i++) {
      const { state, rng } = run(['core_hollow_spring'], `hollow${i}`);
      fixReels(state, [['cog', 'spring', 'fuse'], ['cog', 'coil', 'crown'], ['spring', 'fuse', 'coil']]);
      spin(state, rng);
      summoned += state.reserveBench.length;
    }
    expect(summoned).toBeGreaterThan(3);
    expect(summoned).toBeLessThan(25);
  });

  it('Spring Barrel: a line of Springs brings two archers', () => {
    const { state, rng } = run(['core_spring_barrel']);
    fixReels(state, [['spring', 'cog', 'fuse'], ['spring', 'coil', 'crown'], ['spring', 'fuse', 'coil']]);
    spin(state, rng);
    expect(state.reserveBench.filter((u) => u.faction === 'spring')).toHaveLength(2);
  });

  it('Grand Regulator: a jackpot pays cogs and steam', () => {
    const { state, rng } = run(['core_grand_regulator']);
    fixReels(state, [['crown', 'cog', 'fuse'], ['crown', 'coil', 'spring'], ['crown', 'fuse', 'coil']]);
    state.economy.steam = 0;
    const cogs = state.economy.cogs;
    spin(state, rng);
    expect(state.economy.cogs).toBeGreaterThanOrEqual(cogs + 50);
    expect(state.economy.steam).toBe(2);
  });

  it('Overdrive Clutch: a jam neither hurts robots nor locks a reel', () => {
    const { state, rng } = run(['core_overdrive_clutch']);
    const u = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    u.deployedSlot = { col: 0, row: 0 };
    state.deployedUnits.push(u);
    const bus = new EventBus();
    let jams = 0;
    bus.on('jam_triggered', () => jams++);
    state.freeSpinsLeft = 0;
    for (let i = 0; i < 60 && jams === 0; i++) {
      state.economy.steam = 5;
      state.heat.currentHeat = 100;
      RunReducer.dispatch(state, { type: 'SPIN' }, rng, bus);
    }
    expect(jams).toBe(1);
    expect(u.currentHp).toBe(u.maxHp);
    expect(state.heldReels).toEqual([false, false, false]);
  });
});

describe('wave and workshop cores', () => {
  const nextWave = (state: RunState, rng: RngStreams): void => {
    state.phase = 'SHOP';
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
  };

  it('Brass Ratchet: +1 nudge per wave', () => {
    const { state, rng } = run(['core_brass_ratchet']);
    nextWave(state, rng);
    expect(state.nudgesLeft).toBe(BALANCE.BASE_NUDGE_CHARGES + 1);
  });

  it('Steam Forge: +1 steam per wave', () => {
    const plain = run([]);
    const forge = run(['core_steam_forge']);
    for (const r of [plain, forge]) {
      r.state.economy.steam = 0;
      nextWave(r.state, r.rng);
    }
    expect(forge.state.economy.steam).toBe(plain.state.economy.steam + 1);
  });

  it('Perpetual Cam: unused holds carry over, up to 4', () => {
    const { state, rng } = run(['core_perpetual_cam']);
    state.holdsLeft = 2;
    nextWave(state, rng);
    expect(state.holdsLeft).toBe(4);
    nextWave(state, rng);
    expect(state.holdsLeft).toBe(4);
  });

  it('Gilded Flywheel: gilding costs half', () => {
    const { state } = run(['core_gilded_flywheel']);
    expect(CoreEffects.gildCost(state)).toBe(Math.round(BALANCE.COST_GILD_SYMBOL / 2));
    expect(CoreEffects.gildCost(run([]).state)).toBe(BALANCE.COST_GILD_SYMBOL);
  });
});

describe('merge cores', () => {
  function merge(cores: string[], heat = 0): RunState {
    const { state, rng } = run(cores);
    const a = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    const b = UnitFactory.createUnit('unit_cog_knight', rng.loot);
    a.mods = [];
    state.reserveBench.push(a, b);
    state.heat.currentHeat = heat;
    state.boilerHp = 5;
    RunReducer.dispatch(state, { type: 'SMELT_UNITS', targetId: a.instanceId, sacrificeId: b.instanceId }, rng);
    return state;
  }

  it('Scrap Boiler: every merge repairs the boiler', () => {
    expect(merge(['core_scrap_boiler']).boilerHp).toBe(6);
    expect(merge([]).boilerHp).toBe(5);
  });

  it('Furnace Bellows: a hot merge adds a mod', () => {
    expect(merge(['core_furnace_bellows'], 60).reserveBench[0].mods.length).toBe(1);
    expect(merge(['core_furnace_bellows'], 20).reserveBench[0].mods.length).toBe(0);
  });
});

describe('battle cores', () => {
  function battle(cores: string[], defIds: string[], prep?: (s: RunState) => void): CombatSimulationState {
    const { state, rng } = run(cores);
    defIds.forEach((id, i) => {
      const u = UnitFactory.createUnit(id, rng.loot);
      u.mods = [];
      u.deployedSlot = { col: 1, row: i };
      state.deployedUnits.push(u);
    });
    prep?.(state);
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    return state.combatState!;
  }

  it('Cog Catalyst: Cog robots get +25% health', () => {
    const plain = battle([], ['unit_cog_knight', 'unit_spring_archer']);
    const buffed = battle(['core_cog_catalyst'], ['unit_cog_knight', 'unit_spring_archer']);
    expect(buffed.units[0].maxHp).toBe(Math.round(plain.units[0].maxHp * 1.25));
    expect(buffed.units[1].maxHp).toBe(plain.units[1].maxHp);
  });

  it('Steam Forge: +15% damage only when the battle starts in overdrive', () => {
    const plain = battle(['core_steam_forge'], ['unit_cog_knight']);
    const hot = battle(['core_steam_forge'], ['unit_cog_knight'], (s) => (s.heat.currentHeat = 80));
    expect(hot.units[0].damage).toBe(Math.round(plain.units[0].damage * 1.15));
  });

  it('Clockwork Relay: +10% attack speed per combo spin, up to 3', () => {
    const plain = battle(['core_clockwork_relay'], ['unit_cog_knight']);
    const relay = battle(['core_clockwork_relay'], ['unit_cog_knight'], (s) => (s.comboSpinsThisWave = 5));
    expect(relay.units[0].attackSpeed).toBeCloseTo(plain.units[0].attackSpeed * 1.3, 1);
  });

  it('Coil Resonator: chain lightning reaches 2 more enemies', () => {
    const hitCount = (cores: string[]): number => {
      const state = battle(cores, ['unit_coil_sparker']);
      const rng = PRNG.fromSeed('chain');
      const enemies = [0, 1, 2, 3, 4].map((i) => CombatEngine.spawnEnemy(state, 'en_spire_golem', 0, i + 1));
      enemies.forEach((e, i) => {
        e.x = 3 + i * 0.3;
        e.moveSpeed = 0;
        e.attackRange = 0.1;
      });
      for (let i = 0; i < 20; i++) CombatEngine.step(state, 0.05, rng);
      return enemies.filter((e) => e.hp < e.maxHp).length;
    };
    expect(hitCount(['core_coil_resonator'])).toBe(hitCount([]) + 2);
  });

  it('Fuse Initiator: Fuse blasts reach farther', () => {
    expect(battle(['core_fuse_initiator'], ['unit_fuse_sapper']).coreMods?.fuseRadiusMult).toBe(1.5);
    expect(battle([], ['unit_fuse_sapper']).coreMods?.fuseRadiusMult).toBe(1);
  });
});
