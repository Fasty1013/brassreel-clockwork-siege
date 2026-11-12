import { Ramp } from './PixelCanvas';

/** Material colour ramps: [dark, mid, light, specular]. */
export const R = {
  brass: ['#6b3f22', '#b57647', '#e0a45c', '#ffe3a1'],
  bronze: ['#4a2a18', '#8c5836', '#b57647', '#e0a45c'],
  gold: ['#a8641f', '#e6a532', '#ffd166', '#fff4c2'],
  copper: ['#7a3320', '#c0623a', '#e8905a', '#ffd0a8'],
  iron: ['#2b2533', '#514a5e', '#7b728c', '#b8afc9'],
  steel: ['#4a4658', '#8a879c', '#bfbdd0', '#f0eef8'],
  green: ['#1f5a3c', '#3f9b63', '#74c98d', '#c8f2c0'],
  moss: ['#26432a', '#4d7a3e', '#86b35a', '#d2e89a'],
  red: ['#6e1220', '#c22a33', '#ee5a4a', '#ffb08a'],
  ember: ['#8a2a0a', '#e2581a', '#ff9a2e', '#ffe08a'],
  blue: ['#123a7a', '#2274c4', '#4fb3ec', '#c4f0ff'],
  cyan: ['#0c6a8a', '#1fb0d0', '#7ee6f5', '#eaffff'],
  rust: ['#3d1f1c', '#7a3b2a', '#a85a3a', '#d68a5a'],
  dusk: ['#1c1a26', '#3a3648', '#5a556e', '#8d87a6'],
  acid: ['#24451a', '#4e8a22', '#8fd12e', '#e0ff8a'],
  bog: ['#2a2e22', '#4a5238', '#727a52', '#a8ae7e'],
  crimson: ['#3d0a14', '#8a1526', '#c9283a', '#ff7a70'],
  wood: ['#3b2416', '#6b4226', '#9a6638', '#c99658'],
  glass: ['#2a6f8f', '#6fc7e0', '#b8ecf7', '#ffffff'],
  bone: ['#8a7a6a', '#c9bca4', '#efe6d0', '#ffffff'],
  violet: ['#3a1f5c', '#6d3fa8', '#a071e0', '#e0c8ff']
} as const satisfies Record<string, Ramp>;

export const C = {
  eyeWarm: '#ffe066',
  eyeCyan: '#7ee6f5',
  eyeRed: '#ff3b3b',
  eyeGreen: '#b4ff3a',
  dark: '#17121f',
  steam: '#f4ecd8',
  steamDim: '#b8a9c9',
  spark: '#ffd166',
  fire1: '#ffe08a',
  fire2: '#ff9a2e',
  fire3: '#e2581a',
  arc: '#eaffff',
  white: '#ffffff'
} as const;

export interface Palette {
  body: Ramp;
  trim: Ramp;
  accent: Ramp;
  eye: string;
}
