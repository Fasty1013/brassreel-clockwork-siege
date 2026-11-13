# BRASSREEL: Clockwork Siege — памятка для Claude Code

Краткая выжимка для агента, который продолжает работу над проектом.
Правила игры подробно — в [`GAME_INFO.md`](GAME_INFO.md), история изменений
и список «что осталось» — в [`WORK_LOG.md`](WORK_LOG.md). Начинать стоит с них.

Старые документы `GDD.md`, `BALANCE.md`, `ARCHITECTURE.md`, `ART_BIBLE.md`,
`ASSET_INVENTORY.md`, `HANDOFF.md` писались до визуальной переделки: архитектура
в них верна, но правила (слияние, лимиты, цена прокрутки) и пути к графике устарели.

---

## 1. Что за игра

Стимпанк-рогалик: слот-машина 3×3 призывает роботов, роботы на поле 8×5 сами
защищают котёл от волн врагов. 30 волн, 3 акта, босс в конце каждого.

- Призыв — только 3 одинаковых символа в линию (8 линий). Пары ничего не дают.
- Каждая прокрутка стоит шестерни: 2, 3, 4… (цена растёт внутри волны, сбрасывается в новой). Первые 3 прокрутки волны без жара.
- Слияние: та же линейка и тот же уровень → уровень +1, максимум 5★. На 3★ и 5★ — эволюция.
- Лимит роботов на поле 5, растёт в древе навыков (клавиша T). Скамейка — 10 мест.
- У каждого класса своя способность, все работают в бою.

## 2. Технологии

- **Phaser 3.88**, **TypeScript**, сборка **Vite**, тесты **Vitest**.
- Холст 1920×1080, `Phaser.Scale.FIT`. Пиксельная графика, но холст сглаживается,
  когда масштаб окна не целый (`syncCanvasSmoothing` в `src/main.ts`), иначе текст теряет строки пикселей.
- Шрифт **Rubik** (`@fontsource/rubik`), задаётся в одном месте — `src/ui/TextStyles.ts`.
  Минимальный размер 15 px. Pixelify Sans убран: его кириллица нечитаема.
- Вся графика генерируется кодом, внешних картинок нет.

## 3. Где что лежит

| Путь | Что там |
|---|---|
| `src/core/` | логика без Phaser и DOM, детерминирована зерном |
| `src/core/state/reducer.ts` | все команды игрока (SPIN, DEPLOY_UNIT, SMELT_UNITS…) |
| `src/core/state/RunState.ts` | состояние забега, `spinCost()` |
| `src/core/combat/combatEngine.ts` | бой: тики, цели, урон |
| `src/core/combat/quirkEffects.ts` | способности классов (по `effectType` + `params`) |
| `src/core/smelt/smelt.ts` | слияние и эволюция |
| `src/core/skills/skills.ts` | древо навыков, лимит роботов |
| `src/data/` | баланс (`balance.ts`), роботы, способности (`quirks.ts`), враги, волны, навыки |
| `src/data/i18n/ru.json`, `en.json` | тексты на двух языках |
| `src/art/forge/` | генератор пиксельных фигурок: `roster.ts` (роботы), `bestiary.ts` (враги), `levelLook.ts` (вид по уровням) |
| `src/art/environment/actBackdrops.ts` | фоны трёх актов |
| `src/art/ui/UISkin.ts` | пиксельные панели |
| `src/ui/` | HUD, барабаны (`ReelView`), карточки роботов, окна, подсказки (`InfoTip`) |
| `src/scenes/RunScene.ts` | главный экран забега, связывает ядро и интерфейс |
| `tests/` | тесты ядра и боя |
| `tools/sim/` | безголовый симулятор с ботами для баланса |
| `tools/qa/` | скриншоты и листы спрайтов без браузера |

`src/art/characters/`, `src/fx/proceduralAssets.ts`, `ReferenceScene`, `AnimationViewerScene` —
остатки ранних этапов; рабочая графика роботов и врагов идёт из `src/art/forge/`.

## 4. Правила работы

1. `src/core/` не импортирует Phaser, `window`, `document`. Логика должна работать в Node (тесты, симулятор).
2. Ядро детерминировано: случайность только через потоки `rng.reel / combat / loot / shop`.
3. Правила игры (ядро) меняются, когда об этом просит автор игры. Числа — в `src/data/`.
4. Тексты способностей в `i18n` должны совпадать с тем, что делает `quirkEffects.ts`.
5. После изменений: `npm run typecheck`, `npm test`, `npm run build` — все должны проходить.
6. Видимые изменения проверять в игре: сервер разработки (`.claude/launch.json`) или `tools/qa/shot.ts`.

## 4а. Баланс сложности

- Сила врагов задаётся числом `enemyPower` у каждой волны в `src/data/waves.ts` (HP ×сила, урон растёт на `ENEMY_DMG_GROWTH_SHARE` от этого). Общий регулятор — `BALANCE.ENEMY_POWER_SCALE` (1 — как настроено, 0.8 — легче, 1.2 — сложнее).
- Числа не выдумываются руками: их подбирает `npm run sim:calibrate` по боту `HumanBot` (сливает роботов, покупает навыки, ставит строй). После изменения роботов, навыков, бонусов слияния или состава волн калибровку надо перезапустить и перенести числа в `waves.ts`.
- `npm run sim:balance` показывает результат. Ориентир: `HumanBot` проходит 30 волн примерно в 70% забегов, зависших боёв (столбец `stalls`) — ноль.
- Старые боты `smart` и `greedy` не сливают роботов по новым правилам и не покупают навыки — по ним баланс мерить нельзя.

## 5. Команды

```bash
npm run dev          # сервер разработки
npm test             # тесты
npm run typecheck    # проверка типов
npm run build        # сборка в dist/
npm run sim -- --runs 300 --bot human --waves 30   # симуляция (боты: human, smart, greedy, random)
npm run sim:balance                 # отчёт по волнам: смертность, прорывы, потери роботов
npm run sim:calibrate               # подобрать enemyPower каждой волны (-- --check — только замерить)
npx tsx tools/qa/shot.ts out.png "<js>"   # скриншот собранной игры 1920×1080
npx tsx tools/qa/renderForge.ts <папка> 5  # листы всех фигурок и уровней
```

Отладочные адреса: `?seed=123456789` — повторить забег, `?debug=gallery` — галерея фигурок.

## 6. Плагины и навыки Claude

На аккаунте включены только плагины, полезные этой игре. Для интерфейса и дизайна:

| Плагин | Для чего в этом проекте |
|---|---|
| **frontend-design** (Anthropic) | визуальный стиль, шрифты, чтобы интерфейс не выглядел шаблонным |
| **Design** (Anthropic) | разбор экранов (`design:design-critique`), тексты интерфейса (`design:ux-copy`), доступность (`design:accessibility-review`) |
| **design-skills** | взаимодействие и анимации (`design-skills:interaction-design`), «подтягивание» визуала (`design-skills:design-elevation`), UX-тексты |
| **audit-suite** | проверка глазами дизайнера и UX-инженера (`audit-suite:audit-as-design-eng`, `audit-as-ux-eng`), `make-interfaces-feel-better`, `web-animation-design` |
| **Engineering** (Anthropic) | ревью кода, отладка, стратегия тестов |
| **GitHub** | репозиторий и PR; нужен вход через `/mcp` |

Unity, Unreal, Meta VR, Figma, ux-ui-audit, Desktop Commander и другие отключены: проект на Phaser,
графика рисуется кодом на холсте. Подробности и причины — в `WORK_LOG.md`, раздел 14.

## 7. Публикация

- Отправка в ветку `main` запускает `.github/workflows/pages.yml`: тесты, сборка,
  обновление https://fasty1013.github.io/brassreel-clockwork-siege/ . Если тесты падают, сайт не обновляется.
- `BRASSREEL.exe` (исходник `launcher/Launcher.cs`) раздаёт папку `dist/` и открывает игру окном браузера.
