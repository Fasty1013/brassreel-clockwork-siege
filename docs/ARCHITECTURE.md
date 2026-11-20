# BRASSREEL: Clockwork Siege — устройство кода

Версия 2.0, ноябрь 2026 (игра v0.4.0).

---

## 1. Главное правило: логика отдельно от графики

```
   Phaser: сцены, окна, анимации, звук      (src/scenes, src/ui, src/art, src/presentation, src/fx, src/audio)
          │ команды (RunCommand)       ▲ события (EventBus)
          ▼                            │
   Логика игры без графики                  (src/core)
          ▲
          │ та же логика, без браузера
   Симулятор с ботами и тесты               (tools/sim, tests)
```

- **В `src/core` нет Phaser, `window` и `document`.** Исключение — `core/meta/metaManager.ts`: он читает
  и пишет `localStorage`, но проверяет, что `window` есть, и в Node работает без сохранений.
- **Детерминизм:** одно зерно + те же команды = тот же забег до бита. Зерно случайное на каждый забег,
  `?seed=…` в адресе задаёт его вручную.
- **Данные отдельно от правил:** числа и содержимое — в `src/data`, правила их читают.

## 2. Папки

```
src/
  main.ts            запуск Phaser, шрифт Rubik, масштабирование холста (keepCanvasSharp)
  core/              ЛОГИКА
    state/           RunState (состояние забега), reducer.ts (все команды)
    prng/            SFC32 и четыре потока случайности
    reels/           ленты, остановка, 8 линий, джокер, джекпот
    heat/            жар и заклинивание
    units/           создание робота: характеристики, модули
    smelt/           слияние по уровням и эволюция
    combat/          бой: движение, цели, атаки, черты, статусы, клапан, прорывы
    waves/           волны, появление врагов, проверка ОТК, эволюция врагов (enemyEvolution)
    economy/         шестерни и пар
    gadgets/         витрина мастерской, цены, эффекты гаджетов
    skills/          древо навыков, лимит поля
    cores/           ядра двигателя: coreEngine (какие надеты), coreEffects (что делают)
    campaign/        кампания: части Регулятора, сцены, угрозы
    meta/            архив кузницы между забегами (localStorage)
    events/          типы событий и EventBus
  data/              ДАННЫЕ
    balance.ts       все числа баланса, рост врагов (ENEMY_SCALE_ANCHORS, enemyWaveScale)
    units.ts         32 робота          quirks.ts   24 черты
    mods.ts          40 модулей         cores.ts    20 ядер
    gadgets.ts       30 гаджетов        skills.ts   12 узлов древа
    enemies.ts       20 врагов + 3 босса   mutations.ts  6 мутаций врагов
    waves.ts         30 волн            acts.ts     3 акта для ленты и карты кампании
    story.ts         главы, сцены, реплики перед волнами
    schemas/         схемы Zod для units, mods, cores, gadgets, enemies, waves
    i18n/            ru.json, en.json, t(key, params)
  art/               ПРОЦЕДУРНАЯ ГРАФИКА
    forge/           генератор фигурок: PixelCanvas, automaton (детали), roster (роботы),
                     bestiary (враги, боссы), levelLook (вид по уровням), symbolIcons, SpriteForge
    environment/     фоны трёх актов (actBackdrops.ts)
    ui/              пиксельные панели и рамки (UISkin.ts, frames.ts)
    characters/      ранние эталонные фигурки (Cog Knight и др.) для AnimationViewer
  presentation/      постановка прокрутки (SlotDirector, Choreographer), эффекты (Juice, ParticleKit)
  fx/                старый генератор текстур (proceduralAssets.ts), атмосфера, анимации
  audio/             SoundManager.ts — синтез звуков WebAudio
  ui/                окна и элементы: HUD, ReelView, GridView, UnitCard, ShopView, SkillTreeModal,
                     EvolutionModal, CoreDraftModal, ArchiveModal, CampaignModal, CampaignMapModal,
                     DialogueModal, InfoTip, Tooltip, ModalKit, TextStyles
  scenes/            BootScene, MenuScene, RunScene, GameOverScene;
                     отладочные GalleryScene (?debug=gallery), AnimationViewerScene, ReferenceScene
tests/               Vitest: core/, combat/, meta/, audio/; e2e/playtestBrowser.ts (Puppeteer)
tools/
  sim/               runner.ts, telemetry.ts, idleUnits.ts, боты (VeteranBot и варианты; старые Random/Greedy/Smart)
  qa/                shot.ts (скриншот), verifyPlayability.ts, renderForge.ts (листы спрайтов)
launcher/            Launcher.cs — исходник BRASSREEL.exe
electron/, src-tauri/ заготовки настольных обёрток (см. RELEASE.md)
data/animation/      JSON с таймингами анимаций из планов визуальной переделки
```

## 3. Случайность

`PrngManager.createStreams(seed)` создаёт четыре независимых потока SFC32 из одного зерна:

| Поток | На что |
|---|---|
| `reel` | остановки барабанов, заклинивание |
| `combat` | бой |
| `loot` | модули при призыве |
| `shop` | витрина мастерской, выбор ядер |

Покупки в мастерской не меняют исход прокруток, прокрутки не меняют бой. Состояние потока сериализуется
в 4 числа.

## 4. Состояние и команды

Сцена не меняет состояние сама: она отправляет команду в `RunReducer.dispatch(state, command, rng, eventBus)`
(`src/core/state/reducer.ts`). Команды:

`SPIN`, `HOLD_REEL`, `NUDGE_REEL`, `DEPLOY_UNIT`, `UNDEPLOY_UNIT`, `SMELT_UNITS`, `CHOOSE_EVOLUTION`,
`BUY_SKILL`, `START_BATTLE`, `STEP_BATTLE`, `USE_VALVE`, `ADVANCE_TO_SHOP`, `BUY_SYMBOL`, `REMOVE_SYMBOL`,
`GILD_SYMBOL`, `BUY_GADGET`, `EQUIP_CORE`, `REROLL_SHOP`, `START_NEXT_WAVE`.

Фазы забега: `PREP` → `BATTLE` → `RESULT` → `SHOP` → `PREP` …, в конце `GAME_OVER` или `VICTORY`.
Расставлять, сливать и покупать навыки можно в любой фазе, кроме боя (`RunReducer.canArrange`).

Редьюсер рассылает события через `EventBus` (`src/core/events/events.ts`): `spin_start`, `line_hit`, `jackpot`,
`unit_summoned`, `bench_overflow`, `unit_smelted`, `evolution_ready`, `jam_triggered`, `wave_completed`,
`inspection_completed`, `core_draft_ready`, `run_victory`, `run_defeat` и др. Сцена по ним рисует эффекты,
открывает окна и играет звуки.

Пауза забега: «МЕНЮ» или Esc усыпляет `RunScene` (`scene.sleep`) и запускает `MenuScene`;
«Продолжить забег» будит её (`scene.wake`) в том же состоянии.

## 5. Бой

`CombatEngine` (`src/core/combat/combatEngine.ts`) шагает по 50 мс (`STEP_BATTLE` с `dt`).
Поле 8×5, координаты дробные: роботы и враги ходят непрерывно, клетки нужны для расстановки.

За шаг:
1. Статусы: оглушение, поджог, шок, замедление, щиты.
2. Роботы: цели только в своём и соседних рядах (`inLanes`, `LANE_REACH`). Цель в радиусе — атака; нет —
   стрелок отходит от клетки не дальше `UNIT_LEASH`, ближний бой — не дальше `MELEE_LEASH`, и только к врагу,
   которого оттуда достанет; иначе возвращается на клетку (`homeOf`, `returnHome`).
3. Враги: прыгун перепрыгивает робота, перекрывшего ряд; иначе ближайший робот своего ряда в радиусе
   (снайпер — самый слабый) — атака, иначе шаг к Котлу. Стрелок, по которому 3 с никто не попадает,
   подходит к цели. Подрывник при гибели взрывается (`killEnemy`).
4. Снаряды и черты: пробивание, цепи, урон по площади, щиты, отбрасывание.
5. Смерти, награда за врагов, прорывы (−1 Котлу, босс −3).

Урон: `max(1, урон − броня)`, бронированный мутант дополнительно режет урон. Числа врагов умножаются
на `enemyWaveScale(wave)` и угрозу кампании.

**Эволюция врагов** (`src/core/waves/enemyEvolution.ts`): на `START_BATTLE` редьюсер запоминает расстановку
(`analyzeFormation` → `state.lastFormation`), на `START_NEXT_WAVE` составляет план мутаций следующей волны
(`planWave` → `state.evolution`, поток `combat`). `WaveController` при появлении врага берёт мутации из плана
(`rollFor`) и применяет их (`apply`).

## 6. Графика и звук

- Внешних картинок нет. Фигурки собирает `src/art/forge`: детали (головы, ноги, оружие, щиты) рисуются
  на `PixelCanvas` палитрами по 4 оттенка с тёмным контуром, `SpriteForge` склеивает кадры (покой, ходьба,
  атака — 12 кадров) и регистрирует текстуры в Phaser при загрузке.
- Звуки синтезирует `SoundManager` через WebAudio.
- Шрифт — Rubik (`@fontsource/rubik`, 500 и 700), все стили текста — `src/ui/TextStyles.ts`.
- Игра рисуется в 1920×1080 (`Phaser.Scale.FIT`). В уменьшенном окне холст сглаживается, в полном
  размере — пиксельный (`keepCanvasSharp` в `src/main.ts`).

## 7. Тексты

- `t(key, params)` из `src/data/i18n/index.ts` берёт строку из `ru.json` или `en.json`.
- По замыслу в коде окон не должно быть строк на языке игрока. На деле в `src/ui` и `src/scenes` много
  русского текста прямо в коде (около 20 файлов), а сюжет (`story.ts`) и названия навыков (`skills.ts`) —
  только на русском. Английская версия экранов не проверялась.

## 8. Проверки

- `npm test` — Vitest, 203 теста в 26 файлах (ноябрь 2026).
- `npm run typecheck` — TypeScript в режиме `strict`.
- `npm run sim -- --runs 1000 --bot veteran --waves 30` — баланс; таблица по волнам, зависшие бои отдельно.
- `npx tsx tools/qa/verifyPlayability.ts` — браузер: меню → барабаны → бой.
