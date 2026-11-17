# Порядок: /release-build

Выпуск новой версии. Подробно о способах доставки — `docs/RELEASE.md`.

## Список

1. **Проверки**
   - [ ] рабочая копия чистая, всё нужное закоммичено;
   - [ ] `npm run typecheck` и `npm test` без ошибок;
   - [ ] `npm run sim -- --runs 1000 --bot veteran --waves 30` — 0 зависших боёв, процент побед в цели `BALANCE.md` §6.
2. **Сборка**
   - [ ] `npm run build` — `dist/` без предупреждений, Phaser в отдельном чанке;
   - [ ] `npx tsx tools/qa/verifyPlayability.ts` проходит;
   - [ ] `BRASSREEL.exe` открывает игру (при правке лаунчера — `npm run build:exe`).
3. **Версия**
   - [ ] номер в `package.json` и в подписи главного меню (`src/scenes/MenuScene.ts`).
4. **Выпуск**
   - [ ] заметка `docs/releases/v<версия>.md` (что нового, баланс, управление, ограничения);
   - [ ] архив `BRASSREEL-v<версия>-windows.zip` = `BRASSREEL.exe` + `dist/`;
   - [ ] отправка в `main` обновляет сайт; убедиться, что сборка GitHub Actions прошла.
