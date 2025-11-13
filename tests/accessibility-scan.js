#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const baseUrl = 'http://localhost:3000';
  const outDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox','--start-maximized'], defaultViewport: null });
  const page = await browser.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    // Inject aXe from CDN
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js' });
    // Retry axe run once if it fails due to target close timing. Give the page time to fully initialize.
    let results = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.waitForTimeout(1000 * attempt);
        results = await page.evaluate(async () => {
          return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa'] } });
        });
        break;
      } catch (e) {
        console.warn('aXe run attempt', attempt, 'failed:', e && e.message);
        if (attempt === 2) throw e;
        await page.waitForTimeout(500);
      }
    }
    const outPath = path.join(outDir, `axe-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log('Accessibility scan saved to', outPath);
  } catch (e) {
    console.error('Accessibility scan failed:', e);
  } finally {
    await browser.close();
  }
})();
