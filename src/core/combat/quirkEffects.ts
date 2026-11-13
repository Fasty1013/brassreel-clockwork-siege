import { QUIRKS_DATA, QuirkDefinition } from '@data/quirks';
import { PRNG } from '../prng/sfc32';
import type { CombatEnemy, CombatSimulationState, CombatUnit } from './combatEngine';

/**
 * Class abilities ("quirks") in battle. Every effect is driven by the quirk's
 * effectType + params from /src/data/quirks.ts, so the numbers in the tooltip
 * are the numbers the fight uses.
 */

/** Per-unit runtime memory used by abilities. */
export interface QuirkRuntime {
  attackCount: number;
  lastTargetId?: string;
  speedStacks: number;
  auraTimer: number;
  minesLeft: number;
  stunnedTargets: string[];
}

export function quirkOf(unit: CombatUnit): QuirkDefinition | undefined {
  return QUIRKS_DATA[unit.sourceUnit.quirkId];
}

function p(q: QuirkDefinition, key: string, fallback: number): number {
  return q.params[key] ?? fallback;
}

export function createQuirkRuntime(unit: CombatUnit): QuirkRuntime {
  const q = quirkOf(unit);
  const rt: QuirkRuntime = { attackCount: 0, speedStacks: 0, auraTimer: 0, minesLeft: 0, stunnedTargets: [] };
  if (!q) return rt;
  if (q.effectType === 'proximity_mines') rt.minesLeft = p(q, 'mineCount', 2);
  return rt;
}

/** Abilities that act once when the battle starts. */
export function applyBattleStart(unit: CombatUnit): void {
  const q = quirkOf(unit);
  if (q?.effectType === 'start_shield') {
    unit.shield += Math.round(unit.maxHp * p(q, 'hpPct', 0.35));
  }
}

const near = (a: { x: number; y: number }, b: { x: number; y: number }, r: number): boolean =>
  Math.abs(a.x - b.x) <= r && Math.abs(a.y - b.y) <= r;

/** Applies damage to an enemy (shield first), records the hit and handles its death. */
export function hitEnemy(state: CombatSimulationState, sourceId: string, enemy: CombatEnemy, amount: number): void {
  if (enemy.isDead || amount <= 0) return;
  let dmg = Math.max(1, Math.round(amount));
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, dmg);
    enemy.shield -= absorbed;
    dmg -= absorbed;
  }
  enemy.hp -= dmg;
  state.events.push({ type: 'damage', sourceId, targetId: enemy.id, amount: Math.max(1, Math.round(amount)) });
  if (enemy.hp <= 0) {
    enemy.isDead = true;
    const bounty = enemy.def.bountyCogs ?? 1;
    state.cogsEarned += bounty;
    state.events.push({ type: 'death', sourceId: enemy.id, amount: bounty });
  }
}

/** Stun that bosses shrug off. */
function stun(enemy: CombatEnemy, seconds: number): void {
  if (enemy.isBoss) return;
  enemy.statuses.stunDuration = Math.max(enemy.statuses.stunDuration, seconds);
}

function ignite(enemy: CombatEnemy, dps: number, seconds: number): void {
  enemy.statuses.burnDps = Math.max(enemy.statuses.burnDps, dps);
  enemy.statuses.burnDuration = Math.max(enemy.statuses.burnDuration, seconds);
}

/** Timed and proximity abilities, run every tick for every living unit. */
export function tickUnitQuirk(unit: CombatUnit, state: CombatSimulationState, dt: number): void {
  const q = quirkOf(unit);
  if (!q) return;
  const rt = unit.quirk;

  if (q.effectType === 'shield_aura') {
    rt.auraTimer += dt;
    const interval = p(q, 'intervalSeconds', 6);
    if (rt.auraTimer >= interval) {
      rt.auraTimer -= interval;
      const amount = p(q, 'shieldAmount', 100);
      for (const ally of state.units) {
        if (ally.isDead || !near(ally, unit, 1.5)) continue;
        ally.shield = Math.min(amount * 2, ally.shield + amount);
      }
    }
  }

  if (q.effectType === 'proximity_mines' && rt.minesLeft > 0) {
    const victim = state.enemies.find(
      (e) => !e.isDead && Math.abs(e.y - unit.y) < 0.6 && e.x >= unit.x && e.x - unit.x <= 1.6
    );
    if (victim) {
      rt.minesLeft--;
      hitEnemy(state, unit.id, victim, p(q, 'damage', 150));
    }
  }
}

/** Multiplier on a unit's attack speed from its own stacks and from allies' auras. */
export function attackSpeedMultiplier(unit: CombatUnit, state: CombatSimulationState): number {
  let mult = 1;
  const q = quirkOf(unit);
  if (q?.effectType === 'speed_stack') {
    mult += unit.quirk.speedStacks * p(q, 'speedPerHitPct', 0.1);
  }
  let aura = 0;
  for (const ally of state.units) {
    if (ally === unit || ally.isDead) continue;
    const aq = quirkOf(ally);
    if (aq?.effectType === 'speed_aura' && near(ally, unit, 1.5)) {
      aura = Math.max(aura, p(aq, 'speedBuffPct', 0.25));
    }
  }
  return mult + aura;
}

/** Enemy movement multiplier while a time-dilation robot is alive. */
export function enemySlowFromUnits(state: CombatSimulationState): number {
  let slow = 0;
  for (const u of state.units) {
    if (u.isDead) continue;
    const q = quirkOf(u);
    if (q?.effectType === 'time_dilation') slow = Math.max(slow, p(q, 'slowPct', 0.4));
  }
  return 1 - slow;
}

/** Raw damage and the target armor this attack uses, before armor is subtracted. */
export function modifyOutgoing(
  unit: CombatUnit,
  target: CombatEnemy,
  state: CombatSimulationState,
  rawDmg: number,
  armor: number,
  rng: PRNG
): { rawDmg: number; armor: number; critReplaced: boolean } {
  const q = quirkOf(unit);
  let critReplaced = false;

  // burning enemies take extra damage while a thermal-vulnerability robot is alive
  if (target.statuses.burnDuration > 0) {
    const thermal = state.units.find((u) => !u.isDead && quirkOf(u)?.effectType === 'thermal_vuln');
    if (thermal) rawDmg *= 1 + p(quirkOf(thermal)!, 'bonusDamagePct', 0.25);
  }
  if (!q) return { rawDmg, armor, critReplaced };

  switch (q.effectType) {
    case 'armor_pierce':
      armor *= 1 - p(q, 'pct', 0.5);
      break;
    case 'solar_beam':
      armor *= 1 - p(q, 'armorShredPct', 0.5);
      rawDmg *= 1 + p(q, 'bonusDamagePct', 0.25);
      break;
    case 'crit_execute':
      if (target.hp / target.maxHp > p(q, 'thresholdPct', 0.7)) {
        rawDmg *= p(q, 'critDmgPct', 2.5);
        critReplaced = true;
      }
      break;
    case 'speed_stack': {
      const rt = unit.quirk;
      rt.speedStacks = rt.lastTargetId === target.id ? Math.min(p(q, 'maxStacks', 10), rt.speedStacks + 1) : 0;
      break;
    }
    default:
      break;
  }
  void rng;
  return { rawDmg, armor, critReplaced };
}

/** Everything an ability does after the main hit landed for `netDmg`. */
export function afterUnitHit(
  unit: CombatUnit,
  target: CombatEnemy,
  state: CombatSimulationState,
  netDmg: number,
  rng: PRNG
): void {
  const q = quirkOf(unit);
  const rt = unit.quirk;
  rt.attackCount++;
  const isNewTarget = rt.lastTargetId !== target.id;
  rt.lastTargetId = target.id;
  if (!q) return;

  const others = (r: number) => state.enemies.filter((e) => !e.isDead && e.id !== target.id && near(e, target, r));

  switch (q.effectType) {
    case 'scrap_scavenge':
      if (rng.next() < p(q, 'cogChance', 0.2)) state.cogsEarned += p(q, 'cogs', 1);
      break;
    case 'ricochet':
      if (rng.next() < p(q, 'chancePct', 0.2)) {
        const secondary = others(2.0)[0];
        if (secondary) hitEnemy(state, unit.id, secondary, netDmg * p(q, 'damagePct', 0.6));
      }
      break;
    case 'chain_lightning': {
      const jumps = p(q, 'maxJumps', 1);
      let from: CombatEnemy = target;
      const hit = new Set<string>([target.id]);
      for (let i = 0; i < jumps; i++) {
        const next = state.enemies.find((e) => !e.isDead && !hit.has(e.id) && near(e, from, 2.5));
        if (!next) break;
        hit.add(next.id);
        next.statuses.shockBonusPct = Math.max(next.statuses.shockBonusPct, 0.2);
        next.statuses.shockDuration = Math.max(next.statuses.shockDuration, 3.0);
        hitEnemy(state, unit.id, next, netDmg * p(q, 'damageRatio', 0.5));
        from = next;
      }
      break;
    }
    case 'cleave':
      for (const e of others(1.1)) hitEnemy(state, unit.id, e, netDmg * p(q, 'cleavePct', 0.4));
      break;
    case 'steam_shroud':
      for (const e of others(1.1)) hitEnemy(state, unit.id, e, netDmg * p(q, 'cleavePct', 0.3));
      break;
    case 'pierce': {
      const behind = state.enemies
        .filter((e) => !e.isDead && e.id !== target.id && Math.abs(e.y - target.y) < 0.6 && e.x > target.x)
        .sort((a, b) => a.x - b.x)
        .slice(0, Math.max(0, p(q, 'maxTargets', 3) - 1));
      for (const e of behind) hitEnemy(state, unit.id, e, netDmg);
      break;
    }
    case 'burst_fire': {
      const extra = Math.max(0, p(q, 'boltCount', 3) - 1);
      for (let i = 0; i < extra && !target.isDead; i++) hitEnemy(state, unit.id, target, netDmg * 0.4);
      break;
    }
    case 'double_shot':
      if (!target.isDead && rng.next() < p(q, 'chance', 0.3)) hitEnemy(state, unit.id, target, netDmg * p(q, 'damagePct', 0.7));
      break;
    case 'thunderbolt':
      if (rt.attackCount % Math.max(1, p(q, 'hitInterval', 4)) === 0 && !target.isDead) {
        stun(target, p(q, 'stunSeconds', 1));
        hitEnemy(state, unit.id, target, p(q, 'damage', 100));
      }
      break;
    case 'stun_charge':
      if (isNewTarget && !rt.stunnedTargets.includes(target.id)) {
        rt.stunnedTargets.push(target.id);
        stun(target, p(q, 'stunSeconds', 2));
      }
      break;
    case 'ignite':
      ignite(target, p(q, 'dps', 20), p(q, 'durationSeconds', 3));
      break;
    case 'thermal_vuln':
      ignite(target, 20, 3);
      break;
    case 'molten_pool':
      ignite(target, p(q, 'dps', 35), p(q, 'durationSeconds', 4));
      for (const e of others(1.1)) ignite(e, p(q, 'dps', 35), p(q, 'durationSeconds', 4));
      break;
    case 'knockback':
      if (!target.isBoss && !target.isDead) target.x = Math.min(7.8, target.x + p(q, 'tiles', 1));
      break;
    default:
      break;
  }
}

/** Share of incoming damage a defender keeps (1 = full damage). */
export function incomingDamageFactor(unit: CombatUnit): number {
  const q = quirkOf(unit);
  if (q?.effectType === 'damage_reduction') return 1 - p(q, 'reductionPct', 0.15);
  if (q?.effectType === 'steam_shroud') return 1 - p(q, 'damageDebuffPct', 0.2);
  return 1;
}

/** Abilities that answer an enemy's hit on this defender. */
export function afterUnitStruck(unit: CombatUnit, attacker: CombatEnemy, state: CombatSimulationState, netDmg: number): void {
  const q = quirkOf(unit);
  if (q?.effectType === 'reflect') {
    hitEnemy(state, unit.id, attacker, netDmg * p(q, 'reflectPct', 0.3));
  }
}

/** Abilities that fire when this defender is destroyed. */
export function onUnitDeath(unit: CombatUnit, state: CombatSimulationState): void {
  const q = quirkOf(unit);
  if (q?.effectType !== 'death_explosion') return;
  const r = p(q, 'radiusTiles', 1.5);
  for (const e of state.enemies) {
    if (!e.isDead && near(e, unit, r)) hitEnemy(state, unit.id, e, p(q, 'blastDamage', 120));
  }
}
