import Phaser from 'phaser';
import { UISkin } from '../art/ui/UISkin';
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
import { CoreDraftModal } from '@ui/CoreDraftModal';
import { GADGETS_DATA } from '@data/gadgets';
import { BALANCE } from '@data/balance';
import { ReelManager } from '@core/reels/reels';
import { SoundManager } from '../audio/SoundManager';
import { MetaManager } from '@core/meta/metaManager';
import { SmeltManager } from '@core/smelt/smelt';
import { AnimationFX } from '../fx/AnimationFX';
import { SteampunkAtmosphere } from '../fx/SteampunkAtmosphere';
import { ParticleKit } from '../presentation/ParticleKit';
import { SpriteForge } from '../art/forge/SpriteForge';
import { actBackdropKey, BG_SCALE } from '../art/environment/actBackdrops';
import { fieldScale, playAttack as playForgeAttack, playLoop } from '../art/forge/play';

interface EnemyVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpW: number;
  key: string;
  flying: boolean;
  lastX: number;
  attackingUntil: number;
  /** height of the visible body in screen px (for hit/float text placement) */
  bodyH: number;
}

/** Feet of a combatant sit this far below the tile centre. */
const FOOT_DY = 26;

export class RunScene extends Phaser.Scene {
  public state!: RunState;
  public rng!: RngStreams;
  public eventBus!: EventBus;

  // UI & FX Components
  public hud!: HUD;
  public reelView!: ReelView;
  public gridView!: GridView;
  public tooltip!: Tooltip;
  public shopView!: ShopView;
  public evolutionModal!: EvolutionModal;
  public coreDraftModal!: CoreDraftModal;
  public atmosphere!: SteampunkAtmosphere;

  // Cards & Visuals
  private unitCards: Map<string, UnitCard> = new Map();
  private enemyVisuals: Map<string, EnemyVisual> = new Map();
  private benchSlots: { x: number; y: number }[] = [];
  private battleBg!: Phaser.GameObjects.Image;

  // Controls
  private spinButton?: Phaser.GameObjects.Rectangle;
  private spinButtonText?: Phaser.GameObjects.Text;
  private nudgeButtonText?: Phaser.GameObjects.Text;
  private engageButton!: Phaser.GameObjects.Image;
  private engageButtonText!: Phaser.GameObjects.Text;
  private speedButton!: Phaser.GameObjects.Rectangle;
  private speedButtonText!: Phaser.GameObjects.Text;
  private waveInfoText!: Phaser.GameObjects.Text;

  // Slotbound Presentation Elements
  private waveRibbonTexts: Phaser.GameObjects.Text[] = [];
  private speechBubbleText!: Phaser.GameObjects.Text;
  private skullBtnPulseTween: Phaser.Tweens.Tween | null = null;

  // Boss & Inspection Overlays
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossBarText!: Phaser.GameObjects.Text;
  private inspectionBanner!: Phaser.GameObjects.Container;
  private inspectionText!: Phaser.GameObjects.Text;

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
    const meta = MetaManager.load();
    MetaManager.applyMetaToRun(this.state, meta);
    this.rng = PrngManager.createStreams(seed);
    this.eventBus = new EventBus();

    // Reset collections
    this.unitCards.clear();
    this.enemyVisuals.clear();
    this.benchSlots = [];
    this.speedMultiplier = 1;
    this.combatAccumulator = 0;
    this.isSpinning = false;

    // Audio init & ambient hum
    SoundManager.getInstance().init();
    SoundManager.getInstance().startAmbientHum();

    // 2. Build Stone Shell & Grand Meadow Battle Window (matching Reference Slotbound)
    this.add.rectangle(960, 540, 1920, 1080, 0x120f17);

    // Battle Window positioned at x: 1176, y: 540 (width 1416, height 924)
    const winX = 1176;
    const winY = 540;
    const winW = 1416;
    const winH = 924;

    // Meadow Backdrop
    // Act backdrop, painted at native res and shown at an exact ×4
    const bgKey = actBackdropKey(this.state.actNumber);
    this.battleBg = this.add.image(winX, winY, this.textures.exists(bgKey) ? bgKey : 'bg_meadow_day');
    if (this.textures.exists(bgKey)) this.battleBg.setScale(BG_SCALE);
    else this.battleBg.setDisplaySize(winW - 50, winH - 50);

    // Parchment/Brass Window Frame
    const windowFrame = this.add.image(winX, winY, 'ui_window_frame');
    windowFrame.setDisplaySize(winW, winH);

    // Top Wave Ribbon Banner
    this.createWaveRibbon(winX, 114);

    // Foreman Cogsworth in arch niche
    this.createForemanGuide(540, 138);

    // 3. Mount Sub-Views & Presentation Components
    this.hud = new HUD(this);
    this.reelView = new ReelView(this, 224, 460);
    this.gridView = new GridView(this, 560, 580);
    this.tooltip = new Tooltip(this);
    this.shopView = new ShopView(this);
    this.evolutionModal = new EvolutionModal(this);
    this.coreDraftModal = new CoreDraftModal(this);

    // Set initial reel view grid
    const initialGrid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);
    this.reelView.setGrid(initialGrid);

    // 4. Create Bench Area (Vernak under Slot Machine)
    this.createBenchArea();

    // 5. Create Slot Machine Controls
    this.createSlotControls();

    // 6. Create Battle Controls (Round Skull Valve Button)
    this.createBattleControls();

    // 7. Create Boss Bar & Inspection Overlays
    this.createSpecialWaveOverlays();

    // 8. Create Wave Victory Overlay
    this.createWaveResultOverlay();

    // 9. Wire Event Listeners
    this.wireEvents();

    // 10. Desktop Keyboard Controls & Hotkeys
    this.setupKeyboardShortcuts();

    // Initial HUD & View update
    this.refreshHUD();
    this.syncUnitCards();

    // pixel-art 9-slice skin for every framed panel/button in the scene
    UISkin.install(this);
  }

  private setupKeyboardShortcuts(): void {
    if (!this.input || !this.input.keyboard) return;

    // Fullscreen: F or F11
    this.input.keyboard.on('keydown-F', () => {
      this.scale.toggleFullscreen();
    });
    this.input.keyboard.on('keydown-F11', (event: KeyboardEvent) => {
      if (event && event.preventDefault) event.preventDefault();
      this.scale.toggleFullscreen();
    });

    // Mute: M
    this.input.keyboard.on('keydown-M', () => {
      SoundManager.getInstance().toggleMute();
      this.refreshHUD();
    });

    // Space: Spin in PREP, advance in RESULT / SHOP
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.state.phase === 'PREP') {
        this.handleSpinClick();
      } else if (this.state.phase === 'RESULT' && this.waveResultContainer.visible) {
        this.waveResultContainer.setVisible(false);
        this.openShop();
      } else if (this.state.phase === 'SHOP') {
        this.shopView.emit('close_shop');
      }
    });

    // Enter: Engage battle in PREP, next wave in SHOP
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.state.phase === 'PREP') {
        this.handleEngageClick();
      } else if (this.state.phase === 'SHOP') {
        this.shopView.emit('close_shop');
      }
    });

    // Keys 1, 2, 3: Hold reels in PREP; Speed 1x, 2x, 4x in BATTLE
    this.input.keyboard.on('keydown-ONE', () => {
      if (this.state.phase === 'PREP') {
        this.toggleHoldReel(0);
      } else if (this.state.phase === 'BATTLE') {
        this.speedMultiplier = 1;
        this.speedButtonText.setText('СКОРОСТЬ: 1×');
      }
    });
    this.input.keyboard.on('keydown-TWO', () => {
      if (this.state.phase === 'PREP') {
        this.toggleHoldReel(1);
      } else if (this.state.phase === 'BATTLE') {
        this.speedMultiplier = 2;
        this.speedButtonText.setText('СКОРОСТЬ: 2×');
      }
    });
    this.input.keyboard.on('keydown-THREE', () => {
      if (this.state.phase === 'PREP') {
        this.toggleHoldReel(2);
      }
    });
    this.input.keyboard.on('keydown-FOUR', () => {
      if (this.state.phase === 'BATTLE') {
        this.speedMultiplier = 4;
        this.speedButtonText.setText('СКОРОСТЬ: 4×');
      }
    });

    // Keys Q, W, E: Nudge reels in PREP
    this.input.keyboard.on('keydown-Q', () => {
      if (this.state.phase === 'PREP' && this.state.nudgesLeft > 0) {
        this.nudgeReel(0, 1);
      }
    });
    this.input.keyboard.on('keydown-W', () => {
      if (this.state.phase === 'PREP' && this.state.nudgesLeft > 0) {
        this.nudgeReel(1, 1);
      }
    });
    this.input.keyboard.on('keydown-E', () => {
      if (this.state.phase === 'PREP' && this.state.nudgesLeft > 0) {
        this.nudgeReel(2, 1);
      }
    });

    // Key V: Emergency Valve in BATTLE
    this.input.keyboard.on('keydown-V', () => {
      if (this.state.phase === 'BATTLE' && this.state.combatState && !this.state.combatState.valveUsed) {
        RunReducer.dispatch(this.state, { type: 'USE_VALVE', choice: 'slow' }, this.rng, this.eventBus);
      }
    });

    // Key P: Pause toggle in BATTLE
    this.input.keyboard.on('keydown-P', () => {
      if (this.state.phase === 'BATTLE') {
        this.speedMultiplier = this.speedMultiplier === 0 ? 1 : 0;
        this.speedButtonText.setText(this.speedMultiplier === 0 ? 'ПАУЗА ❚❚' : `СКОРОСТЬ: ${this.speedMultiplier}×`);
      }
    });
  }

  private toggleHoldReel(reelIndex: number): void {
    RunReducer.dispatch(this.state, { type: 'HOLD_REEL', reelIndex }, this.rng, this.eventBus);
    this.reelView.updateHolds(this.state.heldReels);
    this.refreshHUD();
  }

  private nudgeReel(reelIndex: number, direction: 1 | -1): void {
    RunReducer.dispatch(this.state, { type: 'NUDGE_REEL', reelIndex, direction }, this.rng, this.eventBus);
    const grid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);
    this.reelView.setGrid(grid);
    this.refreshHUD();
  }

  private createWaveRibbon(x: number, y: number): void {
    const ribbonBg = this.add.rectangle(x, y, 280, 42, 0x231d2c);
    ribbonBg.setStrokeStyle(2, 0x3d3047);
    this.waveRibbonTexts = [];
    const offsets = [-75, -25, 25, 75];
    for (let i = 0; i < 4; i++) {
      const txt = this.add.text(x + offsets[i], y, `${i + 1}`, {
        fontFamily: 'monospace',
        fontSize: i === 0 ? '22px' : '15px',
        color: i === 0 ? '#ffd166' : '#534764',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.waveRibbonTexts.push(txt);
    }
  }

  private createForemanGuide(x: number, y: number): void {
    // Arch niche and avatar
    const nicheBg = this.add.rectangle(x, y, 92, 102, 0x18131e);
    nicheBg.setStrokeStyle(2, 0x3d3047);
    const avatar = this.add.image(x, y, 'ui_avatar_cogsworth');
    avatar.setScale(2.5);

    // Speech bubble
    const bubble = this.add.image(x + 195, y, 'ui_speech_bubble');
    bubble.setScale(2.3);
    this.speechBubbleText = this.add.text(x + 195, y, 'Потяните рычаг Кузницы (Пробел) или расставьте автоматонов!', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd166',
      align: 'center',
      wordWrap: { width: 330 }
    }).setOrigin(0.5);
  }

  private createBenchArea(): void {
    // Reserve Shelf under Slot Machine
    const shelfX = 224;
    const shelfY = 880;
    const benchBg = this.add.rectangle(shelfX, shelfY, 400, 190, 0x18141f);
    benchBg.setStrokeStyle(2, 0x3d3047);

    this.add.text(shelfX, shelfY - 74, '[ РЕЗЕРВ АВТОМАТОНОВ ]', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 5 Bench slots in a clean row
    this.benchSlots = [];
    const slotStartX = shelfX - 150;
    const slotSpacing = 75;
    for (let i = 0; i < 5; i++) {
      const slotX = slotStartX + i * slotSpacing;
      const slotY = shelfY + 12;
      const slotOutline = this.add.rectangle(slotX, slotY, 68, 80, 0x241d2c);
      slotOutline.setStrokeStyle(1, 0x534764, 0.7);
      this.benchSlots.push({ x: slotX, y: slotY });
    }
  }

  private createSlotControls(): void {
    // Slot Lever and Reel wiring
    this.reelView.on('spin_requested', () => this.handleSpinClick());
    this.reelView.on('nudge_reel', (col: number) => {
      this.nudgeReel(col, 1);
    });
    this.reelView.on('toggle_hold', (reelIndex: number) => {
      this.toggleHoldReel(reelIndex);
    });

    // Hidden fallback text for legacy test compatibility
    this.spinButton = this.add.rectangle(-1000, -1000, 10, 10, 0x000000);
    this.spinButtonText = this.add.text(-1000, -1000, '');
    this.nudgeButtonText = this.add.text(-1000, -1000, '');
  }

  private createBattleControls(): void {
    // Round Cast-Iron Skull Valve Button at bottom right of battle window
    this.engageButton = this.add.image(1760, 920, 'ui_btn_round_skull');
    this.engageButton.setScale(2.8);
    this.engageButton.setInteractive({ useHandCursor: true });

    this.engageButtonText = this.add.text(1760, 975, 'В БОЙ ▶ (Enter)', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.skullBtnPulseTween = this.tweens.add({
      targets: this.engageButton,
      scaleX: 3.0,
      scaleY: 3.0,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.engageButton.on('pointerdown', () => this.handleEngageClick());
    this.engageButton.on('pointerover', () => this.engageButton.setScale(3.1));
    this.engageButton.on('pointerout', () => this.engageButton.setScale(2.8));

    // Game Speed Button
    this.speedButton = this.add.rectangle(1760, 835, 120, 34, 0x241d2c);
    this.speedButton.setStrokeStyle(2, 0x8c5836);
    this.speedButton.setInteractive({ useHandCursor: true });

    this.speedButtonText = this.add.text(1760, 835, 'СКОРОСТЬ: 1×', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.speedButton.on('pointerdown', () => {
      if (this.speedMultiplier === 1) this.speedMultiplier = 2;
      else if (this.speedMultiplier === 2) this.speedMultiplier = 4;
      else this.speedMultiplier = 1;
      this.speedButtonText.setText(`СКОРОСТЬ: ${this.speedMultiplier}×`);
    });

    this.waveInfoText = this.add.text(-1000, -1000, '');
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

    this.inspectionText = this.add.text(0, 0, '★ ПРОВЕРКА ОТК: Победить за 40 сек! Награда: +50 Шестерней ★', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.inspectionBanner.add(this.inspectionText);

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
        SoundManager.getInstance().playValveHiss();
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
      const evoUnit = [...this.state.reserveBench, ...this.state.deployedUnits].find((u) => u.instanceId === data.unitInstanceId);
      this.evolutionModal.showEvolution(data.unitInstanceId, data.branchA, data.branchB, evoUnit?.starRank);
    });

    // Engine Core draft ready event
    this.eventBus.on('core_draft_ready', (data) => {
      this.coreDraftModal.showDraft(data.choices);
    });

    this.coreDraftModal.on('core_selected', (coreId: string) => {
      RunReducer.dispatch(this.state, { type: 'EQUIP_CORE', coreId }, this.rng, this.eventBus);
      this.refreshHUD();
    });

    // Smelt text floater & fusion vortex
    this.eventBus.on('unit_smelted', (data) => {
      SoundManager.getInstance().playSmelt();
      const card = this.unitCards.get(data.targetId);
      if (card) {
        AnimationFX.playSmeltVortex(this, card.x, card.y);
        this.spawnParticleBurst(card.x, card.y, 'fx_spark_particle', 16);
        card.refreshLevel();
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
    this.spinButtonText?.setText('ВРАЩЕНИЕ...');
    this.spinButton?.setFillStyle(0x6c757d);

    // Dispatch spin
    RunReducer.dispatch(this.state, { type: 'SPIN' }, this.rng, this.eventBus);
    const finalGrid = ReelManager.extractGrid(this.state.reelStrips, this.state.reelIndices);

    this.reelView.playSpinAnimation(finalGrid, this.state.heldReels, () => {
      this.isSpinning = false;
      this.refreshHUD();

      if (this.state.lastSpinResult) {
        this.reelView.highlightWinningLines(this.state.lastSpinResult);
        if (this.state.lastSpinResult.lineHits && this.state.lastSpinResult.lineHits.length > 0) {
          if (this.speechBubbleText) {
            this.speechBubbleText.setText('Отлично! Сплав готов! Автоматон призван в резерв!');
          }
        }
      }

      this.syncUnitCards();
    });
  }

  public handleEngageClick(): void {
    if (this.state.phase !== 'PREP') return;

    if (this.state.deployedUnits.length === 0) {
      // Quality-of-life: if player clicks Engage with units on bench, auto-deploy them to frontline
      if (this.state.reserveBench.length > 0) {
        const availableSlots: [number, number][] = [
          [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
          [1, 0], [1, 1], [1, 2], [1, 3], [1, 4]
        ];
        let slotIdx = 0;
        const toDeploy = [...this.state.reserveBench];
        for (const u of toDeploy) {
          if (slotIdx < availableSlots.length) {
            const [c, r] = availableSlots[slotIdx++];
            this.deployUnit(u.instanceId, c, r);
          }
        }
      } else {
        this.showFloatingText(960, 300, 'Сначала покрутите барабаны (Пробел) и призовите автоматонов!', '#ffd166');
        return;
      }
    }

    // Switch to Battle Phase
    RunReducer.dispatch(this.state, { type: 'START_BATTLE' }, this.rng, this.eventBus);
    this.reelView.clearPaylines();
    this.gridView.setBattleMode(true);
    if (this.skullBtnPulseTween) this.skullBtnPulseTween.pause();
    this.engageButton.setTint(0x555555);
    this.engageButtonText.setText('БОЙ...');
    if (this.speechBubbleText) {
      this.speechBubbleText.setText('Орда мародёров наступает! Защищайте Котёл!');
    }

    for (const card of this.unitCards.values()) {
      card.setDraggableEnabled(false);
    }

    // Check boss or inspection
    if (this.state.waveNumber === 10) {
      this.bossBarText.setText('★ ПАРОВОЙ БАРОН [ФАЗА 1: ДАВЛЕНИЕ] ★');
      this.bossBarFill.setFillStyle(0xe63946);
      this.bossBarContainer.setVisible(true);
    } else if (this.state.waveNumber === 20) {
      this.bossBarText.setText('★ ИМПЕРАТРИЦА КОРРОЗИИ [ФАЗА 1: КИСЛОТА] ★');
      this.bossBarFill.setFillStyle(0x2ec4b6);
      this.bossBarContainer.setVisible(true);
    } else if (this.state.waveNumber === 30) {
      this.bossBarText.setText('★ ЖЕЛЕЗНЫЙ КОЛОСС [ФАЗА 1: ТИТАН] ★');
      this.bossBarFill.setFillStyle(0xffd166);
      this.bossBarContainer.setVisible(true);
    } else if (this.state.waveNumber === 5) {
      this.inspectionText.setText('★ ПРОВЕРКА ОТК: Победить за 40 сек! Награда: +50 Шестерней ★');
      this.inspectionBanner.setVisible(true);
    } else if (this.state.waveNumber === 15) {
      this.inspectionText.setText('★ ПРОВЕРКА ОТК: Кислотный шторм! Победить за 45 сек! ★');
      this.inspectionBanner.setVisible(true);
    } else if (this.state.waveNumber === 25) {
      this.inspectionText.setText('★ ПРОВЕРКА ОТК: Тяжёлый конвой! Победить за 50 сек! ★');
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
        SoundManager.getInstance().playValveHiss();
        this.spawnParticleBurst(480, 300, 'fx_smoke_particle', 16);
        AnimationFX.playValveEruption(this);
        this.showFloatingText(480, 300, 'ПРОРЫВ К КОТЛУ! -1 HP', '#e63946');
      } else if (ev.type === 'boss_phase') {
        SoundManager.getInstance().playBossAlarm();
        this.spawnParticleBurst(960, 300, 'fx_fire_particle', 20);
        AnimationFX.spawnShockwaveRing(this, 960, 300, 0xff0054, 160);
        if (this.state.waveNumber === 10) {
          this.bossBarText.setText('★ ПАРОВОЙ БАРОН [ФАЗА 2: ПЕРЕГРЕВ] ★');
          this.bossBarFill.setFillStyle(0xff0054);
        } else if (this.state.waveNumber === 20) {
          this.bossBarText.setText('★ ИМПЕРАТРИЦА КОРРОЗИИ [ФАЗА 2: ВЫЛЕТ РОЯ] ★');
          this.bossBarFill.setFillStyle(0xb7094c);
        } else if (this.state.waveNumber === 30) {
          this.bossBarText.setText('★ ЖЕЛЕЗНЫЙ КОЛОСС [РЕАКТОР: ПЕРЕГРУЗКА] ★');
          this.bossBarFill.setFillStyle(0xffbe0b);
        }
        this.cameras.main.flash(400, 255, 60, 0);
      } else if (ev.type === 'death') {
        SoundManager.getInstance().playEnemyDeath();
        const vis = this.enemyVisuals.get(ev.sourceId);
        if (vis) {
          this.killEnemyVisual(ev.sourceId, vis);
        }
      } else if (ev.type === 'attack') {
        const card = ev.sourceId ? this.unitCards.get(ev.sourceId) : undefined;
        if (card) {
          SoundManager.getInstance().playAttack(card.unit.faction);
          const cu = this.state.combatState.units.find((u) => u.id === ev.sourceId);
          const isRanged = (cu?.attackRange ?? 1) > 1;
          const tv = ev.targetId ? this.enemyVisuals.get(ev.targetId) : undefined;
          const target = tv ? { x: tv.container.x, y: tv.container.y - tv.bodyH * 0.45 + 30 } : undefined;
          card.playAttack(isRanged, undefined, target);
        } else {
          SoundManager.getInstance().playAttack('cog');
          const enemyVis = ev.sourceId ? this.enemyVisuals.get(ev.sourceId) : undefined;
          if (enemyVis) {
            enemyVis.attackingUntil = this.time.now + 420;
            if (!playForgeAttack(enemyVis.sprite, enemyVis.key, 'walk')) {
              AnimationFX.playAttackAnimation(this, enemyVis.sprite, false);
            }
          }
        }
      } else if (ev.type === 'damage') {
        const enemyVis = ev.targetId ? this.enemyVisuals.get(ev.targetId) : undefined;
        const card = ev.targetId ? this.unitCards.get(ev.targetId) : undefined;
        let pos: { x: number; y: number } | null = null;
        if (enemyVis) {
          pos = { x: enemyVis.container.x, y: enemyVis.container.y - enemyVis.bodyH * 0.55 };
          enemyVis.sprite.setTintFill(0xffffff);
          this.time.delayedCall(70, () => {
            if (enemyVis.sprite.active) enemyVis.sprite.clearTint();
          });
        } else if (card) {
          pos = { x: card.x, y: card.y - 30 };
          card.playHitFlash();
        } else if (ev.x !== undefined && ev.y !== undefined) {
          pos = this.gridView.getSlotWorldPos(Math.floor(ev.x), ev.y);
        }
        if (pos) {
          if (this.textures.exists('tex_slash_arc') && enemyVis) {
            const slash = this.add.image(pos.x, pos.y, 'tex_slash_arc').setDepth(1900).setScale(1.5);
            this.tweens.add({
              targets: slash,
              alpha: { from: 1, to: 0 },
              scale: { from: 1.5, to: 2.1 },
              duration: 160,
              onComplete: () => slash.destroy()
            });
          }
          this.spawnParticleBurst(pos.x, pos.y, 'fx_spark_particle', 4);
          this.showFloatingText(pos.x + Phaser.Math.Between(-10, 10), pos.y - 24, `-${ev.amount}`, enemyVis ? '#ffe066' : '#ff5a5a');
        }
      }
    }
  }

  /** Death: white flash, pop, debris; the sprite then falls apart and fades. */
  private killEnemyVisual(id: string, vis: EnemyVisual): void {
    this.enemyVisuals.delete(id);
    const { container, sprite } = vis;
    const cx = container.x;
    const cy = container.y - vis.bodyH * 0.45;
    sprite.anims.stop();
    sprite.setTintFill(0xffffff);
    if (this.textures.exists('tex_scrap_debris')) this.spawnParticleBurst(cx, cy, 'tex_scrap_debris', 7);
    this.spawnParticleBurst(cx, cy, 'fx_fire_particle', 6);
    this.spawnParticleBurst(cx, cy, 'fx_smoke_particle', 4);
    AnimationFX.spawnShockwaveRing(this, cx, container.y - 6, 0xffa500, 40);
    this.time.delayedCall(80, () => {
      if (sprite.active) sprite.setTint(0x6b5a7a);
    });
    this.tweens.add({
      targets: container,
      alpha: 0,
      angle: sprite.flipX ? 12 : -12,
      y: container.y + 6,
      duration: 380,
      delay: 90,
      ease: 'Quad.easeIn',
      onComplete: () => container.destroy()
    });
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

    // Remove enemies that vanished without a death event (breach, wave end)
    for (const [id, visual] of this.enemyVisuals.entries()) {
      if (!currentEnemyIds.has(id)) {
        this.killEnemyVisual(id, visual);
      }
    }

    for (const enemy of this.state.combatState.enemies) {
      if (enemy.isDead) continue;

      let visual = this.enemyVisuals.get(enemy.id);
      if (!visual) {
        visual = this.createEnemyVisual(enemy.id, enemy.def.spriteKey, enemy.isBoss);
        this.enemyVisuals.set(enemy.id, visual);
      }

      const colX = this.gridView.x + enemy.x * this.gridView.tileWidth + this.gridView.tileWidth / 2;
      const footY = this.gridView.y + enemy.row * this.gridView.tileHeight + this.gridView.tileHeight / 2 + FOOT_DY;
      const moving = Math.abs(enemy.x - visual.lastX) > 0.0005;
      visual.lastX = enemy.x;
      visual.container.setPosition(Math.round(colX), footY);
      visual.container.setDepth(Math.floor(footY));

      if (this.time.now > visual.attackingUntil) {
        playLoop(visual.sprite, visual.key, moving ? 'walk' : 'idle');
      }

      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      visual.hpBarFill.setSize(visual.hpW * hpPct, 4);

      if (enemy.isBoss) {
        this.bossBarFill.setSize(636 * hpPct, 22);
      }
    }
  }

  private createEnemyVisual(id: string, key: string, isBoss: boolean): EnemyVisual {
    const def = SpriteForge.get(key);
    const size = def?.size ?? 32;
    const flying = def?.flying ?? false;
    const scale = fieldScale(size);
    const b = SpriteForge.bounds(key);
    const bodyW = b ? (b.right - b.left + 1) * scale : size * scale;
    const bodyH = b ? (size - b.top) * scale : size * scale;

    const container = this.add.container(0, 0);
    const shadow = this.add.ellipse(0, -2, Math.max(40, bodyW * 0.7), flying ? 10 : 16, 0x0b1408, flying ? 0.22 : 0.38);
    container.add(shadow);

    const sprite = this.add.sprite(0, scale, key).setOrigin(0.5, 1).setScale(scale).setFlipX(true);
    if (this.anims.exists(`${key}_walk`)) sprite.play({ key: `${key}_walk`, startFrame: Phaser.Math.Between(0, 3) });
    container.add(sprite);
    if (flying) {
      this.tweens.add({
        targets: sprite,
        y: scale - 8,
        duration: 600 + Phaser.Math.Between(0, 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const hpW = isBoss ? 0 : Phaser.Math.Clamp(Math.round(bodyW * 0.55), 36, 72);
    const barY = -bodyH - (flying ? 16 : 8);
    const hpBarBg = this.add.rectangle(0, barY, hpW + 4, 8, 0x17121f);
    const hpBarFill = this.add.rectangle(-hpW / 2, barY, hpW, 4, 0xe63946).setOrigin(0, 0.5);
    hpBarBg.setVisible(!isBoss);
    hpBarFill.setVisible(!isBoss);
    container.add(hpBarBg);
    container.add(hpBarFill);

    // spawn pop-in
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 220 });

    void id;
    return { container, sprite, hpBarFill, hpW, key, flying, lastX: -1, attackingUntil: 0, bodyH };
  }

  private handleWaveVictory(): void {
    this.bossBarContainer.setVisible(false);
    this.inspectionBanner.setVisible(false);
    this.gridView.setBattleMode(false);

    if (this.skullBtnPulseTween) this.skullBtnPulseTween.resume();
    this.engageButton.clearTint();
    this.engageButtonText.setText('В БОЙ ▶ (Enter)');
    if (this.speechBubbleText) {
      this.speechBubbleText.setText('Волна успешно отражена! Получена награда шестернями!');
    }
    ParticleKit.coinShower(this, 60);

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
    this.engageButton.clearTint();
    this.engageButtonText.setText('В БОЙ ▶ (Enter)');

    const currentWave = this.state.waveNumber;
    const act = this.state.actNumber;
    const bgKey = actBackdropKey(act);
    if (this.battleBg && this.textures.exists(bgKey) && this.battleBg.texture.key !== bgKey) {
      this.battleBg.setTexture(bgKey).setScale(BG_SCALE);
      this.cameras.main.flash(500, 255, 240, 200);
    }
    this.waveInfoText.setText(`Волна ${currentWave} / 30 [АКТ ${act}]\nПодготовьте позиции и крутите горн-слот!`);

    // Act transition announcements
    if (currentWave === 11) {
      this.showFloatingText(960, 400, '★ АКТ 2: РЖАВЫЕ ТОПИ ★', '#2ec4b6');
      SoundManager.getInstance().playBossAlarm();
    } else if (currentWave === 21) {
      this.showFloatingText(960, 400, '★ АКТ 3: ЦИТАДЕЛЬ БАРОНА ★', '#ffbe0b');
      SoundManager.getInstance().playBossAlarm();
    }

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

    // Destroy cards for removed/smelted units (and evolved ones, which need their new sprite)
    const defById = new Map(allUnits.map((u) => [u.instanceId, u.defId]));
    for (const [id, card] of this.unitCards.entries()) {
      if (!activeIds.has(id) || defById.get(id) !== card.builtDefId) {
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
        card.refreshLevel();
      }
      card.setDeployedMode(true);
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
        card.refreshLevel();
      }
      card.setDeployedMode(false);
    }

    // robots that fought in the last wave were locked for the battle — unlock them for prep
    const canDrag = this.state.phase === 'PREP';
    for (const card of this.unitCards.values()) {
      card.setDraggableEnabled(canDrag);
    }
  }

  /** Merge two units (same line + same level -> level + 1) or explain why not. */
  private tryMerge(targetId: string, sacrificeId: string): void {
    const all = [...this.state.reserveBench, ...this.state.deployedUnits];
    const target = all.find((u) => u.instanceId === targetId);
    const sacrifice = all.find((u) => u.instanceId === sacrificeId);
    if (!target || !sacrifice) return;
    const reason = SmeltManager.canMerge(target, sacrifice);
    const card = this.unitCards.get(targetId);
    const x = card?.x ?? 960;
    const y = (card?.y ?? 540) - 60;
    if (reason) {
      const msg: Record<string, string> = {
        different_archetype: 'Сливаются только роботы одной линейки!',
        different_level: `Нужен робот того же уровня (${target.starRank}★)`,
        max_level: 'Максимальный уровень — 5★',
        same_unit: ''
      };
      if (msg[reason]) this.showFloatingText(x, y, msg[reason], '#ffb08a');
      return;
    }
    RunReducer.dispatch(this.state, { type: 'SMELT_UNITS', targetId, sacrificeId }, this.rng, this.eventBus);
    this.showFloatingText(x, y, `СЛИЯНИЕ! Уровень ${target.starRank}★`, '#ffd166');
    ParticleKit.sparkleBurst(this, x, y + 40, 0xffd166, 14);
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
          this.tryMerge(existingUnit.instanceId, droppedCard.unit.instanceId);
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
          this.tryMerge(benchTarget.instanceId, droppedCard.unit.instanceId);
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
      valveUsed: this.state.combatState?.valveUsed ?? false,
      activeCores: this.state.activeCores
    });

    this.hud.updateUnitsCount(this.state.deployedUnits.length, BALANCE.PLAYER_DEPLOY_COLS * BALANCE.GRID_ROWS);

    if (this.reelView) {
      this.reelView.updateBadges(
        this.state.freeSpinsLeft,
        this.state.freeSpinsLeft > 0,
        BALANCE.EXTRA_SPIN_STEAM_COST
      );
    }

    // Update Wave Ribbon
    if (this.waveRibbonTexts && this.waveRibbonTexts.length === 4) {
      const activeIdx = (this.state.waveNumber - 1) % 4;
      for (let i = 0; i < 4; i++) {
        if (i === activeIdx) {
          this.waveRibbonTexts[i].setFontSize('22px');
          this.waveRibbonTexts[i].setColor('#ffd166');
        } else {
          this.waveRibbonTexts[i].setFontSize('15px');
          this.waveRibbonTexts[i].setColor('#534764');
        }
      }
    }

    // Update Steampunk atmosphere & slot heat aura
    if (this.atmosphere) {
      this.atmosphere.updateHeatHaze(this.state.heat.currentHeat, 240, 310);
    }
    if (this.reelView) {
      this.reelView.updateHeatAura(this.state.heat.currentHeat);
    }

    // Spin button text
    if (this.state.phase === 'PREP') {
      if (this.state.freeSpinsLeft > 0) {
        this.spinButtonText?.setText(`КРУТИТЬ (${this.state.freeSpinsLeft} БЕСПЛ.)`);
        this.spinButton?.setFillStyle(0xd4a373);
      } else {
        this.spinButtonText?.setText(`КРУТИТЬ (ПАР: 1, +20 HEAT)`);
        this.spinButton?.setFillStyle(0xe76f51);
      }
      this.nudgeButtonText?.setText(`СДВИГ БАРАБАНА (${this.state.nudgesLeft})`);
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

  public spawnParticleBurst(x: number, y: number, textureKey: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const p = this.add.sprite(x, y, textureKey);
      p.setDepth(1200);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const destX = x + Math.cos(angle) * speed;
      const destY = y + Math.sin(angle) * speed;
      this.tweens.add({
        targets: p,
        x: destX,
        y: destY,
        alpha: 0,
        scale: 0.2,
        duration: 350 + Math.random() * 250,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }
}
