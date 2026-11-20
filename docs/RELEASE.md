# BRASSREEL: Clockwork Siege — выпуск и упаковка

Игра — офлайн-страница HTML5 + WebGL: все картинки рисуются кодом, звуки синтезируются WebAudio,
сетевых запросов нет. Есть три способа доставить её игроку.

## 1. Сайт (GitHub Pages)

Основной способ. `.github/workflows/pages.yml` при каждой отправке в `main`:
`npm ci` → `npm test` → `npm run build` → публикация `dist/`. Если тесты падают, сайт не обновляется.

Адрес: https://fasty1013.github.io/brassreel-clockwork-siege/

## 2. Windows: BRASSREEL.exe

`BRASSREEL.exe` — маленький лаунчер (`launcher/Launcher.cs`, C# WinForms). Он раздаёт папку `dist`
локальным HTTP-сервером (порт от 38888) и открывает игру отдельным окном Chrome или Edge.
Лог — `%TEMP%\BRASSREEL_log.txt`. Нужны Windows 10/11 и установленный Chrome или Edge.

```bash
npm run build       # собрать dist/
npm run build:exe   # пересобрать BRASSREEL.exe из launcher/Launcher.cs (компилятор csc из .NET Framework 4)
```

`PLAY.bat` собирает `dist`, если её нет, и запускает `BRASSREEL.exe`; без exe открывает `npm run preview`.

**Архив для выпуска:** `BRASSREEL.exe` + папка `dist` в одном zip (`BRASSREEL-v<версия>-windows.zip`),
к нему заметка в `docs/releases/v<версия>.md`. Пример — [`docs/releases/v0.4.0.md`](releases/v0.4.0.md).

## 3. Android: APK

Обёртка Capacitor 8.5.3 вокруг `dist/` (`capacitor.config.ts`, папка `android/`).

- **Сборка — на GitHub:** `.github/workflows/android.yml` при отправке в `main` (и в ветку `android-build`)
  прогоняет тесты, собирает игру, `npx cap sync android`, `./gradlew assembleDebug` (JDK 21 и Android SDK —
  на машине GitHub) и выкладывает `BRASSREEL-v<версия>-android.apk` в пред-выпуск **android-latest**
  (страница Releases репозитория) и в артефакты сборки.
- **Установка:** скачать APK на телефон, открыть, разрешить установку из неизвестных источников.
  Подпись отладочная (для Google Play нужна своя подпись и формат AAB). Android 7.0+.
- **Приложение:** только горизонтальная ориентация (поворот по датчику), полный экран без системных панелей
  (свайп от края показывает их на время), экран не гаснет, тёмная заставка, значок — золотая шестерня
  (`npx tsx tools/android/makeIcons.ts` перерисовывает его во всех размерах).
- **Локально** (нужны JDK 21 и Android SDK): `npm run build && npx cap sync android`, затем
  `cd android && ./gradlew assembleDebug`; APK — `android/app/build/outputs/apk/debug/app-debug.apk`.

## 4. Экраны разной формы

Игра рисуется в 1920×1080 и вписывается целиком в любой экран (`Phaser.Scale.FIT`): телефоны 19.5–20:9,
планшеты 4:3 и 16:10, ПК 16:9, 16:10, 21:9. Поля по краям — тёмный латунный узор (`index.html`), отступы
под вырез камеры (`safe-area`), в портретной ориентации на телефоне — «Поверните телефон горизонтально».
Проверка: `SHOT_WIDTH=915 SHOT_HEIGHT=412 npx tsx tools/qa/shot.ts out.png`.

## 5. Заготовки под Steam (не доведены)

- **Electron:** `electron/main.cjs` и `preload.cjs`; пакет `electron` есть в devDependencies.
  Запуск: `npx electron electron/main.cjs`. Сборщика установщика (`electron-builder`) в проекте нет.
- **Tauri 2:** есть только `src-tauri/tauri.conf.json`, Rust-части (`Cargo.toml`, `src/main.rs`) нет —
  `npx tauri build` в нынешнем виде не соберётся.

## Перед выпуском

1. `npm test` и `npm run typecheck` — без ошибок.
2. Менялись числа роботов, врагов или экономики — `npm run sim -- --runs 1000 --bot veteran --waves 30`,
   итог в `docs/BALANCE.md`.
3. `npm run build`, затем `npx tsx tools/qa/verifyPlayability.ts` (меню → барабаны → бой).
4. Номер версии — в `package.json` и в подписи главного меню (`src/scenes/MenuScene.ts`).
5. Заметка к выпуску в `docs/releases/`.

## Сохранения

- Архив кузницы и прогресс кампании — в `localStorage` браузера, ключ `brassreel_meta_state_v1`.
- Текущий забег живёт, пока открыта вкладка или окно игры; после закрытия начинается новый.
