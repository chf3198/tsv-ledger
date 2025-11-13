/**
 * Data Import E2E Tests
 *
 * Comprehensive end-to-end tests for data import functionality
 * Tests multiple import scenarios with test database isolation
 *
 * @fileoverview Tests data import workflows including CSV, ZIP, and manual entry
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers, AssertionHelpers, TestFixtures } = require('../shared/test-helpers');
const path = require('path');
const fs = require('fs');

test.describe('Data Import E2E Tests', () => {
  // Test database setup and teardown
  test.beforeEach(async ({ page }) => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB = 'true';

    // Reset test database before each test
    const { resetTestDatabase } = require('../../src/database');
    resetTestDatabase();

    // Wait for app to load
    await PageHelpers.waitForAppLoad(page);
  });

  test.afterEach(async () => {
    // Clean up test environment
    delete process.env.NODE_ENV;
    delete process.env.TEST_DB;

    // Reset test database after each test
    const { resetTestDatabase } = require('../../src/database');
    resetTestDatabase();
  });

  test('should import Amazon CSV data successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Verify import form is visible
    await AssertionHelpers.assertVisible(page, '#csv-import-form');

    // Upload test Amazon CSV file
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csv-file-input', csvFilePath);

    // Select Amazon CSV import type
    await page.selectOption('#import-type', 'amazon-csv');

    // Submit import
    await page.click('#import-submit-btn');

    // Wait for import completion
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Verify success message
    await AssertionHelpers.assertContainsText(page, '.import-success', 'Import completed');

    // Navigate to expenditures to verify data
    await PageHelpers.navigateToSection(page, 'expenditures');
    await AssertionHelpers.assertVisible(page, '#expenditures.active');

    // Verify data was imported
    const expenditureRows = await page.locator('.expenditure-row').count();
    expect(expenditureRows).toBeGreaterThan(0);

    // Check for Amazon-specific data
    await AssertionHelpers.assertContainsText(page, 'body', 'Amazon');
  });

  test('should import bank statement data successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Upload test bank statement file
    const bankFilePath = path.join(__dirname, '../data/test-bank-statement.csv');
    await page.setInputFiles('#csv-file-input', bankFilePath);

    // Select bank statement import type
    await page.selectOption('#import-type', 'bank-statement');

    // Submit import
    await page.click('#import-submit-btn');

    // Wait for import completion
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Verify success message
    await AssertionHelpers.assertContainsText(page, '.import-success', 'Import completed');

    // Navigate to expenditures to verify data
    await PageHelpers.navigateToSection(page, 'expenditures');
    await AssertionHelpers.assertVisible(page, '#expenditures.active');

    // Verify bank data was imported
    const expenditureRows = await page.locator('.expenditure-row').count();
    expect(expenditureRows).toBeGreaterThan(0);
  });

  test('should import Amazon ZIP file successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Upload Amazon ZIP file
    const zipFilePath = path.join(__dirname, '../../data/Your Orders.zip');
    await page.setInputFiles('#zip-file-input', zipFilePath);

    // Submit ZIP import
    await page.click('#zip-import-submit-btn');

    // Wait for import completion (ZIP imports may take longer)
    await page.waitForSelector('.import-success', { timeout: 60000 });

    // Verify success message
    await AssertionHelpers.assertContainsText(page, '.import-success', 'Import completed');

    // Navigate to Amazon items section
    await PageHelpers.navigateToSection(page, 'amazon-items');
    await AssertionHelpers.assertVisible(page, '#amazon-items.active');

    // Verify Amazon data was imported
    const amazonRows = await page.locator('.amazon-order-row').count();
    expect(amazonRows).toBeGreaterThan(0);
  });

  test('should handle multiple sequential imports correctly', async ({ page }) => {
    // First import - Amazon CSV
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csv-file-input', csvFilePath);
    await page.selectOption('#import-type', 'amazon-csv');
    await page.click('#import-submit-btn');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Get count after first import
    await PageHelpers.navigateToSection(page, 'expenditures');
    const countAfterFirst = await page.locator('.expenditure-row').count();

    // Second import - Bank statement
    await PageHelpers.navigateToSection(page, 'data-import');
    const bankFilePath = path.join(__dirname, '../data/test-bank-statement.csv');
    await page.setInputFiles('#csv-file-input', bankFilePath);
    await page.selectOption('#import-type', 'bank-statement');
    await page.click('#import-submit-btn');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Verify combined data
    await PageHelpers.navigateToSection(page, 'expenditures');
    const countAfterSecond = await page.locator('.expenditure-row').count();

    // Should have more data after second import
    expect(countAfterSecond).toBeGreaterThan(countAfterFirst);
  });

  test('should handle import errors gracefully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Try to import invalid file
    const invalidFilePath = path.join(__dirname, '../../README.md'); // Not a CSV
    await page.setInputFiles('#csv-file-input', invalidFilePath);
    await page.selectOption('#import-type', 'amazon-csv');

    // Submit import
    await page.click('#import-submit-btn');

    // Should show error message, not crash
    await page.waitForSelector('.import-error, .error-message', { timeout: 10000 });

    // Verify error is displayed
    const errorVisible = await page.locator('.import-error, .error-message').isVisible();
    expect(errorVisible).toBe(true);
  });

  test('should validate data integrity after import', async ({ page }) => {
    // Import test data
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csv-file-input', csvFilePath);
    await page.selectOption('#import-type', 'amazon-csv');
    await page.click('#import-submit-btn');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Navigate to analysis section
    await PageHelpers.navigateToSection(page, 'analysis');
    await AssertionHelpers.assertVisible(page, '#analysis.active');

    // Verify analysis works with imported data
    await AssertionHelpers.assertVisible(page, '.analysis-results');
    await AssertionHelpers.assertContainsText(page, 'body', 'Analysis');

    // Check for valid data in analysis
    const hasValidData = await page.locator('.analysis-metric, .chart-data').isVisible();
    expect(hasValidData).toBe(true);
  });

  test('should support manual data entry alongside imports', async ({ page }) => {
    // First import some data
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csv-file-input', csvFilePath);
    await page.selectOption('#import-type', 'amazon-csv');
    await page.click('#import-submit-btn');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Navigate to manual entry
    await PageHelpers.navigateToSection(page, 'manual-entry');
    await AssertionHelpers.assertVisible(page, '#manual-entry.active');

    // Add manual entry
    await page.fill('#expense-date', '2025-01-30');
    await page.fill('#expense-amount', '99.99');
    await page.fill('#expense-description', 'Manual test entry');
    await page.selectOption('#expense-category', 'Office Supplies');
    await page.fill('#expense-vendor', 'Test Vendor Inc.');

    // Submit manual entry
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to expenditures
    await PageHelpers.navigateToSection(page, 'expenditures');
    await AssertionHelpers.assertVisible(page, '#expenditures.active');

    // Verify both imported and manual data exist
    const expenditureRows = await page.locator('.expenditure-row').count();
    expect(expenditureRows).toBeGreaterThan(1);

    // Check for manual entry
    await AssertionHelpers.assertContainsText(page, 'body', 'Manual test entry');
  });

  test('should maintain database isolation between test and production', async ({ page }) => {
    // Verify we're using test database
    const { isTestDatabase, getDatabasePath } = require('../../../src/database');
    expect(isTestDatabase()).toBe(true);
    expect(getDatabasePath()).toContain('test-expenditures.json');

    // Import test data
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csv-file-input', csvFilePath);
    await page.selectOption('#import-type', 'amazon-csv');
    await page.click('#import-submit-btn');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Verify test data exists in test database
    const { readExpenditures } = require('../../../src/database');
    const testData = readExpenditures();
    expect(testData.length).toBeGreaterThan(0);
    expect(testData.some(item => item.vendor === 'Amazon.com')).toBe(true);

    // Verify production database is unaffected
    const fs = require('fs');
    const path = require('path');
    const prodDbPath = path.join(__dirname, '../../../data/expenditures.json');

    // Read production data (without test environment)
    const originalEnv = process.env;
    delete process.env.NODE_ENV;
    delete process.env.TEST_DB;

    const prodData = JSON.parse(fs.readFileSync(prodDbPath, 'utf8'));

    // Restore test environment
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.TEST_DB = originalEnv.TEST_DB;

    // Production data should be different from test data
    // (This assumes production has different data than our test imports)
    expect(prodData).not.toEqual(testData);
  });  });

  test('should handle large data imports without performance issues', async ({ page }) => {
    // Use larger test file
    await PageHelpers.navigateToSection(page, 'data-import');
    const largeFilePath = path.join(__dirname, '../../data/amazon-comprehensive-orders.csv');
    await page.setInputFiles('#csv-file-input', largeFilePath);
    await page.selectOption('#import-type', 'amazon-csv');

    // Start timing
    const startTime = Date.now();

    // Submit import
    await page.click('#import-submit-btn');

    // Wait for completion with reasonable timeout
    await page.waitForSelector('.import-success', { timeout: 120000 }); // 2 minutes for large files

    const endTime = Date.now();
    const importDuration = endTime - startTime;

    // Import should complete within reasonable time (under 2 minutes)
    expect(importDuration).toBeLessThan(120000);

    // Verify data was imported
    await PageHelpers.navigateToSection(page, 'expenditures');
    const expenditureRows = await page.locator('.expenditure-row').count();
    expect(expenditureRows).toBeGreaterThan(10); // Large file should have many records
  });
});
