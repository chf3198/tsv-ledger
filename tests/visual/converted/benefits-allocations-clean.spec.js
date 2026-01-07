const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../../shared/test-helpers');

test.describe('Benefits allocations (clean)', () => {
  test('allocation moves item and updates counts', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(`${base}/employee-benefits.html`, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

    // wait for manager to be ready
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });

    // open selection modal
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });

    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    const initial = await page.evaluate(() => ({
      businessCount: parseInt(document.getElementById('businessItemsCount')?.textContent || '0', 10) || 0,
      benefitsCount: parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0
    }));

    expect(initial.businessCount).toBeGreaterThan(0);

    const firstItemId = await page.$eval('#businessSuppliesList .col-md-6', el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId || '');
    expect(firstItemId).not.toBe('');

    // set a 50/50 allocation on the first item
    await page.evaluate((id) => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (!mgr) {
          return;
        }
        if (!mgr.itemProgressiveAllocations) {
          mgr.itemProgressiveAllocations = new Map();
        }
        mgr.itemProgressiveAllocations.set(id, { benefits: 50, business: 50, total: 100 });
        if (!mgr.selectedItems) {
          mgr.selectedItems = new Set();
        }
        mgr.selectedItems.add(id);
        if (typeof mgr.updateModalDisplay === 'function') {
          mgr.updateModalDisplay();
        }
      } catch (e) { }
    }, firstItemId);

    // wait for change: either DOM counter increments or manager.selectedItems reflects change
    await page.waitForFunction((prev) => {
      try {
        const be = parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0;
        if (be > prev) {
          return true;
        }
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.selectedItems && typeof mgr.selectedItems.size === 'number') {
          return mgr.selectedItems.size > 0;
        }
      } catch (e) { }
      return false;
    }, initial.benefitsCount, { timeout: 15000 });

    const after = await page.evaluate(() => ({
      businessCount: parseInt(document.getElementById('businessItemsCount')?.textContent || '0', 10) || 0,
      benefitsCount: parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0
    }));

    expect(after.benefitsCount).toBeGreaterThan(initial.benefitsCount);
  });
});
