# BRASSREEL: Clockwork Siege — Steam & Production Release Manual

## 📦 Distribution Packages

BRASSREEL is packaged as a high-performance, 100% offline HTML5 + WebGL application, ready for native Steam distribution via **Tauri 2** (preferred for ultra-lightweight binary ~10MB) or **Electron** (broadest cross-platform compatibility).

---

## 🛠️ Production Build Process

### 1. Build the Web Application
```bash
# Typecheck, bundle and split vendor chunks into /dist
npm run build
```

This generates:
- `dist/index.html` (entry point with relative asset paths `./assets/...`)
- `dist/assets/index-*.js` (~250 KB application logic & data)
- `dist/assets/phaser-*.js` (~1.48 MB Phaser 3 engine)

### 2. Verify Local Preview
```bash
npm run preview
```
Visit `http://localhost:4173/` to verify zero console warnings, perfect WebAudio synthesis, and offline operability.

---

## 🚀 Desktop Wrapper Builds (Steam Deployment)

### Option A: Tauri 2 (Recommended for Steam)
1. Prerequisites: Rust toolchain installed (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` or `rustup-init.exe` on Windows).
2. Install Tauri CLI:
   ```bash
   npm install --save-dev @tauri-apps/cli@^2.0.0
   ```
3. Build standalone Windows `.exe` / Steam installer:
   ```bash
   npx tauri build
   ```
4. Output directory: `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/brassreel-clockwork-siege.exe`.

### Option B: Electron
1. Install electron-builder:
   ```bash
   npm install --save-dev electron electron-builder
   ```
2. Run in development:
   ```bash
   npx electron electron/main.cjs
   ```
3. Build Windows portable / installer:
   ```bash
   npx electron-builder --win portable
   ```

---

## 📋 Steamworks Checklist

- [x] **Zero External Network Dependencies:** All textures are synthesized on HTML5 Canvas via `proceduralAssets.ts`; all audio is synthesized via WebAudio `SoundManager.ts`. Zero 3rd party CDN requests.
- [x] **Local Storage Meta-Progression:** Saves state in `localStorage` (`brassreel_meta_state_v1`), which seamlessly persists in Steam Cloud or local app data folders.
- [x] **Display & Resolution Flexibility:** Supports fixed 1080p, 4K downsampling, and Steam Deck native 1280×800 (16:10) with automatic pixel-art aspect ratio preservation.
- [x] **Input Parity:** Full mouse/touch support + full keyboard shortcut suite (Space, Enter, 1/2/3, Q/W/E, V, P, F11, M).
- [x] **Deterministic Seed Engine:** Single seed reproduces the exact same run bit-by-bit for Steam daily runs / speedrun challenges.
- [x] **Dual Localization:** Full English (`en`) and Russian (`ru`) with runtime language toggle and zero missing string keys.

