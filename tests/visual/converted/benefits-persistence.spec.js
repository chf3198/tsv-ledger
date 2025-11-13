const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../../shared/test-helpers');

test.describe('Benefits persistence (converted)', () => {
  test('selections persist across reloads', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${base}/employee-benefits.html`;

    await page.goto(url, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

    await page.waitForFunction(() => {
      try { const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); return !!(mgr && typeof mgr.showSelectionModal === 'function'); } catch (e) { return false; }
    }, { timeout: 20000 });

    // Open modal and wait for business list
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') mgr.showSelectionModal();
    });
    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    // Set selection state and persist via manager helpers
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) return;
      const el = document.querySelector('#businessSuppliesList .col-md-6');
      const id = el ? (el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId) : null;
      if (!id) return;
      mgr.itemProgressiveAllocations.set(id, { allocated: 30, remaining: 70 });
      mgr.selectedItems.add(id);
      if (typeof mgr.updateModalDisplay === 'function') mgr.updateModalDisplay();
      if (typeof mgr.saveProgressiveAllocations === 'function') mgr.saveProgressiveAllocations();
      if (typeof mgr.saveSelection === 'function') mgr.saveSelection();
    });

    // Reload and wait for manager to initialize
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      try { const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); return !!mgr && typeof (mgr.loadSavedSelection || mgr.loadSelection) === 'function'; } catch (e) { return false; }
    }, { timeout: 20000 });

    const persisted = await page.evaluate(() => {
      const ls = (() => { try { return JSON.parse(localStorage.getItem('employeeBenefitsSelection') || '[]'); } catch (e) { return []; } })();
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      const mgrCount = mgr ? (mgr.selectedItems ? (typeof mgr.selectedItems.size === 'number' ? mgr.selectedItems.size : Array.from(mgr.selectedItems || []).length) : 0) : 0;
      return { lsCount: ls.length, mgrCount };
    });

    console.log('Persisted selection:', persisted);
    expect(persisted.lsCount + persisted.mgrCount).toBeGreaterThan(0);
  });
});
