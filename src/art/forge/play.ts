import Phaser from 'phaser';

/**
 * Helpers for driving forged sprites: every key has `<key>_idle|_walk|_attack`.
 */

export function hasAnim(scene: Phaser.Scene, key: string, suffix: 'idle' | 'walk' | 'attack'): boolean {
  return scene.anims.exists(`${key}_${suffix}`);
}

/** Play a looping state (idle / walk) without restarting it if already playing. */
export function playLoop(sprite: Phaser.GameObjects.Sprite, key: string, suffix: 'idle' | 'walk'): void {
  const animKey = `${key}_${suffix}`;
  if (!sprite.scene.anims.exists(animKey)) return;
  if (sprite.anims.currentAnim?.key === animKey && sprite.anims.isPlaying) return;
  sprite.play(animKey, true);
}

/** Play the attack once, then fall back to `then` (idle or walk). Returns false if no anim. */
export function playAttack(sprite: Phaser.GameObjects.Sprite, key: string, then: 'idle' | 'walk'): boolean {
  const animKey = `${key}_attack`;
  if (!sprite.scene.anims.exists(animKey)) return false;
  sprite.play(animKey);
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (sprite.active) playLoop(sprite, key, then);
  });
  return true;
}

/** Integer pixel scale used on the battlefield, by native sprite size. */
export function fieldScale(size: number): number {
  return size >= 72 ? 2 : 3;
}
