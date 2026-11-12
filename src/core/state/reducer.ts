import { RunState } from './RunState';
import { RngStreams } from '../prng/prngManager';
import { ReelManager, SlotSymbol } from '../reels/reels';
import { HeatManager } from '../heat/heat';
import { UnitFactory } from '../units/unitFactory';
import { SmeltManager } from '../smelt/smelt';
import { CombatEngine } from '../combat/combatEngine';
import { WaveController } from '../waves/waveController';
import { CoreEngine } from '../cores/coreEngine';
import { EconomyManager } from '../economy/economy';
import { BALANCE } from '@data/balance';
import { GADGETS_DATA } from '@data/gadgets';
import { CORES_DATA } from '@data/cores';
import { EventBus } from '../events/events';

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

export class RunReducer {
  private static waveController = new WaveController(1);

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
          state.heat.currentHeat = Math.min(state.heat.maxHeat, state.heat.currentHeat + BALANCE.EXTRA_SPIN_HEAT_ADD);
          eventBus?.emit('heat_changed', { currentHeat: state.heat.currentHeat, delta: BALANCE.EXTRA_SPIN_HEAT_ADD });

          // Jam check
          const jamCheck = HeatManager.rollForJam(
            state.heat,
            rng.reel,
            coreEngine.hasModifier('expand_heat_capacity') ? 0.1 : 0
          );

          if (jamCheck.isJammed) {
            const lockedReel = jamCheck.lockedReelIndex ?? 0;
            state.heldReels[lockedReel] = true;

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
          rng.reel
        );
        state.reelIndices = nextIndices;
        state.heldReels = [false, false, false]; // Reset holds after spin

        const grid = ReelManager.extractGrid(state.reelStrips, state.reelIndices);
        const evalResult = ReelManager.evaluateGrid(grid, {
          mirrorHorizontal: coreEngine.hasModifier('mirror_horizontal_lines'),
          upgradeDiagonal: coreEngine.hasModifier('upgrade_diagonal_tier'),
          hollowSpringPairBonus: coreEngine.hasModifier('pair_upgrade_chance') && rng.reel.next() < 0.25,
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
          state.reserveBench.push(legendary);
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
            comboStatMult: comboMult
          });
          state.reserveBench.push(unit);
          eventBus?.emit('unit_summoned', {
            unitInstanceId: unit.instanceId,
            unitDefId: unit.defId,
            isGilded: summon.isGilded
          });
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

      case 'UNDEPLOY_UNIT': {
        if (!RunReducer.canArrange(state)) return state;
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
          targetModIndexToReplace: command.targetModIndexToReplace,
          furnaceBellowsBonus: coreEngine.hasModifier('heat_smelt_bonus') && state.heat.currentHeat > 50,
          cogWrenchBonus: state.activeGadgets.includes('gadget_cog_wrench')
        });

        if (!smeltResult.merged) {
          // not the same line / level: nothing happens, the UI explains why
          return state;
        }

        // Remove sacrifice from bench or deployed
        state.reserveBench = state.reserveBench.filter((u) => u.instanceId !== sacrifice.instanceId);
        state.deployedUnits = state.deployedUnits.filter((u) => u.instanceId !== sacrifice.instanceId);

        if (coreEngine.hasModifier('smelt_refund_steam')) {
          EconomyManager.addSteam(state.economy, 1);
        }

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
        this.waveController = new WaveController(state.waveNumber);
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
          const earned = waveDef.rewardCogs + state.combatState.cogsEarned;
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
            const choices = available.slice(0, 3);
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
        }
        return state;
      }

      case 'BUY_SYMBOL': {
        const cost = EconomyManager.getAddSymbolCost();
        if (EconomyManager.spendCogs(state.economy, cost) && state.reelStrips[command.reelIndex]) {
          EconomyManager.addSymbolToStrip(state.reelStrips[command.reelIndex], command.symbol, command.isGilded);
        }
        return state;
      }

      case 'REMOVE_SYMBOL': {
        const cost = EconomyManager.getRemoveSymbolCost(state.economy);
        if (EconomyManager.canAfford(state.economy, cost) && state.reelStrips[command.reelIndex]) {
          const removed = EconomyManager.removeSymbolFromStrip(state.reelStrips[command.reelIndex], command.symbolIndex);
          if (removed) {
            EconomyManager.spendCogs(state.economy, cost);
            state.economy.removalsCount++;
          }
        }
        return state;
      }

      case 'GILD_SYMBOL': {
        const cost = EconomyManager.getGildSymbolCost();
        if (EconomyManager.spendCogs(state.economy, cost) && state.reelStrips[command.reelIndex]) {
          EconomyManager.gildSymbolOnStrip(state.reelStrips[command.reelIndex], command.symbolIndex);
        }
        return state;
      }

      case 'BUY_GADGET': {
        const gadget = GADGETS_DATA[command.gadgetId];
        if (gadget && EconomyManager.spendCogs(state.economy, gadget.cost)) {
          state.activeGadgets.push(command.gadgetId);
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
        const cost = EconomyManager.getRerollCost(state.economy);
        if (EconomyManager.spendCogs(state.economy, cost)) {
          state.economy.freeRerollAvailable = false;
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
          state.freeSpinsLeft = BALANCE.FREE_SPINS_PER_WAVE;
          state.holdsLeft = BALANCE.BASE_HOLD_CHARGES;
          state.nudgesLeft = BALANCE.BASE_NUDGE_CHARGES;
          state.heldReels = [false, false, false];
          HeatManager.coolDownAtWaveEnd(state.heat);
          EconomyManager.addSteam(state.economy, BALANCE.STEAM_PER_WAVE);

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
