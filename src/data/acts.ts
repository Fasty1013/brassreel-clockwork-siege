import { CHAPTERS } from './story';

/** The three acts of the campaign (10 waves each), taken from the story chapters. */
export interface ActInfo {
  act: number;
  name: string;
  boss: string;
  /** the Great Regulator part this act's boss holds */
  part: string;
  /** accent colour of the act (CSS) */
  color: string;
}

const ACT_COLORS = ['#ffd166', '#2ec4b6', '#ff6b6b'];

export const ACTS: ActInfo[] = CHAPTERS.map((c, i) => ({
  act: c.act,
  name: c.place,
  boss: c.boss,
  part: c.part.name,
  color: ACT_COLORS[i] ?? '#ffd166'
}));

export const WAVES_PER_ACT = 10;
