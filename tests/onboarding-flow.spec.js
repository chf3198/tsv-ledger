const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

const clearStorage = async (page) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};

test.describe('Onboarding Flow Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
  });

  test('choosing Local proceeds to import step', async ({ page }) => {
    await page.locator('[data-testid="accept-terms-checkbox"]').check();
    await page.locator('[data-testid="get-started-btn"]').click();
    await page.locator('[data-testid="choose-local"]').click();
    await expect(page.locator('[data-testid="import-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible();
  });

  test('successful import reveals navigation', async ({ page }) => {
    await page.locator('[data-testid="accept-terms-checkbox"]').check();
    await page.locator('[data-testid="get-started-btn"]').click();
    await page.locator('[data-testid="choose-local"]').click();
    const fileInput = page.locator('[data-testid="import-step"] input[type="file"]');
    await fileInput.setInputFiles('test-data/amazon-sample.csv');
    await expect(page.locator('[data-testid="view-dashboard-btn"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="view-dashboard-btn"]').click();
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-wizard"]')).toBeHidden();
  });

  test('returning user with data sees nav immediately', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', amount: 10, date: '2024-01-01' }
      ]));
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-wizard"]')).toBeHidden();
  });

  test('repeat visit bypasses terms prompt when already accepted', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tsv-terms-accepted', 'true'));
    await page.reload();
    await expect(page.locator('[data-testid="get-started-btn"]')).toBeEnabled();
  });

  test('logout resets terms acceptance gate', async ({ page }) => {
    await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      localStorage.setItem('tsv-terms-accepted', 'true');
      app.termsAccepted = true;
      app.logout();
    });
    await page.reload();
    await expect(page.locator('[data-testid="get-started-btn"]')).toBeDisabled();
  });
});
