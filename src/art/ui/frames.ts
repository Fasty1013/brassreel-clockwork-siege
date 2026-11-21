import Phaser from 'phaser';

/**
 * Steampunk UI Pixel Assets & 9-Slice Canvas Generators
 * Matches reference layout: Slot Machine Left, Battle Window Right, Floating HUD Top.
 */

// ---------------------------------------------------------------- pixel kit
// Same palette as the 9-slice panels in UISkin, so every frame reads as one set.
const C = {
  out: '#17121f',
  ironHi: '#6a6280',
  ironMid: '#3d3650',
  iron: '#2f2b3c',
  ironLo: '#1c1a26',
  brassHi: '#ffe3a1',
  brassLight: '#e0a45c',
  brass: '#b57647',
  brassLo: '#6b3f22',
  copper: '#8c5836',
  paper: '#e7e0ef',
  paperLo: '#bdb3cc',
  red: '#c1121f',
  redLo: '#6e0d18',
  redHi: '#ff8a7a',
  steelHi: '#e7e0ef',
  steel: '#a8a3b8',
  steelLo: '#5c566e'
};

function canvasOf(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

/** Outline + one-pixel bevel (light top-left, dark bottom-right) + flat fill. */
function bevel(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  light: string, dark: string, fill: string, outline: string | null = C.out
): void {
  let o = 0;
  if (outline) {
    rect(ctx, x, y, w, h, outline);
    o = 1;
  }
  rect(ctx, x + o, y + o, w - 2 * o, h - 2 * o, dark);
  rect(ctx, x + o, y + o, w - 2 * o - 1, h - 2 * o - 1, light);
  rect(ctx, x + o + 1, y + o + 1, w - 2 * o - 2, h - 2 * o - 2, fill);
}

/** Brass trim: outline, brass bevel, mid brass ring, dark inner line. Inner area left as `fill`. */
function brassFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, rivets = true): void {
  bevel(ctx, x, y, w, h, C.brassLight, C.brassLo, C.brass);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, C.out);
  rect(ctx, x + 4, y + 4, w - 8, h - 8, fill);
  if (rivets) {
    for (const [rx, ry] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]) {
      rect(ctx, rx, ry, 1, 1, C.brassHi);
    }
  }
}

/** Integer-pixel disc; `shade` picks the colour from the offset to the centre. */
function disc(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  shade: (dx: number, dy: number, d: number) => string
): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r) rect(ctx, x, y, 1, 1, shade(dx, dy, d));
    }
  }
}

/** Draw a small sprite from text rows; each char maps to a colour, '.' is empty. */
function sprite(ctx: CanvasRenderingContext2D, x: number, y: number, rows: string[], pal: Record<string, string>): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = pal[row[i]];
      if (c) rect(ctx, x + i, y + j, 1, 1, c);
    }
  });
}

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
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;

    // iron cabinet with bevel and rivet columns
    bevel(ctx, 0, 6, W, H - 6, C.ironHi, C.ironLo, C.iron);
    for (let y = 52; y < H - 8; y += 16) {
      rect(ctx, 3, y, 1, 1, C.brass);
      rect(ctx, W - 4, y, 1, 1, C.brass);
    }
    // vertical panel seams
    rect(ctx, 5, 48, 1, H - 56, C.ironLo);
    rect(ctx, W - 6, 48, 1, H - 56, C.ironLo);

    // twin exhaust stacks
    for (const px of [18, W - 28]) {
      bevel(ctx, px, 0, 10, 10, C.ironHi, C.ironLo, C.ironMid);
      rect(ctx, px + 1, 7, 8, 2, C.brass);
      rect(ctx, px + 1, 7, 8, 1, C.brassLight);
    }

    // brass boiler crown with two rivet rows
    brassFrame(ctx, 6, 5, W - 12, 40, C.copper, true);
    rect(ctx, 10, 9, W - 20, 32, C.brass);
    rect(ctx, 10, 9, W - 20, 3, C.brassLight);
    rect(ctx, 10, 12, W - 20, 1, C.brassHi);
    rect(ctx, 10, 37, W - 20, 4, C.brassLo);
    for (let x = 14; x < W - 12; x += 8) {
      rect(ctx, x, 15, 1, 1, C.brassHi);
      rect(ctx, x, 34, 1, 1, C.brassLo);
    }

    // manometer: brass bezel, paper face, red needle
    const mx = W / 2;
    const my = 25;
    disc(ctx, mx, my, 12, (dx, dy, d) => (d > 11 ? C.out : d > 9.5 ? (dx + dy < 0 ? C.brassHi : C.brassLo) : C.paper));
    for (let a = 0; a < 8; a++) {
      const ang = Math.PI * (0.75 + a * 0.215);
      rect(ctx, Math.round(mx + Math.cos(ang) * 7.5 - 0.5), Math.round(my + Math.sin(ang) * 7.5 - 0.5), 1, 1, C.steelLo);
    }
    for (let i = 0; i <= 6; i++) rect(ctx, Math.round(mx + i * 0.8), Math.round(my - i * 0.7), 1, 1, C.red);
    rect(ctx, mx - 1, my - 1, 2, 2, C.out);

    // reel window: brass trim around the original recess (geometry kept for ReelView)
    brassFrame(ctx, 4, 46, W - 8, 152, C.out, true);
    rect(ctx, 8, 50, W - 16, 144, '#0b090f');
    rect(ctx, 10, 52, W - 20, 140, C.paper);
    rect(ctx, 10, 52, W - 20, 2, C.paperLo);
    rect(ctx, 46, 52, 2, 140, C.ironMid);
    rect(ctx, 84, 52, 2, 140, C.ironMid);

    // (the vent plate under the reels gave way to the big spin button, see ReelView)

    // (the bottom of the cabinet sits behind the reserve shelf)

    mgr.addCanvas('ui_slot_chassis', canvas);
  }


  // 3. Articulated Red Ball Lever Arm
  private static createLever(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_lever')) return;
    const W = 28;
    const H = 84;
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;

    // brass socket bolted to the cabinet
    bevel(ctx, 0, 54, 12, 18, C.brassLight, C.brassLo, C.brass);
    rect(ctx, 2, 56, 1, 1, C.brassHi);
    rect(ctx, 2, 68, 1, 1, C.brassHi);

    // steel rod with a light and a dark side
    rect(ctx, 6, 16, 7, 44, C.out);
    rect(ctx, 7, 16, 5, 44, C.steel);
    rect(ctx, 7, 16, 1, 44, C.steelHi);
    rect(ctx, 11, 16, 1, 44, C.steelLo);
    // brass collar
    bevel(ctx, 5, 48, 9, 5, C.brassLight, C.brassLo, C.brass);

    // red knob, lit from the top left
    disc(ctx, 9.5, 11.5, 9, (dx, dy, d) => {
      if (d > 8) return C.out;
      if (dx + dy > 6) return C.redLo;
      if (d < 3.2 && dx < -1 && dy < -1) return C.redHi;
      return C.red;
    });
    rect(ctx, 5, 6, 2, 2, '#ffe3e0');

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

    // 52×13 plates shown at an exact ×3 (156×39 px): brass trim, dark plate, icon socket
    const makePill = (key: string, icon: string[], pal: Record<string, string>) => {
      const W = 52;
      const H = 13;
      const made = canvasOf(W, H);
      if (!made) return;
      const { canvas, ctx } = made;
      bevel(ctx, 0, 0, W, H, C.brassLight, C.brassLo, C.brass);
      rect(ctx, 2, 2, W - 4, H - 4, C.out);
      rect(ctx, 3, 3, W - 6, H - 6, '#1d1824');
      rect(ctx, 3, 3, W - 6, 1, C.iron);
      // icon socket
      rect(ctx, 2, 2, 11, 9, C.ironLo);
      rect(ctx, 13, 2, 1, 9, C.brassLo);
      sprite(ctx, 3, 2, icon, pal);
      mgr.addCanvas(key, canvas);
    };

    makePill('ui_hud_pill_gold', [
      '...a.a...',
      '..aabaa..',
      '.abbbbba.',
      '..bbcbb..',
      '.abcccba.',
      '..bbcbb..',
      '.abbbbba.',
      '..aabaa..',
      '...a.a...'
    ], { a: C.brassLo, b: '#ffd166', c: C.copper });

    makePill('ui_hud_pill_boiler', [
      '.........',
      '.aa...aa.',
      'abba.abba',
      'abbbabbba',
      'abbbbbbba',
      '.abbbbba.',
      '..abbba..',
      '...aba...',
      '....a....'
    ], { a: C.redLo, b: '#e63946' });

    makePill('ui_hud_pill_units', [
      '...aaa...',
      '..abbba..',
      '..acbca..',
      '..abbba..',
      '...aaa...',
      '.aabbbaa.',
      'abbbbbbba',
      'abbbbbbba',
      '.aaaaaaa.'
    ], { a: C.steelLo, b: C.steelHi, c: '#5ae0d0' });

    makePill('ui_hud_pill_steam', [
      '....a....',
      '...aba...',
      '..abbba..',
      '..abcba..',
      '.abbcbba.',
      '.abbbbba.',
      '.abbbbba.',
      '..abbba..',
      '...aaa...'
    ], { a: '#0b5d73', b: '#00b4d8', c: '#caf0f8' });
  }


  // 8. Speech Bubble Frame
  private static createSpeechBubble(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_speech_bubble')) return;
    // 168×30 plate shown at ×3
    const W = 168;
    const H = 30;
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;
    brassFrame(ctx, 0, 0, W, H, '#241e2c', true);
    rect(ctx, 4, 4, W - 8, 1, C.iron);
    mgr.addCanvas('ui_speech_bubble', canvas);
  }

}
