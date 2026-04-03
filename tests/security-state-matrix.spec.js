const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine } = require('./helpers/auth-helpers');

test.describe('Security State Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAlpine(page);
  });

  test('cloud intent signed out shows no expenses and signed out identity', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'cloud');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'secret-1', description: 'Cloud cached item', amount: 99, date: '2026-04-03' }
      ]));
    });
    await page.reload();
    await waitForAlpine(page);
    await expect(page.getByTestId('identity-badge')).toContainText('Signed out');
    await expect(page.locator('text=Cloud cached item')).toHaveCount(0);
  });

  test('cloud auth pending remains hidden and signed out', async ({ page }) => {
    await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      app.storageIntent = 'cloud';
      app.sessionState = 'auth-pending';
    });
    await expect(page.getByTestId('cloud-auth-required-banner')).toBeVisible();
    await expect(page.getByTestId('identity-badge')).toContainText('Signed out');
  });

  test('local locked state hides expenses until resumed', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-local-profile', JSON.stringify({ alias: 'Front Desk' }));
      localStorage.setItem('tsv-local-data-locked', 'true');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'secret-2', description: 'Hidden local item', amount: 51, date: '2026-04-03' }
      ]));
    });
    await page.reload();
    await waitForAlpine(page);
    await expect(page.getByTestId('local-locked-banner')).toBeVisible();
    await expect(page.locator('text=Hidden local item')).toHaveCount(0);
  });
});
