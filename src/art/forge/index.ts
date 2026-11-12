import Phaser from 'phaser';
import { SpriteForge } from './SpriteForge';
import { ROSTER } from './roster';
import { BESTIARY } from './bestiary';
import { registerSymbolIcons } from './symbolIcons';

export { SpriteForge } from './SpriteForge';
export { ROSTER } from './roster';
export { BESTIARY } from './bestiary';

/** Forge every unit, enemy and boss sprite + their idle/walk/attack animations. */
export function registerForgeArt(scene: Phaser.Scene): void {
  SpriteForge.register(scene, ROSTER);
  SpriteForge.register(scene, BESTIARY);
  registerSymbolIcons(scene.textures);
}
