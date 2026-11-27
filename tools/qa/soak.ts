/**
 * Soak test: a bot plays the real game in Chrome and watches for freezes.
 *
 *   npm run dev    (or any server with the game)
 *   npx tsx tools/qa/soak.ts [desktop|phone] [minutes]
 *
 * Env: GAME_URL (default http://localhost:5173/), CHROME_PATH, SOFTWARE=1 (no GPU; frames are
 * slow and timings stretch), GOD=1 (boiler never empties,
 * to reach later acts and bosses), OUT (folder for screenshots of problems).
 *
 * It reports:
 *  - page errors and console errors (an exception inside Phaser's frame stops the game for good);
 *  - a stopped render loop (game.loop.frame does not move);
 *  - a stuck run (the phase does not change for too long while no window waits for the player).
 * Phone mode also presses the Android back gesture (window.__brassBack), hides and shows the
 * page, and reloads it mid-run to continue the saved run, like the APK does.
 */
import puppeteer, { type Page } from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const MODE = (process.argv[2] ?? 'desktop') as 'desktop' | 'phone';
const MINUTES = Number(process.argv[3] ?? 10);
const URL = process.env.GAME_URL ?? 'http://localhost:5173/';
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = process.env.OUT ?? path.resolve('soak-out');
const GOD = process.env.GOD === '1';

const problems: string[] = [];
const log = (s: string): void => console.log(`[${MODE} ${new Date().toISOString().slice(11, 19)}] ${s}`);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function snap(page: Page, name: string): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${MODE}-${name}.png`) }).catch(() => undefined);
}

/** What the bot sees: scene, phase, open windows, render frame. */
interface Look {
  frame: number;
  fps: number;
  focus: boolean;
  hasFocus: boolean;
  scenes: string[];
  phase?: string;
  wave?: number;
  boiler?: number;
  bench?: number;
  deployed?: number;
  cap?: number;
  dialogue: boolean;
  evo: boolean;
  core: boolean;
  jackpot: boolean;
  shop: boolean;
  result: boolean;
  spinning?: boolean;
  free?: number;
  steam?: number;
}

async function look(page: Page): Promise<Look | null> {
  return page
    .evaluate(async () => {
      const w = window as any;
      const g = w.game;
      if (!g) return null;
      const dm = (await import(String('/src/ui/DialogueModal.ts'))).DialogueModal as any;
      const active = g.scene.getScenes(true).map((s: any) => s.scene.key);
      const run = g.scene.getScene('RunScene') as any;
      const st = run?.state;
      const on = active.includes('RunScene');
      return {
        frame: g.loop.frame,
        fps: Math.round(g.loop.actualFps),
        focus: g.loop.inFocus,
        hasFocus: document.hasFocus(),
        scenes: active,
        phase: on ? st?.phase : undefined,
        wave: st?.waveNumber,
        boiler: st?.boilerHp,
        bench: st?.reserveBench?.length,
        deployed: st?.deployedUnits?.length,
        cap: on ? undefined : undefined,
        dialogue: dm.openCount > 0,
        evo: Boolean(on && run.evolutionModal?.visible),
        core: Boolean(on && run.coreDraftModal?.visible),
        jackpot: Boolean(on && run.jackpotModal?.visible),
        shop: Boolean(on && run.shopView?.visible),
        result: Boolean(on && run.waveResultContainer?.visible),
        spinning: run?.isSpinning,
        free: st?.freeSpinsLeft,
        steam: st?.economy?.steam
      } as any;
    })
    .catch((e) => {
      problems.push(`evaluate failed: ${e?.message ?? e}`);
      return null;
    });
}

/** Clicks a random choice inside a window (a card or button that listens to the click). */
async function pickInWindow(page: Page, which: 'evolutionModal' | 'coreDraftModal' | 'jackpotModal'): Promise<string> {
  return page.evaluate((key) => {
    const run = (window as any).game.scene.getScene('RunScene') as any;
    const modal = run[key];
    const found: any[] = [];
    const walk = (o: any): void => {
      // the full-screen shade is interactive too (it only blocks clicks): skip it
      if (o.input?.enabled && o.visible !== false && o.listenerCount('pointerdown') > 0 && (o.width ?? 0) < 1500) found.push(o);
      (o.list ?? []).forEach(walk);
    };
    walk(modal);
    const target = found[Math.floor(Math.random() * found.length)];
    if (!target) return `no choice found in ${key}`;
    {
      target.emit('pointerdown', { x: target.x, y: target.y, worldX: target.x, worldY: target.y }, 0, 0, { stopPropagation() {} });
      target.emit('pointerup', { x: target.x, y: target.y }, 0, 0, { stopPropagation() {} });
    }
    return '';
  }, which);
}

/** Puts robots from the reserve on the field: one per row, melee in front. */
async function deploy(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const run = (window as any).game.scene.getScene('RunScene') as any;
    const st = run.state;
    const { SkillManager } = await import(String('/src/core/skills/skills.ts'));
    const cap = SkillManager.unitCap(st);
    const taken = new Set(st.deployedUnits.map((u: any) => `${u.deployedSlot.col},${u.deployedSlot.row}`));
    const rowsUsed = new Set(st.deployedUnits.map((u: any) => u.deployedSlot.row));
    for (const u of [...st.reserveBench]) {
      if (st.deployedUnits.length >= cap) break;
      let row = [0, 1, 2, 3, 4].find((r) => !rowsUsed.has(r)) ?? Math.floor(Math.random() * 5);
      let col = u.stats?.attackRange > 1 ? 0 : 2;
      let tries = 0;
      while (taken.has(`${col},${row}`) && tries < 40) {
        col = (col + 1) % 8;
        if (col === 0) row = (row + 1) % 5;
        tries++;
      }
      run.deployUnit(u.instanceId, col, row);
      taken.add(`${col},${row}`);
      rowsUsed.add(row);
    }
  });
}

/** Screen point (CSS px) of a world point of the RunScene camera. */
async function toScreen(page: Page, wx: number, wy: number): Promise<{ x: number; y: number }> {
  return page.evaluate(
    (x, y) => {
      const g = (window as any).game;
      const cam = g.scene.getScene('RunScene').cameras.main;
      const v = cam.worldView;
      const cx = cam.x + ((x - v.x) / v.width) * cam.width;
      const cy = cam.y + ((y - v.y) / v.height) * cam.height;
      const rect = g.canvas.getBoundingClientRect();
      return { x: rect.left + (cx / g.scale.width) * rect.width, y: rect.top + (cy / g.scale.height) * rect.height };
    },
    wx,
    wy
  );
}

/** Real pointer input: drag a robot to a cell or onto another robot, long-press, open windows. */
async function chaos(page: Page, what: 'drag' | 'press' | 'windows'): Promise<void> {
  const pick = await page.evaluate(() => {
    const r = (window as any).game.scene.getScene('RunScene') as any;
    const cards = [...r.unitCards.values()].filter((c: any) => c.active && c.visible);
    const enemies = [...r.enemyVisuals.values()].map((v: any) => v.container).filter((c: any) => c?.active);
    const all = [...cards, ...enemies];
    const c: any = all[Math.floor(Math.random() * all.length)];
    const col = Math.floor(Math.random() * 8);
    const row = Math.floor(Math.random() * 5);
    const cell = r.gridView.getSlotWorldPos(col, row);
    // sometimes drop on another robot (merge or swap)
    const other: any = cards[Math.floor(Math.random() * cards.length)];
    const to = Math.random() < 0.3 && other ? { x: other.x, y: other.y } : cell;
    return c ? { x: c.x, y: c.y - 20, tx: to.x, ty: to.y } : null;
  });
  if (what === 'windows') {
    for (const key of ['KeyT', 'KeyK'] as const) {
      if (MODE === 'desktop' || Math.random() < 0.5) {
        await page.keyboard.press(key);
        await sleep(500);
        await page.keyboard.press('Escape');
        await sleep(300);
      }
    }
    return;
  }
  if (!pick) return;
  const a = await toScreen(page, pick.x, pick.y);
  if (what === 'press') {
    if (MODE === 'phone') {
      await page.touchscreen.touchStart(a.x, a.y);
      await sleep(650);
      await page.touchscreen.touchEnd();
    } else {
      await page.mouse.move(a.x, a.y);
      await sleep(500);
      await page.mouse.move(a.x + 300, a.y + 200);
    }
    await sleep(200);
    return;
  }
  const b = await toScreen(page, pick.tx, pick.ty);
  const steps = 8;
  if (MODE === 'phone') {
    await page.touchscreen.touchStart(a.x, a.y);
    for (let i = 1; i <= steps; i++) {
      await page.touchscreen.touchMove(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
      await sleep(25);
    }
    await page.touchscreen.touchEnd();
  } else {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps });
    await page.mouse.up();
  }
  await sleep(300);
}

/** Merges one pair of robots (same line and level) the way a drop on a robot does, buys a skill. */
async function merge(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const run = (window as any).game.scene.getScene('RunScene') as any;
    const st = run.state;
    const { SmeltManager } = await import(String('/src/core/smelt/smelt.ts'));
    const all = [...st.deployedUnits, ...st.reserveBench];
    outer: for (const a of all) {
      for (const b of all) {
        if (a !== b && !SmeltManager.canMerge(a, b)) {
          run.tryMerge(a.instanceId, b.instanceId);
          run.syncUnitCards();
          run.refreshHUD();
          break outer;
        }
      }
    }
    // a skill now and then (the tree's own event)
    const { SKILLS } = await import(String('/src/data/skills.ts')).catch(() => ({ SKILLS: [] as any[] }));
    const list: any[] = Array.isArray(SKILLS) ? SKILLS : Object.values(SKILLS ?? {});
    const pick = list[Math.floor(Math.random() * list.length)];
    if (pick && run.skillTreeModal) run.skillTreeModal.emit('buy_skill', pick.id);
  });
}

async function main(): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', ...(process.env.SOFTWARE === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist'])]
  });
  const page = await browser.newPage();
  // tsx (esbuild) wraps named functions in __name(); the page has no such helper
  await page.evaluateOnNewDocument('window.__name = (f) => f;');
  if (GOD) {
    // the boiler is topped up every frame: the bot reaches the later acts and the bosses
    await page.evaluateOnNewDocument(`
      const t = setInterval(() => {
        const g = window.game;
        if (!g) return;
        clearInterval(t);
        // one frame runs several battle steps at ×4: keep a big reserve before the frame
        g.events.on('prestep', () => {
          const r = g.scene.getScene('RunScene');
          const st = r && r.state;
          if (!st) return;
          // the battle keeps its own copy of the boiler (combatState), copied back when it ends
          if (st.phase === 'BATTLE' && st.combatState) st.combatState.boilerHp = 1000;
          else if (st.boilerHp > st.maxBoilerHp) st.boilerHp = st.maxBoilerHp;
        });
      }, 100);
    `);
  }
  if (MODE === 'phone') {
    await page.setViewport({ width: 915, height: 412, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; 2210129SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36');
  } else {
    await page.setViewport({ width: 1920, height: 1080 });
  }
  page.on('pageerror', (err: any) => {
    const m = `PAGE ERROR: ${err?.message ?? err}\n${(err?.stack ?? '').split('\n').slice(0, 6).join('\n')}`;
    problems.push(m);
    log(m);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const m = `console.error: ${msg.text()}`;
      if (!/favicon|Failed to load resource/.test(m)) {
        problems.push(m);
        log(m);
      }
    }
  });

  await page.goto(URL, { waitUntil: 'load' });
  await sleep(2500);

  const end = Date.now() + MINUTES * 60_000;
  let lastFrame = -1;
  let frameStuckSince = Date.now();
  let lastKey = '';
  let keySince = Date.now();
  let waves = 0;
  let runs = 0;
  let maxWave = 0;
  let lastAndroidPoke = Date.now();
  let lastReload = Date.now();
  let lastWave = 0;

  while (Date.now() < end) {
    const s = await look(page);
    if (!s) {
      await sleep(500);
      continue;
    }

    // 1. the render loop must keep going
    if (s.frame === lastFrame) {
      if (Date.now() - frameStuckSince > 4000) {
        const m = `FREEZE: render loop stopped at frame ${s.frame} (scenes ${s.scenes.join(',')}, phase ${s.phase}, wave ${s.wave})`;
        problems.push(m);
        log(m);
        await snap(page, `freeze-${problems.length}`);
        break;
      }
    } else {
      lastFrame = s.frame;
      frameStuckSince = Date.now();
    }

    // 2. the run must keep moving
    const key = `${s.scenes.join(',')}|${s.phase}|${s.wave}|${s.dialogue}|${s.evo}|${s.core}|${s.jackpot}|${s.shop}|${s.result}`;
    if (key !== lastKey) {
      lastKey = key;
      keySince = Date.now();
    } else if (Date.now() - keySince > (s.phase === 'BATTLE' ? 150_000 : 25_000)) {
      const m = `STUCK: nothing changed for ${Math.round((Date.now() - keySince) / 1000)} s: ${JSON.stringify(s)}`;
      problems.push(m);
      log(m);
      await snap(page, `stuck-${problems.length}`);
      keySince = Date.now();
    }

    if (s.wave && s.wave !== lastWave) {
      lastWave = s.wave;
      maxWave = Math.max(maxWave, s.wave);
      log(`wave ${s.wave}, boiler ${s.boiler}, bench ${s.bench}, field ${s.deployed}, fps ${s.fps}, focus ${s.focus}`);
    }

    // 3. play
    if (s.scenes.includes('MenuScene') && !s.scenes.includes('RunScene')) {
      runs++;
      await page.keyboard.press('Enter');
      await sleep(1200);
      continue;
    }
    if (s.scenes.includes('GameOverScene')) {
      log(`game over at wave ${s.wave}`);
      await sleep(1500);
      await page.evaluate(() => (window as any).game.scene.getScene('GameOverScene').scene.start('RunScene'));
      runs++;
      await sleep(1500);
      continue;
    }
    if (!s.scenes.includes('RunScene')) {
      await sleep(500);
      continue;
    }
    if (s.dialogue) {
      await page.keyboard.press(Math.random() < 0.5 ? 'Escape' : 'Space');
      await sleep(400);
      continue;
    }
    if (s.jackpot) {
      log('jackpot window');
      { const e = await pickInWindow(page, 'jackpotModal'); if (e) problems.push(e); }
      await sleep(400);
      continue;
    }
    if (s.evo) {
      { const e = await pickInWindow(page, 'evolutionModal'); if (e) problems.push(e); }
      await sleep(400);
      continue;
    }
    if (s.core) {
      { const e = await pickInWindow(page, 'coreDraftModal'); if (e) problems.push(e); }
      await sleep(400);
      continue;
    }

    // phone: what Android does to the app
    if (MODE === 'phone' && s.phase === 'PREP' && !s.spinning && Date.now() - lastAndroidPoke > 45_000) {
      lastAndroidPoke = Date.now();
      log('android: back gesture → menu, back again → resume');
      await page.evaluate(() => (window as any).__brassBack());
      await sleep(900);
      await page.evaluate(() => (window as any).__brassBack());
      await sleep(900);
      const after = await look(page);
      if (after && after.scenes.includes('MenuScene')) await page.keyboard.press('Enter');
      await sleep(900);
      log('android: app to background and back');
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await sleep(3000);
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await sleep(800);
      continue;
    }
    if (MODE === 'phone' && s.phase === 'PREP' && !s.spinning && Date.now() - lastReload > 120_000) {
      lastReload = Date.now();
      log(`android killed the app at wave ${s.wave}: reload and continue`);
      await page.reload({ waitUntil: 'load' });
      // a phone boots slowly: wait for the menu
      let m = await look(page);
      for (let i = 0; i < 60 && !m?.scenes.includes('MenuScene'); i++) {
        await sleep(300);
        m = await look(page);
      }
      if (!m?.scenes.includes('MenuScene')) problems.push(`after reload the menu is not shown in 18 s: ${JSON.stringify(m)}`);
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(1500);
      const r = await look(page);
      if (r?.wave !== s.wave) {
        const msg = `RESUME: saved run not continued (was wave ${s.wave}, now ${r?.wave}, scenes ${r?.scenes})`;
        problems.push(msg);
        log(msg);
      }
      continue;
    }

    if (s.phase === 'PREP') {
      if (s.spinning) {
        await sleep(300);
        continue;
      }
      if ((s.free ?? 0) > 0 || ((s.steam ?? 0) > 0 && Math.random() < 0.6)) {
        // sometimes hold a reel first, like a player
        if (Math.random() < 0.15) await page.keyboard.press(['Digit1', 'Digit2', 'Digit3'][Math.floor(Math.random() * 3)] as any);
        if (Math.random() < 0.1) await page.keyboard.press('KeyQ');
        await page.keyboard.press('Space');
        await sleep(250);
        continue;
      }
      // what a player does by hand: drag robots, long-press hints, skill tree, campaign map
      if (Math.random() < 0.7) await chaos(page, 'drag');
      if (Math.random() < 0.3) await chaos(page, 'press');
      if (Math.random() < 0.15) await chaos(page, 'windows');
      await merge(page);
      await sleep(300);
      const m = await look(page);
      if (m?.evo) continue; // an evolution window opened: pick a branch first
      await deploy(page);
      await sleep(200);
      await page.keyboard.press('Enter');
      await sleep(600);
      await page.keyboard.press('Digit4');
      continue;
    }
    if (s.phase === 'BATTLE') {
      if (Math.random() < 0.05) await page.keyboard.press('KeyV');
      // a long press on a robot or enemy in battle (hint) now and then
      if (Math.random() < 0.08) await chaos(page, 'press');
      await sleep(700);
      continue;
    }
    if (s.phase === 'RESULT') {
      waves++;
      await sleep(400);
      await page.keyboard.press('Space');
      await sleep(600);
      continue;
    }
    if (s.phase === 'SHOP') {
      // buy something now and then through the shop's own events
      if (Math.random() < 0.5) {
        await page.evaluate(() => {
          const run = (window as any).game.scene.getScene('RunScene') as any;
          const offer = run.state.shopOffers[0];
          if (offer) run.shopView.emit('buy_gadget', offer);
        });
        await sleep(300);
      }
      await page.keyboard.press('Enter');
      await sleep(800);
      continue;
    }
    await sleep(500);
  }

  log(`done: ${waves} waves, ${runs} runs started, best wave ${maxWave}, ${problems.length} problems`);
  if (problems.length) {
    console.log('\n=== PROBLEMS ===\n' + [...new Set(problems)].join('\n---\n'));
    await snap(page, 'end');
  }
  await browser.close();
  process.exit(problems.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
