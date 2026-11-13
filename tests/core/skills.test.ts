import { describe, it, expect } from 'vitest';
import { PrngManager } from '@core/prng/prngManager';
import { UnitFactory } from '@core/units/unitFactory';
import { RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { SkillManager } from '@core/skills/skills';
import { BALANCE } from '@data/balance';
import { SKILLS } from '@data/skills';

function setup(cogs = 500) {
  const rng = PrngManager.createStreams('SKILL_SEED');
  const state = RunStateManager.createInitialState('SKILL_SEED');
  state.economy.cogs = cogs;
  const buy = (id: string) => RunReducer.dispatch(state, { type: 'BUY_SKILL', skillId: id }, rng);
  const addUnits = (n: number) => {
    const units = Array.from({ length: n }, () => UnitFactory.createUnit('unit_cog_knight', rng.loot));
    state.reserveBench.push(...units);
    return units;
  };
  const deploy = (id: string, col: number, row: number) =>
    RunReducer.dispatch(state, { type: 'DEPLOY_UNIT', unitId: id, col, row }, rng);
  return { rng, state, buy, addUnits, deploy };
}

describe('Field limit and in-run skill tree', () => {
  it('starts with a limit of 5 robots on the field', () => {
    const { state, addUnits, deploy } = setup();
    const units = addUnits(7);
    units.forEach((u, i) => deploy(u.instanceId, i, 0));
    expect(SkillManager.unitCap(state)).toBe(BALANCE.BASE_UNIT_CAP);
    expect(state.deployedUnits).toHaveLength(5);
    expect(state.reserveBench).toHaveLength(2);
  });

  it('"+1 robot" skill raises the limit and costs cogs', () => {
    const { state, buy, addUnits, deploy } = setup(100);
    buy('log_hangar');
    expect(SkillManager.rank(state, 'log_hangar')).toBe(1);
    expect(state.economy.cogs).toBe(85);
    expect(SkillManager.unitCap(state)).toBe(6);
    const units = addUnits(7);
    units.forEach((u, i) => deploy(u.instanceId, i, 1));
    expect(state.deployedUnits).toHaveLength(6);
  });

  it('swapping with an occupant is allowed at the limit', () => {
    const { state, addUnits, deploy } = setup();
    const units = addUnits(6);
    units.slice(0, 5).forEach((u, i) => deploy(u.instanceId, i, 0));
    deploy(units[5].instanceId, 0, 0);
    expect(state.deployedUnits).toHaveLength(5);
    expect(units[5].deployedSlot).toEqual({ col: 0, row: 0 });
    expect(units[0].deployedSlot).toBeUndefined();
  });

  it('locked nodes need the node above; ranks stop at max; no cogs = no purchase', () => {
    const { state, buy } = setup(1000);
    buy('log_salvage');
    expect(SkillManager.rank(state, 'log_salvage')).toBe(0);
    buy('log_hangar');
    buy('log_salvage');
    expect(SkillManager.rank(state, 'log_salvage')).toBe(1);
    for (let i = 0; i < 10; i++) buy('log_hangar');
    expect(SkillManager.rank(state, 'log_hangar')).toBe(3);

    const poor = setup(5);
    poor.buy('ars_whetstone');
    expect(SkillManager.rank(poor.state, 'ars_whetstone')).toBe(0);
  });

  it('cannot buy skills during battle', () => {
    const { state, buy } = setup();
    state.phase = 'BATTLE';
    buy('ars_whetstone');
    expect(SkillManager.rank(state, 'ars_whetstone')).toBe(0);
  });

  it('boiler, spin, hold and nudge skills apply immediately', () => {
    const { state, buy } = setup(1000);
    const hp = state.maxBoilerHp;
    const spins = state.freeSpinsLeft;
    buy('mech_spin');
    expect(state.freeSpinsLeft).toBe(spins + 1);
    buy('arm_plating');
    buy('arm_plates');
    buy('arm_boiler');
    expect(state.maxBoilerHp).toBe(hp + 3);
    expect(state.boilerHp).toBe(hp + 3);
  });

  it('combat buffs scale the robots at battle start', () => {
    const { rng, state, buy, addUnits, deploy } = setup(1000);
    const [u] = addUnits(1);
    deploy(u.instanceId, 0, 0);
    buy('ars_whetstone');
    buy('arm_plating');
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);
    const cu = state.combatState!.units[0];
    expect(cu.damage).toBe(Math.round(u.damage * 1.1));
    expect(cu.maxHp).toBe(Math.round(u.maxHp * 1.1));
  });

  it('every node has a cost for each rank and a valid parent', () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const s of SKILLS) {
      expect(s.costs).toHaveLength(s.maxRank);
      if (s.requires) expect(ids.has(s.requires)).toBe(true);
    }
  });
});
