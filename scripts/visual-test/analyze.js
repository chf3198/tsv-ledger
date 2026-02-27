#!/usr/bin/env node
/**
 * Visual Analysis Report Generator
 * Captures screenshots and generates analysis prompts for AI review
 *
 * This script generates a report that can be fed to Claude for visual analysis.
 * The base64 screenshots can be analyzed by the AI agent for:
 * - Layout issues (elements overlapping, misaligned)
 * - Visual regressions
 * - Accessibility concerns (contrast, size)
 * - UX issues (confusing layouts, hidden elements)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'https://tsv-ledger.pages.dev';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Visual test checklist - things to verify for each scenario
const visualChecks = {
  'guest-warning-modal': {
    description: 'Guest mode warning modal after data import',
    checks: [
      'Modal is centered and fully visible',
      'Modal has clear title with warning icon',
      'List items are properly formatted with icons',
      'Sign In and Continue as Guest buttons are visible and properly styled',
      'Background is dimmed/overlaid appropriately',
      'Modal does not block critical UI when it shouldnt',
    ]
  },
  'auth-modal': {
    description: 'Authentication options modal',
    checks: [
      'Modal is centered and visible',
      'Google and GitHub buttons are clearly visible',
      'Passkey option is present',
      'Close button (×) is visible',
      'Button styling is consistent',
    ]
  },
  'dashboard-with-data': {
    description: 'Dashboard with expense data loaded',
    checks: [
      'Business Supplies and Board Member Benefits cards show totals',
      'Expense cards are displayed in grid',
      'Navigation is visible on left',
      'Header shows Sign In or user profile',
      'Footer is visible at bottom',
    ]
  },
  'guest-banner': {
    description: 'Guest mode warning banner',
    checks: [
      'Yellow warning banner is visible at top of main content',
      'Banner contains warning icon and Guest Mode text',
      'Sign in button within banner is visible and styled',
      'Banner does not overlap with header',
    ]
  },
  'expenses-allocation': {
    description: 'Expense allocation dual-column view',
    checks: [
      'Two columns visible: Business Supplies and Board Member Benefits',
      'Each column has header with total',
      'Expense cards show allocation sliders',
      'Percentage badges are visible',
      'Search bar is present',
    ]
  },
  'mobile-view': {
    description: 'Mobile responsive layout (375px width)',
    checks: [
      'Hamburger menu icon is visible',
      'Navigation is collapsed/hidden',
      'Content fits within viewport',
      'Text is readable at mobile size',
      'Touch targets are adequately sized',
    ]
  },
};

async function captureAndAnalyze(scenarioName, page) {
  const checkInfo = visualChecks[scenarioName] || {
    description: scenarioName,
    checks: ['General layout and styling']
  };

  const screenshot = await page.screenshot({ encoding: 'base64' });

  return {
    scenario: scenarioName,
    description: checkInfo.description,
    checks: checkInfo.checks,
    base64: screenshot,
    timestamp: new Date().toISOString(),
  };
}

async function generateReport() {
  const browser = await chromium.launch({ headless: true });

  const scenarios = [
    {
      name: 'guest-warning-modal',
      setup: async (page) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
          localStorage.clear();
          localStorage.setItem('tsv-expenses', JSON.stringify([
            { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100 }
          ]));
        });
        await page.reload();
        await page.waitForTimeout(1000);
      }
    },
    {
      name: 'dashboard-with-data',
      setup: async (page) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
          localStorage.setItem('tsv-guest-acknowledged', 'true');
          localStorage.setItem('tsv-expenses', JSON.stringify([
            { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 100 },
            { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 0 },
          ]));
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
    },
    {
      name: 'guest-banner',
      setup: async (page) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
          localStorage.setItem('tsv-guest-acknowledged', 'true');
          localStorage.setItem('tsv-expenses', JSON.stringify([
            { id: 'test-1', description: 'Test', date: '2026-02-20', amount: 100 }
          ]));
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
    },
  ];

  const results = [];

  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    try {
      await scenario.setup(page);
      const result = await captureAndAnalyze(scenario.name, page);
      results.push(result);

      // Save individual screenshot
      const filepath = path.join(OUTPUT_DIR, `${scenario.name}.png`);
      await page.screenshot({ path: filepath });
      console.log(`✓ Captured: ${scenario.name}`);
    } catch (error) {
      console.error(`✗ Failed: ${scenario.name} - ${error.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Generate analysis report
  const report = {
    generated: new Date().toISOString(),
    url: BASE_URL,
    results: results.map(r => ({
      ...r,
      base64: `[${r.base64.length} chars - use read_file on .base64 files]`
    })),
  };

  // Save report
  const reportPath = path.join(OUTPUT_DIR, 'visual-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save base64 files for AI analysis
  for (const result of results) {
    const b64Path = path.join(OUTPUT_DIR, `${result.scenario}.base64`);
    fs.writeFileSync(b64Path, result.base64);
  }

  console.log(`\n✓ Report saved to: ${reportPath}`);
  console.log('Base64 screenshots saved for AI analysis');

  return report;
}

generateReport().catch(console.error);
