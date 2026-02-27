#!/usr/bin/env node
/**
 * Visual Test Capture Script
 * Captures screenshots of key app states for AI visual analysis
 * Usage: node scripts/visual-test/capture.js [scenario]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'https://tsv-ledger.pages.dev';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const scenarios = {
  // Core UI states
  'dashboard-empty': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  },

  'dashboard-with-data': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, category: 'Business Supplies', businessPercent: 100 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, category: 'Board Member Benefits', businessPercent: 0 },
        { id: 'test-3', description: 'Software License', date: '2026-02-18', amount: 299, category: 'Business Supplies', businessPercent: 50 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  },

  'guest-warning-modal': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100, category: 'Business Supplies' }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for modal animation
  },

  'auth-modal': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="auth-button"]');
    await page.waitForTimeout(300);
  },

  'expenses-allocation': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 75 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 25 },
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    await page.waitForLoadState('networkidle');
  },

  'import-page': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
    });
    await page.reload();
    await page.click('[data-nav="import"]');
    await page.waitForLoadState('networkidle');
  },

  'settings-page': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Item 1', date: '2026-02-20', amount: 100, paymentMethod: 'Visa - 1234' },
        { id: 'test-2', description: 'Item 2', date: '2026-02-19', amount: 50, paymentMethod: 'MasterCard - 5678' },
      ]));
    });
    await page.reload();
    await page.click('[data-nav="settings"]');
    await page.waitForLoadState('networkidle');
  },

  'guest-banner': async (page) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-02-20', amount: 100 }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  },

  'mobile-view': async (page) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  },
};

async function captureScenario(scenarioName) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    const scenario = scenarios[scenarioName];
    if (!scenario) {
      console.error(`Unknown scenario: ${scenarioName}`);
      console.log('Available scenarios:', Object.keys(scenarios).join(', '));
      process.exit(1);
    }

    console.log(`Capturing: ${scenarioName}...`);
    await scenario(page);

    const filename = `${scenarioName}-${Date.now()}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });

    console.log(`✓ Saved: ${filepath}`);

    // Also output base64 for AI analysis
    const base64 = await page.screenshot({ encoding: 'base64' });
    const base64File = path.join(OUTPUT_DIR, `${scenarioName}-latest.base64`);
    fs.writeFileSync(base64File, base64);
    console.log(`✓ Base64: ${base64File}`);

    return { filepath, base64 };
  } finally {
    await browser.close();
  }
}

async function captureAll() {
  const results = {};
  for (const name of Object.keys(scenarios)) {
    results[name] = await captureScenario(name);
  }

  // Create manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    scenarios: Object.keys(results),
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n✓ All scenarios captured');
  console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
}

// CLI handling
const arg = process.argv[2];
if (arg === 'all' || !arg) {
  captureAll().catch(console.error);
} else if (arg === 'list') {
  console.log('Available scenarios:');
  Object.keys(scenarios).forEach(s => console.log(`  - ${s}`));
} else {
  captureScenario(arg).catch(console.error);
}
