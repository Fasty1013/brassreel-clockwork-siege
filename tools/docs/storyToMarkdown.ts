/**
 * Writes docs/STORY.md from src/data/story.ts so the script in the docs
 * always matches the game.   npx tsx tools/docs/storyToMarkdown.ts
 */
import * as fs from 'fs';
import { CHAPTERS, SPEAKERS, STORY_SCENES, THREAT_LEVELS, WAVE_LINES } from '../../src/data/story';

const out: string[] = [];
const p = (s = ''): void => {
  out.push(s);
};

p('# Сюжет кампании «Великий Регулятор»');
p();
p('> Файл собран автоматически из `src/data/story.ts` командой `npx tsx tools/docs/storyToMarkdown.ts`.');
p('> Править текст — в `story.ts`, потом пересобрать этот файл.');
p();
p('## Завязка');
p();
p('Нью-Брассхольм живёт по Часам Регулятора. Паровой Барон украл Великий Регулятор и разобрал его');
p('на три части: Маховик оставил себе, Спираль отдал Императрице Коррозии, а Сердце поставил реактором');
p('в своего Железного Колосса. Игрок — Механик последней работающей кузницы-казино. Цель кампании —');
p('вернуть все три части и снова запустить часы города.');
p();
p('## Персонажи');
p();
p('| Персонаж | Портрет (текстура) |');
p('|---|---|');
for (const s of Object.values(SPEAKERS)) p(`| ${s.name} | \`${s.portrait}\` |`);
p();
p('## Главы');
p();
p('| Глава | Волны | Босс | Цель | Часть | Награда за первую победу |');
p('|---|---|---|---|---|---|');
for (const c of CHAPTERS) {
  p(`| ${c.title} | ${(c.act - 1) * 10 + 1}–${c.act * 10} | ${c.boss} | ${c.goal} | ${c.part.name} | ${c.firstClearReward} очищ. шестерней |`);
}
p();
p('## Когда показываются сцены');
p();
p('| Сцена | Момент |');
p('|---|---|');
for (const c of CHAPTERS) {
  p(`| ${STORY_SCENES[c.intro].title} | ${c.act === 1 ? 'начало забега' : `начало волны ${(c.act - 1) * 10 + 1}`} |`);
  p(`| ${STORY_SCENES[c.bossTaunt].title} | перед волной ${c.act * 10} (босс) |`);
  p(`| ${STORY_SCENES[c.outro].title} | ${c.act === 3 ? 'победа в 30-й волне' : `после победы над боссом волны ${c.act * 10}`} |`);
}
p();
p('Каждая сцена показывается один раз на профиль игрока, затем её можно перечитать в меню «Кампания» → «Хроника».');
p('Управление: Пробел / Enter / клик — дальше, Esc — пропустить.');
p();
p('## Текст сцен');
for (const sc of Object.values(STORY_SCENES)) {
  p();
  p(`### ${sc.title}`);
  p();
  p(`\`${sc.id}\``);
  p();
  for (const line of sc.lines) p(`- **${SPEAKERS[line.speaker].name}:** ${line.text}`);
}
p();
p('## Реплики перед волнами');
p();
p('Показываются в табличке над полем: глава, номер волны и реплика.');
p();
p('| Волна | Реплика |');
p('|---|---|');
WAVE_LINES.forEach((line, i) => p(`| ${i + 1} | ${line} |`));
p();
p('## Уровни угрозы');
p();
p('Открываются по очереди: победа в кампании на текущей угрозе открывает следующую.');
p();
p('| Уровень | Название | Что меняется |');
p('|---|---|---|');
for (const t of THREAT_LEVELS) p(`| ${t.level} | ${t.name} | ${t.desc} |`);
p();

fs.writeFileSync('docs/STORY.md', out.join('\n'), 'utf-8');
console.log('docs/STORY.md written,', out.length, 'lines');
