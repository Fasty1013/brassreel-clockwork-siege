import { PRNG } from './sfc32';

export interface RngStreams {
  reel: PRNG;
  combat: PRNG;
  loot: PRNG;
  shop: PRNG;
}

export class PrngManager {
  public static createStreams(masterSeed: string): RngStreams {
    return {
      reel: PRNG.fromSeed(`${masterSeed}_reel`),
      combat: PRNG.fromSeed(`${masterSeed}_combat`),
      loot: PRNG.fromSeed(`${masterSeed}_loot`),
      shop: PRNG.fromSeed(`${masterSeed}_shop`)
    };
  }

  public static serializeStreams(streams: RngStreams): Record<string, [number, number, number, number]> {
    return {
      reel: streams.reel.serialize(),
      combat: streams.combat.serialize(),
      loot: streams.loot.serialize(),
      shop: streams.shop.serialize()
    };
  }

  public static deserializeStreams(serialized: Record<string, [number, number, number, number]>): RngStreams {
    return {
      reel: PRNG.deserialize(serialized.reel),
      combat: PRNG.deserialize(serialized.combat),
      loot: PRNG.deserialize(serialized.loot),
      shop: PRNG.deserialize(serialized.shop)
    };
  }
}

