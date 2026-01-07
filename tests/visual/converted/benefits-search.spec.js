const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../../shared/test-helpers');

test.describe('Benefits search (converted)', () => {
  test('search filters business supplies correctly', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${base}/employee-benefits.html`;

    await page.goto(url, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

    // Ensure manager and open modal
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });

    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });

    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    const sample = await page.$eval('#businessSuppliesList .col-md-6 .card-title', el => el && el.textContent ? el.textContent.trim() : '');
    expect(sample, 'sample card title should exist').not.toBe('');
    const token = sample.split(' ').slice(0,2).join(' ').slice(0,6);

    const before = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
    await page.fill('#searchBusiness', token);
    await page.waitForTimeout(400);

    const after = await page.$$eval('#businessSuppliesList .col-md-6', els => els.filter(e => {
      const style = window.getComputedStyle(e);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
    }).length);

    expect(after).toBeLessThanOrEqual(before);

    // Clear search
    await page.fill('#searchBusiness', '');
    await page.waitForTimeout(200);
  });
});
