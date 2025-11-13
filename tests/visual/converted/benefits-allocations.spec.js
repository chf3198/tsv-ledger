const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../../shared/test-helpers');

test.describe('Benefits allocations (converted)', () => {
  test('allocation moves item and updates counts', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(`${base}/employee-benefits.html`, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
                      await page.waitForFunction((prev) => {
                        try {
                          const be = parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0;
                          if (be > prev) return true;
                          const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
                          if (mgr && mgr.selectedItems && typeof mgr.selectedItems.size === 'number') {
                            return mgr.selectedItems.size > 0;
                          }
                        } catch (e) {}
                        return false;
                      }, initial.benefitsCount, { timeout: 15000 });

                      const after = await page.evaluate(() => ({
                        businessCount: parseInt(document.getElementById('businessItemsCount')?.textContent || '0', 10) || 0,
                        benefitsCount: parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0
                      }));

                      expect(after.benefitsCount).toBeGreaterThan(initial.benefitsCount);
                    });

