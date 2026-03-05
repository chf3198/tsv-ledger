// @ts-check
const { test, expect } = require('@playwright/test');
const { analyzeScreenshotWithClaude } = require('./helpers/auth-helpers');

/**
 * Visual Regression Tests (ADR-020)
 * Uses Playwright's built-in screenshot comparison
 * Run with: npm run test:visual:update to create/update baselines
 *
 * AI Visual Inspection: Tests with analyzeScreenshotWithClaude() require ANTHROPIC_API_KEY
 * Set: export ANTHROPIC_API_KEY=sk-ant-... before running tests
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://tsv-ledger.pages.dev');
  });

  test('dashboard empty state', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-empty.png', {
      maxDiffPixelRatio: 0.05, // Allow 5% difference for font rendering
    });
  });

  test('dashboard with data', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 100 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 0 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-with-data.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('storage mode modal appearance', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    await page.click('a[data-nav="import"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for modal to appear
    await expect(page).toHaveScreenshot('storage-mode-modal.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('local mode banner when data exists', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-02-20', amount: 100 }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Take screenshot of just the banner area
    const banner = page.locator('.guest-warning-banner');
    await expect(banner).toHaveScreenshot('local-mode-banner.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('auth modal', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click('[data-testid="auth-button"]');
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('auth-modal.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('expenses allocation view', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 75 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 25 },
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('expenses-allocation.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('mobile responsive view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-view.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

/**
 * AI-Powered Visual Inspection Tests (Claude Vision API)
 * Requires: export ANTHROPIC_API_KEY=sk-ant-... before running
 * These tests run independently of Playwright snapshots
 */
test.describe('AI Visual Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://tsv-ledger.pages.dev');
  });

  test('accessibility check - button sizes and contrast', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 100 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Analyze this expense tracking UI for accessibility:
1. Are all buttons large enough (minimum 44px × 44px)?
2. Are text and background colors contrasting well (≥4.5:1 ratio)?
3. Are form labels visible and associated with inputs?
4. Any overlapping or hidden elements?
Report issues found. Format: "✅ PASS" or "❌ ISSUE: description"`);

    expect(analysis).not.toContain('API_UNAVAILABLE');
    expect(analysis).not.toContain('API_ERROR');
    console.log('Accessibility Analysis:', analysis);
  });

  test('responsive design check - mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Team Lunch', date: '2026-02-20', amount: 75, businessPercent: 50 },
        { id: 'test-2', description: 'Office Supplies', date: '2026-02-19', amount: 150, businessPercent: 100 },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Check mobile (375px) responsiveness:
1. Does text fit without wrapping awkwardly?
2. Are buttons/controls touch-friendly (large enough to tap)?
3. Is layout single-column (no horizontal scroll needed)?
4. Are expense cards readable and properly spaced?
Report findings: "✅ PASS" or "❌ ISSUE: description"`);

    console.log('Mobile Responsiveness Analysis:', analysis);
  });

  test('layout clarity - form field labels and structure', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Review form and UI structure clarity:
1. Are input field purposes clear from visible labels?
2. Is the call-to-action (primary button) obvious?
3. Are different sections visually separated?
4. Is the UI hierarchy logical (heading, form, actions)?
Report: "✅ PASS" or "❌ ISSUE: description"`);

    console.log('UI Clarity Analysis:', analysis);
  });
});
