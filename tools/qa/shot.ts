/**
 * Full-resolution screenshot of the built game after running a setup snippet.
 *   npm run build && npx tsx tools/qa/shot.ts <out.png> "<js run in page>"
 * The snippet runs with `game` and a `pump(frames)` helper available.
 */
import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 39998;
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

async function main(): Promise<void> {
  const [out = 'shot.png', snippet = ''] = process.argv.slice(2);
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
    await page.setViewport({ width: 1920, height: 1080 });
    page.on('pageerror', (e: unknown) => console.error('PAGE ERROR:', (e as Error)?.message ?? e));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(`(async () => {
      const game = window.game;
      const pump = (n) => { let t = performance.now(); for (let i = 0; i < n; i++) { t += 16.7; game.step(t, 16.7); } };
      ${snippet}
    })()`);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: out });
    console.log('saved', out);
  } finally {
    await browser.close();
    server.close();
  }
}
void main();
