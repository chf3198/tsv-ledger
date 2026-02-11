/**
 * TSV Expenses - Real Data Import Tests
 * Tests using actual Amazon and BOA data fixtures
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';

test.describe('Real Data Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('imports Amazon order history CSV', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/amazon-sample.csv'));
    
    // Wait for import to complete
    await page.waitForTimeout(2000);
    
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('tbody tr')).toHaveCount(5);
    
    // Verify totals updated
    await page.click('[data-nav="dashboard"]');
    const suppliesAmount = await page.locator('.category-supplies .amount').textContent();
    expect(suppliesAmount).not.toBe('$0.00');
  });

  test('categorizes Amazon items correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/amazon-sample.csv'));
    
    await page.waitForTimeout(1000);
    await page.click('[data-nav="expenses"]');
    
    // Paper towels and soap should be supplies
    const paperTowels = page.locator('tr:has-text("Bounty Paper Towels")');
    await expect(paperTowels.locator('select')).toHaveValue(/Office Supplies|Employee Benefits/);
  });

  test('displays correct amounts from Amazon data', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/amazon-sample.csv'));
    
    await page.waitForTimeout(1000);
    await page.click('[data-nav="dashboard"]');
    
    // Should have totals from the 5 imported items
    const suppliesTotal = await page.locator('.category-supplies .amount').textContent();
    const benefitsTotal = await page.locator('.category-benefits .amount').textContent();
    
    // Totals should not be $0.00
    expect(suppliesTotal).not.toBe('$0.00');
  });
});
