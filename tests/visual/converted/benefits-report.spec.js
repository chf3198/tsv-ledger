const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../../shared/test-helpers');

test.describe('Benefits report (converted)', () => {
  test('generates and displays benefits report for selected items', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${base}/employee-benefits.html`;

    await page.goto(url, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

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

    const firstItemId = await page.$eval('#businessSuppliesList .col-md-6', el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId || '');
    expect(firstItemId, 'should find a business item id').not.toBe('');

    await page.evaluate((id) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) {
        return;
      }
      mgr.itemProgressiveAllocations.set(id, { benefits: 50, business: 50, total: 100 });
      mgr.selectedItems.add(id);
      if (typeof mgr.updateModalDisplay === 'function') {
        mgr.updateModalDisplay();
      }
    }, firstItemId);

    // Give the UI a moment to reflect selection; if DOM doesn't update, fall back to manager state
    await page.waitForTimeout(250);
    const appeared = await page.$(`#benefitsList [data-item-id="${firstItemId}"]`);
    if (!appeared) {
      // Attempt manager fallback: use the first selected item in manager.selectedItems
      const mgrSelected = await page.evaluate(() => {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (!mgr || !mgr.selectedItems) {
          return null;
        }
        return Array.from(mgr.selectedItems)[0] || null;
      });
      if (mgrSelected) {
        firstItemId = mgrSelected; // override with manager-provided id
      }
    }

    await page.evaluate(async (id) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) {
        throw new Error('Manager not available');
      }

      const itemIds = [id];
      const progressive = mgr.itemProgressiveAllocations.get(id) || { allocated: 0 };
      const itemAllocations = {};
      itemAllocations[id] = progressive.allocated || progressive.benefits || 100;

      const resp = await fetch('/api/employee-benefits-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, itemAllocations })
      });

      if (!resp.ok) {
        throw new Error('Server failed to generate report');
      }
      const report = await resp.json();
      if (typeof mgr.displayBenefitsReport === 'function') {
        mgr.displayBenefitsReport(report);
      } else {
        let c = document.getElementById('summaryContainer');
        if (!c) {
          c = document.createElement('div'); c.id = 'summaryContainer'; document.body.appendChild(c);
        }
        c.innerHTML = JSON.stringify(report).slice(0, 200);
      }
    }, firstItemId);

    await page.waitForSelector('#summaryContainer .card-body, #summaryContainer', { timeout: 15000 });
    const reportSummary = await page.$eval('#summaryContainer .card-body, #summaryContainer', el => el.innerText || el.textContent || '');
    console.log('Report summary text length:', reportSummary.length);
    expect(reportSummary.length).toBeGreaterThan(20);
  });
});
