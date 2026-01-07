/**
 * Debug script to check what's happening with the benefits management section
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers } = require('../shared/test-helpers');

test.describe('Benefits Management Debug', () => {
  test.beforeEach(async ({ page }) => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB = 'true';

    await page.goto('/');
    await PageHelpers.waitForAppLoad(page);
  });

  test.afterEach(async () => {
    delete process.env.NODE_ENV;
    delete process.env.TEST_DB;
  });

  test('debug benefits management section', async ({ page }) => {
    console.log('🔍 Starting benefits management debug...');

    // Check if navigation menu loads
    await page.waitForSelector('#main-navigation', { timeout: 10000 });
    console.log('✅ Navigation menu found');

    // Check if benefits management link exists - use the main navigation one
    const benefitsLink = page.locator(
      '#main-navigation [data-section="benefits-management"]'
    );
    await expect(benefitsLink).toBeVisible();
    console.log('✅ Benefits management link found in main navigation');

    // Click the benefits management link
    await benefitsLink.click();
    console.log('✅ Clicked benefits management link');

    // Wait for section to be active
    await page.waitForSelector('#benefits-management.active', {
      timeout: 5000
    });
    console.log('✅ Benefits management section is active');

    // Check if the section content is visible
    const section = page.locator('#benefits-management');
    const isVisible = await section.isVisible();
    console.log('Section visible:', isVisible);

    // Check for key elements
    const header = page.locator('#benefits-management h2');
    const headerText = await header.textContent();
    console.log('Header text:', headerText);

    const description = page.locator('#benefits-management p');
    const descText = await description.textContent();
    console.log('Description text:', descText);

    const openModalBtn = page.locator('#openSelectionModal');
    const btnVisible = await openModalBtn.isVisible();
    console.log('Open modal button visible:', btnVisible);

    // Take a screenshot
    await page.screenshot({ path: 'debug-benefits.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-benefits.png');

    // Check for any console errors
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('❌ Console errors found:', errors);
    } else {
      console.log('✅ No console errors');
    }

    // Check if employee benefits JS loaded
    const hasEmployeeBenefitsManager = await page.evaluate(() => {
      return typeof window.employeeBenefitsManager !== 'undefined';
    });
    console.log(
      'Employee benefits manager loaded:',
      hasEmployeeBenefitsManager
    );

    // Check if the selection status element exists
    const statusElement = page.locator('#selectionStatus');
    const statusExists = (await statusElement.count()) > 0;
    console.log('Selection status element exists:', statusExists);

    if (statusExists) {
      const statusText = await statusElement.textContent();
      console.log('Selection status text:', statusText);
    }
  });
});
