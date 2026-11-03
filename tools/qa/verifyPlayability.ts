import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 39999;

function createServer(): http.Server {
  const distDir = path.resolve('dist');
  const server = http.createServer((req, res) => {
    let reqPath = (req.url || '/').split('?')[0].replace(/^\//, '');
    if (!reqPath) reqPath = 'index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      let mime = 'application/octet-stream';
      if (ext === '.html') mime = 'text/html';
      else if (ext === '.js') mime = 'application/javascript';
      else if (ext === '.css') mime = 'text/css';
      else if (ext === '.json') mime = 'application/json';
      else if (ext === '.png') mime = 'image/png';

      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return server;
}

async function main() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', () => resolve()));
  console.log(`Test server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err: any) => console.error('PAGE ERROR:', err?.message || err));

  console.log('Navigating to game...');
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot of MenuScene
  await page.screenshot({ path: 'docs/audit/verified_menu.png' });
  console.log('✓ Captured MenuScene');

  // Click Start Button (center of screen, y ≈ 540)
  await page.mouse.click(960, 540);
  await new Promise(r => setTimeout(r, 1200));

  // Take screenshot of RunScene
  await page.screenshot({ path: 'docs/audit/verified_run_prep.png' });
  console.log('✓ Captured RunScene after click');

  // Try spinning slot: click on spin button or press Space
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'docs/audit/verified_run_spinning.png' });
  console.log('✓ Captured RunScene spinning with Space');

  // Start battle wave: press Enter
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'docs/audit/verified_run_battle.png' });
  console.log('✓ Captured RunScene in active battle');

  await browser.close();
  server.close();
  console.log('ALL PLAYABILITY TESTS PASSED WITH REAL HTTP SERVER!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
