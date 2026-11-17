/** The three acts of the campaign (10 waves each): where the fight is and who waits at the end. */
export interface ActInfo {
  act: number;
  name: string;
  boss: string;
  /** accent colour of the act (CSS) */
  color: string;
}

export const ACTS: ActInfo[] = [
  { act: 1, name: 'Латунный луг', boss: 'Паровой Барон', color: '#ffd166' },
  { act: 2, name: 'Ржавые топи', boss: 'Коррозийная Императрица', color: '#2ec4b6' },
  { act: 3, name: 'Цитадель Барона', boss: 'Железный Колосс', color: '#ff6b6b' }
];

export const WAVES_PER_ACT = 10;
