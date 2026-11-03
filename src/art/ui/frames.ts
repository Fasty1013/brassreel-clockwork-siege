import Phaser from 'phaser';

/**
 * Steampunk UI Pixel Assets & 9-Slice Canvas Generators
 * Matches reference layout: Slot Machine Left, Battle Window Right, Floating HUD Top.
 */
export class UIFrameArt {
  /**
   * Generates all UI component textures.
   */
  public static registerAllUI(scene: Phaser.Scene): void {
    const mgr = scene.textures;

    this.createParchmentWindow(mgr);
    this.createSlotChassis(mgr);
    this.createLever(mgr);
    this.createForemanCogsworth(mgr);
    this.createRoundSkullButton(mgr);
    this.createNudgeArrow(mgr);
    this.createHUDPills(mgr);
    this.createSpeechBubble(mgr);
  }

  // 1. Battle Window Parchment Frame (Beige, dark brass edge, iron corner brackets & rivets)
  private static createParchmentWindow(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_window_frame')) return;

    const W = 472;
    const H = 308;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Dark drop shadow behind window
    ctx.fillStyle = '#0b090f';
    ctx.fillRect(4, 4, W - 4, H - 4);

    // Parchment outer border (10px wide)
    ctx.fillStyle = '#f4ecd8'; // Antique beige
    ctx.fillRect(0, 0, W - 4, H - 4);

    // Inner brass beveled rim
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, W - 10, H - 10);

    ctx.strokeStyle = '#3a2215';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, W - 20, H - 20);

    // 4 Heavy Iron Corner Reinforcement Brackets
    const bSize = 20;
    const corners = [
      { x: 0, y: 0 },
      { x: W - 4 - bSize, y: 0 },
      { x: 0, y: H - 4 - bSize },
      { x: W - 4 - bSize, y: H - 4 - bSize }
    ];

    ctx.fillStyle = '#393047';
    for (const c of corners) {
      ctx.fillRect(c.x, c.y, bSize, bSize);
      // Brass rivet in center of corner bracket
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(c.x + 8, c.y + 8, 4, 4);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(c.x + 9, c.y + 9, 2, 2);
      ctx.fillStyle = '#393047';
    }

    // Edge rivets every 40 px along perimeter
    ctx.fillStyle = '#8c5836';
    for (let x = 40; x < W - 40; x += 36) {
      ctx.fillRect(x, 4, 3, 3);
      ctx.fillRect(x, H - 11, 3, 3);
    }
    for (let y = 35; y < H - 35; y += 32) {
      ctx.fillRect(4, y, 3, 3);
      ctx.fillRect(W - 11, y, 3, 3);
    }

    // Cut out inner viewport so background shows through cleanly
    ctx.clearRect(10, 10, W - 24, H - 24);

    mgr.addCanvas('ui_window_frame', canvas);
  }

  // 2. Slot Machine Chassis Base
  private static createSlotChassis(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_slot_chassis')) return;

    const W = 132;
    const H = 276;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Outer dark chassis casing
    ctx.fillStyle = '#231d2c'; // Slate purple chassis
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#393047';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Top Crown-Boiler Header Dome (Steampunk Brass Boiler with exhaust stacks)
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(8, 6, W - 16, 36);
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(10, 8, W - 20, 32);
    ctx.fillStyle = '#b57647';
    ctx.fillRect(12, 10, W - 24, 28);
    // Twin exhaust pipes on top
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(20, 0, 8, 8);
    ctx.fillRect(W - 28, 0, 8, 8);
    ctx.fillStyle = '#b57647';
    ctx.fillRect(22, 1, 4, 6);
    ctx.fillRect(W - 26, 1, 4, 6);

    // Center Manometer / Dial on Boiler
    ctx.fillStyle = '#0b090f';
    ctx.beginPath();
    ctx.arc(W / 2, 24, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4ecd8';
    ctx.beginPath();
    ctx.arc(W / 2, 24, 8, 0, Math.PI * 2);
    ctx.fill();
    // Needle
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 24);
    ctx.lineTo(W / 2 + 5, 20);
    ctx.stroke();

    // 3 Reel Window Recess (x: 10, y: 52, w: 112, h: 140)
    ctx.fillStyle = '#0b090f';
    ctx.fillRect(8, 50, W - 16, 144);
    ctx.fillStyle = '#e7e0ef'; // Reel paper backdrop
    ctx.fillRect(10, 52, W - 20, 140);

    // 2 Vertical Reel Dividers
    ctx.fillStyle = '#393047';
    ctx.fillRect(46, 52, 2, 140);
    ctx.fillRect(84, 52, 2, 140);

    // Lower Ribbed Mechanical Plate
    ctx.fillStyle = '#15121b';
    ctx.fillRect(10, 222, W - 20, 16);
    ctx.fillStyle = '#534764';
    for (let rx = 12; rx < W - 12; rx += 4) {
      ctx.fillRect(rx, 224, 2, 12);
    }

    // Bottom Relic / Engine Core Shelf (y: 244 to 272)
    ctx.fillStyle = '#15121b';
    ctx.fillRect(8, 242, W - 16, 30);
    ctx.strokeStyle = '#393047';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 242, W - 16, 30);

    mgr.addCanvas('ui_slot_chassis', canvas);
  }

  // 3. Articulated Red Ball Lever Arm
  private static createLever(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_lever')) return;

    const W = 28;
    const H = 84;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Crank base socket
    ctx.fillStyle = '#393047';
    ctx.fillRect(0, 56, 8, 14);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(2, 58, 4, 10);

    // Vertical crank rod (white / silver metal)
    ctx.fillStyle = '#15121b';
    ctx.fillRect(6, 16, 6, 44);
    ctx.fillStyle = '#e7e0ef';
    ctx.fillRect(7, 16, 4, 44);

    // Shiny Red Ball Knob on top
    const bx = 9;
    const by = 12;
    const br = 8;
    // Contour
    ctx.fillStyle = '#4a0e17';
    ctx.beginPath();
    ctx.arc(bx, by, br + 1, 0, Math.PI * 2);
    ctx.fill();
    // Red body
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(bx - 2, by - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    mgr.addCanvas('ui_lever', canvas);
  }

  // 4. Foreman Cogsworth Portrait (32x32)
  private static createForemanCogsworth(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_avatar_cogsworth')) return;

    const W = 32;
    const H = 32;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Dark niche background
    ctx.fillStyle = '#15121b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d4a373';
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Leather engineer cap with brass visor
    ctx.fillStyle = '#5c381e';
    ctx.fillRect(6, 4, 20, 8);
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(4, 11, 24, 3);

    // Brass automaton head
    ctx.fillStyle = '#b57647';
    ctx.fillRect(7, 14, 18, 12);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(8, 15, 16, 10);

    // Monocle magnifier on right eye
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(9, 17, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 18, 2, 2);

    // Left eye slit
    ctx.fillStyle = '#0b090f';
    ctx.fillRect(18, 19, 4, 2);

    // Gear Mustache
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(7, 24, 18, 3);
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(13, 24, 6, 2);

    mgr.addCanvas('ui_avatar_cogsworth', canvas);
  }

  // 5. Round Cast-Iron Skull Valve Button (36x36)
  private static createRoundSkullButton(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_btn_round_skull')) return;

    const W = 36;
    const H = 36;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const cx = 18;
    const cy = 18;

    // Outer dark iron ring
    ctx.fillStyle = '#0b090f';
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();

    // Dark slate valve body
    ctx.fillStyle = '#231d2c';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    // Inner rim
    ctx.strokeStyle = '#534764';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Cog Skull Emblem in Center
    ctx.fillStyle = '#d4a373'; // Brass skull
    ctx.fillRect(12, 10, 12, 10);
    ctx.fillRect(14, 20, 8, 4);

    // Eye sockets
    ctx.fillStyle = '#0b090f';
    ctx.fillRect(14, 13, 3, 3);
    ctx.fillRect(19, 13, 3, 3);

    // Teeth notches
    ctx.fillRect(16, 22, 1, 2);
    ctx.fillRect(19, 22, 1, 2);

    mgr.addCanvas('ui_btn_round_skull', canvas);
  }

  // 6. Nudge Arrow Button (28x18)
  private static createNudgeArrow(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_btn_nudge')) return;

    const W = 28;
    const H = 18;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Dark bevel
    ctx.fillStyle = '#15121b';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#393047';
    ctx.fillRect(1, 1, W - 2, H - 2);

    // Downward triangle arrow
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.moveTo(7, 5);
    ctx.lineTo(21, 5);
    ctx.lineTo(14, 13);
    ctx.closePath();
    ctx.fill();

    mgr.addCanvas('ui_btn_nudge', canvas);
  }

  // 7. Floating HUD Pills (Compact cartouches: Gold, Boiler HP, Units, Steam, Wave)
  private static createHUDPills(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_hud_pill_gold')) return;

    const makePill = (key: string, drawIcon: (ctx: CanvasRenderingContext2D) => void) => {
      const W = 62;
      const H = 16;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;

      // Dark translucent pill base
      ctx.fillStyle = 'rgba(11,9,15,0.75)';
      ctx.fillRect(1, 1, W - 2, H - 2);
      ctx.strokeStyle = '#393047';
      ctx.strokeRect(0, 0, W, H);

      // Icon on left
      drawIcon(ctx);

      mgr.addCanvas(key, canvas);
    };

    // Gold Pill
    makePill('ui_hud_pill_gold', (ctx) => {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(8, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8c5836';
      ctx.fillRect(7, 7, 2, 2);
    });

    // Boiler HP Pill
    makePill('ui_hud_pill_boiler', (ctx) => {
      ctx.fillStyle = '#e63946';
      ctx.fillRect(5, 5, 3, 3);
      ctx.fillRect(9, 5, 3, 3);
      ctx.fillRect(4, 7, 9, 3);
      ctx.fillRect(6, 10, 5, 2);
      ctx.fillRect(8, 12, 1, 1);
    });

    // Units Pill
    makePill('ui_hud_pill_units', (ctx) => {
      ctx.fillStyle = '#e7e0ef';
      ctx.fillRect(7, 4, 3, 3);
      ctx.fillRect(6, 8, 5, 5);
    });

    // Steam Pill
    makePill('ui_hud_pill_steam', (ctx) => {
      ctx.fillStyle = '#00b4d8';
      ctx.beginPath();
      ctx.arc(8, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#caf0f8';
      ctx.fillRect(7, 7, 2, 2);
    });
  }

  // 8. Speech Bubble Frame
  private static createSpeechBubble(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_speech_bubble')) return;

    const W = 220;
    const H = 40;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Dark mulberry body
    ctx.fillStyle = '#393047';
    ctx.fillRect(2, 2, W - 4, H - 4);

    // Beveled brass contour
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Pointer tail to left
    ctx.fillStyle = '#393047';
    ctx.beginPath();
    ctx.moveTo(14, H - 3);
    ctx.lineTo(8, H + 4);
    ctx.lineTo(20, H - 3);
    ctx.fill();

    mgr.addCanvas('ui_speech_bubble', canvas);
  }
}
