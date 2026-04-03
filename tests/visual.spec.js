// @ts-check
const { test, expect } = require('@playwright/test');

const setState = async (page, kv) => page.evaluate((kv) => {
  localStorage.clear();
  Object.entries(kv).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
}, kv);

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('dashboard empty state', async ({ page }) => {
    await setState(page, {});
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-empty.png', { maxDiffPixelRatio: 0.05 });
  });

  test('dashboard with data', async ({ page }) => {
    await setState(page, {
      'tsv-storage-mode': 'local',
      'tsv-onboarding-complete': 'true',
      'tsv-expenses': [
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 100 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 0 },
      ]
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-with-data.png', { maxDiffPixelRatio: 0.05 });
  });

  test('storage mode modal appearance', async ({ page }) => {
    await setState(page, { 'tsv-onboarding-complete': 'true' });
    await page.reload();
    await page.click('a[data-nav="import"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('storage-mode-modal.png', { maxDiffPixelRatio: 0.05 });
  });

  test('local mode banner when data exists', async ({ page }) => {
    await setState(page, {
      'tsv-storage-mode': 'local',
      'tsv-onboarding-complete': 'true',
      'tsv-expenses': [{ id: 'test-1', description: 'Test', date: '2026-02-20', amount: 100 }]
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.guest-warning-banner')).toHaveScreenshot('local-mode-banner.png', { maxDiffPixelRatio: 0.05 });
  });

  test('auth modal', async ({ page }) => {
    await setState(page, {});
    await page.reload();
    await page.click('[data-testid="auth-button"]');
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('auth-modal.png', { maxDiffPixelRatio: 0.05 });
  });

  test('expenses allocation view', async ({ page }) => {
    await setState(page, {
      'tsv-storage-mode': 'local',
      'tsv-onboarding-complete': 'true',
      'tsv-expenses': [
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 75 },
        { id: 'test-2', description: 'Team Lunch', date: '2026-02-19', amount: 75, businessPercent: 25 },
      ]
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('expenses-allocation.png', { maxDiffPixelRatio: 0.05 });
  });

  test('mobile responsive view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setState(page, {
      'tsv-storage-mode': 'local',
      'tsv-onboarding-complete': 'true',
      'tsv-expenses': [{ id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150 }]
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-view.png', { maxDiffPixelRatio: 0.05 });
  });
});
