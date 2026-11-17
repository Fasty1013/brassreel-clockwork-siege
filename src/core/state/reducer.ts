import { RunState } from './RunState';
import { SkillManager } from '../skills/skills';
import { RngStreams } from '../prng/prngManager';
import { ReelManager, SlotSymbol } from '../reels/reels';
import { HeatManager } from '../heat/heat';
import { UnitFactory, UnitInstance, UnitLevel } from '../units/unitFactory';
import { SmeltManager } from '../smelt/smelt';
import { CombatEngine } from '../combat/combatEngine';
import { WaveController } from '../waves/waveController';
import { CoreEngine } from '../cores/coreEngine';
import { CoreEffects } from '../cores/coreEffects';
import { EconomyManager } from '../economy/economy';
import { BALANCE } from '@data/balance';
import { CORES_DATA } from '@data/cores';
import { EventBus } from '../events/events';
import { GadgetManager } from '../gadgets/gadgets';

export type RunCommand =
  | { type: 'SPIN' }
  | { type: 'HOLD_REEL'; reelIndex: number }
  | { type: 'NUDGE_REEL'; reelIndex: number; direction: 1 | -1 }
  | { type: 'DEPLOY_UNIT'; unitId: string; col: number; row: number }
  | { type: 'UNDEPLOY_UNIT'; unitId: string }
  | {
      type: 'SMELT_UNITS';
      targetId: string;
      sacrificeId: string;
      sacrificeModIndex?: number;
      targetModIndexToReplace?: number;
    }
  | { type: 'CHOOSE_EVOLUTION'; unitId: string; chosenBranchDefId: string }
  | { type: 'BUY_SKILL'; skillId: string }
  | { type: 'START_BATTLE' }
  | { type: 'STEP_BATTLE'; dt: number }
  | { type: 'USE_VALVE'; choice: 'slow' | 'heal' }
  | { type: 'ADVANCE_TO_SHOP' }
  | { type: 'BUY_SYMBOL'; reelIndex: number; symbol: SlotSymbol; isGilded?: boolean }
  | { type: 'REMOVE_SYMBOL'; reelIndex: number; symbolIndex: number }
  | { type: 'GILD_SYMBOL'; reelIndex: number; symbolIndex: number }
  | { type: 'BUY_GADGET'; gadgetId: string }
  | { type: 'EQUIP_CORE'; coreId: string }
  | { type: 'REROLL_SHOP' }
  | { type: 'START_NEXT_WAVE' };

/** Symbols the workshop sells. */
export const BUYABLE_SYMBOLS: readonly SlotSymbol[] = ['cog', 'spring', 'fuse', 'coil'];

export class RunReducer {
  private static waveController = new WaveController(1);

  /** Rough worth of a robot, used to decide which one leaves a full bench. */
  public static unitWorth(u: UnitInstance): number {
    return 2 ** (u.starRank - 1) * 1000 + u.maxHp + u.damage * 10;
  }

  /**
   * Puts a new robot on the bench. When the bench is full, the weakest robot
   * of the bench and the newcomer is melted down for cogs instead.
   * Returns false when the newcomer itself was melted.
   */
  public static addToBench(state: RunState, unit: UnitInstance, eventBus?: EventBus): boolean {
    if (state.reserveBench.length < BALANCE.BENCH_CAP) {
      state.reserveBench.push(unit);
      return true;
    }
    const weakest = [...state.reserveBench, unit].sort((a, b) => this.unitWorth(a) - this.unitWorth(b))[0];
    const cogs = BALANCE.BENCH_MELT_COGS * 2 ** (weakest.starRank - 1);
    EconomyManager.addCogs(state.economy, cogs);
    eventBus?.emit('bench_overflow', { unitInstanceId: weakest.instanceId, unitDefId: weakest.defId, cogs });
    if (weakest === unit) return false;
    state.reserveBench = state.reserveBench.filter((u) => u !== weakest);
    state.reserveBench.push(unit);
    return true;
  }

  /** Robots may be placed, moved and merged in every phase except battle and the end screens. */
  public static canArrange(state: RunState): boolean {
    return state.phase === 'PREP' || state.phase === 'RESULT' || state.phase === 'SHOP';
  }

  public static dispatch(
    state: RunState,
    command: RunCommand,
    rng: RngStreams,
    eventBus?: EventBus
  ): RunState {
    const coreEngine = new CoreEngine(state.activeCores);

    switch (command.type) {
      case 'SPIN': {
        if (state.phase !== 'PREP') return state;

        // Determine if extra spin with Heat & Steam cost
        const isExtraSpin = state.freeSpinsLeft <= 0;
        if (isExtraSpin) {
          if (!EconomyManager.spendSteam(state.economy, BALANCE.EXTRA_SPIN_STEAM_COST)) {
            return state; // Cannot afford steam
          }
          state.heat.maxHeat = CoreEffects.maxHeat(state);
          state.heat.currentHeat = Math.min(state.heat.maxHeat, state.heat.currentHeat + BALANCE.EXTRA_SPIN_HEAT_ADD);
          eventBus?.emit('heat_changed', { currentHeat: state.heat.currentHeat, delta: BALANCE.EXTRA_SPIN_HEAT_ADD });

          // Jam check
          const jamCheck = HeatManager.rollForJam(
            state.heat,
            rng.reel,
            coreEngine.hasModifier('expand_heat_capacity') ? 0.1 : 0
          );

          if (jamCheck.isJammed && state.consumables.gaskets > 0) {
            // Spare Gasket: the jam is cancelled and the spin goes on
            state.consumables.gaskets--;
          } else if (jamCheck.isJammed) {
            const lockedReel = jamCheck.lockedReelIndex ?? 0;
            if (!GadgetManager.owns(state, 'gadget_insulated_gloves') && !coreEngine.hasModifier('safe_jam')) {
              state.heldReels[lockedReel] = true;
            }

            // Damage random deployed unit if any
            let damagedUnitId: string | undefined;
            if (state.deployedUnits.length > 0 && !coreEngine.hasModifier('safe_jam')) {
              const damaged = rng.combat.pick(state.deployedUnits);
              damagedUnitId = damaged.instanceId;
              damaged.currentHp = Math.max(1, Math.round(damaged.currentHp * 0.75));
            }

            eventBus?.emit('jam_triggered', {
              heat: state.heat.currentHeat,
              damagedUnitId,
              lockedReelIndex: lockedReel
            });
            return state;
          }
        } else {
          state.freeSpinsLeft--;
        }

        // Spin reels
        eventBus?.emit('spin_start', { freeSpinsLeft: state.freeSpinsLeft, heat: state.heat.currentHeat });
        const nextIndices = ReelManager.spinReels(
          state.reelStrips,
          state.reelIndices,
          state.heldReels,
          rng.reel,
          CoreEffects.symbolWeights(state)
        );
        state.reelIndices = nextIndices;
        state.heldReels = [false, false, false]; // Reset holds after spin

        const grid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
        const evalResult = ReelManager.evaluateGrid(grid, {
          mirrorHorizontal: coreEngine.hasModifier('mirror_horizontal_lines'),
          upgradeDiagonal: coreEngine.hasModifier('upgrade_diagonal_tier'),
          omniCenterWild: coreEngine.hasModifier('omni_center_wild')
        });

        state.lastSpinResult = evalResult;

        // Process line hits and summons
        for (const hit of evalResult.lineHits) {
          eventBus?.emit('line_hit', {
            lineIndex: hit.paylineId,
            symbol: hit.faction ?? 'jackpot',
            indices: [hit.coords[0][0], hit.coords[1][0], hit.coords[2][0]],
            isJackpot: hit.matchType === 'jackpot',
            isWild: hit.wildCount > 0
          });
        }

        if (evalResult.isJackpot) {
          eventBus?.emit('jackpot', {
            choices: [
              'unit_legendary_steam_leviathan',
              'unit_legendary_solarion_sun_forge',
              'unit_legendary_chrono_warden'
            ]
          });
          // Summon 1st legendary by default or add to bench
          const legendary = UnitFactory.createUnit('unit_legendary_steam_leviathan', rng.loot, { customStarRank: 3 });
          RunReducer.addToBench(state, legendary, eventBus);
          CoreEffects.onJackpot(state);
        }

        // Hollow Spring: a spin without a 3-in-a-row may turn its first pair into a robot
        if (evalResult.factionHitsCount === 0 && evalResult.pairFaction) {
          const chance = CoreEffects.pairSummonChance(state);
          if (chance > 0 && rng.reel.next() < chance) {
            evalResult.totalSummonsToTrigger.push({ faction: evalResult.pairFaction, tier: 1, isGilded: false });
          }
        }

        // Spring Barrel: every line of Springs brings extra archers
        const extraSprings = CoreEffects.extraSpringSummons(state);
        if (extraSprings > 0) {
          for (const summon of [...evalResult.totalSummonsToTrigger]) {
            if (summon.faction !== 'spring') continue;
            for (let i = 0; i < extraSprings; i++) evalResult.totalSummonsToTrigger.push({ ...summon });
          }
        }

        // Clockwork Relay counts the combo spins of the wave
        if (evalResult.lineHits.length >= 2) {
          state.comboSpinsThisWave = (state.comboSpinsThisWave ?? 0) + 1;
        }

        // Trigger unit summons to bench
        for (const summon of evalResult.totalSummonsToTrigger) {
          let unitDefId = 'unit_scrap_bot';
          if (summon.faction === 'cog') unitDefId = 'unit_cog_knight';
          else if (summon.faction === 'spring') unitDefId = 'unit_spring_archer';
          else if (summon.faction === 'fuse') unitDefId = 'unit_fuse_sapper';
          else if (summon.faction === 'coil') unitDefId = 'unit_coil_sparker';

          const comboMult = BALANCE.COMBO_BONUS[Math.min(4, Math.max(1, evalResult.lineHits.length)) as 1 | 2 | 3 | 4].statMult;
          const unit = UnitFactory.createUnit(unitDefId, rng.loot, {
            isGilded: summon.isGilded,
            comboStatMult: comboMult,
            // Diagonal Dynamo: diagonal lines summon a level higher
            customStarRank: summon.tier > 1 ? (Math.min(BALANCE.MAX_UNIT_LEVEL, summon.tier) as UnitLevel) : undefined
          });
          if (RunReducer.addToBench(state, unit, eventBus)) {
            eventBus?.emit('unit_summoned', {
              unitInstanceId: unit.instanceId,
              unitDefId: unit.defId,
              isGilded: summon.isGilded
            });
          }
        }

        if (evalResult.lineHits.length > 0) {
          state.dryStreak = 0;
        } else if (GadgetManager.scrapPressTriggers(state)) {
          const scrap = UnitFactory.createUnit('unit_scrap_bot', rng.loot);
          if (RunReducer.addToBench(state, scrap, eventBus)) {
            eventBus?.emit('unit_summoned', { unitInstanceId: scrap.instanceId, unitDefId: scrap.defId, isGilded: false });
          }
        }

        return state;
      }

      case 'HOLD_REEL': {
        if (state.phase !== 'PREP' || state.holdsLeft <= 0) return state;
        if (command.reelIndex >= 0 && command.reelIndex < 3) {
          state.heldReels[command.reelIndex] = !state.heldReels[command.reelIndex];
          if (state.heldReels[command.reelIndex]) {
            state.holdsLeft--;
          } else {
            state.holdsLeft++;
          }
        }
        return state;
      }

      case 'NUDGE_REEL': {
        if (state.phase !== 'PREP' || state.nudgesLeft <= 0) return state;
        const r = command.reelIndex;
        if (r >= 0 && r < 3) {
          const len = state.reelStrips[r].length;
          state.reelIndices[r] = (state.reelIndices[r] + command.direction + len) % len;
          state.nudgesLeft--;

          // Re-evaluate 3x3 grid after nudge
          const grid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
          state.lastSpinResult = ReelManager.evaluateGrid(grid);
        }
        return state;
      }

      case 'DEPLOY_UNIT': {
        // Robots can be placed on ANY grid cell, at any time except during battle.
        // Placing onto an occupied cell swaps: a field robot trades cells, a bench
        // robot sends the occupant back to the bench.
        if (!RunReducer.canArrange(state)) return state;
        if (command.col < 0 || command.col >= BALANCE.GRID_COLS || command.row < 0 || command.row >= BALANCE.GRID_ROWS) {
          return state;
        }

        const target = { col: command.col, row: command.row };
        const occupant = state.deployedUnits.find((u) => u.deployedSlot?.col === target.col && u.deployedSlot?.row === target.row);
        if (occupant?.instanceId === command.unitId) return state;

        const deployed = state.deployedUnits.find((u) => u.instanceId === command.unitId);
        if (deployed) {
          // move within the field (swap with the occupant if any)
          if (occupant) occupant.deployedSlot = deployed.deployedSlot ? { ...deployed.deployedSlot } : undefined;
          deployed.deployedSlot = target;
          return state;
        }

        const benchIdx = state.reserveBench.findIndex((u) => u.instanceId === command.unitId);
        if (benchIdx === -1) return state;
        // field limit: a new robot needs a free place (swapping with an occupant keeps the count)
        if (!occupant && state.deployedUnits.length >= SkillManager.unitCap(state)) return state;
        const [unit] = state.reserveBench.splice(benchIdx, 1);
        if (occupant) {
          state.deployedUnits = state.deployedUnits.filter((u) => u.instanceId !== occupant.instanceId);
          occupant.deployedSlot = undefined;
          state.reserveBench.splice(benchIdx, 0, occupant);
        }
        unit.deployedSlot = target;
        state.deployedUnits.push(unit);
        return state;
      }

      case 'BUY_SKILL': {
        if (SkillManager.canBuy(state, command.skillId, RunReducer.canArrange(state)) !== null) return state;
        SkillManager.buy(state, command.skillId);
        return state;
      }

      case 'UNDEPLOY_UNIT': {
        if (!RunReducer.canArrange(state)) return state;
        if (state.reserveBench.length >= BALANCE.BENCH_CAP) return state; // no free bench slot
        const depIdx = state.deployedUnits.findIndex((u) => u.instanceId === command.unitId);
        if (depIdx !== -1) {
          const [unit] = state.deployedUnits.splice(depIdx, 1);
          unit.deployedSlot = undefined;
          state.reserveBench.push(unit);
        }
        return state;
      }

      case 'SMELT_UNITS': {
        if (!RunReducer.canArrange(state)) return state;
        const allUnits = [...state.reserveBench, ...state.deployedUnits];
        const target = allUnits.find((u) => u.instanceId === command.targetId);
        const sacrifice = allUnits.find((u) => u.instanceId === command.sacrificeId);

        if (!target || !sacrifice || target.instanceId === sacrifice.instanceId) {
          return state;
        }

        const smeltResult = SmeltManager.smelt(target, sacrifice, {
          sacrificeModIndex: command.sacrificeModIndex,
          targetModIndexToReplace: command.targetModIndexToReplace
        });

        if (!smeltResult.merged) {
          // not the same line / level: nothing happens, the UI explains why
          return state;
        }

        // Forge Wrench: every merge teaches the robot one more mod
        if (GadgetManager.owns(state, 'gadget_cog_wrench')) {
          const owned = new Set(target.mods.map((m) => m.id));
          const [mod] = UnitFactory.rollMods(1, target.isGilded, rng.loot).filter((m) => !owned.has(m.id));
          if (mod) {
            target.mods.push(mod);
            SmeltManager.applyLevelStats(target);
          }
        }

        // Remove sacrifice from bench or deployed
        state.reserveBench = state.reserveBench.filter((u) => u.instanceId !== sacrifice.instanceId);
        state.deployedUnits = state.deployedUnits.filter((u) => u.instanceId !== sacrifice.instanceId);

        if (coreEngine.hasModifier('smelt_refund_steam')) {
          EconomyManager.addSteam(state.economy, 1);
        }
        CoreEffects.onMerge(state, target, rng.loot);

        eventBus?.emit('unit_smelted', {
          targetId: target.instanceId,
          sacrificeId: sacrifice.instanceId,
          xpAdded: smeltResult.xpGained,
          newTotalXp: smeltResult.totalXp
        });

        if (smeltResult.evolutionAvailable && smeltResult.evolutionBranchA && smeltResult.evolutionBranchB) {
          state.pendingEvolutionUnitId = target.instanceId;
          eventBus?.emit('evolution_ready', {
            unitInstanceId: target.instanceId,
            branchA: smeltResult.evolutionBranchA,
            branchB: smeltResult.evolutionBranchB
          });
        }

        return state;
      }

      case 'CHOOSE_EVOLUTION': {
        const allUnits = [...state.reserveBench, ...state.deployedUnits];
        const unit = allUnits.find((u) => u.instanceId === command.unitId);
        if (unit) {
          SmeltManager.evolveUnit(unit, command.chosenBranchDefId, rng.loot);
          state.pendingEvolutionUnitId = undefined;
        }
        return state;
      }

      case 'START_BATTLE': {
        if (state.phase !== 'PREP') return state;
        state.phase = 'BATTLE';
        state.combatState = CombatEngine.initCombatState(state.deployedUnits, state.boilerHp, state.maxBoilerHp);
        SkillManager.applyCombatBuffs(state, state.combatState);
        CoreEffects.applyBattleStart(state, state.combatState);
        GadgetManager.applyBattleStart(state, state.combatState);
        CombatEngine.applyStartQuirks(state.combatState);
        this.waveController = new WaveController(state.waveNumber, state.threat ?? 0);
        this.waveController.initWaveSpawns(rng.combat);
        eventBus?.emit('wave_started', { waveNumber: state.waveNumber, actNumber: state.actNumber });
        return state;
      }

      case 'STEP_BATTLE': {
        if (state.phase !== 'BATTLE' || !state.combatState) return state;
        this.waveController.update(state.combatState, command.dt, rng.combat);

        state.boilerHp = state.combatState.boilerHp;

        if (state.combatState.isDefeat) {
          state.phase = 'GAME_OVER';
          eventBus?.emit('run_defeat', { waveFailed: state.waveNumber });
        } else if (state.combatState.isVictory) {
          state.phase = 'RESULT';
          const waveDef = this.waveController.getCurrentWaveDef();
          const earned = waveDef.rewardCogs + state.combatState.cogsEarned + SkillManager.bonusWaveCogs(state);
          EconomyManager.addCogs(state.economy, earned);
          eventBus?.emit('wave_completed', { waveNumber: state.waveNumber, rewardCogs: earned });

          // Inspection check on wave 5
          if (waveDef.isInspection) {
            const inspection = this.waveController.evaluateInspectionChallenge(state.combatState, state.deployedUnits.length);
            if (inspection.success) {
              EconomyManager.addCogs(state.economy, inspection.bonusCogs);
            } else {
              state.boilerHp = Math.max(1, state.boilerHp - inspection.penaltyDmg);
            }
            eventBus?.emit('inspection_completed', {
              success: inspection.success,
              bonusCogs: inspection.bonusCogs,
              penaltyDmg: inspection.penaltyDmg
            });
          }

          // Engine Core draft offering every 5 waves
          if (state.waveNumber % 5 === 0 && state.activeCores.length < 3) {
            const available = Object.keys(CORES_DATA).filter((id) => !state.activeCores.includes(id));
            const choices: string[] = [];
            while (choices.length < GadgetManager.coreChoices(state) && available.length > 0) {
              choices.push(available.splice(rng.shop.nextRange(0, available.length - 1), 1)[0]);
            }
            if (choices.length > 0) {
              eventBus?.emit('core_draft_ready', { choices });
            }
          }

          if (state.waveNumber >= 30 && waveDef.isBoss) {
            state.phase = 'VICTORY';
            eventBus?.emit('run_victory', { totalWavesCleared: 30, finalCogs: state.economy.cogs });
          }
        }
        return state;
      }

      case 'USE_VALVE': {
        if (state.phase === 'BATTLE' && state.combatState) {
          CombatEngine.triggerEmergencyValve(state.combatState, command.choice);
        }
        return state;
      }

      case 'ADVANCE_TO_SHOP': {
        if (state.phase === 'RESULT') {
          state.phase = 'SHOP';
          GadgetManager.rollOffers(state, rng.shop);
        }
        return state;
      }

      case 'BUY_SYMBOL': {
        // Reel edits happen in the workshop, within the strip length limits.
        const strip = state.reelStrips[command.reelIndex];
        if (state.phase !== 'SHOP' || !strip || strip.length >= BALANCE.MAX_STRIP_LENGTH) return state;
        if (!BUYABLE_SYMBOLS.includes(command.symbol)) return state;
        const cost = EconomyManager.getAddSymbolCost(GadgetManager.discount(state));
        if (EconomyManager.spendCogs(state.economy, cost)) {
          EconomyManager.addSymbolToStrip(strip, command.symbol, command.isGilded);
        }
        return state;
      }

      case 'REMOVE_SYMBOL': {
        const strip = state.reelStrips[command.reelIndex];
        if (state.phase !== 'SHOP' || !strip || strip.length <= BALANCE.MIN_STRIP_LENGTH) return state;
        if (command.symbolIndex < 0 || command.symbolIndex >= strip.length) return state;
        const cost = EconomyManager.getRemoveSymbolCost(state.economy, GadgetManager.discount(state));
        if (EconomyManager.spendCogs(state.economy, cost)) {
          strip.splice(command.symbolIndex, 1);
          state.economy.removalsCount++;
          // keep the reel's stop position inside the shorter strip
          const r = command.reelIndex as 0 | 1 | 2;
          state.reelIndices[r] = state.reelIndices[r] % strip.length;
        }
        return state;
      }

      case 'GILD_SYMBOL': {
        const strip = state.reelStrips[command.reelIndex];
        const item = strip?.[command.symbolIndex];
        if (state.phase !== 'SHOP' || !item || item.isGilded) return state;
        const cost = CoreEffects.gildCost(state);
        if (EconomyManager.spendCogs(state.economy, cost)) {
          item.isGilded = true;
        }
        return state;
      }

      case 'BUY_GADGET': {
        if (GadgetManager.buy(state, command.gadgetId, rng.shop)) {
          eventBus?.emit('gadget_bought', { gadgetId: command.gadgetId });
        }
        return state;
      }

      case 'EQUIP_CORE': {
        if (state.activeCores.length < 3 && !state.activeCores.includes(command.coreId)) {
          state.activeCores.push(command.coreId);
          eventBus?.emit('core_equipped', { coreId: command.coreId });
        }
        return state;
      }

      case 'REROLL_SHOP': {
        if (state.phase !== 'SHOP') return state;
        const cost = EconomyManager.getRerollCost(state.economy, GadgetManager.discount(state));
        if (EconomyManager.spendCogs(state.economy, cost)) {
          state.economy.freeRerollAvailable = false;
          GadgetManager.rollOffers(state, rng.shop);
        }
        return state;
      }

      case 'START_NEXT_WAVE': {
        if (state.phase === 'SHOP' || state.phase === 'RESULT') {
          state.waveNumber++;
          if (state.waveNumber > 20) {
            state.actNumber = 3;
          } else if (state.waveNumber > 10) {
            state.actNumber = 2;
          } else {
            state.actNumber = 1;
          }
          state.phase = 'PREP';
          state.freeSpinsLeft = BALANCE.FREE_SPINS_PER_WAVE + SkillManager.bonusSpins(state) + state.consumables.spinsNextWave;
          state.consumables.spinsNextWave = 0;
          state.shopOffers = [];
          const leftoverHolds = state.holdsLeft;
          state.holdsLeft = BALANCE.BASE_HOLD_CHARGES + SkillManager.bonusHolds(state);
          state.nudgesLeft = BALANCE.BASE_NUDGE_CHARGES + SkillManager.bonusNudges(state);
          state.heldReels = [false, false, false];
          HeatManager.coolDownAtWaveEnd(state.heat);
          state.heat.currentHeat = Math.max(0, state.heat.currentHeat - GadgetManager.coolingBonus(state));
          EconomyManager.addSteam(state.economy, BALANCE.STEAM_PER_WAVE);
          CoreEffects.onWaveStart(state, leftoverHolds);

          // Restore HP of surviving deployed units
          for (const u of state.deployedUnits) {
            u.currentHp = u.maxHp;
          }
        }
        return state;
      }
    }

    return state;
  }
}
