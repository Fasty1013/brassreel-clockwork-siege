# Порядок: /new-content

Новый робот, враг, черта, модуль, ядро, гаджет, волна или навык. Подробно о полях — `docs/CONTENT_GUIDE.md`.

## Шаги

1. **Дизайн.** Запись в `docs/GDD.md`: числа, роль, как взаимодействует с другими системами.
2. **Данные.** Запись в `src/data/<таблица>.ts` по схеме из `src/data/schemas/`, строки `name`/`desc`
   в `src/data/i18n/ru.json` и `en.json`.
3. **Логика.** Новый вид эффекта — обработчик в `src/core` (бой — `src/core/combat/combatEngine.ts`)
   и тест в `tests/core` или `tests/combat`: эффект срабатывает, сочетается с другими, повторяется при том же зерне.
   Ядро без обработчика `hasModifier('<ruleModifier>')` ничего не делает.
4. **Вид.** Фигурка с нужным `spriteKey` в `src/art/forge/roster.ts` или `bestiary.ts`;
   проверка — `?debug=gallery` или `npx tsx tools/qa/renderForge.ts <папка>`. Звук — в `src/audio/SoundManager.ts`.
5. **Симулятор:** `npm run sim -- --runs 500 --bot veteran --waves 30` — без ошибок и зависших боёв.
6. **Проверки:** `npm run typecheck`, `npm test`. Запись в `docs/WORK_LOG.md`.
