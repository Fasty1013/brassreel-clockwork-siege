# BRASSREEL: Clockwork Siege — как добавлять содержимое

Версия 2.0, ноябрь 2026. Роботы, враги, модули, черты, ядра, гаджеты, волны и навыки — это данные
в `src/data/`. Правила, которые их читают, — в `src/core/`.

---

## 1. Общие правила

1. **В данных нет логики:** числа, строки, перечисления. Поведение задаёт тип эффекта
   (`effectType`, `ruleModifier`, `triggerEffect`), а обрабатывает его код в `src/core`.
2. **Идентификаторы:** `unit_<линейка>_<имя>`, `mod_<имя>`, `quirk_<имя>`, `core_<имя>`, `gadget_<имя>`,
   `en_<имя>`, `boss_<имя>`.
3. **Тексты:** запись хранит ключи `nameKey` и `descKey` (например `unit.cog_knight.name`), сами строки —
   в `src/data/i18n/ru.json` и `en.json`. Описание должно совпадать с тем, что делает код.
   Исключения: `skills.ts` и `story.ts` хранят русский текст прямо в данных.
4. **Проверка схемами:** `tests/core/dataValidation.test.ts` и `schemaSmoke.test.ts` прогоняют все таблицы
   через схемы Zod из `src/data/schemas/`.
5. **Картинка:** у робота и врага есть `spriteKey` (`tex_…`). Фигурка с таким ключом должна быть в
   `src/art/forge/roster.ts` (роботы) или `bestiary.ts` (враги и боссы), иначе на поле будет заглушка.
   Проверить — `?debug=gallery` или `npx tsx tools/qa/renderForge.ts <папка>`.

## 2. Таблицы

### Робот — `units.ts`, схема `unitSchema.ts`
```typescript
{
  id, nameKey, descKey,
  faction: 'cog' | 'spring' | 'fuse' | 'coil' | 'scrap' | 'legendary',
  tier: 0 | 1 | 2 | 3,          // 1 — базовый, 2 — эволюция на 3★, 3 — эволюция на 5★
  baseHp, baseDamage,
  attackSpeed,                  // атак в секунду
  attackRange,                  // клетки, 1 — ближний бой
  armor, moveSpeed,             // клеток в секунду, роботы ходят к врагам
  quirkId,                      // черта из quirks.ts
  evolutionBranchA?, evolutionBranchB?,  // id роботов следующей ступени
  spriteKey
}
```
Уровень (1★–5★) — не в данных: он растёт слиянием и даёт +50% здоровья и урона за уровень (`balance.ts`).
Новую линейку придётся добавить и в символы барабанов (`src/core/reels/reels.ts`).

### Черта — `quirks.ts`
`{ id, nameKey, descKey, effectType, params }`. `effectType` — вид из перечня в `QuirkDefinition` (`shield_aura`, `stun_charge`,
`chain_lightning`, `time_dilation`…), обработка — в `combatEngine.ts`. Числа в `params` задают доли от урона
и здоровья робота, чтобы черта не устаревала к концу забега. Новый вид эффекта = новый код в бою + тест
в `tests/combat/quirks.test.ts`.

### Модуль — `mods.ts`, схема `modSchema.ts`
`{ id, nameKey, descKey, rarity: 'common'|'rare'|'epic', statModifiers, triggerEffect?, triggerParam? }`.
`statModifiers`: `damagePct`, `hpPct`, `attackSpeedPct`, `flatArmor`, `rangeTiles` и др.
В бою срабатывают `triggerEffect` `burn`, `shock`, `stun`; остальные значения схемы пока ничего не делают.

### Враг — `enemies.ts`, схема `enemySchema.ts`
`{ id, nameKey, descKey, hp, damage, attackSpeed, moveSpeed, attackRange, armor, bountyCogs, isBoss?, bossPhases?, spriteKey }`.
Это базовые числа: в бою они умножаются на `enemyWaveScale(волна)` и угрозу кампании.
Враг с `attackRange > 1` — стрелок: стоит и стреляет, а через 3 с без попаданий по нему подходит к цели.

### Волна — `waves.ts`, схема `waveSchema.ts`
`{ waveNumber, actNumber, titleKey, rewardCogs, spawns: [{ enemyId, count, spawnDelaySeconds, rowLane? }], isBoss?, isInspection?, inspectionChallenge? }`.
Проверка ОТК сейчас всегда `speed_trial` (победить быстрее `targetParam` секунд). Реплика перед волной —
в `story.ts`, название акта для ленты и карты — `acts.ts`.

### Гаджет — `gadgets.ts`, схема `gadgetSchema.ts`
`{ id, nameKey, descKey, type: 'passive'|'consumable', cost, effectType, params }`.
Эффект по `effectType` — в `src/core/gadgets/gadgets.ts` (покупка, витрина, цены) и в бою для расходников
следующего боя. Цена в данных — базовая: улучшения дорожают на 50% за каждое купленное, расходники — на 15% за волну.

### Ядро двигателя — `cores.ts`, схема `coreSchema.ts`
`{ id, nameKey, descKey, tags, actTier, ruleModifier, params }`. Эффекты ядер собраны в `src/core/cores/coreEffects.ts`
(прокрутка, волна, слияние, начало боя) и читают `params` через `CoreEngine.getModifierParam`; правила внутри боя
(`buff_fuse_aoe`, `buff_coil_jumps`) передаются в `combat.coreMods`. Новое ядро без обработчика ничего не делает —
добавьте его и тест в `tests/core/coreEffects.test.ts`.

### Навык — `skills.ts`
`{ id, branch, tier, name, desc, effect, perRank, maxRank, costs, requires? }`. `effect` — один из видов
в `SkillEffect`, применяется в `src/core/skills/skills.ts`. `{n}` в `desc` заменяется на `perRank`.

## 3. Порядок

1. Запись в данных + строки в `ru.json` и `en.json`.
2. Новый вид эффекта — код в `src/core` и тест в `tests/core` или `tests/combat`.
3. Фигурка в `src/art/forge` (для роботов и врагов).
4. `npm test`, `npm run typecheck`.
5. `npm run sim -- --runs 500 --bot veteran --waves 30` — без ошибок и зависших боёв; если меняется сила,
   прогнать 1000 забегов и обновить `BALANCE.md`.
