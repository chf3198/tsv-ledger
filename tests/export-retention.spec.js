const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Retention Controls and Export Naming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-local-profile', JSON.stringify({ alias: 'Curtis Franks' }));
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'e-1', date: '2026-04-01', description: 'Desk supplies', amount: 42.15, businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="settings"]');
  });

  test('settings exposes user-facing deletion control', async ({ page }) => {
    await expect(page.getByRole('button', { name: /clear all/i })).toBeVisible();
  });

  test('export filename excludes user PII and sensitive metadata', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export csv/i }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    expect(filename).toMatch(/^tsv-ledger-export-\d{8}-(local|cloud)\.csv$/);
    expect(filename.toLowerCase()).not.toContain('curtis');
    expect(filename.toLowerCase()).not.toContain('franks');
    expect(filename.toLowerCase()).not.toContain('amazon');
  });
});
