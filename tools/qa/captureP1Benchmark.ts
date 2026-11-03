import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');
const AUDIT_DIR = path.resolve(DOCS_DIR, 'audit');
const ARTIFACT_DIR = 'C:\\Users\\wawil\\.gemini\\antigravity\\brain\\f50e1065-e755-4e2c-84cf-c082d8de7719';

async function main() {
  console.log('=== Starting Phase P1 Benchmark Capture ===');

  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }

  // 1. Start preview server on free port
  const server = await preview({
    preview: { port: 3344 }
  });
  console.log('✓ Vite server listening on http://localhost:3344');

  // 2. Launch Chrome
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
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();

  async function capture(url: string, filename: string, waitMs = 1500) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, waitMs));

    const localPath = path.join(AUDIT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, type: 'png' });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`✓ Saved screenshot: ${localPath}`);
  }

  try {
    // 1. Capture Static Reference Scene (Default)
    await capture('http://localhost:3344/', 'benchmark_reference_scene.png', 1800);

    // 2. Capture Animation Viewer Scene
    await capture('http://localhost:3344/?debug=anim', 'benchmark_animation_viewer.png', 1800);

    console.log('=== All P1 Benchmark Screenshots Captured Successfully! ===');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

main();
