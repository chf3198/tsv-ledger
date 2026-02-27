// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Guest Mode Warnings (ADR-020)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Clear ALL localStorage to simulate fresh user
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows warning modal after first import in guest mode', async ({ page }) => {
    // Import data
    await page.click('a[data-nav="import"]');
    await page.waitForTimeout(300);
    await page.locator('input[type="file"]').setInputFiles('test-data/amazon-sample.csv');
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });

    // Guest warning modal should appear
    await expect(page.getByTestId('guest-warning-modal')).toBeVisible();
    await expect(page.getByTestId('guest-warning-modal')).toContainText('Guest Mode');
    await expect(page.getByTestId('guest-warning-modal')).toContainText('only on this device');
  });

  test('acknowledge button dismisses modal and persists', async ({ page }) => {
    // Set up data and trigger modal
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
    });
    await page.reload();

    // Modal should be visible
    await expect(page.getByTestId('guest-warning-modal')).toBeVisible();

    // Click acknowledge
    await page.getByTestId('guest-acknowledge-btn').click();

    // Modal should be hidden
    await expect(page.getByTestId('guest-warning-modal')).not.toBeVisible();

    // Acknowledgement should persist after reload
    await page.reload();
    await expect(page.getByTestId('guest-warning-modal')).not.toBeVisible();
  });

  test('shows guest warning banner when not signed in with data', async ({ page }) => {
    // Acknowledge the modal first
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
      localStorage.setItem('tsv-guest-acknowledged', 'true');
    });
    await page.reload();

    // Banner should be visible
    await expect(page.locator('.guest-warning-banner')).toBeVisible();
    await expect(page.locator('.guest-warning-banner')).toContainText('Guest Mode');
  });

  test('sign in button in modal opens auth modal', async ({ page }) => {
    // Set up data to trigger guest warning
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
    });
    await page.reload();

    // Click Sign In in guest warning modal
    await page.getByTestId('guest-warning-modal').locator('button', { hasText: 'Sign In' }).click();

    // Auth modal should now be visible
    await expect(page.getByTestId('auth-modal')).toBeVisible();
  });

  test('logout function clears all localStorage including guest acknowledgement', async ({ page }) => {
    // Set up data
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', date: '2026-01-01', amount: 10, category: 'Business Supplies' }
      ]));
      localStorage.setItem('tsv-guest-acknowledged', 'true');
      localStorage.setItem('tsv-import-history', JSON.stringify([{ id: 'imp-1', filename: 'test.csv' }]));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Call logout directly via Alpine component (Alpine 3 uses _x_dataStack)
    await page.evaluate(() => {
      const app = document.querySelector('[x-data]');
      if (app && app._x_dataStack) {
        app._x_dataStack[0].logout();
      }
    });
    await page.waitForTimeout(100);

    // Verify localStorage is cleared (including guest acknowledgement)
    const guestAck = await page.evaluate(() => localStorage.getItem('tsv-guest-acknowledged'));
    expect(guestAck).toBeNull();

    const expenses = await page.evaluate(() => localStorage.getItem('tsv-expenses'));
    expect(expenses).toBeNull();
    
    const history = await page.evaluate(() => localStorage.getItem('tsv-import-history'));
    expect(history).toBeNull();
  });
});
