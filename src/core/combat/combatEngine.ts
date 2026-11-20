import { BALANCE } from '@data/balance';
import { UnitInstance } from '../units/unitFactory';
import { EnemyDefinition } from '@data/schemas/enemySchema';
import { ENEMIES_DATA } from '@data/enemies';
import { PRNG } from '../prng/sfc32';
import type { CombatGadgetMods } from '../gadgets/gadgets';
import { QUIRKS_DATA, QuirkDefinition } from '@data/quirks';
import type { ActiveMutation } from '../waves/enemyEvolution';

/** robots with an attack range up to this many tiles fight in melee */
const MELEE_RANGE_MAX = 1.5;

/** heading changes (radians) that still bring a walking robot closer to its goal */
const SIDESTEP_TURNS = [0, 0.5, -0.5, 1.0, -1.0, 1.4, -1.4];

/** heading changes for walking around an ally in the way (sideways and a bit back), on the chosen side */
const DETOUR_TURNS = [1.6, 2.1, 2.6];

/** a robot boxed in by allies for this long squeezes past them… */
const SQUEEZE_AFTER_S = 0.4;
/** …for this long, ignoring the spacing rule */
const SQUEEZE_S = 0.8;
/** a robot that cannot get closer to its enemy for this long picks another enemy */
const BLOCKED_RETARGET_S = 2;
/** …and leaves the unreachable one alone for this long */
const AVOID_TARGET_S = 3;

/** per-robot walking memory: which side it walks around allies on, and what it is stuck on */
export interface WalkMemory {
  side: 1 | -1;
  /** seconds without getting closer to the enemy */
  blockedFor: number;
  /** seconds left of squeezing past allies */
  squeezeFor: number;
  avoidId: string | null;
  avoidFor: number;
}

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
  /** temporary copy placed by the Portable Turret gadget for one battle */
  isTurret?: boolean;
  /** attacks made this battle (every-Nth-hit quirks) */
  hits?: number;
  /** focus quirk: current target and stacked attack speed */
  focusTargetId?: string;
  focusStacks?: number;
  /** seconds until the next periodic quirk effect (shield auras) */
  quirkTimer?: number;
  /** walking toward enemies out of reach (created on the first step) */
  walk?: WalkMemory;
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
  /** hp + shield at the end of the previous tick, to notice incoming damage */
  /** a robot's attack reached this enemy during the current tick */
  answered: boolean;
  /** how long it has been shooting at a defender without being hit back */
  unansweredSeconds: number;
  /** evolution: mutations this enemy carries (EnemyEvolution.apply) */
  mutations?: ActiveMutation[];
  /** armored: share of robot damage that gets through */
  damageTakenMult?: number;
  /** leaper: jumps over the robot blocking its lane this many times */
  leapsLeft?: number;
  /** bomber: blows up on death, hurting robots around it */
  deathBlast?: { mult: number; radius: number };
  /** sniper: shoots the weakest robot in its lane instead of the nearest */
  targetsWeakest?: boolean;
  statuses: {
    burnDps: number;
    burnDuration: number;
    shockBonusPct: number;
    shockDuration: number;
    stunDuration: number;
    slowRatio: number;
    slowDuration: number;
    /** takes this much more damage from robots (thermal vulnerability) */
    vulnPct?: number;
    vulnDuration?: number;
    /** bosses shrug off new stuns while this runs */
    stunImmune?: number;
    /** seconds left before the enemy can be knocked back again (no knock-lock) */
    knockImmune?: number;
  };
}

export interface CombatEvent {
  type: 'attack' | 'projectile_hit' | 'damage' | 'death' | 'breach' | 'valve_used' | 'boss_phase' | 'leap' | 'blast';
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
  /** how many times the valve was pulled this battle */
  valveUses: number;
  /** effects of the gadgets owned when the battle started */
  gadgetMods?: CombatGadgetMods;
  /** in-battle engine-core rules (CoreEffects.applyBattleStart) */
  coreMods?: { fuseRadiusMult: number; coilExtraJumps: number };
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
        return {
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
      });

    return {
      tickCount: 0,
      elapsedSeconds: 0,
      boilerHp,
      maxBoilerHp,
      valveUsed: false,
      valveUses: 0,
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
   */
  public static spawnEnemy(
    state: CombatSimulationState,
    enemyDefId: string,
    row: number,
    sequence: number,
    scale: { hp: number; damage: number } = { hp: 1, damage: 1 }
  ): CombatEnemy {
    const def = ENEMIES_DATA[enemyDefId];
    if (!def) {
      throw new Error(`Enemy definition not found: ${enemyDefId}`);
    }

    const enemy: CombatEnemy = {
      id: `en_${sequence}_${enemyDefId}`,
      defId: enemyDefId,
      def,
      x: 7.8, // Right edge
      y: row + 0.5,
      row,
      hp: Math.round(def.hp * scale.hp),
      maxHp: Math.round(def.hp * scale.hp),
      damage: Math.round(def.damage * scale.damage),
      attackSpeed: def.attackSpeed,
      attackRange: def.attackRange,
      armor: def.armor ?? 0,
      moveSpeed: def.moveSpeed,
      attackCooldown: 1.0 / def.attackSpeed,
      shield: 0,
      isDead: false,
      isBoss: def.isBoss ?? false,
      bossPhase: 1,
      answered: false,
      unansweredSeconds: 0,
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

    // Shock Mine: the first enemies to arrive are stunned
    const mods = state.gadgetMods;
    if (mods && mods.stunNextSpawns > 0) {
      mods.stunNextSpawns--;
      enemy.statuses.stunDuration = mods.stunSeconds;
    }

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

    if (state.gadgetMods && state.gadgetMods.surgeSeconds > 0) {
      state.gadgetMods.surgeSeconds = Math.max(0, state.gadgetMods.surgeSeconds - dt);
    }

    // 1. Update Emergency Valve slow duration
    if (state.valveSlowRemaining > 0) {
      state.valveSlowRemaining = Math.max(0, state.valveSlowRemaining - dt);
    }

    // 2. Update statuses & tick damage on units and enemies
    this.updateStatuses(state, dt);

    // 3. Defenders action loop
    for (const unit of state.units) {
      if (unit.isDead) continue;

      this.tickPeriodicQuirk(state, unit, dt);
      if (unit.statuses.stunDuration > 0) continue;

      // Placement decides: melee robots hold their cell (stepping at most MELEE_LEASH) and block the lane; a shooter
      // steps at most UNIT_LEASH tiles off its cell, only toward an enemy it can reach from
      // there, and walks back when there is none. (a Portable Turret is bolted down)
      if (!unit.isTurret) {
        if (!this.findBestEnemyTarget(unit, state.enemies)) {
          this.advanceUnit(unit, state, dt);
        } else {
          const w = this.walkOf(unit);
          w.blockedFor = 0;
          w.squeezeFor = 0;
          this.spreadOut(unit, state, dt);
        }
      }

      unit.attackCooldown -= dt;
      if (unit.attackCooldown <= 0) {
        // Target selection
        const target = this.findBestEnemyTarget(unit, state.enemies);
        if (target) {
          this.executeUnitAttack(unit, target, state, rng);
          let effectiveAttackSpeed = unit.statuses.slowDuration > 0
            ? unit.attackSpeed * (1 - unit.statuses.slowRatio)
            : unit.attackSpeed;
          const focus = this.quirk(unit, 'speed_stack');
          if (focus) effectiveAttackSpeed *= 1 + (unit.focusStacks ?? 0) * focus.params.speedPerHitPct;
          unit.attackCooldown = 1.0 / Math.max(0.2, effectiveAttackSpeed);
        }
      }
    }

    // 4. Enemies action & movement loop
    const warden = state.units.find((u) => !u.isDead && this.quirk(u, 'time_dilation'));
    const timeFactor = warden ? 1 - this.quirk(warden, 'time_dilation')!.params.slowPct : 1;
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

      let effectiveMoveSpeed = enemy.moveSpeed * timeFactor;
      if (state.valveSlowRemaining > 0) {
        effectiveMoveSpeed *= (1 - BALANCE.VALVE_SLOW_RATIO);
      } else if (enemy.statuses.slowDuration > 0) {
        effectiveMoveSpeed *= (1 - enemy.statuses.slowRatio);
      }

      // Check for blockers / targets in range
      const targetUnit = this.findDefenderInRange(enemy, state.units);
      // leaper mutation: jumps over the robot that blocks its lane and lands behind it
      if (targetUnit && (enemy.leapsLeft ?? 0) > 0 && targetUnit.x < enemy.x) {
        enemy.leapsLeft = (enemy.leapsLeft ?? 0) - 1;
        enemy.x = Math.max(0.2, targetUnit.x - 1);
        enemy.attackCooldown = Math.max(enemy.attackCooldown, 0.5);
        state.events.push({ type: 'leap', sourceId: enemy.id, targetId: targetUnit.id });
        continue;
      }
      if (targetUnit) {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          this.executeEnemyAttack(enemy, targetUnit, state, rng);
          const effectiveAttackSpeed = enemy.statuses.slowDuration > 0
            ? enemy.attackSpeed * (1 - enemy.statuses.slowRatio)
            : enemy.attackSpeed;
          enemy.attackCooldown = 1.0 / Math.max(0.2, effectiveAttackSpeed);
        }

        // A shooter that nobody answers keeps closing in on its target until
        // it is hit or stands in melee reach. Without this a ranged enemy and
        // a defender out of everyone's range would trade shots forever.
        // (reflected damage, burns and explosions do not count as an answer)
        enemy.unansweredSeconds = enemy.answered ? 0 : enemy.unansweredSeconds + dt;
        if (enemy.unansweredSeconds >= BALANCE.ENEMY_PRESS_AFTER_S) {
          const gap = enemy.x - targetUnit.x - BALANCE.ENEMY_PRESS_MIN_GAP;
          if (gap > 0) enemy.x -= Math.min(gap, effectiveMoveSpeed * dt);
        }
      } else {
        enemy.unansweredSeconds = 0;

        // Advance leftward
        enemy.x -= effectiveMoveSpeed * dt;

        // Check for breach at column 0 border (x <= 0)
        if (enemy.x <= 0.1) {
          enemy.isDead = true;
          let leakDmg = enemy.isBoss ? 3 : 1;
          if (state.gadgetMods && state.gadgetMods.freeLeaks > 0) {
            state.gadgetMods.freeLeaks--;
            leakDmg = 0;
          }
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

    for (const enemy of state.enemies) {
      enemy.answered = false;
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
    state.valveUses++;
    // Chrono Gear: the valve is ready again right away
    const extra = state.gadgetMods?.extraValves ?? 0;
    if (extra > 0 && state.gadgetMods) {
      state.gadgetMods.extraValves--;
    } else {
      state.valveUsed = true;
    }

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

  /** Cogs for a destroyed enemy (plus the Collector's Magnet bonus). */
  private static bounty(state: CombatSimulationState, enemy: CombatEnemy): number {
    return (enemy.def.bountyCogs ?? 1) + (state.gadgetMods?.extraBountyCogs ?? 0);
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
        if (e.hp <= 0) this.killEnemy(state, e);
      }
      if (e.statuses.shockDuration > 0) e.statuses.shockDuration -= dt;
      if (e.statuses.stunDuration > 0) e.statuses.stunDuration -= dt;
      if (e.statuses.slowDuration > 0) e.statuses.slowDuration -= dt;
      if ((e.statuses.vulnDuration ?? 0) > 0) e.statuses.vulnDuration = (e.statuses.vulnDuration ?? 0) - dt;
      if ((e.statuses.stunImmune ?? 0) > 0) e.statuses.stunImmune = (e.statuses.stunImmune ?? 0) - dt;
      if ((e.statuses.knockImmune ?? 0) > 0) e.statuses.knockImmune = (e.statuses.knockImmune ?? 0) - dt;
    }
  }

  private static findBestEnemyTarget(unit: CombatUnit, enemies: CombatEnemy[]): CombatEnemy | null {
    let closestEnemy: CombatEnemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      // lanes: a robot covers its own lane and the neighbouring ones only
      if (!this.inLanes(unit, enemy)) continue;

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
   * block its lane. Robots stay inside the field and never walk into each other:
   * an ally in the way is walked around on one side (kept until the way is clear),
   * and a robot that still cannot get closer for a while goes after another enemy.
   */
  private static advanceUnit(unit: CombatUnit, state: CombatSimulationState, dt: number): void {
    const w = this.walkOf(unit);
    if (w.avoidFor > 0) {
      w.avoidFor -= dt;
      if (w.avoidFor <= 0) w.avoidId = null;
    }

    const home = this.homeOf(unit);
    // shooters may step UNIT_LEASH off their cell, melee robots only MELEE_LEASH (they hold the lane)
    const leash = unit.attackRange > MELEE_RANGE_MAX ? BALANCE.UNIT_LEASH : BALANCE.MELEE_LEASH;
    // only enemies the robot can reach without leaving its leash
    const reachable = state.enemies.filter(
      (e) => !e.isDead && this.inLanes(unit, e) && Math.hypot(e.x - home.x, e.y - home.y) <= unit.attackRange + leash
    );
    const enemy = this.findApproachTarget(unit, reachable, w.avoidId);
    if (!enemy) {
      this.returnHome(unit, state, dt);
      return;
    }

    // the point closest to home from which the enemy is in range (a hair inside)
    const dHome = Math.hypot(enemy.x - home.x, enemy.y - home.y);
    const along = Math.min(leash, Math.max(0, dHome - unit.attackRange + 0.05));
    const goal = dHome > 1e-6
      ? { x: home.x + ((enemy.x - home.x) / dHome) * along, y: home.y + ((enemy.y - home.y) / dHome) * along }
      : home;

    const distGoal = Math.hypot(goal.x - unit.x, goal.y - unit.y);
    if (distGoal < 1e-3) return;

    let speed = unit.moveSpeed;
    if (unit.statuses.slowDuration > 0) speed *= 1 - unit.statuses.slowRatio;
    const stepLen = Math.min(speed * dt, distGoal);
    if (stepLen <= 0) return;

    const heading = Math.atan2(goal.y - unit.y, goal.x - unit.x);
    const distEnemyBefore = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
    const squeezing = w.squeezeFor > 0;
    if (squeezing) w.squeezeFor -= dt;
    const blocked = (x: number, y: number): boolean => !squeezing && this.crowdsAnotherUnit(unit, x, y, state.units);

    // 1. a step that brings the robot closer to its goal
    for (const turn of SIDESTEP_TURNS) {
      const nx = clampFieldX(unit.x + Math.cos(heading + turn) * stepLen);
      const ny = clampFieldY(unit.y + Math.sin(heading + turn) * stepLen);
      if (Math.hypot(goal.x - nx, goal.y - ny) >= distGoal - 1e-6) continue;
      if (blocked(nx, ny)) continue;
      this.placeUnit(unit, nx, ny);
      this.noteProgress(unit, enemy, distEnemyBefore, dt);
      return;
    }

    // 2. the way is taken by allies: walk around them, keeping to one side
    const sides: (1 | -1)[] = [w.side, w.side === 1 ? -1 : 1];
    for (const side of sides) {
      for (const turn of DETOUR_TURNS) {
        const nx = clampFieldX(unit.x + Math.cos(heading + side * turn) * stepLen);
        const ny = clampFieldY(unit.y + Math.sin(heading + side * turn) * stepLen);
        // squeezed against the field edge: this way does not move at all
        if (Math.hypot(nx - unit.x, ny - unit.y) < stepLen * 0.5) continue;
        if (blocked(nx, ny)) continue;
        w.side = side;
        this.placeUnit(unit, nx, ny);
        this.noteProgress(unit, enemy, distEnemyBefore, dt);
        return;
      }
    }

    // 3. boxed in by allies: wait a moment, then squeeze past them straight ahead
    this.noteProgress(unit, enemy, distEnemyBefore, dt);
    if (w.blockedFor >= SQUEEZE_AFTER_S) {
      w.squeezeFor = SQUEEZE_S;
      this.placeUnit(
        unit,
        clampFieldX(unit.x + Math.cos(heading) * stepLen),
        clampFieldY(unit.y + Math.sin(heading) * stepLen)
      );
    }
  }

  /**
   * A robot that ended up too close to an ally (after squeezing past, or pushed) steps
   * away from it while it fights, as long as its enemy stays in reach.
   */
  private static spreadOut(unit: CombatUnit, state: CombatSimulationState, dt: number): void {
    let nearest: CombatUnit | null = null;
    let nearestDist: number = BALANCE.UNIT_SEPARATION;
    for (const o of state.units) {
      if (o === unit || o.isDead) continue;
      const d = Math.hypot(o.x - unit.x, o.y - unit.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = o;
      }
    }
    if (!nearest) return;
    // exactly on top of each other: split by id so the two step opposite ways
    const ax = nearestDist > 1e-6 ? (unit.x - nearest.x) / nearestDist : 0;
    const ay = nearestDist > 1e-6 ? (unit.y - nearest.y) / nearestDist : unit.id < nearest.id ? 1 : -1;
    const step = unit.moveSpeed * 0.5 * dt;
    const nx = clampFieldX(unit.x + ax * step);
    const ny = clampFieldY(unit.y + ay * step);
    const keepsReach = state.enemies.some(
      (e) => !e.isDead && Math.hypot(e.x - nx, e.y - ny) <= unit.attackRange
    );
    if (keepsReach && !this.crowdsAnotherUnit(unit, nx, ny, state.units)) this.placeUnit(unit, nx, ny);
  }

  /** The robot's walking memory; it walks around allies on the side facing the middle of the field. */
  private static walkOf(unit: CombatUnit): WalkMemory {
    if (!unit.walk) {
      unit.walk = { side: unit.row < BALANCE.GRID_ROWS / 2 ? 1 : -1, blockedFor: 0, squeezeFor: 0, avoidId: null, avoidFor: 0 };
    }
    return unit.walk;
  }

  private static placeUnit(unit: CombatUnit, x: number, y: number): void {
    unit.x = x;
    unit.y = y;
    unit.col = Math.min(BALANCE.GRID_COLS - 1, Math.floor(x));
    unit.row = Math.min(BALANCE.GRID_ROWS - 1, Math.floor(y));
  }

  /**
   * Tracks whether the robot actually gets closer to its enemy. Walking around allies
   * for longer than BLOCKED_RETARGET_S without getting closer → that enemy is out of
   * the way for a while and the robot heads for another one.
   */
  private static noteProgress(unit: CombatUnit, enemy: CombatEnemy, distBefore: number, dt: number): void {
    const w = this.walkOf(unit);
    const closer = Math.hypot(enemy.x - unit.x, enemy.y - unit.y) < distBefore - 1e-4;
    w.blockedFor = closer ? Math.max(0, w.blockedFor - dt) : w.blockedFor + dt;
    if (w.blockedFor >= BLOCKED_RETARGET_S) {
      w.blockedFor = 0;
      w.avoidId = enemy.id;
      w.avoidFor = AVOID_TARGET_S;
      w.side = w.side === 1 ? -1 : 1;
    }
  }

  /**
   * The enemy a robot walks to: the closest one, with a lean toward those nearer the boiler.
   * `avoidId` (an enemy it could not get through to) is skipped while there is any other.
   */
  private static findApproachTarget(unit: CombatUnit, enemies: CombatEnemy[], avoidId: string | null = null): CombatEnemy | null {
    let best: CombatEnemy | null = null;
    let bestScore = Infinity;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      if (enemy.id === avoidId && enemies.some((e) => !e.isDead && e.id !== avoidId)) continue;
      const score = Math.hypot(enemy.x - unit.x, enemy.y - unit.y) + enemy.x * 0.2;
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  /** True if the enemy walks in the robot's lane or a neighbouring one (counted from the robot's cell). */
  private static inLanes(unit: CombatUnit, enemy: CombatEnemy): boolean {
    return Math.abs(enemy.y - this.homeOf(unit).y) <= BALANCE.LANE_REACH + 0.1;
  }

  /** The cell the robot was placed on (its post for the battle). */
  private static homeOf(unit: CombatUnit): { x: number; y: number } {
    const slot = unit.sourceUnit.deployedSlot;
    return slot ? { x: slot.col + 0.5, y: slot.row + 0.5 } : { x: unit.x, y: unit.y };
  }

  /** Walks a robot that left its cell straight back to it (allies are not pushed through). */
  private static returnHome(unit: CombatUnit, state: CombatSimulationState, dt: number): void {
    const home = this.homeOf(unit);
    const dist = Math.hypot(home.x - unit.x, home.y - unit.y);
    if (dist < 1e-3) return;
    let speed = unit.moveSpeed;
    if (unit.statuses.slowDuration > 0) speed *= 1 - unit.statuses.slowRatio;
    const step = Math.min(speed * dt, dist);
    const nx = unit.x + ((home.x - unit.x) / dist) * step;
    const ny = unit.y + ((home.y - unit.y) / dist) * step;
    if (!this.crowdsAnotherUnit(unit, nx, ny, state.units) || dist <= step) this.placeUnit(unit, nx, ny);
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
        // a sniper picks the weakest robot in reach, the others the nearest
        const key = enemy.targetsWeakest ? unit.hp + unit.shield : dx;
        if (dx >= 0 && dx <= enemy.attackRange && key < nearestDx) {
          nearest = unit;
          nearestDx = key;
        }
      }
    }
    return nearest;
  }

  // ------------------------------------------------------------ quirks

  /** The unit's quirk if it has the given effect. */
  private static quirk(unit: CombatUnit, effect: QuirkDefinition['effectType']): QuirkDefinition | undefined {
    const q = QUIRKS_DATA[unit.sourceUnit.quirkId];
    return q && q.effectType === effect ? q : undefined;
  }

  /** Battle-start auras (speed field). Call once after all stat buffs. */
  public static applyStartQuirks(state: CombatSimulationState): void {
    for (const src of state.units) {
      const q = this.quirk(src, 'speed_aura');
      if (!q) continue;
      for (const ally of state.units) {
        if (ally === src) continue;
        if (Math.hypot(ally.x - src.x, ally.y - src.y) <= q.params.radiusTiles) {
          ally.attackSpeed = Math.round(ally.attackSpeed * (1 + q.params.speedBuffPct) * 100) / 100;
        }
      }
    }
  }

  /** Shield auras: every few seconds allies around get a shield worth part of the caster's health. */
  private static tickPeriodicQuirk(state: CombatSimulationState, unit: CombatUnit, dt: number): void {
    const q = QUIRKS_DATA[unit.sourceUnit.quirkId];
    if (!q || q.effectType !== 'shield_aura') return;
    unit.quirkTimer = (unit.quirkTimer ?? q.params.intervalSeconds) - dt;
    if (unit.quirkTimer > 0) return;
    unit.quirkTimer = q.params.intervalSeconds;
    const amount = Math.round(unit.maxHp * q.params.shieldPctOfHp);
    for (const ally of state.units) {
      if (ally.isDead || Math.hypot(ally.x - unit.x, ally.y - unit.y) > q.params.radiusTiles) continue;
      ally.shield = Math.max(ally.shield, amount);
    }
  }

  /** Fuse Initiator: blast and fire-pool radius multiplier for Fuse robots. */
  private static fuseRadiusMult(state: CombatSimulationState, unit: CombatUnit): number {
    return unit.sourceUnit.faction === 'fuse' ? state.coreMods?.fuseRadiusMult ?? 1 : 1;
  }

  /** Damage to an enemy outside the main hit (splash, chains, bolts); handles death and bounty. */
  private static dealExtra(
    state: CombatSimulationState,
    unit: CombatUnit,
    enemy: CombatEnemy,
    amount: number,
    fromAttack = true
  ): void {
    if (enemy.isDead) return;
    if (fromAttack) enemy.answered = true;
    const dmg = Math.max(1, Math.round(amount * (enemy.damageTakenMult ?? 1)));
    const absorbed = Math.min(enemy.shield, dmg);
    enemy.shield -= absorbed;
    enemy.hp -= dmg - absorbed;
    state.events.push({ type: 'damage', sourceId: unit.id, targetId: enemy.id, amount: dmg });
    if (enemy.hp <= 0) this.killEnemy(state, enemy);
  }

  private static killEnemy(state: CombatSimulationState, enemy: CombatEnemy): void {
    if (enemy.isDead) return;
    enemy.isDead = true;
    const bounty = this.bounty(state, enemy);
    state.cogsEarned += bounty;
    state.events.push({ type: 'death', sourceId: enemy.id, amount: bounty });
    // bomber mutation: the blast hurts every robot around (armor helps, shields absorb)
    if (enemy.deathBlast) {
      const blast = enemy.damage * enemy.deathBlast.mult;
      for (const u of state.units) {
        if (u.isDead || Math.hypot(u.x - enemy.x, u.y - enemy.y) > enemy.deathBlast.radius) continue;
        const net = Math.max(1, Math.round(blast - u.armor));
        const absorbed = Math.min(u.shield, net);
        u.shield -= absorbed;
        u.hp -= net - absorbed;
        state.events.push({ type: 'damage', sourceId: enemy.id, targetId: u.id, amount: net });
        if (u.hp <= 0) {
          u.isDead = true;
          state.events.push({ type: 'death', sourceId: u.id });
        }
      }
      state.events.push({ type: 'blast', sourceId: enemy.id, amount: Math.round(blast) });
    }
  }

  /** Pushes an enemy back toward its side; afterwards it cannot be pushed again for a while. */
  private static knockBack(enemy: CombatEnemy, tiles: number): void {
    if ((enemy.statuses.knockImmune ?? 0) > 0) return;
    enemy.x = Math.min(7.8, enemy.x + tiles);
    enemy.statuses.knockImmune = BALANCE.KNOCKBACK_IMMUNITY_S;
  }

  /** Stun an enemy; a boss takes a short stun and then ignores stuns for a while. */
  private static stun(enemy: CombatEnemy, seconds: number, bossSeconds: number): void {
    if (enemy.isBoss) {
      if ((enemy.statuses.stunImmune ?? 0) > 0) return;
      enemy.statuses.stunImmune = BALANCE.BOSS_STUN_IMMUNITY_S;
      enemy.statuses.stunDuration = Math.max(enemy.statuses.stunDuration, bossSeconds);
      return;
    }
    enemy.statuses.stunDuration = Math.max(enemy.statuses.stunDuration, seconds);
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
    unit.hits = (unit.hits ?? 0) + 1;
    target.answered = true;
    const quirk = QUIRKS_DATA[unit.sourceUnit.quirkId];
    const qp = quirk?.params ?? {};
    const effect = quirk?.effectType;

    // Damage calculation: Max(1, Dmg - Armor)
    let rawDmg = unit.damage;
    let armor = target.armor;

    // Check shock on target
    if (target.statuses.shockDuration > 0) {
      rawDmg *= (1 + target.statuses.shockBonusPct);
    }
    if ((target.statuses.vulnDuration ?? 0) > 0) {
      rawDmg *= 1 + (target.statuses.vulnPct ?? 0);
    }
    if (state.gadgetMods && state.gadgetMods.surgeSeconds > 0) {
      rawDmg *= state.gadgetMods.surgeMultiplier;
    }
    // armored mutation
    rawDmg *= target.damageTakenMult ?? 1;

    // Quirks that change the main hit
    if (effect === 'crit_execute' && target.hp > target.maxHp * qp.thresholdPct) rawDmg *= qp.damageMult;
    if (effect === 'proximity_mines' && Math.abs(target.x - unit.x) <= qp.rangeTiles) rawDmg *= qp.damageMult;
    if (effect === 'solar_beam') {
      rawDmg *= 1 + qp.bonusDamagePct;
      armor *= 1 - qp.armorShredPct;
    }
    let thunder = false;
    if (effect === 'thunderbolt' && unit.hits % qp.hitInterval === 0) {
      rawDmg *= qp.damageMult;
      thunder = true;
    }

    // Check crit chance
    const critChance = unit.sourceUnit.mods.reduce(
      (acc, m) => acc + (m.statModifiers?.critChancePct ?? 0),
      0.05 + (state.gadgetMods?.critChanceBonus ?? 0)
    );
    if (rng.next() < critChance) {
      const critMult = unit.sourceUnit.mods.reduce((acc, m) => acc + (m.statModifiers?.critDamagePct ?? 0), 2.0);
      rawDmg *= critMult;
    }

    const netDmg = Math.max(1, Math.round(rawDmg - armor));

    // Apply shield absorption first
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
      sourceId: unit.id,
      targetId: target.id,
      amount: netDmg
    });

    // Mod trigger effects (burn, shock, stun, lifesteal)
    for (const mod of unit.sourceUnit.mods) {
      if (mod.triggerEffect === 'burn' && mod.triggerParam) {
        target.statuses.burnDps = mod.triggerParam;
        target.statuses.burnDuration = 3.0;
      } else if (mod.triggerEffect === 'shock' && mod.triggerParam) {
        target.statuses.shockBonusPct = mod.triggerParam;
        target.statuses.shockDuration = 4.0 + (state.gadgetMods?.shockBonusSeconds ?? 0);
      } else if (mod.triggerEffect === 'stun' && mod.triggerParam) {
        this.stun(target, mod.triggerParam, mod.triggerParam / 2);
      } else if (mod.statModifiers?.lifestealPct) {
        const heal = Math.round(netDmg * mod.statModifiers.lifestealPct);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      }
    }

    const others = (): CombatEnemy[] => state.enemies.filter((e) => !e.isDead && e.id !== target.id);
    switch (effect) {
      case 'scrap_scavenge':
        if (rng.next() < qp.cogChance) state.cogsEarned += qp.cogs;
        break;
      case 'stun_charge':
        if (unit.hits % qp.everyNthHit === 0) this.stun(target, qp.stunSeconds, qp.bossStunSeconds);
        break;
      case 'cleave':
        for (const e of others()) {
          if (Math.abs(e.y - target.y) > 0.5 && Math.abs(e.y - target.y) <= 1.1 && Math.abs(e.x - target.x) <= 1) {
            this.dealExtra(state, unit, e, netDmg * qp.cleavePct);
          }
        }
        break;
      case 'ricochet':
        if (rng.next() < qp.chancePct) {
          const secondary = others().find((e) => Math.abs(e.x - target.x) < 2.0);
          if (secondary) this.dealExtra(state, unit, secondary, netDmg * qp.damagePct);
        }
        break;
      case 'pierce': {
        const behind = others()
          .filter((e) => e.row === target.row && e.x > target.x)
          .sort((a, b) => a.x - b.x)
          .slice(0, qp.maxTargets - 1);
        for (const e of behind) this.dealExtra(state, unit, e, Math.max(1, rawDmg - e.armor));
        break;
      }
      case 'burst_fire': {
        const inRange = others().filter((e) => Math.hypot(e.x - unit.x, e.y - unit.y) <= unit.attackRange);
        for (let i = 0; i < qp.extraBolts; i++) {
          const pick = inRange.length > 0 ? rng.pick(inRange) : target;
          this.dealExtra(state, unit, pick, netDmg * qp.damagePct);
        }
        break;
      }
      case 'speed_stack':
        if (unit.focusTargetId === target.id) {
          unit.focusStacks = Math.min(qp.maxStacks, (unit.focusStacks ?? 0) + 1);
        } else {
          unit.focusTargetId = target.id;
          unit.focusStacks = 0;
        }
        break;
      case 'molten_pool': {
        const radius = qp.radiusTiles * this.fuseRadiusMult(state, unit);
        for (const e of [target, ...others()]) {
          if (Math.hypot(e.x - target.x, e.y - target.y) > radius) continue;
          e.statuses.burnDps = Math.max(e.statuses.burnDps, Math.round(unit.damage * qp.burnPctOfDamage));
          e.statuses.burnDuration = qp.durationSeconds;
        }
        break;
      }
      case 'thermal_vuln':
        target.statuses.vulnPct = qp.bonusDamagePct;
        target.statuses.vulnDuration = qp.durationSeconds;
        break;
      case 'knockback':
        if (!target.isBoss && target.hp > 0) this.knockBack(target, qp.tiles);
        break;
      case 'chain_lightning': {
        let from = target;
        const hit = new Set([target.id]);
        // Coil Resonator: Coil lightning jumps further
        const jumps = qp.maxJumps + (unit.sourceUnit.faction === 'coil' ? state.coreMods?.coilExtraJumps ?? 0 : 0);
        for (let j = 0; j < jumps; j++) {
          const next = state.enemies.find((e) => !e.isDead && !hit.has(e.id) && Math.abs(e.x - from.x) < 2.5);
          if (!next) break;
          hit.add(next.id);
          next.statuses.shockBonusPct = Math.max(next.statuses.shockBonusPct, 0.2);
          next.statuses.shockDuration = 3.0 + (state.gadgetMods?.shockBonusSeconds ?? 0);
          this.dealExtra(state, unit, next, netDmg * qp.damageRatio);
          from = next;
        }
        break;
      }
      case 'thunderbolt':
        if (thunder) this.stun(target, qp.stunSeconds, qp.bossStunSeconds);
        break;
      default:
        break;
    }

    // Recoil Buffer: melee hits push ordinary enemies back
    const knockback = state.gadgetMods?.knockbackTiles ?? 0;
    if (knockback > 0 && unit.attackRange <= 2 && !target.isBoss && target.hp > 0) {
      this.knockBack(target, knockback);
    }

    if (target.hp <= 0) this.killEnemy(state, target);
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

    const quirk = QUIRKS_DATA[target.sourceUnit.quirkId];
    const qp = quirk?.params ?? {};
    let incoming = enemy.damage;
    if (quirk?.effectType === 'damage_reduction' || quirk?.effectType === 'steam_shroud') {
      incoming *= 1 - qp.damageReductionPct;
    }
    const netDmg = Math.max(1, Math.round(incoming - target.armor));

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

    // Reflection (Aegis Bastion, Steam Leviathan)
    if (quirk && (quirk.effectType === 'reflect' || quirk.effectType === 'steam_shroud') && !enemy.isDead) {
      this.dealExtra(state, target, enemy, netDmg * qp.reflectPct, false);
    }

    if (target.hp <= 0) {
      target.isDead = true;
      state.events.push({
        type: 'death',
        sourceId: target.id
      });

      // Death explosion (fuse line)
      if (quirk?.effectType === 'death_explosion') {
        const radius = qp.radiusTiles * this.fuseRadiusMult(state, target);
        for (const e of state.enemies) {
          if (!e.isDead && Math.abs(e.x - target.x) <= radius && Math.abs(e.y - target.y) <= radius) {
            this.dealExtra(state, target, e, target.damage * qp.damageMult, false);
          }
        }
      }
    }
  }
}
