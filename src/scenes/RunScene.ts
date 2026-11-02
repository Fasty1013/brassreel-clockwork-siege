import Phaser from 'phaser';
import { RunState, RunStateManager } from '@core/state/RunState';
import { RunReducer } from '@core/state/reducer';
import { RngStreams, PrngManager } from '@core/prng/prngManager';
import { EventBus } from '@core/events/events';
import { HUD } from '@ui/HUD';
import { ReelView } from '@ui/ReelView';
import { GridView } from '@ui/GridView';
import { UnitCard } from '@ui/UnitCard';
import { Tooltip } from '@ui/Tooltip';
import { ShopView } from '@ui/ShopView';
import { EvolutionModal } from '@ui/EvolutionModal';
import { GADGETS_DATA } from '@data/gadgets';
import { BALANCE } from '@data/balance';
import { ReelManager } from '@core/reels/reels';

interface EnemyVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  hpBarFill: Phaser.GameObjects.Rectangle;
}

export class RunScene extends Phaser.Scene {
  public state!: RunState;
  public rng!: RngStreams;
  public eventBus!: EventBus;

  // UI Components
  public hud!: HUD;
  public reelView!: ReelView;
  public gridView!: GridView;
  public tooltip!: Tooltip;
  public shopView!: ShopView;
  public evolutionModal!: EvolutionModal;

  // Cards & Visuals
  private unitCards: Map<string, UnitCard> = new Map();
  private enemyVisuals: Map<string, EnemyVisual> = new Map();
  private benchSlots: { x: number; y: number }[] = [];

  // Controls
  private spinButton!: Phaser.GameObjects.Rectangle;
  private spinButtonText!: Phaser.GameObjects.Text;
  private nudgeButton!: Phaser.GameObjects.Rectangle;
  private nudgeButtonText!: Phaser.GameObjects.Text;
  private engageButton!: Phaser.GameObjects.Rectangle;
  private engageButtonText!: Phaser.GameObjects.Text;
  private speedButton!: Phaser.GameObjects.Rectangle;
  private speedButtonText!: Phaser.GameObjects.Text;
  private waveInfoText!: Phaser.GameObjects.Text;

  // Boss & Inspection Overlays
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossBarText!: Phaser.GameObjects.Text;
  private inspectionBanner!: Phaser.GameObjects.Container;

  // Wave Result Modal
  private waveResultContainer!: Phaser.GameObjects.Container;
  private waveResultText!: Phaser.GameObjects.Text;

  // Timing & state
  private speedMultiplier = 1;
  private combatAccumulator = 0;
  private isSpinning = false;

  constructor() {
    super('RunScene');
  }

  public create(): void {
    // 1. Initialize deterministic run state & PRNG
    const seed = '20261102';
    this.state = RunStateManager.createInitialState(seed);
    this.rng = PrngManager.createStreams(seed);
    this.eventBus = new EventBus();

    // Reset collections
    this.unitCards.clear();
    this.enemyVisuals.clear();
    this.benchSlots = [];
    this.speedMultiplier = 1;
    this.combatAccumulator = 0;
    this.isSpinning = false;

    // 2. Build Industrial Background
    this.add.rectangle(960, 540, 1920, 1080, 0x14100c);
    const border = this.add.rectangle(960, 540, 1880, 1040);
    border.setStrokeStyle(2, 0x3d2b1f);

    // 3. Mount Sub-Views
    this.hud = new HUD(this);
    this.reelView = new ReelView(this, 240, 310);
    this.gridView = new GridView(this, 480, 100);
    this.tooltip = new Tooltip(this);
    this.shopView = new ShopView(this);
    this.evolutionModal = new EvolutionModal(this);

    // Set initial reel view grid
    const initialGrid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);
    this.reelView.setGrid(initialGrid);

    // 4. Create Bench Area (Vernak)
    this.createBenchArea();

    // 5. Create Slot Machine Controls
    this.createSlotControls();

    // 6. Create Battle Controls & Status Pane
    this.createBattleControls();

    // 7. Create Boss Bar & Inspection Overlays
    this.createSpecialWaveOverlays();

    // 8. Create Wave Victory Overlay
    this.createWaveResultOverlay();

    // 9. Wire Event Listeners
    this.wireEvents();

    // Initial HUD & View update
    this.refreshHUD();
    this.syncUnitCards();
  }

  private createBenchArea(): void {
    // Bench backdrop panel
    const benchBg = this.add.rectangle(1170, 640, 1380, 120, 0x1a1512);
    benchBg.setStrokeStyle(2, 0x8c5836, 0.8);

    this.add.text(490, 586, 'ВЕРСТАК АВТОМАТОНОВ (РЕЗЕРВ • ПЕРЕТАСКИВАЙТЕ НА ПОЛЕ ИЛИ ДРУГ НА ДРУГА ДЛЯ СЛИЯНИЯ):', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold'
    });

    // 12 Bench slot slots
    const startX = 535;
    const slotSpacing = 110;
    for (let i = 0; i < 12; i++) {
      const slotX = startX + i * slotSpacing;
      const slotY = 650;
      const slotOutline = this.add.rectangle(slotX, slotY, 74, 86, 0x221a15);
      slotOutline.setStrokeStyle(1, 0x495057, 0.6);
      this.benchSlots.push({ x: slotX, y: slotY });
    }
  }

  private createSlotControls(): void {
    // Spin Button
    this.spinButton = this.add.rectangle(240, 555, 320, 54, 0xd4a373);
    this.spinButton.setStrokeStyle(3, 0xffd166);
    this.spinButton.setInteractive({ useHandCursor: true });

    this.spinButtonText = this.add.text(240, 555, 'КРУТИТЬ (3/3 БЕСПЛ.)', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.spinButton.on('pointerdown', () => this.handleSpinClick());
    this.spinButton.on('pointerover', () => {
      if (!this.isSpinning) this.spinButton.setFillStyle(0xffd166);
    });
    this.spinButton.on('pointerout', () => {
      if (!this.isSpinning) this.spinButton.setFillStyle(0xd4a373);
    });

    // Nudge Button
    this.nudgeButton = this.add.rectangle(240, 620, 320, 42, 0x2b221a);
    this.nudgeButton.setStrokeStyle(2, 0x8c5836);
    this.nudgeButton.setInteractive({ useHandCursor: true });

    this.nudgeButtonText = this.add.text(240, 620, 'СДВИГ БАРАБАНА (1/1)', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.nudgeButton.on('pointerdown', () => {
      if (this.state.phase === 'PREP' && this.state.nudgesLeft > 0) {
        RunReducer.dispatch(this.state, { type: 'NUDGE_REEL', reelIndex: 1, direction: 1 }, this.rng, this.eventBus);
        const grid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);
        this.reelView.setGrid(grid);
        this.refreshHUD();
      }
    });

    // Hold Reels wiring
    this.reelView.on('toggle_hold', (reelIndex: number) => {
      if (this.state.phase === 'PREP') {
        RunReducer.dispatch(this.state, { type: 'HOLD_REEL', reelIndex }, this.rng, this.eventBus);
        this.reelView.updateHolds(this.state.heldReels);
        this.refreshHUD();
      }
    });
  }

  private createBattleControls(): void {
    // Battle status & control box at (1220, 100)
    const boxX = 1450;
    const boxY = 300;
    const controlBox = this.add.rectangle(boxX, boxY, 500, 400, 0x1a1512);
    controlBox.setStrokeStyle(2, 0x8c5836);

    this.add.text(boxX, boxY - 170, '★ СТАВКА КОМАНДОВАНИЯ ★', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.waveInfoText = this.add.text(boxX, boxY - 90, 'Волна 1: Нашествие мародёров\nОжидаемые враги: Скрапперы, Дроны', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#e9ecef',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Engage Button
    this.engageButton = this.add.rectangle(boxX, boxY + 30, 360, 60, 0x2a9d8f);
    this.engageButton.setStrokeStyle(3, 0xffd166);
    this.engageButton.setInteractive({ useHandCursor: true });

    this.engageButtonText = this.add.text(boxX, boxY + 30, 'В БОЙ ▶ (ОТРАЗИТЬ ВОЛНУ)', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.engageButton.on('pointerdown', () => this.handleEngageClick());
    this.engageButton.on('pointerover', () => this.engageButton.setFillStyle(0x38b000));
    this.engageButton.on('pointerout', () => this.engageButton.setFillStyle(0x2a9d8f));

    // Game Speed Button
    this.speedButton = this.add.rectangle(boxX, boxY + 115, 260, 44, 0x2b221a);
    this.speedButton.setStrokeStyle(2, 0x8c5836);
    this.speedButton.setInteractive({ useHandCursor: true });

    this.speedButtonText = this.add.text(boxX, boxY + 115, 'СКОРОСТЬ: 1×', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.speedButton.on('pointerdown', () => {
      if (this.speedMultiplier === 1) this.speedMultiplier = 2;
      else if (this.speedMultiplier === 2) this.speedMultiplier = 4;
      else this.speedMultiplier = 1;
      this.speedButtonText.setText(`СКОРОСТЬ: ${this.speedMultiplier}×`);
    });
  }

  private createSpecialWaveOverlays(): void {
    // Boss Bar at top center
    this.bossBarContainer = this.add.container(960, 85);

    const bossBarBg = this.add.rectangle(0, 0, 640, 26, 0x221010);
    bossBarBg.setStrokeStyle(2, 0xe63946);
    this.bossBarContainer.add(bossBarBg);

    this.bossBarFill = this.add.rectangle(-318, 0, 636, 22, 0xe63946);
    this.bossBarFill.setOrigin(0, 0.5);
    this.bossBarContainer.add(this.bossBarFill);

    this.bossBarText = this.add.text(0, 0, '★ ПАРОВОЙ БАРОН [ФАЗА 1: ДАВЛЕНИЕ] ★', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.bossBarContainer.add(this.bossBarText);

    this.bossBarContainer.setVisible(false);
    this.bossBarContainer.setDepth(200);

    // Inspection Banner
    this.inspectionBanner = this.add.container(960, 85);
    const inspectBg = this.add.rectangle(0, 0, 720, 32, 0x1f1610);
    inspectBg.setStrokeStyle(2, 0xffd166);
    this.inspectionBanner.add(inspectBg);

    const inspectText = this.add.text(0, 0, '★ ПРОВЕРКА ОТК: Победить за 40 сек! Награда: +50 Шестерней ★', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.inspectionBanner.add(inspectText);

    this.inspectionBanner.setVisible(false);
    this.inspectionBanner.setDepth(200);
  }

  private createWaveResultOverlay(): void {
    this.waveResultContainer = this.add.container(960, 540);

    const overlay = this.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.7);
    overlay.setInteractive();
    this.waveResultContainer.add(overlay);

    const panel = this.add.rectangle(0, 0, 600, 320, 0x1f1610);
    panel.setStrokeStyle(4, 0xffd166);
    this.waveResultContainer.add(panel);

    const title = this.add.text(0, -90, '★ ВОЛНА ОТРАЖЕНА! ★', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.waveResultContainer.add(title);

    this.waveResultText = this.add.text(0, -20, 'Награда за оборону: +25 Шестерней', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#e9ecef'
    }).setOrigin(0.5);
    this.waveResultContainer.add(this.waveResultText);

    const toShopBtn = this.add.rectangle(0, 65, 300, 52, 0xd4a373);
    toShopBtn.setStrokeStyle(2, 0xffd166);
    toShopBtn.setInteractive({ useHandCursor: true });
    this.waveResultContainer.add(toShopBtn);

    const toShopTxt = this.add.text(0, 65, 'В МАСТЕРСКУЮ ГОРНА ▶', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#1f1610',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.waveResultContainer.add(toShopTxt);

    toShopBtn.on('pointerdown', () => {
      this.waveResultContainer.setVisible(false);
      this.openShop();
    });

    this.waveResultContainer.setVisible(false);
    this.waveResultContainer.setDepth(700);
  }

  private wireEvents(): void {
    // Valve usage
    this.hud.on('use_valve', (choice: 'slow' | 'heal') => {
      if (this.state.phase === 'BATTLE') {
        RunReducer.dispatch(this.state, { type: 'USE_VALVE', choice }, this.rng, this.eventBus);
        this.refreshHUD();
      }
    });

    // Evolution selection
    this.evolutionModal.on('evolution_selected', (data: { unitId: string; chosenBranchDefId: string }) => {
      RunReducer.dispatch(this.state, { type: 'CHOOSE_EVOLUTION', unitId: data.unitId, chosenBranchDefId: data.chosenBranchDefId }, this.rng, this.eventBus);
      this.syncUnitCards();
    });

    // Shop actions
    this.shopView.on('buy_symbol', (reelIndex: number, symbol: any) => {
      RunReducer.dispatch(this.state, { type: 'BUY_SYMBOL', reelIndex, symbol }, this.rng, this.eventBus);
      this.refreshHUD();
      this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(0, 3));
    });

    this.shopView.on('gild_symbol', (reelIndex: number, symbolIndex: number) => {
      RunReducer.dispatch(this.state, { type: 'GILD_SYMBOL', reelIndex, symbolIndex }, this.rng, this.eventBus);
      this.refreshHUD();
      this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(0, 3));
    });

    this.shopView.on('remove_symbol', (reelIndex: number, symbolIndex: number) => {
      RunReducer.dispatch(this.state, { type: 'REMOVE_SYMBOL', reelIndex, symbolIndex }, this.rng, this.eventBus);
      this.refreshHUD();
      this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(0, 3));
    });

    this.shopView.on('buy_gadget', (gadgetId: string) => {
      RunReducer.dispatch(this.state, { type: 'BUY_GADGET', gadgetId }, this.rng, this.eventBus);
      this.refreshHUD();
      this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(0, 3));
    });

    this.shopView.on('reroll_shop', () => {
      RunReducer.dispatch(this.state, { type: 'REROLL_SHOP' }, this.rng, this.eventBus);
      this.refreshHUD();
      this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(3, 6));
    });

    this.shopView.on('close_shop', () => {
      this.shopView.hideShop();
      RunReducer.dispatch(this.state, { type: 'START_NEXT_WAVE' }, this.rng, this.eventBus);
      this.startPrepPhase();
    });

    // Evolution ready event from core
    this.eventBus.on('evolution_ready', (data) => {
      this.evolutionModal.showEvolution(data.unitInstanceId, data.branchA, data.branchB);
    });

    // Smelt text floater
    this.eventBus.on('unit_smelted', (data) => {
      const card = this.unitCards.get(data.targetId);
      if (card) {
        this.showFloatingText(card.x, card.y - 30, `+${data.xpAdded} XP (Сплав!)`, '#ffd166');
      }
    });
  }

  public deployUnit(unitId: string, col: number, row: number): void {
    RunReducer.dispatch(this.state, { type: 'DEPLOY_UNIT', unitId, col, row }, this.rng, this.eventBus);
    this.syncUnitCards();
    this.refreshHUD();
  }

  public handleSpinClick(): void {
    if (this.isSpinning || this.state.phase !== 'PREP') return;

    // Check if extra spin and can't afford steam
    if (this.state.freeSpinsLeft <= 0 && this.state.economy.steam < BALANCE.EXTRA_SPIN_STEAM_COST) {
      this.showFloatingText(240, 500, 'Недостаточно Пара!', '#e63946');
      return;
    }

    this.isSpinning = true;
    this.spinButtonText.setText('ВРАЩЕНИЕ...');
    this.spinButton.setFillStyle(0x6c757d);

    // Dispatch spin
    RunReducer.dispatch(this.state, { type: 'SPIN' }, this.rng, this.eventBus);
    const finalGrid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);

    this.reelView.playSpinAnimation(finalGrid, this.state.heldReels, () => {
      this.isSpinning = false;
      this.refreshHUD();

      if (this.state.lastSpinResult) {
        this.reelView.highlightWinningLines(this.state.lastSpinResult);
      }

      this.syncUnitCards();
    });
  }

  public handleEngageClick(): void {
    if (this.state.phase !== 'PREP') return;

    if (this.state.deployedUnits.length === 0) {
      this.showFloatingText(960, 300, 'Разместите хотя бы одного автоматона на поле!', '#ffd166');
      return;
    }

    // Switch to Battle Phase
    RunReducer.dispatch(this.state, { type: 'START_BATTLE' }, this.rng, this.eventBus);
    this.reelView.clearPaylines();

    // Disable prep interactions
    this.spinButton.setFillStyle(0x343a40);
    this.spinButtonText.setText('БОЙ В ПРОЦЕССЕ');
    this.engageButton.setFillStyle(0x343a40);
    this.engageButtonText.setText('ОБОРОНА ВЕДЕТСЯ...');

    for (const card of this.unitCards.values()) {
      card.disableInteractive();
    }

    // Check boss or inspection
    if (this.state.waveNumber === 10) {
      this.bossBarContainer.setVisible(true);
    } else if (this.state.waveNumber === 5) {
      this.inspectionBanner.setVisible(true);
    }

    this.refreshHUD();
  }

  public override update(_time: number, delta: number): void {
    if (this.state.phase === 'BATTLE' && this.state.combatState) {
      this.combatAccumulator += (delta / 1000) * this.speedMultiplier;

      // Fixed timestep 0.05s
      while (this.combatAccumulator >= 0.05) {
        RunReducer.dispatch(this.state, { type: 'STEP_BATTLE', dt: 0.05 }, this.rng, this.eventBus);
        this.combatAccumulator -= 0.05;

        // Process visual events
        this.processCombatEvents();

        if (this.state.phase !== 'BATTLE') break;
      }

      this.syncCombatEntities();
      this.refreshHUD();

      // Check battle end
      const postCombatPhase = this.state.phase as string;
      if (postCombatPhase === 'RESULT') {
        this.handleWaveVictory();
      } else if (postCombatPhase === 'GAME_OVER') {
        this.handleGameOver(false);
      } else if (postCombatPhase === 'VICTORY') {
        this.handleGameOver(true);
      }
    }
  }

  private processCombatEvents(): void {
    if (!this.state.combatState) return;

    for (const ev of this.state.combatState.events) {
      if (ev.type === 'breach') {
        this.cameras.main.shake(300, 0.015);
        this.showFloatingText(480, 300, 'ПРОРЫВ К КОТЛУ! -1 HP', '#e63946');
      } else if (ev.type === 'boss_phase') {
        this.bossBarText.setText('★ ПАРОВОЙ БАРОН [ФАЗА 2: ПЕРЕГРЕВ] ★');
        this.bossBarFill.setFillStyle(0xff0054);
        this.cameras.main.flash(400, 255, 60, 0);
      } else if (ev.type === 'damage' && ev.x !== undefined && ev.y !== undefined) {
        const pos = this.gridView.getSlotWorldPos(Math.floor(ev.x), ev.y);
        this.showFloatingText(pos.x, pos.y - 15, `-${ev.amount}`, '#e63946');
      }
    }
  }

  private syncCombatEntities(): void {
    if (!this.state.combatState) return;

    // 1. Sync defender unit HP
    for (const u of this.state.combatState.units) {
      const card = this.unitCards.get(u.id);
      if (card) {
        card.updateHealth(u.hp, u.maxHp);
      }
    }

    // 2. Sync enemy sprites
    const currentEnemyIds = new Set(this.state.combatState.enemies.filter((e) => !e.isDead).map((e) => e.id));

    // Remove dead/cleared enemies
    for (const [id, visual] of this.enemyVisuals.entries()) {
      if (!currentEnemyIds.has(id)) {
        visual.container.destroy();
        this.enemyVisuals.delete(id);
      }
    }

    // Add or update active enemies
    for (const enemy of this.state.combatState.enemies) {
      if (enemy.isDead) continue;

      let visual = this.enemyVisuals.get(enemy.id);
      if (!visual) {
        const container = this.add.container(0, 0);
        const sprite = this.add.sprite(0, 0, enemy.def.spriteKey);
        sprite.setDisplaySize(enemy.isBoss ? 56 : 38, enemy.isBoss ? 56 : 38);
        container.add(sprite);

        const hpBarBg = this.add.rectangle(0, -26, 40, 5, 0x1f1610);
        const hpBarFill = this.add.rectangle(-20, -26, 40, 5, 0xe63946);
        hpBarFill.setOrigin(0, 0.5);
        container.add(hpBarBg);
        container.add(hpBarFill);

        container.setDepth(40);
        visual = { container, sprite, hpBarFill };
        this.enemyVisuals.set(enemy.id, visual);
      }

      // Smooth position calculation on GridView
      const colX = this.gridView.x + enemy.x * this.gridView.tileWidth + this.gridView.tileWidth / 2;
      const rowY = this.gridView.y + enemy.row * this.gridView.tileHeight + this.gridView.tileHeight / 2;
      visual.container.setPosition(colX, rowY);

      // HP bar scale
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      visual.hpBarFill.setSize(40 * hpPct, 5);

      // Boss bar update if boss
      if (enemy.isBoss) {
        this.bossBarFill.setSize(636 * hpPct, 22);
      }
    }
  }

  private handleWaveVictory(): void {
    this.bossBarContainer.setVisible(false);
    this.inspectionBanner.setVisible(false);

    // Clear enemy visuals
    for (const visual of this.enemyVisuals.values()) {
      visual.container.destroy();
    }
    this.enemyVisuals.clear();

    const earned = 25; // Base reward
    this.waveResultText.setText(`Награда за волну: +${earned} Шестерней\nОборона позиции успешна!`);
    this.waveResultContainer.setVisible(true);
  }

  public openShop(): void {
    this.shopView.showShop(this.state.economy.cogs, Object.values(GADGETS_DATA).slice(0, 3));
  }

  private startPrepPhase(): void {
    this.engageButton.setFillStyle(0x2a9d8f);
    this.engageButtonText.setText('В БОЙ ▶ (ОТРАЗИТЬ ВОЛНУ)');

    const currentWave = this.state.waveNumber;
    this.waveInfoText.setText(`Волна ${currentWave} / 10\nПодготовьте позиции и крутите горн-слот!`);

    this.refreshHUD();
    this.syncUnitCards();
  }

  private handleGameOver(victory: boolean): void {
    this.scene.start('GameOverScene', {
      victory,
      wave: this.state.waveNumber,
      boilerHp: this.state.boilerHp,
      cogs: this.state.economy.cogs,
      seed: Number(this.state.seed)
    });
  }

  private syncUnitCards(): void {
    const allUnits = [...this.state.reserveBench, ...this.state.deployedUnits];
    const activeIds = new Set(allUnits.map((u) => u.instanceId));

    // Destroy cards for removed/smelted units
    for (const [id, card] of this.unitCards.entries()) {
      if (!activeIds.has(id)) {
        card.destroy();
        this.unitCards.delete(id);
      }
    }

    // 1. Place Deployed Cards
    for (const unit of this.state.deployedUnits) {
      if (!unit.deployedSlot) continue;
      let card = this.unitCards.get(unit.instanceId);
      const slotPos = this.gridView.getSlotWorldPos(unit.deployedSlot.col, unit.deployedSlot.row);

      if (!card) {
        card = new UnitCard(this, slotPos.x, slotPos.y, unit, this.tooltip);
        this.attachCardDragHandling(card);
        this.unitCards.set(unit.instanceId, card);
      } else {
        card.setPosition(slotPos.x, slotPos.y);
        card.unit = unit;
      }
    }

    // 2. Place Bench Cards
    for (let i = 0; i < this.state.reserveBench.length; i++) {
      const unit = this.state.reserveBench[i];
      const slot = this.benchSlots[i] ?? this.benchSlots[this.benchSlots.length - 1];
      let card = this.unitCards.get(unit.instanceId);

      if (!card) {
        card = new UnitCard(this, slot.x, slot.y, unit, this.tooltip);
        this.attachCardDragHandling(card);
        this.unitCards.set(unit.instanceId, card);
      } else {
        card.setPosition(slot.x, slot.y);
        card.unit = unit;
      }
    }
  }

  private attachCardDragHandling(card: UnitCard): void {
    card.on('card_dropped', (droppedCard: UnitCard) => {
      if (this.state.phase !== 'PREP') {
        this.syncUnitCards();
        return;
      }

      const dropX = droppedCard.x;
      const dropY = droppedCard.y;

      // Check if dropped onto GridView
      const slot = this.gridView.getSlotAtWorldPos(dropX, dropY);
      if (slot && slot.col < BALANCE.PLAYER_DEPLOY_COLS) {
        // Check if there is already a unit in this slot
        const existingUnit = this.state.deployedUnits.find(
          (u) => u.deployedSlot?.col === slot.col && u.deployedSlot?.row === slot.row
        );

        if (existingUnit && existingUnit.instanceId !== droppedCard.unit.instanceId) {
          // SMELT: Drop card onto existing unit!
          RunReducer.dispatch(
            this.state,
            { type: 'SMELT_UNITS', targetId: existingUnit.instanceId, sacrificeId: droppedCard.unit.instanceId },
            this.rng,
            this.eventBus
          );
        } else {
          // DEPLOY
          RunReducer.dispatch(
            this.state,
            { type: 'DEPLOY_UNIT', unitId: droppedCard.unit.instanceId, col: slot.col, row: slot.row },
            this.rng,
            this.eventBus
          );
        }
      } else if (dropY > 580) {
        // Dropped back onto Bench
        const benchTarget = this.state.reserveBench.find(
          (u) => u.instanceId !== droppedCard.unit.instanceId && Math.abs(droppedCard.x - this.getCardX(u.instanceId)) < 40
        );

        if (benchTarget) {
          // SMELT on bench
          RunReducer.dispatch(
            this.state,
            { type: 'SMELT_UNITS', targetId: benchTarget.instanceId, sacrificeId: droppedCard.unit.instanceId },
            this.rng,
            this.eventBus
          );
        } else if (droppedCard.unit.deployedSlot) {
          // UNDEPLOY
          RunReducer.dispatch(
            this.state,
            { type: 'UNDEPLOY_UNIT', unitId: droppedCard.unit.instanceId },
            this.rng,
            this.eventBus
          );
        }
      }

      this.syncUnitCards();
      this.refreshHUD();
    });
  }

  private getCardX(unitId: string): number {
    return this.unitCards.get(unitId)?.x ?? 0;
  }

  private refreshHUD(): void {
    this.hud.updateState({
      boilerHp: this.state.boilerHp,
      maxBoilerHp: this.state.maxBoilerHp,
      cogs: this.state.economy.cogs,
      steam: this.state.economy.steam,
      maxSteam: this.state.economy.maxSteam,
      heat: this.state.heat.currentHeat,
      wave: this.state.waveNumber,
      valveUsed: this.state.combatState?.valveUsed ?? false
    });

    // Spin button text
    if (this.state.phase === 'PREP') {
      if (this.state.freeSpinsLeft > 0) {
        this.spinButtonText.setText(`КРУТИТЬ (${this.state.freeSpinsLeft} БЕСПЛ.)`);
        this.spinButton.setFillStyle(0xd4a373);
      } else {
        this.spinButtonText.setText(`КРУТИТЬ (ПАР: 1, +20 HEAT)`);
        this.spinButton.setFillStyle(0xe76f51);
      }
      this.nudgeButtonText.setText(`СДВИГ БАРАБАНА (${this.state.nudgesLeft})`);
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const floater = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    floater.setDepth(1500);

    this.tweens.add({
      targets: floater,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => floater.destroy()
    });
  }
}
