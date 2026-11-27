/**
 * Does the lever stay locked when a spin is interrupted? Spins, then mid-spin presses the
 * Android back gesture (pause into the menu, continue) and/or hides and shows the app,
 * and checks that the spin finishes. Phone viewport with touch, like the APK.
 *   npx tsx tools/qa/spinInterrupt.ts [rounds]
 */
import puppeteer, { type Page } from 'puppeteer-core';

const URL = process.env.GAME_URL ?? 'http://localhost:5173/';
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROUNDS = Number(process.argv[2] ?? 30);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const scenes = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const g = (window as any).game;
    return g ? g.scene.getScenes(true).map((s: any) => s.scene.key) : [];
  });

async function waitFor(page: Page, key: string, ms = 20000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if ((await scenes(page)).includes(key)) return true;
    await sleep(150);
  }
  return false;
}

const run = (page: Page): Promise<any> =>
  page.evaluate(() => {
    const g = (window as any).game;
    const r = g.scene.getScene('RunScene') as any;
    const st = r.state;
    return {
      spinning: r.isSpinning,
      reelSpinning: r.reelView?.isSpinning,
      phase: st?.phase,
      wave: st?.waveNumber,
      free: st?.freeSpinsLeft,
      steam: st?.economy?.steam,
      sleeping: r.sys.isSleeping(),
      active: r.sys.isActive(),
      timeEvents: r.time?._active?.length,
      loopRunning: g.loop.running,
      frame: g.loop.frame
    };
  });

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function main(): Promise<void> {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', ...(process.env.SOFTWARE === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist'])] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument('window.__name = (f) => f;');
  await page.setViewport({ width: 915, height: 412, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  page.on('pageerror', (e: any) => console.log('PAGE ERROR', e?.message));
  await page.goto(URL, { waitUntil: 'load' });
  await waitFor(page, 'MenuScene');
  await sleep(500);
  await page.keyboard.press('Enter');
  await waitFor(page, 'RunScene');
  await sleep(1000);
  await page.keyboard.press('Escape'); // skip the intro story
  await sleep(800);

  let locked = 0;
  for (let i = 0; i < ROUNDS; i++) {
    // plenty of steam and free spins: every round can spin
    await page.evaluate(() => {
      const st = (window as any).game.scene.getScene('RunScene').state;
      st.freeSpinsLeft = 3;
      st.economy.steam = 5;
      st.heat.currentHeat = 0;
    });
    const how = ['back', 'hide', 'back+hide', 'hide+back'][i % 4];
    await page.keyboard.press('Space');
    await sleep(60 + Math.random() * 900);
    const mid = await run(page);
    if (how.startsWith('back')) {
      await page.evaluate(() => (window as any).__brassBack());
      await sleep(400 + Math.random() * 400);
    }
    if (how.includes('hide')) {
      await setHidden(page, true);
      await sleep(500 + Math.random() * 1500);
      await setHidden(page, false);
      await sleep(300);
    }
    if (how.endsWith('back') && how !== 'back') {
      await page.evaluate(() => (window as any).__brassBack());
      await sleep(400);
    }
    // back in the menu: continue the run
    if ((await scenes(page)).includes('MenuScene')) {
      await page.keyboard.press('Enter');
      await waitFor(page, 'RunScene', 5000);
    }
    // the spin must be over within a few seconds
    const t0 = Date.now();
    let s = await run(page);
    while (s.spinning && Date.now() - t0 < 8000) {
      await sleep(150);
      s = await run(page);
    }
    const tag = `round ${i} [${how}] spinning at interrupt=${mid.spinning}`;
    if (s.spinning) {
      locked++;
      console.log(`LOCKED ${tag}:`, JSON.stringify(s));
    } else {
      console.log(`ok ${tag}: freed in ${Date.now() - t0} ms`);
    }
  }
  console.log(`done: ${locked} of ${ROUNDS} spins stayed locked`);
  await browser.close();
  process.exit(locked ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
