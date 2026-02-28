// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Storage Mode Selection (ADR-024)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows storage mode modal when clicking Import without prior selection', async ({ page }) => {
    await page.click('a[data-nav="import"]');
    await page.waitForTimeout(300);
    await expect(page.getByTestId('storage-mode-modal')).toBeVisible();
    await expect(page.getByTestId('storage-mode-modal')).toContainText('Choose Storage Mode');
  });

  test('local storage option navigates to import page', async ({ page }) => {
    await page.click('a[data-nav="import"]');
    await expect(page.getByTestId('storage-mode-modal')).toBeVisible();
    await page.getByTestId('storage-local').click();
    await expect(page.getByTestId('storage-mode-modal')).not.toBeVisible();
    await expect(page.locator('a[data-nav="import"]')).toHaveClass(/active/);
  });

  test('cloud storage option opens auth modal', async ({ page }) => {
    await page.click('a[data-nav="import"]');
    await expect(page.getByTestId('storage-mode-modal')).toBeVisible();
    await page.getByTestId('storage-cloud').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
  });

  test('storage mode persists after reload', async ({ page }) => {
    await page.click('a[data-nav="import"]');
    await page.getByTestId('storage-local').click();
    await page.reload();
    await page.click('a[data-nav="dashboard"]');
    await page.click('a[data-nav="import"]');
    await expect(page.getByTestId('storage-mode-modal')).not.toBeVisible();
    await expect(page.locator('a[data-nav="import"]')).toHaveClass(/active/);
  });

  test('local mode banner shows when data exists', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
    });
    await page.reload();
    await expect(page.locator('.guest-warning-banner')).toBeVisible();
    await expect(page.locator('.guest-warning-banner')).toContainText('Local Mode');
  });

  test('logout clears storage mode', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([{ id: 'test-1', description: 'Test' }]));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      const app = document.querySelector('[x-data]');
      if (app && app._x_dataStack) app._x_dataStack[0].logout();
    });
    await page.waitForTimeout(100);
    const mode = await page.evaluate(() => localStorage.getItem('tsv-storage-mode'));
    expect(mode).toBeNull();
  });
});
