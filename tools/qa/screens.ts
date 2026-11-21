/**
 * Screenshots of the main screens at one window size, to check text on phones.
 *   npm run build && npx tsx tools/qa/screens.ts <out-dir> [width] [height] [scale]
 * Example (a 6" phone held sideways, 3 device pixels per CSS pixel):
 *   npx tsx tools/qa/screens.ts shots 844 390 3
 * Saves the menu, story, prep, robot card, skill tree, campaign map, battle, shop, evolution,
 * core draft, the menu with a paused run, archive, campaign and game over.
 * UI=phone or UI=desktop forces the text mode (`?ui=` in the address), e.g. phone text at 1920×1080.
 */
import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 39997;
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const [outDir = 'screens', w = '844', h = '390', dpr = '1'] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const dist = path.resolve('dist');
  const server = http.createServer((req, res) => {
    const rel = ((req.url || '/').split('?')[0].replace(/^\//, '')) || 'index.html';
    const file = path.join(dist, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(PORT, '127.0.0.1', () => r()));
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const touch = Number(w) < 1100;
    await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: Number(dpr), hasTouch: touch, isMobile: touch });
    page.on('pageerror', (e: unknown) => console.error('PAGE ERROR:', (e as Error)?.message ?? e));
    await page.goto(`http://127.0.0.1:${PORT}/${process.env.UI ? `?ui=${process.env.UI}` : ''}`, { waitUntil: 'load' });
    await wait(1800);

    const shot = async (name: string) => {
      await wait(500);
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      console.log('saved', file);
    };
    const key = async (k: string) => {
      await page.keyboard.press(k as never);
      await wait(400);
    };
    /** Game coordinates (1920×1080) → page coordinates. */
    const toPage = (x: number, y: number) =>
      page.evaluate(`(() => {
        const r = window.game.canvas.getBoundingClientRect();
        return { x: r.left + ${x} * r.width / 1920, y: r.top + ${y} * r.height / 1080 };
      })()`) as Promise<{ x: number; y: number }>;

    await shot('01_menu');
    await page.evaluate(`window.game.scene.getScene('MenuScene').scene.start('RunScene')`);
    await wait(1500);
    await shot('02_story');
    await key('Escape');
    await wait(400);
    for (let i = 0; i < 3; i++) {
      await key('Space');
      await wait(1800);
    }
    await shot('03_prep');

    const card = (await page.evaluate(`(() => {
      const rs = window.game.scene.getScene('RunScene');
      const c = [...rs.unitCards.values()][0];
      if (!c) return null;
      const m = c.getWorldTransformMatrix();
      return { x: m.tx, y: m.ty };
    })()`)) as { x: number; y: number } | null;
    if (card) {
      const p = await toPage(card.x, card.y);
      await page.mouse.move(p.x, p.y);
      await wait(900);
      await shot('04_tooltip');
      await page.mouse.move(5, 5);
    }

    await key('t');
    await shot('05_skill_tree');
    await key('Escape');

    await key('k');
    await shot('06_campaign_map');
    await key('Escape');

    await key('Enter');
    await wait(2500);
    await shot('07_battle');

    await page.evaluate(`window.game.scene.getScene('RunScene').openShop()`);
    await shot('08_shop');
    await page.evaluate(`window.game.scene.getScene('RunScene').shopView.hideShop()`);

    await page.evaluate(`window.game.scene.getScene('RunScene').evolutionModal.showEvolution('x', 'unit_cog_bulwark', 'unit_cog_ramhead', 3)`);
    await shot('08b_evolution');
    await page.evaluate(`window.game.scene.getScene('RunScene').evolutionModal.setVisible(false)`);
    await page.evaluate(`window.game.scene.getScene('RunScene').coreDraftModal.showDraft(['core_mirror_piston', 'core_lucky_cam', 'core_recycler'])`);
    await shot('08c_core_draft');
    await page.evaluate(`window.game.scene.getScene('RunScene').coreDraftModal.setVisible(false)`);

    // «МЕНЮ»: the paused run can be continued or replaced
    await key('Escape');
    await wait(600);
    await shot('09_menu_paused');
    await page.evaluate(`window.game.scene.getScene('MenuScene').archiveModal.open()`);
    await shot('10_archive');
    await key('Escape');
    await page.evaluate(`(() => { const m = window.game.scene.getScene('MenuScene'); m.archiveModal.setVisible(false); m.campaignModal.open(); })()`);
    await shot('11_campaign');
    await page.evaluate(`window.game.scene.getScene('MenuScene').scene.start('GameOverScene', { victory: false, wave: 12, boilerHp: 0, cogs: 140, seed: 1, threat: 0, partsThisRun: ['flywheel'] })`);
    await wait(800);
    await shot('12_game_over');
  } finally {
    await browser.close();
    server.close();
  }
}
void main();
