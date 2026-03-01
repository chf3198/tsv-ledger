// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Tests (ADR-020)
 * Uses Playwright's built-in screenshot comparison
 * Run with: npm run test:visual:update to create/update baselines
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
