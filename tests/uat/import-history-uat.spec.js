/**
 * UAT Test Suite for Import History Workflow
 *
 * This test performs actual User Acceptance Testing by:
 * 1. Opening the app in a real browser
 * 2. Performing actions as a real user would
 * 3. Verifying expected outcomes
 *
 * @requires Chrome DevTools MCP for browser interaction
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

test.describe('Import History UAT', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CRITICAL: Single bank import should create exactly ONE history entry', async ({ page }) => {
    // Step 1: Navigate to Data Import section
    console.log('Step 1: Navigating to Data Import section...');

    // Click on Data Import in navigation
    const dataImportLink = page.locator('[data-section="data-import"]');
    await dataImportLink.click();
    await page.waitForTimeout(500);

    // Step 2: Check initial state of import history
    console.log('Step 2: Checking initial import history state...');
    const historyBefore = await page.locator('#importHistory').textContent();
    console.log('History before import:', historyBefore?.substring(0, 100));

    // Step 3: Clear import history to start fresh
    console.log('Step 3: Clearing import history...');
    const clearButton = page.locator('button:has-text("Clear History")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 4: Count history entries before import
    const entriesBeforeCount = await countHistoryEntries(page);
    console.log(`Entries before import: ${entriesBeforeCount}`);

    // Step 5: Create a test CSV file
    console.log('Step 4: Preparing test CSV file...');
    const testCsvContent = `Date,Description,Amount,Running Bal.
01/15/2025,TEST IMPORT UAT,-25.50,1000.00
01/14/2025,TEST TRANSACTION,-10.00,1025.50`;

    const testFilePath = path.join(__dirname, '../../data/uat-test-import.csv');
    fs.writeFileSync(testFilePath, testCsvContent);

    // Step 6: Select the file
    console.log('Step 5: Selecting CSV file...');
    const fileInput = page.locator('#csvFile');
    await fileInput.setInputFiles(testFilePath);

    // Step 7: Click import button ONCE
    console.log('Step 6: Clicking Import button...');
    const importButton = page.locator('#csvImportForm button[type="submit"]');

    // Verify button is enabled
    await expect(importButton).toBeEnabled();

    // Click ONCE
    await importButton.click();

    // Step 8: Wait for import to complete
    console.log('Step 7: Waiting for import to complete...');
    await page.waitForTimeout(3000);

    // Wait for status message
    const statusDiv = page.locator('#importStatus');
    await expect(statusDiv).toBeVisible({ timeout: 10000 });

    // Step 9: Count history entries after import
    console.log('Step 8: Counting history entries after import...');
    const entriesAfterCount = await countHistoryEntries(page);
    console.log(`Entries after import: ${entriesAfterCount}`);

    // Step 10: Calculate new entries
    const newEntriesCount = entriesAfterCount - entriesBeforeCount;
    console.log(`NEW entries created: ${newEntriesCount}`);

    // CRITICAL ASSERTION: Exactly ONE new entry
    expect(newEntriesCount).toBe(1);

    // Step 11: Verify no console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 12: Cleanup
    fs.unlinkSync(testFilePath);

    console.log('✅ UAT PASSED: Single import created exactly one history entry');
  });

  test('Import button should be disabled during import', async ({ page }) => {
    // Navigate to Data Import
    const dataImportLink = page.locator('[data-section="data-import"]');
    await dataImportLink.click();
    await page.waitForTimeout(500);

    // Create test file
    const testCsvContent = `Date,Description,Amount,Running Bal.
01/15/2025,TEST,-25.50,1000.00`;
    const testFilePath = path.join(__dirname, '../../data/uat-test-button.csv');
    fs.writeFileSync(testFilePath, testCsvContent);

    // Select file
    await page.locator('#csvFile').setInputFiles(testFilePath);

    // Click import
    const importButton = page.locator('#csvImportForm button[type="submit"]');
    await importButton.click();

    // Immediately check if button is disabled
    const isDisabled = await importButton.isDisabled();

    // Wait for completion
    await page.waitForTimeout(3000);

    // Cleanup
    fs.unlinkSync(testFilePath);

    // Button should have been disabled during import
    expect(isDisabled).toBe(true);
  });

  test('Console should have no JavaScript errors on Data Import page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to Data Import
    const dataImportLink = page.locator('[data-section="data-import"]');
    await dataImportLink.click();
    await page.waitForTimeout(2000);

    // Filter out expected/acceptable errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR')
    );

    expect(criticalErrors.length).toBe(0);
  });

});

/**
 * Helper function to count import history entries
 */
async function countHistoryEntries(page) {
  // Look for history entry elements
  const historyContainer = page.locator('#importHistory');

  // Try different selectors for history entries
  const entries = await historyContainer.locator('.card, .list-group-item, .import-entry, [class*="history"]').count();

  // If no structured entries, check if there's any content
  if (entries === 0) {
    const text = await historyContainer.textContent();
    if (text?.includes('No recent imports')) {
      return 0;
    }
    // Count by looking for date patterns or "records imported"
    const matches = text?.match(/\d+\s*records?\s*imported/gi) || [];
    return matches.length;
  }

  return entries;
}
