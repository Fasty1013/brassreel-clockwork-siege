/**
 * Campaign story: «Великий Регулятор».
 *
 * Нью-Брассхольм живёт по Часам Регулятора. Паровой Барон украл Великий
 * Регулятор, разобрал на три части и раздал их: Маховик оставил себе,
 * Спираль отдал Императрице Коррозии, а Сердце поставил реактором в своего
 * Железного Колосса. Игрок — Механик последней работающей кузницы-казино.
 * Цель кампании — вернуть все три части и запустить часы города.
 */

export type Speaker = 'foreman' | 'lira' | 'baron' | 'empress' | 'colossus';

export interface SpeakerDef {
  name: string;
  color: string;
  /** texture key of the portrait (single idle frame) */
  portrait: string;
}

export const SPEAKERS: Record<Speaker, SpeakerDef> = {
  foreman: { name: 'Мастер Шестерёнкин', color: '#ffd166', portrait: 'ui_avatar_cogsworth' },
  lira: { name: 'Лира, разведчица гильдии', color: '#8fe39a', portrait: 'tex_spring_sharpshooter' },
  baron: { name: 'Паровой Барон', color: '#ff8a7a', portrait: 'tex_boss_steam_baron' },
  empress: { name: 'Императрица Коррозии', color: '#5ae0d0', portrait: 'tex_boss_corrosion_empress' },
  colossus: { name: 'Барон в Железном Колоссе', color: '#ff6b6b', portrait: 'tex_boss_iron_colossus' }
};

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

export interface StoryScene {
  id: string;
  title: string;
  lines: StoryLine[];
}

export interface RegulatorPart {
  id: string;
  name: string;
  /** icon texture for the part */
  icon: string;
}

export interface Chapter {
  act: 1 | 2 | 3;
  title: string;
  place: string;
  boss: string;
  /** what the player is fighting for in this chapter */
  goal: string;
  part: RegulatorPart;
  intro: string;
  bossTaunt: string;
  outro: string;
  /** refined cogs for the first time this chapter's boss falls */
  firstClearReward: number;
}

export const CHAPTERS: Chapter[] = [
  {
    act: 1,
    title: 'Глава I. Латунный луг',
    place: 'Латунный луг',
    boss: 'Паровой Барон',
    goal: 'Отбить кузницу и отнять у Барона Маховик',
    part: { id: 'flywheel', name: 'Маховик', icon: 'sym_cog_gilded' },
    intro: 'ch1_intro',
    bossTaunt: 'ch1_boss',
    outro: 'ch1_outro',
    firstClearReward: 25
  },
  {
    act: 2,
    title: 'Глава II. Ржавые топи',
    place: 'Ржавые топи',
    boss: 'Императрица Коррозии',
    goal: 'Пройти топи и вернуть Спираль',
    part: { id: 'spiral', name: 'Спираль', icon: 'sym_spring_gilded' },
    intro: 'ch2_intro',
    bossTaunt: 'ch2_boss',
    outro: 'ch2_outro',
    firstClearReward: 50
  },
  {
    act: 3,
    title: 'Глава III. Цитадель Барона',
    place: 'Цитадель Барона',
    boss: 'Железный Колосс',
    goal: 'Ворваться в Цитадель и вырвать Сердце из Колосса',
    part: { id: 'heart', name: 'Сердце', icon: 'sym_crown_gilded' },
    intro: 'ch3_intro',
    bossTaunt: 'ch3_boss',
    outro: 'finale',
    firstClearReward: 100
  }
];

export const STORY_SCENES: Record<string, StoryScene> = {
  ch1_intro: {
    id: 'ch1_intro',
    title: 'Глава I. Латунный луг',
    lines: [
      { speaker: 'foreman', text: 'Механик, подъём! Над Нью-Брассхольмом дым, а часы на ратуше встали.' },
      { speaker: 'foreman', text: 'Паровой Барон украл Великий Регулятор. Без него все механизмы города остановятся.' },
      { speaker: 'lira', text: 'Я Лира, разведчица гильдии. Барон разобрал Регулятор на три части: Маховик, Спираль и Сердце.' },
      { speaker: 'lira', text: 'Маховик он держит при себе. Его мародёры уже идут через луг — прямо к нам.' },
      { speaker: 'foreman', text: 'Наша кузница-казино — последняя, что работает. Её барабаны собирают боевых автоматов.' },
      { speaker: 'foreman', text: 'Крути барабаны, расставляй роботов и держи котёл. Отобьём луг — доберёмся до Барона.' }
    ]
  },
  ch1_boss: {
    id: 'ch1_boss',
    title: 'Паровой Барон',
    lines: [
      { speaker: 'baron', text: 'Кто посмел завести эту ржавую шарманку? Мои мародёры должны были сровнять её с землёй!' },
      { speaker: 'baron', text: 'Маховик теперь мой. Хочешь его — попробуй отнять у Парового Барона!' },
      { speaker: 'foreman', text: 'Осторожно: когда его котёл перегреется, он рванёт вперёд вдвое быстрее.' }
    ]
  },
  ch1_outro: {
    id: 'ch1_outro',
    title: 'Маховик возвращён',
    lines: [
      { speaker: 'baron', text: 'Кх-х… Мой котёл… Это не конец! Императрица утопит вас в ржавчине!' },
      { speaker: 'lira', text: 'Он удирает на север, в Ржавые топи. Но смотри — он выронил Маховик!' },
      { speaker: 'foreman', text: 'Первая часть Регулятора наша. Стрелки на ратуше дрогнули — город ещё жив.' }
    ]
  },
  ch2_intro: {
    id: 'ch2_intro',
    title: 'Глава II. Ржавые топи',
    lines: [
      { speaker: 'lira', text: 'Топи едят металл. Кислотные дроны, пиявки, болотные шатуны — всё здесь служит Императрице.' },
      { speaker: 'foreman', text: 'Роботы будут ржаветь быстрее, чем мы их чиним. Не жалей шестерней в мастерской.' },
      { speaker: 'lira', text: 'Спираль у Императрицы. Говорят, она заводит ею свои рои.' }
    ]
  },
  ch2_boss: {
    id: 'ch2_boss',
    title: 'Императрица Коррозии',
    lines: [
      { speaker: 'empress', text: 'Какой блестящий металл… Скоро он станет рыжим и мягким, как всё в моём болоте.' },
      { speaker: 'empress', text: 'Спираль? Отними её, Механик. Если успеешь, пока не заржавел.' }
    ]
  },
  ch2_outro: {
    id: 'ch2_outro',
    title: 'Спираль возвращена',
    lines: [
      { speaker: 'empress', text: 'Барону… уже… не нужна Спираль. Его Колосс… почти собран…' },
      { speaker: 'lira', text: 'Колосс? Так вот зачем ему Регулятор — Сердце станет реактором его машины!' },
      { speaker: 'foreman', text: 'Спираль у нас. Осталось Сердце. Путь лежит в Цитадель Барона.' }
    ]
  },
  ch3_intro: {
    id: 'ch3_intro',
    title: 'Глава III. Цитадель Барона',
    lines: [
      { speaker: 'foreman', text: 'Цитадель кишит палачами и осадными машинами. Это последний рубеж, Механик.' },
      { speaker: 'lira', text: 'Я вскрою внешние ворота и найду реакторный зал. Держи котёл, пока я внутри.' },
      { speaker: 'foreman', text: 'Если Колосс запустится, ни один город на равнине не устоит. Мы — последняя шестерня в этих часах.' }
    ]
  },
  ch3_boss: {
    id: 'ch3_boss',
    title: 'Железный Колосс',
    lines: [
      { speaker: 'colossus', text: 'Добро пожаловать, Механик. Слышишь, как стучит Сердце Регулятора? Теперь оно бьётся во мне!' },
      { speaker: 'colossus', text: 'Колосс сотрёт твою кузницу, твой город и твои жалкие барабаны!' },
      { speaker: 'lira', text: 'Реактор перегружен! Когда он вспыхнет, Колосс раскроется. Не отступай!' }
    ]
  },
  finale: {
    id: 'finale',
    title: 'Часы Нью-Брассхольма',
    lines: [
      { speaker: 'colossus', text: 'Нет… Мой Колосс… мой Регулятор…' },
      { speaker: 'lira', text: 'Сердце у нас! Все три части!' },
      { speaker: 'foreman', text: 'Великий Регулятор снова собран. Слышишь? Часы Нью-Брассхольма снова идут.' },
      { speaker: 'foreman', text: 'Ты спас город, Механик. Но Барон строил не одного Колосса… Готов к более тяжёлой осаде?' }
    ]
  }
};

/** Short radio lines shown in the speech plate at the start of each wave (index = wave - 1). */
export const WAVE_LINES: string[] = [
  'Мародёры на лугу! Первая волна — разминка.',
  'Паровые роверы в броне. Ставь роботов поплотнее.',
  'Заводные жуки медленные, но толстые. Держи строй.',
  'Снайперы бьют издалека — не оставляй дорожки пустыми.',
  'Проверка ОТК! Управься за 40 секунд — будет премия.',
  'Бомбардировщики! Береги хрупких роботов.',
  'Бурильщики и мортиры. Нужна крепкая передняя линия.',
  'Быстрые шатуны и рейдеры рвутся к котлу.',
  'Элитный авангард Барона. Он сам уже близко.',
  'Паровой Барон! Всё, что есть, — в бой!',
  'Топи. Кислотные дроны разъедают броню.',
  'Ржавые ползуны бьют больно — встречай их стрелками.',
  'Болотные шатуны идут стеной.',
  'Пиявки высасывают щиты. Не давай им подойти.',
  'Проверка ОТК в топях: держи врагов подальше от котла.',
  'Рои дронов. Цепная молния здесь очень кстати.',
  'Императрица гонит всё болото разом.',
  'Туман. Рейдеры появляются из ниоткуда.',
  'Гвардия Императрицы. Она рядом.',
  'Императрица Коррозии! Не дай ей проржавить котёл!',
  'Ворота Цитадели. Палачи Барона уже здесь.',
  'Осадные машины. Пробивай броню!',
  'Дредноуты медленные, но их не остановить простыми ударами.',
  'Грозовые шпили. Береги роботов от молний.',
  'Проверка ОТК: Барон смотрит, как ты держишься.',
  'Лира у реакторного зала. Продержись!',
  'Цитадель бросает всех, кто остался.',
  'Колосс прогревает реактор. Земля дрожит.',
  'Последний заслон перед реакторным залом.',
  'Железный Колосс! Сердце Регулятора — там, внутри!'
];

/** Threat levels unlock one by one after the campaign is finished on the previous one. */
export interface ThreatLevel {
  level: number;
  name: string;
  desc: string;
}

export const THREAT_LEVELS: ThreatLevel[] = [
  { level: 0, name: 'Обычная осада', desc: 'Враги как задумано.' },
  { level: 1, name: 'Тревога', desc: 'Враги на 30% сильнее. Очищенных шестерней ×1.5.' },
  { level: 2, name: 'Осада', desc: 'Враги на 60% сильнее. Очищенных шестерней ×2.' },
  { level: 3, name: 'Перегрев', desc: 'Враги вдвое сильнее. Очищенных шестерней ×2.5.' }
];

export function chapterForWave(wave: number): Chapter {
  return CHAPTERS[Math.min(2, Math.max(0, Math.ceil(wave / 10) - 1))];
}
