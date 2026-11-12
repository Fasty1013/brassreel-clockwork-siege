import { PixelCanvas } from './PixelCanvas';
import { drawHumanoid, HumanoidCfg, Pose } from './automaton';

/** Phaser-free sprite definitions, so the art can also be rendered by offline tools. */

export type FrameDraw = (g: PixelCanvas, p: Pose) => void;

export interface SpriteDef {
  key: string;
  size: number;
  draw: FrameDraw;
  /** flying / hovering sprites get a floating shadow and no ground hop */
  flying?: boolean;
}

export const FRAMES_PER_ANIM = 4;

export const POSES: Pose[] = [
  // idle — slow breathing
  { by: 0, lean: 0, legA: 0, legB: 0, arm: 'rest', t: 0 },
  { by: 0, lean: 0, legA: 0, legB: 0, arm: 'rest', t: 1 },
  { by: 1, lean: 0, legA: 0, legB: 0, arm: 'rest', t: 2 },
  { by: 1, lean: 0, legA: 0, legB: 0, arm: 'rest', t: 3 },
  // walk — alternate foot lifts with a bob on contact
  { by: 0, lean: 1, legA: 2, legB: 0, arm: 'rest', t: 0 },
  { by: 1, lean: 1, legA: 0, legB: 0, arm: 'rest', t: 1 },
  { by: 0, lean: 1, legA: 0, legB: 2, arm: 'rest', t: 2 },
  { by: 1, lean: 1, legA: 0, legB: 0, arm: 'rest', t: 3 },
  // attack — anticipation, strike, follow-through, recover
  { by: 0, lean: -1, legA: 0, legB: 0, arm: 'windup', t: 0 },
  { by: 1, lean: 2, legA: 0, legB: 1, arm: 'strike', t: 1 },
  { by: 1, lean: 1, legA: 0, legB: 0, arm: 'follow', t: 2 },
  { by: 0, lean: 0, legA: 0, legB: 0, arm: 'rest', t: 3 }
];

export function human(key: string, cfg: HumanoidCfg, flying = false): SpriteDef {
  return { key, size: cfg.size, draw: (g, p) => drawHumanoid(g, cfg, p), flying: flying || cfg.legs.type === 'hover' };
}

export function custom(key: string, size: number, draw: FrameDraw, flying = false): SpriteDef {
  return { key, size, draw, flying };
}

