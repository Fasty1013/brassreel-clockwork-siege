import { PixelCanvas, Ramp } from './PixelCanvas';
import { C, Palette, R } from './ramps';
import {
  Anchors, BackType, ChestType, HeadType, HumanoidCfg, LegType, Pose, ShieldType, WeaponType
} from './automaton';
import { human, SpriteDef } from './defs';

/**
 * Player roster — 32 automatons.
 * Tier 0/1 are 32px, tier 2 are 40px, tier 3 are 48px, legendaries 56px, so an
 * evolved unit is visibly bigger than its predecessor on the battlefield.
 */

export const PAL = {
  scrap: { body: R.steel, trim: R.rust, accent: R.copper, eye: C.eyeWarm },
  cog: { body: R.brass, trim: R.gold, accent: R.red, eye: C.eyeWarm },
  spring: { body: R.green, trim: R.brass, accent: R.moss, eye: C.eyeWarm },
  fuse: { body: R.red, trim: R.iron, accent: R.ember, eye: C.fire1 },
  coil: { body: R.blue, trim: R.steel, accent: R.cyan, eye: C.eyeCyan }
} as const satisfies Record<string, Palette>;

interface Opt {
  head: HeadType;
  legs?: LegType;
  chest?: ChestType;
  shape?: 'barrel' | 'box' | 'round';
  weapon?: WeaponType;
  wlen?: number;
  wmat?: Ramp;
  shield?: ShieldType;
  back?: BackType[];
  crest?: boolean;
  crown?: boolean;
  shift?: number;
  tw?: number;
  th?: number;
  hw?: number;
  hh?: number;
  lh?: number;
  lw?: number;
  hdx?: number;
  noArm?: boolean;
  deco?: (g: PixelCanvas, a: Anchors, p: Pose) => void;
}

const DIM: Record<number, { tw: number; th: number; hw: number; hh: number; lh: number; shift: number }> = {
  32: { tw: 10, th: 7, hw: 10, hh: 8, lh: 4, shift: -3 },
  40: { tw: 12, th: 9, hw: 11, hh: 9, lh: 5, shift: -4 },
  48: { tw: 15, th: 11, hw: 12, hh: 10, lh: 6, shift: -5 },
  56: { tw: 18, th: 13, hw: 14, hh: 11, lh: 7, shift: -6 }
};

export function bot(size: number, pal: Palette, o: Opt): HumanoidCfg {
  const d = DIM[size] ?? DIM[32];
  return {
    size,
    pal,
    torso: { w: o.tw ?? d.tw, h: o.th ?? d.th, shape: o.shape, chest: o.chest },
    head: { type: o.head, w: o.hw ?? d.hw, h: o.hh ?? d.hh, crest: o.crest, crown: o.crown, dx: o.hdx },
    legs: { type: o.legs ?? 'stub', h: o.lh ?? d.lh, w: o.lw },
    weapon: o.weapon ? { type: o.weapon, len: o.wlen, mat: o.wmat } : undefined,
    shield: o.shield,
    back: o.back,
    shiftX: o.shift ?? d.shift,
    noArm: o.noArm,
    deco: o.deco
  };
}

// ---------------------------------------------------------------- shared deco
const rivets = (g: PixelCanvas, a: Anchors, ramp: Ramp): void => {
  g.px(a.tx + 1, a.ty + 1, ramp[3]);
  g.px(a.tx + a.tw - 2, a.ty + a.th - 2, ramp[0]);
};

/** Castle crenellations along the shoulders. */
const battlements = (ramp: Ramp) => (g: PixelCanvas, a: Anchors): void => {
  for (let i = 0; i < a.tw; i += 4) {
    if (i >= ((a.tw - a.hw) >> 1) && i < ((a.tw + a.hw) >> 1) + 1) continue;
    g.rect(a.tx + i, a.ty - 2, 2, 2, ramp[1]);
    g.px(a.tx + i, a.ty - 2, ramp[2]);
  }
};

/** Rack of launch tubes on the back/top. */
const tubeRack = (rows: number) => (g: PixelCanvas, a: Anchors, p: Pose): void => {
  const x = a.tx - 5;
  const y = a.ty - 4;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < 3; i++) {
      const tx = x + i * 4 + r;
      const ty = y - r * 3;
      g.rect(tx, ty, 4, 3, R.iron[1]);
      g.hl(tx, ty, 4, R.iron[2]);
      g.px(tx + 3, ty + 1, p.arm === 'strike' && (i + r) % 2 === 0 ? C.fire1 : C.dark);
    }
  }
  if (p.arm === 'strike') {
    g.px(x + 13 + rows, y - 1, C.fire2);
    g.px(x + 14 + rows, y - 3, C.white);
  }
};

/** Big glowing core in the middle of the torso. */
const bigCore = (ramp: Ramp, d = 7) => (g: PixelCanvas, a: Anchors, p: Pose): void => {
  const x = a.tx + ((a.tw - d) >> 1) + 1;
  const y = a.ty + ((a.th - d) >> 1);
  g.oval(x, y, d, d, C.dark);
  g.oval(x + 1, y + 1, d - 2, d - 2, ramp);
  g.px(x + (d >> 1), y + (d >> 1), (p.t & 1) === 0 ? C.white : ramp[3]);
  if (p.arm === 'strike') {
    g.px(x - 2, y + 1, C.arc);
    g.px(x + d + 1, y + d - 2, C.arc);
    g.px(x + (d >> 1), y - 2, C.arc);
  }
};

const shoulderPads = (ramp: Ramp, s = 5) => (g: PixelCanvas, a: Anchors): void => {
  g.oval(a.tx - 2, a.ty - 2, s, s, ramp);
};

const combine = (...fns: Array<(g: PixelCanvas, a: Anchors, p: Pose) => void>) =>
  (g: PixelCanvas, a: Anchors, p: Pose): void => {
    for (const f of fns) f(g, a, p);
  };

// ---------------------------------------------------------------- roster
export const ROSTER: SpriteDef[] = [
  // ============ SCRAP
  human('tex_scrap_bot', bot(32, PAL.scrap, {
    head: 'bucket', chest: 'grill', weapon: 'claw', back: ['key'], tw: 9, hw: 9, hh: 7,
    deco: (g, a) => {
      g.px(a.hx + 2, a.hy - 1, R.rust[2]);
      g.px(a.hx + 2, a.hy - 2, R.rust[1]);
      g.px(a.hx + 3, a.hy - 3, R.red[2]);
      g.px(a.tx + 2, a.ty + a.th - 2, R.rust[1]);
    }
  })),

  // ============ COG — brass tanks
  human('tex_cog_knight', bot(32, PAL.cog, {
    head: 'helm', crest: true, chest: 'plate', weapon: 'sword', wlen: 7, shield: 'round'
  })),
  human('tex_cog_bulwark', bot(40, PAL.cog, {
    head: 'helm', crest: true, chest: 'gauge', weapon: 'hammer', wlen: 6, shield: 'tower',
    back: ['chimney'], tw: 13
  })),
  human('tex_cog_ramhead', bot(40, PAL.cog, {
    head: 'horns', chest: 'gear', weapon: 'lance', wlen: 12, shape: 'box', back: ['gear'],
    deco: (g, a) => rivets(g, a, R.gold)
  })),
  human('tex_cog_fortress', bot(48, PAL.cog, {
    head: 'cyclops', hw: 9, hh: 8, tw: 20, th: 14, shape: 'box', chest: 'grill',
    weapon: 'mace', wlen: 7, back: ['chimney2'], lh: 5, lw: 4,
    deco: combine(battlements(R.gold), (g, a) => {
      g.hl(a.tx + 1, a.ty + a.th - 4, a.tw - 2, R.gold[1]);
      rivets(g, a, R.gold);
    })
  })),
  human('tex_cog_aegis', bot(48, { ...PAL.cog, accent: R.blue }, {
    head: 'helm', crown: true, chest: 'core', weapon: 'sword', wlen: 10, wmat: R.gold,
    shield: 'energy', back: ['cape'], deco: shoulderPads(R.gold)
  })),
  human('tex_cog_juggernaut', bot(48, PAL.cog, {
    head: 'dome', legs: 'tread', chest: 'gauge', weapon: 'drill', wlen: 9, back: ['chimney2'],
    tw: 17, th: 12, lh: 6, deco: shoulderPads(R.iron, 6)
  })),
  human('tex_cog_siegebreaker', bot(48, PAL.cog, {
    head: 'horns', legs: 'wheel', chest: 'gear', weapon: 'axe', wlen: 9, back: ['spikes', 'chimney'],
    shape: 'box', lh: 7, deco: shoulderPads(R.red, 6)
  })),

  // ============ SPRING — green marksmen
  human('tex_spring_archer', bot(32, PAL.spring, {
    head: 'hood', legs: 'spring', weapon: 'bow', wlen: 7, back: ['quiver'], chest: 'belt',
    tw: 8, lh: 5, shift: -4
  })),
  human('tex_spring_sharpshooter', bot(40, PAL.spring, {
    head: 'goggles', legs: 'spring', weapon: 'rifle', wlen: 12, back: ['cape', 'antenna'],
    chest: 'belt', tw: 10, lh: 6, shift: -7
  })),
  human('tex_spring_repeater', bot(40, PAL.spring, {
    head: 'dome', weapon: 'gatling', wlen: 8, back: ['tank'], chest: 'grill', shift: -6
  })),
  human('tex_spring_ballista', bot(48, PAL.spring, {
    head: 'goggles', hw: 9, hh: 8, legs: 'base', lh: 5, shape: 'box', chest: 'gear',
    weapon: 'crossbow', wlen: 16, wmat: R.brass, tw: 13, shift: -9, noArm: true,
    deco: (g, a, p) => {
      // winch on the back of the emplacement
      g.oval(a.tx - 4, a.ty + 3, 6, 6, R.brass);
      g.px(a.tx - 2 + ((p.t & 1) === 0 ? 0 : 1), a.ty + 5, C.dark);
    }
  })),
  human('tex_spring_eagle', bot(48, PAL.spring, {
    head: 'eagle', crest: true, legs: 'spring', weapon: 'bow', wlen: 10, back: ['wings', 'quiver'],
    chest: 'plate', tw: 12, lh: 8, shift: -6
  })),
  human('tex_spring_volley', bot(48, PAL.spring, {
    head: 'cyclops', hw: 8, hh: 7, legs: 'tread', shape: 'box', chest: 'grill',
    weapon: 'gatling', wlen: 9, tw: 16, th: 10, shift: -7, hdx: 6, deco: tubeRack(2)
  })),
  human('tex_spring_chrono', bot(48, PAL.spring, {
    head: 'goggles', legs: 'spring', chest: 'clock', weapon: 'rifle', wlen: 16,
    back: ['cape', 'key'], tw: 13, lh: 7, shift: -10
  })),

  // ============ FUSE — red bombardiers
  human('tex_fuse_sapper', bot(32, PAL.fuse, {
    head: 'bomb', hw: 9, hh: 9, chest: 'belt', weapon: 'bomb', tw: 9
  })),
  human('tex_fuse_pyromancer', bot(40, PAL.fuse, {
    head: 'goggles', chest: 'grill', weapon: 'flamer', wlen: 9, back: ['tank'], shift: -8
  })),
  human('tex_fuse_demolitionist', bot(40, PAL.fuse, {
    head: 'bucket', chest: 'belt', weapon: 'cannon', wlen: 10, back: ['tank'], shift: -7,
    deco: (g, a) => {
      // bandolier of charges
      for (let i = 0; i < 4; i++) g.px(a.tx + 2 + i * 2, a.ty + 2 + i, R.gold[2]);
    }
  })),
  human('tex_fuse_mortar', bot(48, PAL.fuse, {
    head: 'furnace', hw: 10, hh: 9, legs: 'tread', chest: 'gauge', weapon: 'mortar', wlen: 8,
    back: ['chimney'], tw: 16, shift: -6, noArm: true
  })),
  human('tex_fuse_hellfire', bot(48, PAL.fuse, {
    head: 'furnace', hw: 13, hh: 11, shape: 'round', chest: 'core', weapon: 'flamer', wlen: 12,
    back: ['chimney2', 'tank'], tw: 16, th: 12, shift: -10
  })),
  human('tex_fuse_blast_dynamo', bot(48, PAL.fuse, {
    head: 'bomb', hw: 11, hh: 11, legs: 'wheel', shape: 'round', weapon: 'bomb',
    back: ['gear'], tw: 16, th: 12, lh: 7, deco: bigCore(R.ember, 7)
  })),
  human('tex_fuse_doom_barricade', bot(48, PAL.fuse, {
    head: 'mask', hw: 10, hh: 8, legs: 'base', lh: 5, shape: 'box', weapon: 'cannon', wlen: 10,
    shield: 'spiked', back: ['spikes'], tw: 20, th: 14, shift: -6, noArm: true,
    deco: combine(battlements(R.iron), (g, a) => {
      for (let i = 2; i < a.tw - 2; i += 4) {
        g.px(a.tx + i, a.ty + a.th - 3, R.gold[2]);
        g.px(a.tx + i + 1, a.ty + a.th - 4, C.dark);
      }
    })
  })),

  // ============ COIL — blue electricians
  human('tex_coil_sparker', bot(32, PAL.coil, {
    head: 'coil', hw: 9, hh: 9, chest: 'core', weapon: 'prod', wlen: 6, tw: 9
  })),
  human('tex_coil_conduit', bot(40, PAL.coil, {
    head: 'glass', chest: 'core', weapon: 'staff', wlen: 9, back: ['coilpack', 'cape'], shift: -3
  })),
  human('tex_coil_dynamo', bot(40, PAL.coil, {
    head: 'dome', legs: 'wheel', chest: 'core', weapon: 'fork', wlen: 9, back: ['gear'],
    lh: 6, shift: -7
  })),
  human('tex_coil_tesla', bot(48, PAL.coil, {
    head: 'coil', hw: 13, hh: 13, shape: 'box', weapon: 'fork', wlen: 11, back: ['coilpack'],
    tw: 17, th: 12, shift: -9, deco: combine(bigCore(R.cyan, 7), shoulderPads(R.steel, 6))
  })),
  human('tex_coil_storm', bot(48, PAL.coil, {
    head: 'glass', hw: 12, hh: 11, legs: 'hover', lh: 7, chest: 'core', weapon: 'staff', wlen: 13,
    back: ['cape', 'antenna'], tw: 13, shift: -3,
    deco: (g, a, p) => {
      // orbiting storm motes
      const o = [[-4, 2], [a.tw + 2, 6], [-3, 9], [a.tw + 3, 1]][p.t & 3];
      g.px(a.tx + o[0], a.ty + o[1], C.arc);
    }
  })),
  human('tex_coil_shield', bot(48, PAL.coil, {
    head: 'helm', crest: true, chest: 'plate', weapon: 'prod', wlen: 9, shield: 'energy',
    back: ['coilpack'], deco: shoulderPads(R.steel, 6)
  })),
  human('tex_coil_overload', bot(48, PAL.coil, {
    head: 'cyclops', hw: 10, hh: 9, legs: 'spider', lh: 7, shape: 'round', weapon: 'fork', wlen: 9,
    back: ['coilpack', 'antenna'], tw: 17, th: 14, shift: -7, deco: bigCore(R.cyan, 9)
  })),

  // ============ LEGENDARY
  human('tex_legendary_leviathan', bot(56, { body: R.bronze, trim: R.gold, accent: R.cyan, eye: C.eyeCyan }, {
    head: 'horns', legs: 'tread', lh: 8, chest: 'gauge', weapon: 'cannon', wlen: 13,
    back: ['chimney2', 'spikes'], tw: 22, th: 15, shift: -9,
    deco: combine(shoulderPads(R.gold, 8), (g, a, p) => {
      // jaw plate + steam vents
      for (let i = 0; i < 4; i++) g.px(a.hx + a.hw - 2 - i * 2, a.hy + a.hh - 2, R.bone[2]);
      g.hl(a.tx + 2, a.ty + a.th - 4, a.tw - 4, R.gold[1]);
      if (p.arm === 'strike') {
        g.px(a.tx - 2, a.ty + 4, C.steam);
        g.px(a.tx - 3, a.ty + 2, C.steamDim);
      }
    })
  })),
  human('tex_legendary_solarion', bot(56, { body: R.gold, trim: R.bone, accent: R.ember, eye: C.white }, {
    head: 'furnace', hw: 12, hh: 11, legs: 'hover', lh: 8, crown: true, weapon: 'staff', wlen: 15,
    back: ['halo', 'cape'], tw: 15, th: 13, shift: -4, deco: bigCore(R.ember, 7)
  })),
  human('tex_legendary_chrono', bot(56, { body: R.steel, trim: R.gold, accent: R.violet, eye: C.eyeCyan }, {
    head: 'helm', crown: true, chest: 'clock', weapon: 'sword', wlen: 13, wmat: R.violet,
    shield: 'kite', back: ['cape', 'key'], shift: -8, deco: shoulderPads(R.gold, 7)
  }))
];
