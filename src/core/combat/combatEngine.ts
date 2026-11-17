import { BALANCE } from '@data/balance';
import { UnitInstance } from '../units/unitFactory';
import { EnemyDefinition } from '@data/schemas/enemySchema';
import { ENEMIES_DATA } from '@data/enemies';
import { PRNG } from '../prng/sfc32';
import { enemyGrowth } from '../waves/enemyGrowth';
import {
  QuirkRuntime,
  createQuirkRuntime,
  applyBattleStart,
  tickUnitQuirk,
  attackSpeedMultiplier,
  enemySlowFromUnits,
  modifyOutgoing,
  afterUnitHit,
  hitEnemy,
  incomingDamageFactor,
  afterUnitStruck,
  onUnitDeath
} from './quirkEffects';

/** robots with an attack range up to this many tiles fight in melee */
const MELEE_RANGE_MAX = 1.5;

/** heading changes (radians) a walking robot tries, in order, to get around another robot */
const SIDESTEP_TURNS = [0, 0.6, -0.6, 1.2, -1.2];

/**
 * Spots around an enemy a melee robot can stand at, all within 1 tile of it.
 * `penalty` (in tiles of extra walking) makes the front, on the boiler side, the favourite.
 */
const MELEE_SPOTS = [
  { dx: -0.8, dy: 0, penalty: 0 },
  { dx: -0.5, dy: -0.75, penalty: 0.3 },
  { dx: -0.5, dy: 0.75, penalty: 0.3 },
  { dx: 0.5, dy: -0.75, penalty: 0.6 },
  { dx: 0.5, dy: 0.75, penalty: 0.6 },
  { dx: 0.8, dy: 0, penalty: 1 }
];

/** robot centres stay half a tile inside the field */
const clampFieldX = (x: number): number => Math.max(0.5, Math.min(BALANCE.GRID_COLS - 0.5, x));
const clampFieldY = (y: number): number => Math.max(0.5, Math.min(BALANCE.GRID_ROWS - 0.5, y));

export interface CombatUnit {
  id: string;
  sourceUnit: UnitInstance;
  col: number;
  row: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  attackRange: number;
  armor: number;
  moveSpeed: number;
  attackCooldown: number;
  shield: number;
  isDead: boolean;
  /** runtime memory of the class ability (counters, timers, mines) */
  quirk: QuirkRuntime;
  statuses: {
    burnDps: number;
    burnDuration: number;
    shockBonusPct: number;
    shockDuration: number;
    stunDuration: number;
    slowRatio: number;
    slowDuration: number;
  };
}

export interface CombatEnemy {
  id: string;
  defId: string;
  def: EnemyDefinition;
  x: number; // Float in [0, 8]
  y: number; // Row lane 0-4
  row: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  attackRange: number;
  armor: number;
  moveSpeed: number;
  attackCooldown: number;
  shield: number;
  isDead: boolean;
  isBoss: boolean;
  bossPhase: number;
  statuses: {
    burnDps: number;
    burnDuration: number;
    shockBonusPct: number;
    shockDuration: number;
    stunDuration: number;
    slowRatio: number;
    slowDuration: number;
  };
}

export interface CombatEvent {
  type: 'attack' | 'projectile_hit' | 'damage' | 'death' | 'breach' | 'valve_used' | 'boss_phase';
  sourceId: string;
  targetId?: string;
  amount?: number;
  x?: number;
  y?: number;
}

export interface CombatSimulationState {
  tickCount: number;
  elapsedSeconds: number;
  boilerHp: number;
  maxBoilerHp: number;
  valveUsed: boolean;
  valveSlowRemaining: number;
  allEnemiesSpawned: boolean;
  cogsEarned: number;
  isVictory: boolean;
  isDefeat: boolean;
  units: CombatUnit[];
  enemies: CombatEnemy[];
  events: CombatEvent[];
}

export class CombatEngine {
  public static initCombatState(
    deployedUnits: UnitInstance[],
    boilerHp: number,
    maxBoilerHp: number = BALANCE.INITIAL_BOILER_HP
  ): CombatSimulationState {
    const units: CombatUnit[] = deployedUnits
      .filter((u) => u.deployedSlot !== undefined)
      .map((u) => {
        const slot = u.deployedSlot!;
        const unit: CombatUnit = {
          id: u.instanceId,
          sourceUnit: u,
          col: slot.col,
          row: slot.row,
          x: slot.col + 0.5,
          y: slot.row + 0.5,
          hp: u.currentHp,
          maxHp: u.maxHp,
          damage: u.damage,
          attackSpeed: u.attackSpeed,
          attackRange: u.attackRange,
          armor: u.armor,
          moveSpeed: u.moveSpeed,
          attackCooldown: 1.0 / u.attackSpeed,
          shield: 0,
          isDead: false,
          quirk: { attackCount: 0, speedStacks: 0, auraTimer: 0, minesLeft: 0, stunnedTargets: [] },
          statuses: {
            burnDps: 0,
            burnDuration: 0,
            shockBonusPct: 0,
            shockDuration: 0,
            stunDuration: 0,
            slowRatio: 0,
            slowDuration: 0
          }
        };
        unit.quirk = createQuirkRuntime(unit);
        applyBattleStart(unit);
        return unit;
      });

    return {
      tickCount: 0,
      elapsedSeconds: 0,
      boilerHp,
      maxBoilerHp,
      valveUsed: false,
      valveSlowRemaining: 0,
      allEnemiesSpawned: false,
      cogsEarned: 0,
      isVictory: false,
      isDefeat: false,
      units,
      enemies: [],
      events: []
    };
  }

  /**
   * Spawns an enemy into the combat simulation.
   * `enemyPower` is the wave's toughness multiplier (1 = base stats).
   */
  public static spawnEnemy(
    state: CombatSimulationState,
    enemyDefId: string,
    row: number,
    sequence: number,
    enemyPower = 1
  ): CombatEnemy {
    const def = ENEMIES_DATA[enemyDefId];
    if (!def) {
      throw new Error(`Enemy definition not found: ${enemyDefId}`);
    }
    const growth = enemyGrowth(enemyPower);
    const hp = Math.round(def.hp * growth.hp);

    const enemy: CombatEnemy = {
      id: `en_${sequence}_${enemyDefId}`,
      defId: enemyDefId,
      def,
      x: 7.8, // Right edge
      y: row + 0.5,
      row,
      hp,
      maxHp: hp,
      damage: Math.round(def.damage * growth.damage),
      attackSpeed: def.attackSpeed,
      attackRange: def.attackRange,
      armor: def.armor ?? 0,
      moveSpeed: def.moveSpeed,
      attackCooldown: 1.0 / def.attackSpeed,
      shield: 0,
      isDead: false,
      isBoss: def.isBoss ?? false,
      bossPhase: 1,
      statuses: {
        burnDps: 0,
        burnDuration: 0,
        shockBonusPct: 0,
        shockDuration: 0,
        stunDuration: 0,
        slowRatio: 0,
        slowDuration: 0
      }
    };

    state.enemies.push(enemy);
    return enemy;
  }

  /**
   * Advances simulation by one discrete tick (dt = 0.05 seconds by default).
   */
  public static step(
    state: CombatSimulationState,
    dt: number,
    rng: PRNG
  ): CombatEvent[] {
    if (state.isVictory || state.isDefeat) {
      return [];
    }

    state.tickCount++;
    state.elapsedSeconds += dt;
    state.events = [];

    // 1. Update Emergency Valve slow duration
    if (state.valveSlowRemaining > 0) {
      state.valveSlowRemaining = Math.max(0, state.valveSlowRemaining - dt);
    }

    // 2. Update statuses & tick damage on units and enemies
    this.updateStatuses(state, dt);

    // 3. Defenders action loop
    for (const unit of state.units) {
      if (unit.isDead) continue;

      tickUnitQuirk(unit, state, dt);
      if (unit.statuses.stunDuration > 0) continue;

      // Nobody to hit from here: walk toward the nearest enemy until one is in range.
      if (!this.findBestEnemyTarget(unit, state.enemies)) {
        this.advanceUnit(unit, state, dt);
      }

      unit.attackCooldown -= dt;
      if (unit.attackCooldown <= 0) {
        // Target selection
        const target = this.findBestEnemyTarget(unit, state.enemies);
        if (target) {
          this.executeUnitAttack(unit, target, state, rng);
          const baseSpeed = unit.attackSpeed * attackSpeedMultiplier(unit, state);
          const effectiveAttackSpeed = unit.statuses.slowDuration > 0
            ? baseSpeed * (1 - unit.statuses.slowRatio)
            : baseSpeed;
          unit.attackCooldown = 1.0 / Math.max(0.2, effectiveAttackSpeed);
        }
      }
    }

    // 4. Enemies action & movement loop
    const unitSlow = enemySlowFromUnits(state);
    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;

      if (enemy.statuses.stunDuration > 0) continue;

      // Check if boss changes phase
      if (enemy.isBoss && enemy.def.bossPhases && enemy.def.bossPhases.length > 1) {
        const hpPct = enemy.hp / enemy.maxHp;
        if (enemy.bossPhase === 1 && hpPct <= enemy.def.bossPhases[1].thresholdHpPct) {
          enemy.bossPhase = 2;
          enemy.moveSpeed *= 1.4; // 40% speed up in phase 2
          state.events.push({
            type: 'boss_phase',
            sourceId: enemy.id,
            amount: 2
          });
        }
      }

      // Check for blockers / targets in range
      const targetUnit = this.findDefenderInRange(enemy, state.units);
      if (targetUnit) {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          this.executeEnemyAttack(enemy, targetUnit, state, rng);
          const effectiveAttackSpeed = enemy.statuses.slowDuration > 0
            ? enemy.attackSpeed * (1 - enemy.statuses.slowRatio)
            : enemy.attackSpeed;
          enemy.attackCooldown = 1.0 / Math.max(0.2, effectiveAttackSpeed);
        }
        // Shooters keep closing in while they fire, so a fight can never freeze
        // with an enemy plinking away from where no robot can reach it.
        const gap = enemy.x - targetUnit.x - 1;
        if (enemy.attackRange > 1 && gap > 0) {
          const stepLen = this.enemyMoveSpeed(enemy, state, unitSlow) * BALANCE.RANGED_ADVANCE_RATIO * dt;
          enemy.x -= Math.min(gap, stepLen);
        }
      } else {
        // Advance leftward
        enemy.x -= this.enemyMoveSpeed(enemy, state, unitSlow) * dt;

        // Check for breach at column 0 border (x <= 0)
        if (enemy.x <= 0.1) {
          enemy.isDead = true;
          const leakDmg = enemy.isBoss ? 3 : 1;
          state.boilerHp = Math.max(0, state.boilerHp - leakDmg);
          state.events.push({
            type: 'breach',
            sourceId: enemy.id,
            amount: leakDmg
          });

          if (state.boilerHp <= 0) {
            state.isDefeat = true;
            return state.events;
          }
        }
      }
    }

    // 5. Clean up dead entities
    state.units = state.units.filter((u) => !u.isDead);
    state.enemies = state.enemies.filter((e) => !e.isDead);

    // 6. Check victory condition
    if (state.allEnemiesSpawned && state.enemies.length === 0) {
      state.isVictory = true;
    }

    return state.events;
  }

  /** Tiles per second this enemy walks right now (valve and slow effects included). */
  private static enemyMoveSpeed(enemy: CombatEnemy, state: CombatSimulationState, unitSlow: number): number {
    let speed = enemy.moveSpeed * unitSlow;
    if (state.valveSlowRemaining > 0) {
      speed *= (1 - BALANCE.VALVE_SLOW_RATIO);
    } else if (enemy.statuses.slowDuration > 0) {
      speed *= (1 - enemy.statuses.slowRatio);
    }
    return speed;
  }

  /** Damage that gets through armor: armor subtracts, but a share of every hit always lands. */
  public static damageAfterArmor(rawDmg: number, armor: number): number {
    return Math.max(1, Math.round(Math.max(rawDmg - armor, rawDmg * BALANCE.MIN_DAMAGE_RATIO)));
  }

  /**
   * Activates Emergency Valve.
   */
  public static triggerEmergencyValve(
    state: CombatSimulationState,
    choice: 'slow' | 'heal'
  ): boolean {
    if (state.valveUsed) {
      return false;
    }
    state.valveUsed = true;

    if (choice === 'slow') {
      state.valveSlowRemaining = BALANCE.VALVE_SLOW_DURATION_S;
      state.events.push({
        type: 'valve_used',
        sourceId: 'player',
        amount: BALANCE.VALVE_SLOW_DURATION_S
      });
    } else {
      state.boilerHp = Math.min(state.maxBoilerHp, state.boilerHp + BALANCE.VALVE_HEAL_BOILER_HP);
      state.events.push({
        type: 'valve_used',
        sourceId: 'player',
        amount: BALANCE.VALVE_HEAL_BOILER_HP
      });
    }
    return true;
  }

  private static updateStatuses(state: CombatSimulationState, dt: number): void {
    // Units
    for (const u of state.units) {
      if (u.statuses.burnDuration > 0) {
        const burnDmg = Math.round(u.statuses.burnDps * dt);
        u.hp -= burnDmg;
        u.statuses.burnDuration -= dt;
        if (u.hp <= 0) u.isDead = true;
      }
      if (u.statuses.shockDuration > 0) u.statuses.shockDuration -= dt;
      if (u.statuses.stunDuration > 0) u.statuses.stunDuration -= dt;
      if (u.statuses.slowDuration > 0) u.statuses.slowDuration -= dt;
    }

    // Enemies
    for (const e of state.enemies) {
      if (e.statuses.burnDuration > 0) {
        const burnDmg = Math.round(e.statuses.burnDps * dt);
        e.hp -= burnDmg;
        e.statuses.burnDuration -= dt;
        if (e.hp <= 0) {
          e.isDead = true;
          state.cogsEarned += e.def.bountyCogs ?? 1;
        }
      }
      if (e.statuses.shockDuration > 0) e.statuses.shockDuration -= dt;
      if (e.statuses.stunDuration > 0) e.statuses.stunDuration -= dt;
      if (e.statuses.slowDuration > 0) e.statuses.slowDuration -= dt;
    }
  }

  private static findBestEnemyTarget(unit: CombatUnit, enemies: CombatEnemy[]): CombatEnemy | null {
    let closestEnemy: CombatEnemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      // Distance calculation
      const dx = enemy.x - unit.x;
      const dy = enemy.y - unit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= unit.attackRange) {
        // Prioritize enemies closest to lane 0 (threat priority)
        const priorityWeight = dist + enemy.x * 0.2;
        if (priorityWeight < minDistance) {
          minDistance = priorityWeight;
          closestEnemy = enemy;
        }
      }
    }

    return closestEnemy;
  }

  /**
   * Moves a robot that has no enemy in range one step toward the most pressing enemy.
   * Shooters walk straight at it and stop as soon as it is in range; melee robots head
   * for a free spot next to it, preferably in front (on the boiler side), so they also
   * block its lane. Robots stay inside the field and never walk into each other: if the
   * straight path is taken they sidestep, and if every way forward is taken they wait.
   */
  private static advanceUnit(unit: CombatUnit, state: CombatSimulationState, dt: number): void {
    const enemy = this.findApproachTarget(unit, state.enemies);
    if (!enemy) return;

    const goal = unit.attackRange <= MELEE_RANGE_MAX
      ? this.meleeApproachPoint(unit, enemy, state.units)
      : { x: enemy.x, y: enemy.y };

    const distGoal = Math.hypot(goal.x - unit.x, goal.y - unit.y);
    if (distGoal < 1e-3) return;

    let speed = unit.moveSpeed;
    if (unit.statuses.slowDuration > 0) speed *= 1 - unit.statuses.slowRatio;
    const stepLen = Math.min(speed * dt, distGoal);
    if (stepLen <= 0) return;

    const heading = Math.atan2(goal.y - unit.y, goal.x - unit.x);
    for (const turn of SIDESTEP_TURNS) {
      const nx = clampFieldX(unit.x + Math.cos(heading + turn) * stepLen);
      const ny = clampFieldY(unit.y + Math.sin(heading + turn) * stepLen);
      // every step must bring the robot closer, so it never wanders back and forth
      if (Math.hypot(goal.x - nx, goal.y - ny) >= distGoal - 1e-6) continue;
      if (this.crowdsAnotherUnit(unit, nx, ny, state.units)) continue;
      unit.x = nx;
      unit.y = ny;
      unit.col = Math.min(BALANCE.GRID_COLS - 1, Math.floor(nx));
      unit.row = Math.min(BALANCE.GRID_ROWS - 1, Math.floor(ny));
      return;
    }
  }

  /** The enemy a robot walks to: the closest one, with a lean toward those nearer the boiler. */
  private static findApproachTarget(unit: CombatUnit, enemies: CombatEnemy[]): CombatEnemy | null {
    let best: CombatEnemy | null = null;
    let bestScore = Infinity;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const score = Math.hypot(enemy.x - unit.x, enemy.y - unit.y) + enemy.x * 0.2;
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  /** The closest free spot next to the enemy for a melee robot (front first, then flanks, then behind). */
  private static meleeApproachPoint(unit: CombatUnit, enemy: CombatEnemy, units: CombatUnit[]): { x: number; y: number } {
    let best: { x: number; y: number } | null = null;
    let bestScore = Infinity;
    for (const spot of MELEE_SPOTS) {
      const x = clampFieldX(enemy.x + spot.dx);
      const y = clampFieldY(enemy.y + spot.dy);
      // the field edge can squeeze a spot out of reach
      if (Math.hypot(enemy.x - x, enemy.y - y) > unit.attackRange) continue;
      const taken = units.some(
        (o) => o !== unit && !o.isDead && Math.hypot(o.x - x, o.y - y) < BALANCE.UNIT_SEPARATION
      );
      if (taken) continue;
      const score = Math.hypot(x - unit.x, y - unit.y) + spot.penalty;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
    return best ?? { x: enemy.x, y: enemy.y };
  }

  /** True if standing at (x, y) would push the robot closer than allowed to another robot. */
  private static crowdsAnotherUnit(unit: CombatUnit, x: number, y: number, units: CombatUnit[]): boolean {
    for (const o of units) {
      if (o === unit || o.isDead) continue;
      const after = Math.hypot(o.x - x, o.y - y);
      if (after >= BALANCE.UNIT_SEPARATION) continue;
      // already too close (e.g. pushed by knockback): allowed only to move apart
      if (after < Math.hypot(o.x - unit.x, o.y - unit.y)) return true;
    }
    return false;
  }

  /** The nearest robot in the enemy's lane that it can reach: the front line shields the back line. */
  private static findDefenderInRange(enemy: CombatEnemy, units: CombatUnit[]): CombatUnit | null {
    let nearest: CombatUnit | null = null;
    let nearestDx = Infinity;
    for (const unit of units) {
      if (unit.isDead) continue;
      // In same row lane and within enemy attack range
      if (Math.abs(unit.y - enemy.y) < 0.6) {
        const dx = enemy.x - unit.x;
        if (dx >= 0 && dx <= enemy.attackRange && dx < nearestDx) {
          nearest = unit;
          nearestDx = dx;
        }
      }
    }
    return nearest;
  }

  private static executeUnitAttack(
    unit: CombatUnit,
    target: CombatEnemy,
    state: CombatSimulationState,
    rng: PRNG
  ): void {
    state.events.push({
      type: 'attack',
      sourceId: unit.id,
      targetId: target.id
    });

    // Damage calculation: Max(1, Dmg - Armor), shaped by the unit's class ability
    let rawDmg = unit.damage;

    // Check shock on target
    if (target.statuses.shockDuration > 0) {
      rawDmg *= (1 + target.statuses.shockBonusPct);
    }

    const shaped = modifyOutgoing(unit, target, state, rawDmg, target.armor, rng);
    rawDmg = shaped.rawDmg;

    // Check crit chance (an execute-style ability replaces the normal crit roll)
    const critChance = unit.sourceUnit.mods.reduce((acc, m) => acc + (m.statModifiers?.critChancePct ?? 0), 0.05);
    if (!shaped.critReplaced && rng.next() < critChance) {
      const critMult = unit.sourceUnit.mods.reduce((acc, m) => acc + (m.statModifiers?.critDamagePct ?? 0), 2.0);
      rawDmg *= critMult;
    }

    const netDmg = this.damageAfterArmor(rawDmg, shaped.armor);
    hitEnemy(state, unit.id, target, netDmg);

    // Mod trigger effects (burn, shock, stun, lifesteal)
    for (const mod of unit.sourceUnit.mods) {
      if (mod.triggerEffect === 'burn' && mod.triggerParam) {
        target.statuses.burnDps = mod.triggerParam;
        target.statuses.burnDuration = 3.0;
      } else if (mod.triggerEffect === 'shock' && mod.triggerParam) {
        target.statuses.shockBonusPct = mod.triggerParam;
        target.statuses.shockDuration = 4.0;
      } else if (mod.triggerEffect === 'stun' && mod.triggerParam) {
        target.statuses.stunDuration = mod.triggerParam;
      } else if (mod.statModifiers?.lifestealPct) {
        const heal = Math.round(netDmg * mod.statModifiers.lifestealPct);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      }
    }

    // Class ability follow-ups: ricochet, chains, cleave, burn, stun, knockback…
    afterUnitHit(unit, target, state, netDmg, rng);
  }

  private static executeEnemyAttack(
    enemy: CombatEnemy,
    target: CombatUnit,
    state: CombatSimulationState,
    _rng: PRNG
  ): void {
    state.events.push({
      type: 'attack',
      sourceId: enemy.id,
      targetId: target.id
    });

    const netDmg = Math.max(1, Math.round(this.damageAfterArmor(enemy.damage, target.armor) * incomingDamageFactor(target)));

    if (target.shield > 0) {
      if (target.shield >= netDmg) {
        target.shield -= netDmg;
      } else {
        const leftover = netDmg - target.shield;
        target.shield = 0;
        target.hp -= leftover;
      }
    } else {
      target.hp -= netDmg;
    }

    state.events.push({
      type: 'damage',
      sourceId: enemy.id,
      targetId: target.id,
      amount: netDmg
    });

    // Class ability: reflect part of the hit back
    afterUnitStruck(target, enemy, state, netDmg);

    if (target.hp <= 0) {
      target.isDead = true;
      state.events.push({
        type: 'death',
        sourceId: target.id
      });
      // Class ability: explode on destruction
      onUnitDeath(target, state);
    }
  }
}
