import { BALANCE } from '@data/balance';
import { UnitInstance } from '../units/unitFactory';
import { EnemyDefinition } from '@data/schemas/enemySchema';
import { ENEMIES_DATA } from '@data/enemies';
import { PRNG } from '../prng/sfc32';

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
    sequence: number
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
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
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

      if (unit.statuses.stunDuration > 0) continue;

      unit.attackCooldown -= dt;
      if (unit.attackCooldown <= 0) {
        // Target selection
        const target = this.findBestEnemyTarget(unit, state.enemies);
        if (target) {
          this.executeUnitAttack(unit, target, state, rng);
          const effectiveAttackSpeed = unit.statuses.slowDuration > 0
            ? unit.attackSpeed * (1 - unit.statuses.slowRatio)
            : unit.attackSpeed;
          unit.attackCooldown = 1.0 / Math.max(0.2, effectiveAttackSpeed);
        }
      }
    }

    // 4. Enemies action & movement loop
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
      } else {
        // Advance leftward
        let effectiveMoveSpeed = enemy.moveSpeed;
        if (state.valveSlowRemaining > 0) {
          effectiveMoveSpeed *= (1 - BALANCE.VALVE_SLOW_RATIO);
        } else if (enemy.statuses.slowDuration > 0) {
          effectiveMoveSpeed *= (1 - enemy.statuses.slowRatio);
        }

        enemy.x -= effectiveMoveSpeed * dt;

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

  private static findDefenderInRange(enemy: CombatEnemy, units: CombatUnit[]): CombatUnit | null {
    for (const unit of units) {
      if (unit.isDead) continue;
      // In same row lane and within enemy attack range
      if (Math.abs(unit.y - enemy.y) < 0.6) {
        const dx = enemy.x - unit.x;
        if (dx >= 0 && dx <= enemy.attackRange) {
          return unit;
        }
      }
    }
    return null;
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

    // Damage calculation: Max(1, Dmg - Armor)
    let rawDmg = unit.damage;

    // Check shock on target
    if (target.statuses.shockDuration > 0) {
      rawDmg *= (1 + target.statuses.shockBonusPct);
    }

    // Check crit chance
    const critChance = unit.sourceUnit.mods.reduce((acc, m) => acc + (m.statModifiers?.critChancePct ?? 0), 0.05);
    if (rng.next() < critChance) {
      const critMult = unit.sourceUnit.mods.reduce((acc, m) => acc + (m.statModifiers?.critDamagePct ?? 0), 2.0);
      rawDmg *= critMult;
    }

    const netDmg = Math.max(1, Math.round(rawDmg - target.armor));

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
        target.statuses.shockDuration = 4.0;
      } else if (mod.triggerEffect === 'stun' && mod.triggerParam) {
        target.statuses.stunDuration = mod.triggerParam;
      } else if (mod.statModifiers?.lifestealPct) {
        const heal = Math.round(netDmg * mod.statModifiers.lifestealPct);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      }
    }

    // Quirk: recoil spring (ricochet)
    if (unit.sourceUnit.quirkId === 'quirk_recoil_spring' && rng.next() < 0.2) {
      const secondary = state.enemies.find((e) => !e.isDead && e.id !== target.id && Math.abs(e.x - target.x) < 2.0);
      if (secondary) {
        const bounceDmg = Math.max(1, Math.round(netDmg * 0.6));
        secondary.hp -= bounceDmg;
        state.events.push({
          type: 'damage',
          sourceId: unit.id,
          targetId: secondary.id,
          amount: bounceDmg
        });
        if (secondary.hp <= 0) {
          secondary.isDead = true;
          state.cogsEarned += secondary.def.bountyCogs ?? 1;
        }
      }
    }

    // Quirk: chain lightning
    if (unit.sourceUnit.quirkId === 'quirk_electric_conduction') {
      const secondary = state.enemies.find((e) => !e.isDead && e.id !== target.id && Math.abs(e.x - target.x) < 2.5);
      if (secondary) {
        const chainDmg = Math.max(1, Math.round(netDmg * 0.5));
        secondary.hp -= chainDmg;
        secondary.statuses.shockBonusPct = 0.2;
        secondary.statuses.shockDuration = 3.0;
        state.events.push({
          type: 'damage',
          sourceId: unit.id,
          targetId: secondary.id,
          amount: chainDmg
        });
        if (secondary.hp <= 0) {
          secondary.isDead = true;
          state.cogsEarned += secondary.def.bountyCogs ?? 1;
        }
      }
    }

    if (target.hp <= 0) {
      target.isDead = true;
      const bounty = target.def.bountyCogs ?? 1;
      state.cogsEarned += bounty;
      state.events.push({
        type: 'death',
        sourceId: target.id,
        amount: bounty
      });
    }
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

    const netDmg = Math.max(1, Math.round(enemy.damage - target.armor));

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

    // Quirk: damage reflection (Aegis Bastion)
    if (target.sourceUnit.quirkId === 'quirk_damage_reflection') {
      const reflectDmg = Math.round(netDmg * 0.3);
      enemy.hp -= reflectDmg;
      if (enemy.hp <= 0) {
        enemy.isDead = true;
        state.cogsEarned += enemy.def.bountyCogs ?? 1;
      }
    }

    if (target.hp <= 0) {
      target.isDead = true;
      state.events.push({
        type: 'death',
        sourceId: target.id
      });

      // Quirk: death explosion (Fuse Sapper)
      if (target.sourceUnit.quirkId === 'quirk_death_explosion') {
        for (const e of state.enemies) {
          if (!e.isDead && Math.abs(e.x - target.x) <= 1.5 && Math.abs(e.y - target.y) <= 1.5) {
            e.hp -= 120;
            if (e.hp <= 0) {
              e.isDead = true;
              state.cogsEarned += e.def.bountyCogs ?? 1;
            }
          }
        }
      }
    }
  }
}
