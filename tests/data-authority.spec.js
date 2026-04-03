const { test, expect } = require('@playwright/test');

test.describe('Data Authority Security (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'cloud');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'secret-1', date: '2026-04-01', description: 'Sensitive cached item', amount: 999 }
      ]));
    });
    await page.reload();
  });

  test('does not render cached expenses when cloud intent is signed out', async ({ page }) => {
    await page.click('a[data-nav="expenses"]');
    await expect(page.locator('[data-expense-card]')).toHaveCount(0);
    await expect(page.locator('[data-testid="allocation-card"]')).toHaveCount(0);
    await expect(page.locator('text=Sensitive cached item')).toHaveCount(0);
  });

  test('shows explicit cloud re-auth prompt', async ({ page }) => {
    const banner = page.locator('[data-testid="cloud-auth-required-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Sign in to access your cloud data');
    await banner.locator('button').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
  });
});
