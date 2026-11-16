import { describe, it, expect, beforeEach } from 'vitest';
import { RunStateManager, RunState } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { PrngManager, RngStreams } from '@core/prng/prngManager';
import { GadgetManager } from '@core/gadgets/gadgets';
import { SkillManager } from '@core/skills/skills';
import { CombatEngine } from '@core/combat/combatEngine';
import { UnitFactory } from '@core/units/unitFactory';
import { PRNG } from '@core/prng/sfc32';
import { GADGETS_DATA } from '@data/gadgets';
import { BALANCE } from '@data/balance';

function shopState(): { state: RunState; rng: RngStreams } {
  const rng = PrngManager.createStreams('gadgets');
  const state = RunStateManager.createInitialState('gadgets');
  state.phase = 'RESULT';
  RunReducer.dispatch(state, { type: 'ADVANCE_TO_SHOP' }, rng);
  return { state, rng };
}

function buy(state: RunState, rng: RngStreams, id: string): boolean {
  state.shopOffers = [id];
  state.economy.cogs = 100000;
  const before = state.economy.cogs;
  RunReducer.dispatch(state, { type: 'BUY_GADGET', gadgetId: id }, rng);
  return state.economy.cogs < before;
}

describe('workshop shelf', () => {
  let state: RunState;
  let rng: RngStreams;
  beforeEach(() => ({ state, rng } = shopState()));

  it('offers distinct gadgets when the shop opens', () => {
    expect(state.phase).toBe('SHOP');
    expect(state.shopOffers.length).toBe(BALANCE.SHOP_GADGET_OFFERS);
    expect(new Set(state.shopOffers).size).toBe(state.shopOffers.length);
  });

  it('never offers a permanent gadget that is already owned', () => {
    state.activeGadgets.push('gadget_toolkit', 'gadget_oil_can');
    for (let i = 0; i < 50; i++) {
      GadgetManager.rollOffers(state, rng.shop);
      expect(state.shopOffers).not.toContain('gadget_toolkit');
      expect(state.shopOffers).not.toContain('gadget_oil_can');
    }
  });

  it('restocks on reroll and charges for it', () => {
    state.economy.cogs = 100;
    const before = [...state.shopOffers];
    let changed = false;
    for (let i = 0; i < 5 && !changed; i++) {
      RunReducer.dispatch(state, { type: 'REROLL_SHOP' }, rng);
      changed = state.shopOffers.join() !== before.join();
    }
    expect(changed).toBe(true);
    expect(state.economy.cogs).toBeLessThan(100);
  });

  it('sells only what is on the shelf and only in the shop', () => {
    state.economy.cogs = 1000;
    const missing = Object.keys(GADGETS_DATA).find((id) => !state.shopOffers.includes(id))!;
    RunReducer.dispatch(state, { type: 'BUY_GADGET', gadgetId: missing }, rng);
    expect(state.economy.cogs).toBe(1000);

    const offered = state.shopOffers[0];
    state.phase = 'PREP';
    RunReducer.dispatch(state, { type: 'BUY_GADGET', gadgetId: offered }, rng);
    expect(state.economy.cogs).toBe(1000);
  });

  it('takes a bought gadget off the shelf', () => {
    const id = state.shopOffers[0];
    state.economy.cogs = 1000;
    RunReducer.dispatch(state, { type: 'BUY_GADGET', gadgetId: id }, rng);
    expect(state.shopOffers).not.toContain(id);
  });
});

describe('gadget prices', () => {
  it('each owned permanent gadget makes the next one dearer', () => {
    const { state } = shopState();
    const base = GadgetManager.price(state, 'gadget_lens_array');
    expect(base).toBe(GADGETS_DATA.gadget_lens_array.cost);
    state.activeGadgets.push('gadget_toolkit', 'gadget_oil_can');
    expect(GadgetManager.price(state, 'gadget_lens_array')).toBe(
      Math.round(base * (1 + 2 * BALANCE.GADGET_PASSIVE_PRICE_STEP))
    );
  });

  it('consumables get dearer with the wave number', () => {
    const { state } = shopState();
    const early = GadgetManager.price(state, 'gadget_repair_kit');
    state.waveNumber = 21;
    expect(GadgetManager.price(state, 'gadget_repair_kit')).toBeGreaterThan(early * 3);
  });

  it('the merchant stamp lowers every workshop price', () => {
    const { state, rng } = shopState();
    const gadget = GadgetManager.price(state, 'gadget_repair_kit');
    buy(state, rng, 'gadget_discount_coupon');
    expect(GadgetManager.price(state, 'gadget_repair_kit')).toBe(Math.round(gadget * 0.8));
    state.economy.cogs = 100;
    RunReducer.dispatch(state, { type: 'BUY_SYMBOL', reelIndex: 1, symbol: 'cog' }, rng);
    expect(state.economy.cogs).toBe(100 - Math.round(BALANCE.COST_ADD_SYMBOL * 0.8));
  });
});

describe('gadget effects', () => {
  it('the Master Kit adds one robot to the field limit', () => {
    const { state, rng } = shopState();
    const cap = SkillManager.unitCap(state);
    expect(buy(state, rng, 'gadget_toolkit')).toBe(true);
    expect(SkillManager.unitCap(state)).toBe(cap + 1);
  });

  it('armor plates raise the boiler, the repair kit heals it up to the maximum', () => {
    const { state, rng } = shopState();
    buy(state, rng, 'gadget_iron_plates');
    expect(state.maxBoilerHp).toBe(BALANCE.INITIAL_BOILER_HP + 2);
    state.boilerHp = state.maxBoilerHp - 1;
    buy(state, rng, 'gadget_repair_kit');
    expect(state.boilerHp).toBe(state.maxBoilerHp);
  });

  it('the lucky coin adds a wild to every reel', () => {
    const { state, rng } = shopState();
    const wilds = state.reelStrips.map((s) => s.filter((x) => x.symbol === 'wild').length);
    buy(state, rng, 'gadget_lucky_coin');
    state.reelStrips.forEach((s, i) => expect(s.filter((x) => x.symbol === 'wild').length).toBe(wilds[i] + 1));
  });

  it('a free-spin roll is added to the next wave only', () => {
    const { state, rng } = shopState();
    buy(state, rng, 'gadget_reel_reroll');
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
    expect(state.freeSpinsLeft).toBe(BALANCE.FREE_SPINS_PER_WAVE + 1);
    expect(state.consumables.spinsNextWave).toBe(0);
  });

  it('the scrap press summons a Scrap Bot on every 3rd spin without a win', () => {
    const { state, rng } = shopState();
    buy(state, rng, 'gadget_scrap_magnet');
    expect([1, 2, 3].map(() => GadgetManager.scrapPressTriggers(state))).toEqual([false, false, true]);
  });

  it('the golden key offers a fourth engine core', () => {
    const { state, rng } = shopState();
    expect(GadgetManager.coreChoices(state)).toBe(3);
    buy(state, rng, 'gadget_golden_key');
    expect(GadgetManager.coreChoices(state)).toBe(4);
  });

  it('battle consumables are spent by one battle', () => {
    const { state, rng } = shopState();
    const unit = UnitFactory.createUnit('unit_spring_archer', rng.loot);
    unit.deployedSlot = { col: 2, row: 2 };
    state.deployedUnits.push(unit);
    buy(state, rng, 'gadget_sentry_kit');
    buy(state, rng, 'gadget_overcharge_vial');
    buy(state, rng, 'gadget_shock_grenade');
    RunReducer.dispatch(state, { type: 'START_NEXT_WAVE' }, rng);
    RunReducer.dispatch(state, { type: 'START_BATTLE' }, rng);

    const combat = state.combatState!;
    expect(combat.units.filter((u) => u.isTurret)).toHaveLength(1);
    expect(combat.gadgetMods?.surgeSeconds).toBeGreaterThan(0);
    expect(combat.gadgetMods?.stunNextSpawns).toBe(3);
    expect(state.consumables).toMatchObject({ turrets: 0, overcharges: 0, grenades: 0 });
  });
});

describe('gadget effects in battle', () => {
  function battle(mods: Partial<NonNullable<ReturnType<typeof GadgetManager.combatMods>>> = {}) {
    const rng = PRNG.fromSeed('battle');
    const unit = UnitFactory.createUnit('unit_cog_knight', rng);
    unit.deployedSlot = { col: 4, row: 0 };
    const state = CombatEngine.initCombatState([unit], 10);
    state.gadgetMods = {
      critChanceBonus: 0, shockBonusSeconds: 0, knockbackTiles: 0, extraBountyCogs: 0, freeLeaks: 0,
      extraValves: 0, surgeMultiplier: 2, surgeSeconds: 0, stunNextSpawns: 0, stunSeconds: 4, ...mods
    };
    return { state, rng };
  }

  it('steel rivets make the first breach free', () => {
    const { state, rng } = battle({ freeLeaks: 1 });
    CombatEngine.spawnEnemy(state, 'en_scrapper', 3, 1).x = 0.12;
    CombatEngine.spawnEnemy(state, 'en_scrapper', 3, 2).x = 0.12;
    CombatEngine.step(state, 0.05, rng);
    expect(state.boilerHp).toBe(9);
  });

  it('the chrono gear lets the valve be pulled twice', () => {
    const { state } = battle({ extraValves: 1 });
    expect(CombatEngine.triggerEmergencyValve(state, 'slow')).toBe(true);
    expect(CombatEngine.triggerEmergencyValve(state, 'slow')).toBe(true);
    expect(CombatEngine.triggerEmergencyValve(state, 'slow')).toBe(false);
    expect(state.valveUses).toBe(2);
  });

  it('the shock mine stuns the first enemies to arrive', () => {
    const { state } = battle({ stunNextSpawns: 1 });
    const first = CombatEngine.spawnEnemy(state, 'en_scrapper', 3, 1);
    const second = CombatEngine.spawnEnemy(state, 'en_scrapper', 3, 2);
    expect(first.statuses.stunDuration).toBe(4);
    expect(second.statuses.stunDuration).toBe(0);
  });

  it('the collector magnet adds cogs for every kill', () => {
    const plain = battle();
    const magnet = battle({ extraBountyCogs: 1 });
    for (const { state, rng } of [plain, magnet]) {
      const e = CombatEngine.spawnEnemy(state, 'en_scrapper', 0, 1);
      e.x = 4.6;
      e.hp = 1;
      for (let i = 0; i < 40 && state.enemies.length > 0; i++) CombatEngine.step(state, 0.05, rng);
    }
    expect(magnet.state.cogsEarned).toBe(plain.state.cogsEarned + 1);
  });

  it('the recoil buffer pushes ordinary enemies back on melee hits', () => {
    const { state, rng } = battle({ knockbackTiles: 0.3 });
    const e = CombatEngine.spawnEnemy(state, 'en_spire_golem', 0, 1);
    e.x = 5.2;
    const start = e.x;
    for (let i = 0; i < 30; i++) CombatEngine.step(state, 0.05, rng);
    expect(e.x).toBeGreaterThan(start);
  });
});
