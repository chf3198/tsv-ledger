const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Legal Disclaimer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', date: '2026-04-01', description: 'Sample expense', location: 'Austin', amount: 10, businessPercent: 100 }
      ]));
    });
    await page.reload();
  });

  test('shows not-tax-advice disclaimer in export workflow', async ({ page }) => {
    await page.click('a[data-nav="settings"]');
    const disclaimer = page.locator('[data-testid="export-disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText('Not Tax Advice');
  });

  test('includes disclaimer attribution in exported CSV', async ({ page }) => {
    await page.click('a[data-nav="settings"]');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '📤 Export CSV' }).click();
    const download = await downloadPromise;
    const csv = fs.readFileSync(await download.path(), 'utf8');
    await expect(csv).toContain('Disclaimer');
    await expect(csv).toContain('This tool provides expense allocation assistance only');
  });
});
