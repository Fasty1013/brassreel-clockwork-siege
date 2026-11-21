import Phaser from 'phaser';

/**
 * Steampunk UI Pixel Assets & 9-Slice Canvas Generators
 * Matches reference layout: Slot Machine Left, Battle Window Right, Floating HUD Top.
 */

// ---------------------------------------------------------------- pixel kit
// Same palette as the 9-slice panels in UISkin, so every frame reads as one set.
const C = {
  out: '#0c0a10',
  ironHi: '#524866',
  ironMid: '#3b3350',
  iron: '#1f1a29',
  ironLo: '#17131f',
  panelHi: '#2b2438',
  brassHi: '#f2c98a',
  brassLight: '#d9a362',
  brass: '#c08a4e',
  brassLo: '#7a4f2a',
  copper: '#8c5836',
  gold: '#f0b44c',
  paper: '#efe8f4',
  paperLo: '#c9bfd6',
  red: '#c43241',
  redLo: '#5e0f1a',
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

/** Rounded plate in the theme: outline, one edge ring (lit top-left), flat fill; corners cut by 2 px. */
function plate(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  edgeLight: string, edgeDark: string, fill: string, outline: string = C.out
): void {
  rect(ctx, x + 2, y, w - 4, h, outline);
  rect(ctx, x, y + 2, w, h - 4, outline);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, outline);
  rect(ctx, x + 2, y + 1, w - 4, h - 2, edgeDark);
  rect(ctx, x + 1, y + 2, w - 2, h - 4, edgeDark);
  rect(ctx, x + 2, y + 1, w - 4, 1, edgeLight);
  rect(ctx, x + 1, y + 2, 1, h - 4, edgeLight);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, fill);
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

    // A slim brass frame (8 px native = 24 px on screen, exactly the backdrop's inset), shown
    // as a nine-slice: dark outline, lit brass bevel, brass band, small corner caps
    const W = 472;
    const H = 308;
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;

    plate(ctx, 0, 0, W, H, C.brassHi, C.brassLo, C.brass);
    rect(ctx, 3, 3, W - 6, 1, C.brassLight);
    rect(ctx, 6, 6, W - 12, H - 12, C.brassLo);
    rect(ctx, 7, 7, W - 14, H - 14, C.out);
    // corner caps
    for (const [cx, cy] of [[0, 0], [W - 14, 0], [0, H - 14], [W - 14, H - 14]]) {
      plate(ctx, cx, cy, 14, 14, C.brassHi, C.brassLo, C.brass);
      rect(ctx, cx + 6, cy + 6, 2, 2, C.brassHi);
    }
    // the field shows through
    ctx.clearRect(8, 8, W - 16, H - 16);
    mgr.addCanvas('ui_window_frame', canvas);
  }

  private static createSlotChassis(mgr: Phaser.Textures.TextureManager): void {
    if (mgr.exists('ui_slot_chassis')) return;
    const W = 132;
    const H = 276;
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;

    // cabinet: one dark plate with a brass edge (the same material as every panel)
    plate(ctx, 0, 6, W, H - 6, C.brassHi, C.brassLo, C.iron);
    rect(ctx, 2, 9, W - 4, 1, C.panelHi);

    // twin exhaust stacks
    for (const px of [18, W - 28]) {
      plate(ctx, px, 0, 10, 10, C.ironHi, C.out, C.ironMid);
      rect(ctx, px + 2, 7, 6, 1, C.brass);
    }

    // crown with the manometer
    plate(ctx, 6, 6, W - 12, 38, C.brassHi, C.brassLo, C.brass);
    rect(ctx, 9, 9, W - 18, 2, C.brassLight);
    rect(ctx, 9, 36, W - 18, 4, C.copper);

    const mx = W / 2;
    const my = 24;
    disc(ctx, mx, my, 12, (dx, dy, d) => (d > 11 ? C.out : d > 9.5 ? (dx + dy < 0 ? C.brassHi : C.brassLo) : C.paper));
    for (let a = 0; a < 8; a++) {
      const ang = Math.PI * (0.75 + a * 0.215);
      rect(ctx, Math.round(mx + Math.cos(ang) * 7.5 - 0.5), Math.round(my + Math.sin(ang) * 7.5 - 0.5), 1, 1, C.steelLo);
    }
    for (let i = 0; i <= 6; i++) rect(ctx, Math.round(mx + i * 0.8), Math.round(my - i * 0.7), 1, 1, C.red);
    rect(ctx, mx - 1, my - 1, 2, 2, C.out);

    // reel window (geometry kept for ReelView): brass trim, paper strips
    plate(ctx, 4, 46, W - 8, 152, C.brassHi, C.brassLo, C.brass);
    rect(ctx, 7, 49, W - 14, 146, C.out);
    rect(ctx, 9, 51, W - 18, 142, C.paper);
    rect(ctx, 9, 51, W - 18, 2, C.paperLo);
    rect(ctx, 46, 51, 2, 142, C.ironMid);
    rect(ctx, 84, 51, 2, 142, C.ironMid);

    // (the spin button sits under the reels, the reserve shelf covers the cabinet's foot)
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
    const made = canvasOf(W, H);
    if (!made) return;
    const { canvas, ctx } = made;
    plate(ctx, 0, 0, W, H, C.ironHi, C.ironMid, C.iron);
    // gold chevron pointing down
    for (let i = 0; i < 6; i++) rect(ctx, 8 + i, 6 + i, 12 - 2 * i, 1, i === 0 ? '#ffe2a0' : C.gold);
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
      plate(ctx, 0, 0, W, H, C.brassHi, C.brassLo, C.iron);
      rect(ctx, 2, 2, W - 4, 1, C.panelHi);
      // icon on the left, a thin divider before the value
      sprite(ctx, 3, 2, icon, pal);
      rect(ctx, 14, 3, 1, H - 6, C.ironMid);
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
    plate(ctx, 0, 0, W, H, C.brassHi, C.brassLo, C.iron);
    rect(ctx, 2, 2, W - 4, 1, C.panelHi);
    mgr.addCanvas('ui_speech_bubble', canvas);
  }

}
