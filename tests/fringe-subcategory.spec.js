const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Fringe Benefit Subcategory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
  });

  test('benefits card shows subcategory selector with default', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'fb-1', date: '2026-04-10', description: 'Team meal', amount: 80, businessPercent: 0 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    const select = page.locator('[data-testid="benefit-subcategory-select"]').first();
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('Requires Review');
  });

  test('export includes fringe benefit subcategory column', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        {
          id: 'fb-2', date: '2026-04-10', description: 'Gift cards', amount: 60,
          businessPercent: 0, benefitSubcategory: 'De Minimis Benefits'
        }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="settings"]');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export csv/i }).click();
    const download = await downloadPromise;
    const csv = fs.readFileSync(await download.path(), 'utf8');

    expect(csv).toContain('BenefitSubcategory');
    expect(csv).toContain('De Minimis Benefits');
  });
});
