# Порядок: /balance-pass

Замер и подстройка баланса по целям из `docs/BALANCE.md` §6.

## Цели

| Что | Цель |
|---|---|
| `VeteranBot` проходит 30 волн | 50–70% |
| без удержаний (`veteran-noholds`) | заметно хуже обычного |
| без гаджетов (`veteran-nogadgets`), без древа (`veteran-noskills`) | хуже, но не ноль |
| зависших боёв на 1000 забегов | 0 |
| средняя длина боя | 20–60 с |
| хотя бы одна тройка за прокрутку на стартовых лентах | ≈ 60% |

## Шаги

1. **Замер** (по 1000 забегов, отчёты в `docs/sim-reports/`):
   ```bash
   npm run sim -- --runs 1000 --bot veteran --waves 30
   npm run sim -- --runs 1000 --bot veteran-noholds --waves 30
   npm run sim -- --runs 1000 --bot veteran-nogadgets --waves 30
   npm run sim -- --runs 1000 --bot veteran-noskills --waves 30
   ```
2. **Разбор.** Таблица по волнам: где гибнут, прочность Котла, роботы на поле, сумма уровней, шестерни, навыки,
   зависшие бои.
3. **Правка чисел** — только в `src/data/balance.ts` (`ENEMY_SCALE_ANCHORS` и др.) или в базовых числах
   роботов и врагов. Правила игры ради чисел не меняются.
4. **Повторный замер** тем же набором.
5. **Запись** итога в `docs/BALANCE.md` §7 и тест `tests/core/enemyScaling.test.ts`, если менялся рост врагов.
