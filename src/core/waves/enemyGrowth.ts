import { BALANCE } from '@data/balance';

export interface EnemyGrowth {
  hp: number;
  damage: number;
}

/**
 * Stat multipliers for enemies of a wave with the given `enemyPower`
 * (see src/data/waves.ts). Power 1 means base stats.
 */
export function enemyGrowth(enemyPower = 1): EnemyGrowth {
  const extra = Math.max(0, enemyPower - 1) * BALANCE.ENEMY_POWER_SCALE;
  return {
    hp: 1 + extra,
    damage: 1 + extra * BALANCE.ENEMY_DMG_GROWTH_SHARE
  };
}
