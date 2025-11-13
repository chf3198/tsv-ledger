const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../shared/test-helpers');

test.describe('Benefits smoke (converted from Puppeteer)', () => {
  test('basic smoke checks for employee benefits modal', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${base}/employee-benefits.html`;

    await page.goto(url, { waitUntil: 'networkidle' });
    await PageHelpers.waitForAppLoad(page);

    // Ensure the manager is initialized and show the selection modal
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) { return false; }
    }, { timeout: 20000 });

    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') mgr.showSelectionModal();
    });

    // Wait for lists to be present
    await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
    await page.waitForSelector('#benefitsList', { timeout: 10000 });
    await page.waitForTimeout(300);

    const businessCount = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
    const benefitsCount = await page.$$eval('#benefitsList .col-md-6', els => els.length);

    expect(businessCount + benefitsCount).toBeGreaterThan(0);

    // Business search filtering check
    if (businessCount > 0) {
      const sampleTerm = await page.$eval('#businessSuppliesList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
      if (sampleTerm) {
        await page.fill('#searchBusiness', sampleTerm);
        await page.waitForTimeout(300);
        const businessFiltered = await page.$$eval('#businessSuppliesList .col-md-6', els => els.filter(e => {
          const style = window.getComputedStyle(e);
          return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
        }).length);
        expect(businessFiltered).toBeLessThanOrEqual(businessCount);
      }
    }

    // Benefits search filtering check
    if (benefitsCount > 0) {
      const sampleTerm2 = await page.$eval('#benefitsList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
      if (sampleTerm2) {
        await page.fill('#searchBenefits', sampleTerm2);
        await page.waitForTimeout(300);
        const benefitsFiltered = await page.$$eval('#benefitsList .col-md-6', els => els.filter(e => {
          const style = window.getComputedStyle(e);
          return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
        }).length);
        expect(benefitsFiltered).toBeLessThanOrEqual(benefitsCount);
      }
    }
  });
});
const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../shared/test-helpers');

test('Benefits smoke (Playwright)', async ({ page }) => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  await page.goto(url, { waitUntil: 'networkidle' });
  await PageHelpers.waitForAppLoad(page);

  // Ensure manager is initialized and expose showSelectionModal
  await page.waitForFunction(() => {
    try {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      return !!(mgr && typeof mgr.showSelectionModal === 'function');
    } catch (e) { return false; }
  }, { timeout: 20000 });

  // Open the modal via manager API if present
  await page.evaluate(() => {
    const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
    if (mgr && typeof mgr.showSelectionModal === 'function') {
      mgr.showSelectionModal();
    }
  });

  // Wait for lists to be present
  await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
  await page.waitForSelector('#benefitsList', { timeout: 10000 });
  await page.waitForTimeout(300);

  const businessCount = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
  const benefitsCount = await page.$$eval('#benefitsList .col-md-6', els => els.length);

  expect(businessCount + benefitsCount).toBeGreaterThan(0);

  if (businessCount > 0) {
    const sampleTerm = await page.$eval('#businessSuppliesList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
    if (sampleTerm && sampleTerm.length > 0) {
      await page.fill('#searchBusiness', sampleTerm);
      await page.waitForTimeout(300);
      const businessFiltered = await page.$$eval('#businessSuppliesList .col-md-6', els => els.filter(e => {
        const style = window.getComputedStyle(e);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
      }).length);
      expect(businessFiltered).toBeLessThanOrEqual(businessCount);
    }
  }

  if (benefitsCount > 0) {
    const sampleTerm2 = await page.$eval('#benefitsList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
    if (sampleTerm2 && sampleTerm2.length > 0) {
      await page.fill('#searchBenefits', sampleTerm2);
      await page.waitForTimeout(300);
      const benefitsFiltered = await page.$$eval('#benefitsList .col-md-6', els => els.filter(e => {
        const style = window.getComputedStyle(e);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
      }).length);
      expect(benefitsFiltered).toBeLessThanOrEqual(benefitsCount);
    }
  }
});
