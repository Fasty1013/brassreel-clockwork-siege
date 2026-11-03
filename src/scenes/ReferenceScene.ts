import Phaser from 'phaser';
import { CogKnightArt } from '../art/characters/cogKnight';
import { SymbolArt } from '../art/symbols';
import { BackdropArt } from '../art/environment/backdrop';
import { UIFrameArt } from '../art/ui/frames';

/**
 * Static Reference Scene (Phase P1 Benchmark Gate)
 * Meticulously re-creates the composition, pixel scale, color hierarchy,
 * and visual feel of the reference video frame (f_0050.png).
 * Native Canvas: 640x360 px (scaled 3x to 1920x1080).
 */
export class ReferenceScene extends Phaser.Scene {
  private cogKnight!: Phaser.GameObjects.Sprite;
  private leverSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super('ReferenceScene');
  }

  public preload(): void {
    // 1. Register all P1 pixel art assets
    CogKnightArt.registerAnimations(this);
    SymbolArt.registerAllSymbols(this);
    BackdropArt.registerBackdrop(this);
    UIFrameArt.registerAllUI(this);
  }

  public create(): void {
    const W = 640;
    const H = 360;

    // ========================================================
    // 1. DARK STONE/IRON BACKGROUND SHELL (Cold & Moody)
    // ========================================================
    this.add.rectangle(W / 2, H / 2, W, H, 0x120f17);

    // ========================================================
    // 2. LEFT SIDE: SLOT MACHINE CHASSIS & FORGE (x: 8 to 140)
    // ========================================================
    const machineX = 8;
    const machineY = 22;
    const chassis = this.add.image(machineX + 66, machineY + 138, 'ui_slot_chassis');
    chassis.setOrigin(0.5);

    // Badges above reels on Chassis
    // Spin Bag Badge (Left)
    const bagBadge = this.add.rectangle(machineX + 24, machineY + 54, 24, 12, 0x15121b);
    bagBadge.setStrokeStyle(1, 0x393047);
    this.add.text(machineX + 24, machineY + 54, '★ 5', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#d4a373'
    }).setOrigin(0.5);

    // Spin Cost Badge (Center)
    const costBadge = this.add.rectangle(machineX + 66, machineY + 54, 32, 12, 0x15121b);
    costBadge.setStrokeStyle(1, 0x393047);
    this.add.text(machineX + 66, machineY + 54, '150', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Paytable Book Button (Right)
    const bookBtn = this.add.rectangle(machineX + 108, machineY + 54, 20, 12, 0x393047);
    bookBtn.setStrokeStyle(1, 0xd4a373);
    this.add.text(machineX + 108, machineY + 54, '📖', {
      fontSize: '8px'
    }).setOrigin(0.5);

    // 3 Reels (3x3 Symbols) on the Paper Surface
    // Reel 1: Spring, Cog, Fuse
    this.add.sprite(machineX + 28, machineY + 84, 'sym_spring').setDisplaySize(28, 28);
    this.add.sprite(machineX + 28, machineY + 120, 'sym_cog').setDisplaySize(28, 28);
    this.add.sprite(machineX + 28, machineY + 156, 'sym_fuse').setDisplaySize(28, 28);

    // Reel 2: Cog, Cog, Spring
    this.add.sprite(machineX + 66, machineY + 84, 'sym_cog').setDisplaySize(28, 28);
    this.add.sprite(machineX + 66, machineY + 120, 'sym_cog').setDisplaySize(28, 28);
    this.add.sprite(machineX + 66, machineY + 156, 'sym_spring').setDisplaySize(28, 28);

    // Reel 3: Spring, Spring, Coil
    this.add.sprite(machineX + 104, machineY + 84, 'sym_spring').setDisplaySize(28, 28);
    this.add.sprite(machineX + 104, machineY + 120, 'sym_spring').setDisplaySize(28, 28);
    this.add.sprite(machineX + 104, machineY + 156, 'sym_coil').setDisplaySize(28, 28);

    // 3 Nudge Down-Arrow Buttons below Reels
    this.add.image(machineX + 28, machineY + 192, 'ui_btn_nudge');
    this.add.image(machineX + 66, machineY + 192, 'ui_btn_nudge');
    this.add.image(machineX + 104, machineY + 192, 'ui_btn_nudge');

    // Right Articulated Lever Arm
    this.leverSprite = this.add.sprite(machineX + 138, machineY + 115, 'ui_lever');
    this.leverSprite.setInteractive({ useHandCursor: true });
    this.leverSprite.on('pointerdown', () => {
      // Quick lever bounce
      this.tweens.add({
        targets: this.leverSprite,
        y: machineY + 128,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeIn'
      });
    });

    // Lower Core Shelf Text
    this.add.text(machineX + 66, machineY + 256, '[ CORE SHELF ]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#534764'
    }).setOrigin(0.5);

    // ========================================================
    // 3. RIGHT SIDE: BATTLE WINDOW & MEADOW (x: 156 to 628)
    // ========================================================
    const winX = 156;
    const winY = 22;
    const winW = 472;
    const winH = 308;

    // Window Inner Backdrop (Coarse 320x180 scaled to window inner)
    const bg = this.add.image(winX + 236, winY + 154, 'bg_meadow_day');
    bg.setDisplaySize(winW - 20, winH - 20);

    // Window Parchment Frame Overlay
    this.add.image(winX + winW / 2, winY + winH / 2, 'ui_window_frame');

    // --- Window Content: Top Wave Banner Ribbon ---
    const ribbonX = winX + winW / 2;
    const ribbonY = winY + 20;
    const ribbonBg = this.add.rectangle(ribbonX, ribbonY, 140, 16, 0x231d2c);
    ribbonBg.setStrokeStyle(1, 0x393047);

    // Wave numbers 1 2 3 4 with Wave 1 active
    this.add.text(ribbonX - 40, ribbonY, '1', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(ribbonX - 15, ribbonY, '2', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#534764'
    }).setOrigin(0.5);
    this.add.text(ribbonX + 10, ribbonY, '3', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#534764'
    }).setOrigin(0.5);
    this.add.text(ribbonX + 35, ribbonY, '4', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#534764'
    }).setOrigin(0.5);

    // --- Window Content: Top-Left Guide Niche with Foreman Cogsworth ---
    const nicheX = winX + 32;
    const nicheY = winY + 36;
    this.add.image(nicheX, nicheY, 'ui_avatar_cogsworth');

    // Guide Speech Bubble
    const bubbleX = nicheX + 124;
    const bubbleY = nicheY + 4;
    this.add.image(bubbleX, bubbleY, 'ui_speech_bubble');
    this.add.text(bubbleX - 100, bubbleY - 12, 'The slot machine costs 1 Steam to spin.', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#f4ecd8'
    });
    this.add.text(bubbleX, bubbleY + 6, 'Click to continue', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#b8a9c9'
    }).setOrigin(0.5);

    // --- Window Content: Battlefield Characters ---
    // Benchmark Character: Cog Knight on the Meadow Lawn!
    const knightX = winX + 120;
    const knightY = winY + 225;

    // Ground Shadow
    this.add.ellipse(knightX, knightY + 14, 26, 8, 0x0b090f, 0.45);

    // Cog Knight Sprite playing idle animation
    this.cogKnight = this.add.sprite(knightX, knightY, 'tex_cog_knight');
    this.cogKnight.play('cog_knight_idle');
    this.cogKnight.setInteractive({ useHandCursor: true });
    this.cogKnight.on('pointerdown', () => {
      // Click triggers attack animation!
      this.cogKnight.play('cog_knight_attack');
      this.cogKnight.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.cogKnight.play('cog_knight_idle');
      });
    });

    // Spring Archer ally behind Cog Knight
    const archerX = winX + 65;
    const archerY = winY + 230;
    this.add.ellipse(archerX, archerY + 14, 22, 7, 0x0b090f, 0.45);
    // Draw placeholder archer with green cap
    const archerGfx = this.add.graphics();
    archerGfx.fillStyle(0x2d6a4f);
    archerGfx.fillRect(archerX - 8, archerY - 14, 16, 22);
    archerGfx.fillStyle(0x52b788);
    archerGfx.fillRect(archerX - 6, archerY - 18, 12, 6);
    archerGfx.fillStyle(0xd4a373);
    archerGfx.fillRect(archerX + 6, archerY - 10, 3, 16); // Bow

    // Goblins / Scrappers approaching from the Right!
    const gob1X = winX + 380;
    const gob1Y = winY + 232;
    this.add.ellipse(gob1X, gob1Y + 14, 20, 6, 0x0b090f, 0.45);
    const gob1Gfx = this.add.graphics();
    gob1Gfx.fillStyle(0x1b4332);
    gob1Gfx.fillRect(gob1X - 7, gob1Y - 10, 14, 18);
    gob1Gfx.fillStyle(0x52b788);
    gob1Gfx.fillRect(gob1X - 6, gob1Y - 14, 12, 6); // Green goblin hood
    gob1Gfx.fillStyle(0xe63946);
    gob1Gfx.fillRect(gob1X - 11, gob1Y - 4, 6, 3); // Red dagger

    const gob2X = winX + 415;
    const gob2Y = winY + 234;
    this.add.ellipse(gob2X, gob2Y + 14, 20, 6, 0x0b090f, 0.45);
    const gob2Gfx = this.add.graphics();
    gob2Gfx.fillStyle(0x1b4332);
    gob2Gfx.fillRect(gob2X - 7, gob2Y - 10, 14, 18);
    gob2Gfx.fillStyle(0x52b788);
    gob2Gfx.fillRect(gob2X - 6, gob2Y - 14, 12, 6);

    // --- Window Content: Bottom-Right Round Skull Valve Button ---
    const skullBtnX = winX + winW - 36;
    const skullBtnY = winY + winH - 36;
    const skullBtn = this.add.image(skullBtnX, skullBtnY, 'ui_btn_round_skull');
    skullBtn.setInteractive({ useHandCursor: true });
    skullBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: skullBtn,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true
      });
    });

    // --- Window Content: Right Edge Icon Tabs ---
    const tabX = winX + winW - 12;
    // Stats Tab
    this.add.rectangle(tabX, winY + 54, 14, 16, 0x231d2c).setStrokeStyle(1, 0x534764);
    this.add.text(tabX, winY + 54, '📊', { fontSize: '8px' }).setOrigin(0.5);
    // Gold Shop Sack Tab
    this.add.rectangle(tabX, winY + 220, 14, 16, 0x231d2c).setStrokeStyle(1, 0x534764);
    this.add.text(tabX, winY + 220, '💰', { fontSize: '8px' }).setOrigin(0.5);
    // Close / Cancel Tab
    this.add.rectangle(tabX, winY + 245, 14, 16, 0x231d2c).setStrokeStyle(1, 0x534764);
    this.add.text(tabX, winY + 245, '✖', { fontSize: '8px', color: '#e63946' }).setOrigin(0.5);

    // ========================================================
    // 4. TOP FLOATING HUD ROW (x: 230 to 600, y: 10)
    // ========================================================
    const hudY = 11;
    // Gold Pill
    const goldPill = this.add.image(winX + 70, hudY, 'ui_hud_pill_gold');
    this.add.text(goldPill.x + 8, hudY, '350', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Boiler HP Pill
    const boilerPill = this.add.image(winX + 138, hudY, 'ui_hud_pill_boiler');
    this.add.text(boilerPill.x + 8, hudY, '10/10', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#e63946',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Units Pill
    const unitsPill = this.add.image(winX + 206, hudY, 'ui_hud_pill_units');
    this.add.text(unitsPill.x + 8, hudY, '2/5', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#f4ecd8'
    }).setOrigin(0.5);

    // Steam Pill
    const steamPill = this.add.image(winX + 274, hudY, 'ui_hud_pill_steam');
    this.add.text(steamPill.x + 8, hudY, '3/5', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00b4d8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Wave Countdown Pill
    const countPill = this.add.rectangle(winX + 370, hudY, 94, 16, 0x0b090f, 0.75);
    countPill.setStrokeStyle(1, 0x393047);
    this.add.text(winX + 370, hudY, '⚔ until 5 left', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#b8a9c9'
    }).setOrigin(0.5);

    // Animation Viewer button in bottom-left
    const animViewerBtn = this.add.rectangle(74, 344, 132, 20, 0x231d2c);
    animViewerBtn.setStrokeStyle(1, 0xd4a373);
    animViewerBtn.setInteractive({ useHandCursor: true });
    this.add.text(74, 344, '🔍 ANIMATION VIEWER', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    animViewerBtn.on('pointerdown', () => {
      this.scene.start('AnimationViewerScene');
    });
  }
}
