import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\wawil\\.gemini\\antigravity\\brain\\f50e1065-e755-4e2c-84cf-c082d8de7719';
const DOCS_SCREENSHOTS_DIR = path.resolve(process.cwd(), 'docs', 'screenshots');

async function main() {
  console.log('--- Starting BRASSREEL E2E Browser Playtest ---');

  if (!fs.existsSync(DOCS_SCREENSHOTS_DIR)) {
    fs.mkdirSync(DOCS_SCREENSHOTS_DIR, { recursive: true });
  }

  // 1. Start Vite internal dev server
  const server = await createServer({
    server: { port: 3333 }
  });
  await server.listen();
  console.log('✓ Vite server listening on http://localhost:3333');

  // 2. Launch Chrome via puppeteer-core
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });
  console.log('✓ Headless Chrome launched');

  const page = await browser.newPage();
  await page.goto('http://localhost:3333/', { waitUntil: 'networkidle0' });
  console.log('✓ Navigated to game root');

  // Helper to save screenshot both in docs and artifact dir
  async function capture(filename: string) {
    const localPath = path.join(DOCS_SCREENSHOTS_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, type: 'png' });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`✓ Captured screenshot: ${filename}`);
  }

  // Allow BootScene to transition to MenuScene
  await new Promise((r) => setTimeout(r, 1200));

  // --- SCREENSHOT 1: Menu Scene ---
  await capture('screenshot_01_menu.png');

  // Click "НАЧАТЬ ОБОРОНУ ▶" button (located at 960, 540)
  await page.mouse.click(960, 540);
  console.log('✓ Clicked Start Defense');
  await new Promise((r) => setTimeout(r, 800));

  // --- PREP PHASE & SPINS ---
  // Click Spin button at (240, 555) 3 times with delays for animation
  for (let s = 1; s <= 3; s++) {
    await page.mouse.click(240, 555);
    console.log(`✓ Spin ${s} triggered`);
    await new Promise((r) => setTimeout(r, 1800));
  }

  // Deploy units from bench to grid
  await page.evaluate(() => {
    const game = (window as any).game;
    const runScene = game?.scene?.getScene('RunScene');
    if (runScene) {
      if (runScene.state.reserveBench.length >= 2) {
        const u1 = runScene.state.reserveBench[0];
        const u2 = runScene.state.reserveBench[1];
        runScene.deployUnit(u1.instanceId, 0, 2);
        runScene.deployUnit(u2.instanceId, 1, 2);
      }
    }
  });

  // Re-sync scene if exposed or perform card drag simulation
  await page.mouse.move(535, 650);
  await page.mouse.down();
  await page.mouse.move(520, 260, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));

  // --- SCREENSHOT 2: Prep Phase with Slot Machine & Bench ---
  await capture('screenshot_02_prep_slot.png');

  // Click "В БОЙ ▶" at (1450, 330)
  await page.mouse.click(1450, 330);
  console.log('✓ Clicked Engage (В БОЙ)');
  await new Promise((r) => setTimeout(r, 2000));

  // --- SCREENSHOT 3: Battle Phase ---
  await capture('screenshot_03_battle.png');

  // Open Shop View for inspection
  await page.evaluate(() => {
    const game = (window as any).game;
    const runScene = game?.scene?.getScene('RunScene');
    if (runScene) {
      runScene.openShop();
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  // --- SCREENSHOT 4: Foundry Workshop (Shop View) ---
  await capture('screenshot_04_shop.png');

  // Close shop and test Wave 10 Boss
  await page.evaluate(() => {
    const game = (window as any).game;
    const runScene = game?.scene?.getScene('RunScene');
    if (runScene) {
      runScene.shopView.hideShop();
      runScene.state.waveNumber = 10;
      runScene.state.phase = 'PREP';
      // Ensure unit is deployed
      if (runScene.state.deployedUnits.length === 0 && runScene.state.reserveBench.length > 0) {
        const u = runScene.state.reserveBench[0];
        runScene.state.reserveBench.splice(0, 1);
        u.deployedSlot = { col: 1, row: 2 };
        runScene.state.deployedUnits.push(u);
      }
      runScene.handleEngageClick();
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  // --- SCREENSHOT 5: Wave 10 Boss (The Steam Baron) ---
  await capture('screenshot_05_boss.png');

  // Trigger GameOverScene
  await page.evaluate(() => {
    const game = (window as any).game;
    const runScene = game?.scene?.getScene('RunScene');
    if (runScene) {
      runScene.scene.start('GameOverScene', {
        victory: true,
        wave: 10,
        boilerHp: 7,
        cogs: 285,
        seed: 20261102
      });
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  // --- SCREENSHOT 6: Game Over / Victory Screen ---
  await capture('screenshot_06_game_over.png');

  // Cleanup
  await browser.close();
  await server.close();
  console.log('=== Playtest completed successfully! All 6 screenshots captured ===');
}

main().catch((err) => {
  console.error('Playtest failed:', err);
  process.exit(1);
});