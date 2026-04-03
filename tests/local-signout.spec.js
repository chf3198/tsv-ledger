const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine } = require('./helpers/auth-helpers');

async function seedLocalUser(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tsv-storage-mode', 'local');
    localStorage.setItem('tsv-local-profile', JSON.stringify({ alias: 'Shared Laptop' }));
    localStorage.setItem('tsv-onboarding-complete', 'true');
    localStorage.setItem('tsv-expenses', JSON.stringify([
      { id: 'e1', description: 'Sensitive local item', amount: 44, date: '2026-04-03' }
    ]));
  });
  await page.reload();
  await waitForAlpine(page);
  await page.click('[data-nav="settings"]');
}

test.describe('Local Sign Out', () => {
  test('locks local data and allows resume', async ({ page }) => {
    await seedLocalUser(page);
    await page.getByTestId('local-signout-button').click();
    await page.getByTestId('local-signout-lock').click();
    await expect(page.getByTestId('local-locked-banner')).toBeVisible();
    await expect(page.getByTestId('identity-badge')).toContainText('Signed out');
    await page.getByTestId('resume-local-access').click();
    await expect(page.getByTestId('identity-badge')).toContainText('Local: Shared Laptop');
  });

  test('deletes local data on confirmed local sign out', async ({ page }) => {
    await seedLocalUser(page);
    await page.getByTestId('local-signout-button').click();
    await page.getByTestId('local-signout-delete').click();
    await expect(page.getByTestId('welcome-wizard')).toBeVisible();
    await expect(page.locator('[data-expense-card]')).toHaveCount(0);
  });

  test('migrate to cloud switches intent and hides local data until sign-in', async ({ page }) => {
    await seedLocalUser(page);
    await page.getByTestId('local-signout-button').click();
    await page.getByTestId('local-signout-migrate').click();
    await expect(page.getByTestId('cloud-auth-required-banner')).toBeVisible();
    await expect(page.getByTestId('identity-badge')).toContainText('Signed out');
  });
});
