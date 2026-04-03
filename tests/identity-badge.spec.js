const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine } = require('./helpers/auth-helpers');

test.describe('Identity Badge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAlpine(page);
  });

  test('shows Signed out badge when no active identity', async ({ page }) => {
    await expect(page.getByTestId('identity-badge')).toContainText('Signed out');
  });

  test('shows Local alias badge in local mode', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-local-profile', JSON.stringify({ alias: 'Office iPad' }));
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'e1', description: 'Printer paper', amount: 20, date: '2026-04-03' }
      ]));
    });
    await page.reload();
    await waitForAlpine(page);
    await expect(page.getByTestId('identity-badge')).toContainText('Local: Office iPad');
  });

  test('shows Cloud user badge when authenticated', async ({ page }) => {
    await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      app.auth = { authenticated: true, user: { name: 'Taylor Cloud' } };
      app.sessionState = 'authenticated';
      app.storageIntent = 'cloud';
    });
    await expect(page.getByTestId('identity-badge')).toContainText('Cloud: Taylor Cloud');
  });
});
