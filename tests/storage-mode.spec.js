// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Storage Mode Tests (ADR-024)
 * Tests for storage mode persistence and local mode banner
 * Note: Storage mode SELECTION is now part of onboarding wizard (ADR-025)
 * These tests cover post-onboarding storage mode behavior
 */
test.describe('Storage Mode Behavior (ADR-024)', () => {
  test('local mode banner shows when data exists', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
    });
    await page.reload();
    await expect(page.locator('.guest-warning-banner')).toBeVisible();
    await expect(page.locator('.guest-warning-banner')).toContainText('Local Mode');
  });

  test('local mode banner hidden when no data', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    await expect(page.locator('.guest-warning-banner')).toBeHidden();
  });

  test('storage mode persists after page reload', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();

    const storageMode = await page.evaluate(() => localStorage.getItem('tsv-storage-mode'));
    expect(storageMode).toBe('local');
  });

  test('banner sign-in button opens auth modal', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
    });
    await page.reload();
    await page.locator('.guest-warning-banner button').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
  });
});
