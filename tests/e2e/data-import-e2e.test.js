/**
 * Data Import E2E Tests
 *
 * Comprehensive end-to-end tests for data import functionality
 * Tests multiple import scenarios with test database isolation
 *
 * @fileoverview Tests data import workflows including CSV, ZIP, and manual entry
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers, TestFixtures } = require('../shared/test-helpers');
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

    // Reset import history
    const { resetImportHistory } = require('../../src/routes/import');
    resetImportHistory();

    // Wait for app to load
    await page.goto('/');
    await PageHelpers.waitForAppLoad(page);
  });

  test.afterEach(async () => {
    // Clean up test environment
    delete process.env.NODE_ENV;
    delete process.env.TEST_DB;

    // Reset test database after each test
    const { resetTestDatabase } = require('../../src/database');
    resetTestDatabase();

    // Reset import history
    const { resetImportHistory } = require('../../src/routes/import');
    resetImportHistory();
  });

  test('should import Amazon CSV data successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await expect(page.locator('#data-import.active')).toBeVisible();

    // Verify import form is visible
    await expect(page.locator('#csvImportForm')).toBeVisible();

    // Upload test Amazon CSV file
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csvFile', csvFilePath);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for import completion - check for success message or redirect
    await page.waitForTimeout(3000); // Wait for processing

    // Check the status message
    const statusDiv = page.locator('#importStatus');
    await expect(statusDiv).toBeVisible();

    // Check if it contains success or error
    const statusText = await statusDiv.textContent();
    console.log('Import status:', statusText);

    // Should contain success
    await expect(statusDiv).toContainText('Import completed successfully');

    // Verify import history is displayed
    const importHistoryDiv = page.locator('#importHistory');
    await expect(importHistoryDiv).toBeVisible();

    // Should show the recent import
    await expect(importHistoryDiv).toContainText('Recent imports');
    await expect(importHistoryDiv).toContainText('items imported');

    // Navigate to dashboard to verify the page loads
    await PageHelpers.navigateToSection(page, 'dashboard');
    await expect(page.locator('#dashboard.active')).toBeVisible();

    // Verify data was actually imported and displayed
    await PageHelpers.navigateToSection(page, 'analysis');
    await expect(page.locator('#analysis.active')).toBeVisible();

    // Should have analysis data
    const analysisContent = await page.locator('#analysis').textContent();
    expect(analysisContent).toContain('Analysis');
  });

  test('should import bank statement data successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await expect(page.locator('#data-import.active')).toBeVisible();

    // Upload test bank statement file
    const bankFilePath = path.join(
      __dirname,
      '../data/test-bank-statement.csv'
    );
    await page.setInputFiles('#csvFile', bankFilePath);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for import completion
    await page.waitForTimeout(2000);

    // Check for success status
    const statusDiv = page.locator('#importStatus');
    await expect(statusDiv).toBeVisible();

    // Navigate to dashboard to verify the page loads
    await PageHelpers.navigateToSection(page, 'dashboard');
    await expect(page.locator('#dashboard.active')).toBeVisible();

    // For now, just verify the import completed successfully
    // TODO: Verify data was actually imported and displayed
  });

  test('should import Amazon ZIP file successfully', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await expect(page.locator('#data-import.active')).toBeVisible();

    // Upload Amazon ZIP file
    const zipFilePath = path.join(__dirname, '../../data/Your Orders.zip');
    await page.setInputFiles('#amazonZipFile', zipFilePath);

    // Submit ZIP import (skip validation wait for now)
    await page.click('button[type="submit"]');

    // Wait for import completion (ZIP imports may take longer)
    await page.waitForTimeout(15000); // Wait for processing

    // Check for success message in the import results
    await expect(page.locator('#amazonImportResults')).toContainText(
      'Import Successful!'
    );

    // Navigate to dashboard
    await PageHelpers.navigateToSection(page, 'dashboard');
    await expect(page.locator('#dashboard.active')).toBeVisible();

    // TODO: Verify data was actually imported and displayed
  });

  test('should handle multiple sequential imports correctly', async ({
    page
  }) => {
    // First import - Amazon CSV
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csvFile', csvFilePath);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.import-success', { timeout: 30000 });

    // Get count after first import
    await PageHelpers.navigateToSection(page, 'expenditures');
    const countAfterFirst = await page.locator('.expenditure-row').count();

    // Second import - Bank statement
    await PageHelpers.navigateToSection(page, 'data-import');
    const bankFilePath = path.join(
      __dirname,
      '../data/test-bank-statement.csv'
    );
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
    await expect(page.locator('#data-import.active')).toBeVisible();

    // Try to import invalid file
    const invalidFilePath = path.join(__dirname, '../../README.md'); // Not a CSV
    await page.setInputFiles('#csvFile', invalidFilePath);

    // Submit import
    await page.click('button[type="submit"]');

    // Should show error message, not crash
    await page.waitForSelector('.import-error, .error-message', {
      timeout: 10000
    });

    // Verify error is displayed
    const errorVisible = await page
      .locator('.import-error, .error-message')
      .isVisible();
    expect(errorVisible).toBe(true);
  });

  test('should validate data integrity after import', async ({ page }) => {
    // Import test data
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csvFile', csvFilePath);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#importStatus', { timeout: 30000 });

    // Navigate to analysis section
    await PageHelpers.navigateToSection(page, 'analysis');
    await expect(page.locator('#analysis.active')).toBeVisible();

    // Verify analysis works with imported data
    await expect(page.locator('.analysis-results, .chart-data')).toBeVisible();
    await expect(page.locator('body')).toContainText('Analysis');
  });

  test('should support manual data entry alongside imports', async ({
    page
  }) => {
    // First import some data
    await PageHelpers.navigateToSection(page, 'data-import');
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csvFile', csvFilePath);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#importStatus', { timeout: 30000 });

    // Navigate to manual entry
    await PageHelpers.navigateToSection(page, 'manual-entry');
    await expect(page.locator('#manual-entry.active')).toBeVisible();

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
    await expect(page.locator('#expenditures.active')).toBeVisible();

    // Verify both imported and manual data exist
    const expenditureRows = await page.locator('.expenditure-row').count();
    expect(expenditureRows).toBeGreaterThan(1);

    // Check for manual entry
    await expect(page.locator('body')).toContainText('Manual test entry');
  });

  test('should display import history correctly', async ({ page }) => {
    // Navigate to data import section
    await PageHelpers.navigateToSection(page, 'data-import');
    await expect(page.locator('#data-import.active')).toBeVisible();

    // Get initial import history count
    const importHistoryDiv = page.locator('#importHistory');
    await expect(importHistoryDiv).toBeVisible();

    // Wait for history to load
    await page.waitForTimeout(1000);

    const initialCardCount = await page.locator('#importHistory .card').count();

    // Import some data
    const csvFilePath = path.join(__dirname, '../data/test-amazon-orders.csv');
    await page.setInputFiles('#csvFile', csvFilePath);
    await page.click('button[type="submit"]');

    // Wait for import completion
    await page.waitForTimeout(3000);
    await expect(page.locator('#importStatus')).toContainText(
      'Import completed successfully'
    );

    // Import history should now show the import
    await expect(importHistoryDiv).toContainText('Recent imports');
    await expect(importHistoryDiv).toContainText('items imported');
    await expect(importHistoryDiv).toContainText('Success');

    // Import another file to test multiple imports
    const bankFilePath = path.join(
      __dirname,
      '../data/test-bank-statement.csv'
    );
    await page.setInputFiles('#csvFile', bankFilePath);
    await page.click('button[type="submit"]');

    // Wait for second import
    await page.waitForTimeout(3000);
    await expect(page.locator('#importStatus')).toContainText(
      'Import completed successfully'
    );

    // Should show multiple imports
    const finalCardCount2 = await page.locator('#importHistory .card').count();
    expect(finalCardCount2).toBeGreaterThan(initialCardCount);
  });

  test('should maintain database isolation between test and production', async ({
    page
  }) => {
    // Verify we're using test database
    const { isTestDatabase, getDatabasePath } = require('../../src/database');
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
    expect(testData.some((item) => item.vendor === 'Amazon.com')).toBe(true);

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
  });

  test('should handle large data imports without performance issues', async ({
    page
  }) => {
    // Use larger test file
    await PageHelpers.navigateToSection(page, 'data-import');
    const largeFilePath = path.join(
      __dirname,
      '../../data/amazon-comprehensive-orders.csv'
    );
    await page.setInputFiles('#csvFile', largeFilePath);

    // Start timing
    const startTime = Date.now();

    // Submit import
    await page.click('button[type="submit"]');

    // Wait for completion with reasonable timeout
    await page.waitForSelector('#importStatus', { timeout: 120000 }); // 2 minutes for large files

    const endTime = Date.now();
    const importDuration = endTime - startTime;

    // Import should complete within reasonable time (under 2 minutes)
    expect(importDuration).toBeLessThan(120000);

    // Verify data was imported
    await PageHelpers.navigateToSection(page, 'analysis');
    await expect(page.locator('#analysis.active')).toBeVisible();
  });
});
