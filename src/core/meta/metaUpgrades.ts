export interface MetaUpgradeDef {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  costPerRank: number[];
  icon: string;
}

export const META_UPGRADES: Record<string, MetaUpgradeDef> = {
  boiler_reinforcement: {
    id: 'boiler_reinforcement',
    name: 'Усиленная обшивка котла',
    description: '+1 к макс. давлению котла за ранг (до +3 HP)',
    maxRank: 3,
    costPerRank: [15, 30, 50],
    icon: '🛡️'
  },
  steam_manifold: {
    id: 'steam_manifold',
    name: 'Паровой коллектор',
    description: '+1 к стартовому пару в начале каждого забега (до +2)',
    maxRank: 2,
    costPerRank: [20, 45],
    icon: '💨'
  },
  gear_calibration: {
    id: 'gear_calibration',
    name: 'Калибровка фиксаторов (Hold)',
    description: '+1 заряд Hold на каждую волну',
    maxRank: 2,
    costPerRank: [25, 50],
    icon: '⚙️'
  },
  precision_escapement: {
    id: 'precision_escapement',
    name: 'Прецизионный спуск (Nudge)',
    description: '+1 заряд Nudge на каждую волну',
    maxRank: 2,
    costPerRank: [25, 50],
    icon: '📐'
  },
  gilded_starter: {
    id: 'gilded_starter',
    name: 'Золотая гравировка',
    description: 'Центральный символ на втором барабане стартует Золочёным (+50% стат)',
    maxRank: 1,
    costPerRank: [40],
    icon: '✨'
  },
  salvage_efficiency: {
    id: 'salvage_efficiency',
    name: 'Эффективный сбор лома',
    description: '+15% к награде Шестернями за прохождение волн',
    maxRank: 3,
    costPerRank: [20, 35, 60],
    icon: '💰'
  },
  crucible_efficiency: {
    id: 'crucible_efficiency',
    name: 'Горячий тигель (Smelt XP)',
    description: 'Каждый сплав даёт +1 бонусное очко опыта автоматону',
    maxRank: 2,
    costPerRank: [30, 60],
    icon: '🔥'
  },
  overdrive_cooling: {
    id: 'overdrive_cooling',
    name: 'Охлаждающий контур',
    description: 'Порог заклинивания барабанов (Jam) сдвинут с 60% до 70% нагрева',
    maxRank: 1,
    costPerRank: [50],
    icon: '❄️'
  }
};

