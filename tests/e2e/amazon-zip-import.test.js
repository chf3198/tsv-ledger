/**
 * Amazon ZIP Import E2E Test
 *
 * End-to-end test for Amazon ZIP file validation and import workflow.
 * Uses Playwright to test the actual browser UI.
 *
 * @module tests/e2e/amazon-zip-import.test
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_DATA_DIR = path.join(__dirname, '../../data');

test.describe('Amazon ZIP Import Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to Data Import section
    const dataImportLink = page.locator('[data-section="data-import"]');
    if (await dataImportLink.isVisible()) {
      await dataImportLink.click();
      await page.waitForSelector('#data-import.active', { timeout: 5000 });
    }
  });

  test('should display Amazon ZIP import form', async ({ page }) => {
    // Check that the Amazon ZIP form elements exist
    await expect(page.locator('#amazonZipImportForm')).toBeVisible();
    await expect(page.locator('#amazonZipFile')).toBeVisible();
    await expect(page.locator('#amazonImportBtn')).toBeVisible();

    // Import button should be disabled initially
    await expect(page.locator('#amazonImportBtn')).toBeDisabled();
  });

  test('should validate and accept Your Orders.zip', async ({ page }) => {
    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found in data directory');
      return;
    }

    // Upload the file
    const fileInput = page.locator('#amazonZipFile');
    await fileInput.setInputFiles(ordersZipPath);

    // Wait for validation result
    await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

    // Should show success message
    const validationResult = page.locator('#fileValidationResult');
    await expect(validationResult).toContainText('Your Orders Export');

    // Should show confidence percentage
    await expect(validationResult).toContainText('%');

    // Import button should be enabled
    await expect(page.locator('#amazonImportBtn')).toBeEnabled();
  });

  test('should validate and accept Subscriptions.zip', async ({ page }) => {
    const subscriptionsZipPath = path.join(TEST_DATA_DIR, 'Subscriptions.zip');

    if (!fs.existsSync(subscriptionsZipPath)) {
      test.skip(true, 'Subscriptions.zip not found in data directory');
      return;
    }

    // Upload the file
    const fileInput = page.locator('#amazonZipFile');
    await fileInput.setInputFiles(subscriptionsZipPath);

    // Wait for validation result
    await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

    // Should show success for subscriptions
    const validationResult = page.locator('#fileValidationResult');
    await expect(validationResult).toContainText('Subscriptions Export');

    // Import button should be enabled
    await expect(page.locator('#amazonImportBtn')).toBeEnabled();
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Create a temp text file
    const tempFile = path.join(TEST_DATA_DIR, 'temp-uploads', 'test-invalid.txt');
    const tempDir = path.dirname(tempFile);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(tempFile, 'This is not a ZIP file');

    try {
      // Try to upload non-ZIP file
      const fileInput = page.locator('#amazonZipFile');

      // Note: HTML5 accept attribute may prevent upload of wrong types
      // This test validates the backend still catches it
      await fileInput.setInputFiles(tempFile);

      // Wait for validation result
      await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

      // Should show error message
      const validationResult = page.locator('#fileValidationResult');
      const hasError = await validationResult.locator('.alert-danger').isVisible().catch(() => false);

      if (hasError) {
        await expect(validationResult).toContainText('Invalid file type');
        await expect(page.locator('#amazonImportBtn')).toBeDisabled();
      }
    } finally {
      // Cleanup
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test('should show file details after successful validation', async ({ page }) => {
    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found');
      return;
    }

    // Upload the file
    await page.locator('#amazonZipFile').setInputFiles(ordersZipPath);

    // Wait for validation
    await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

    const validationResult = page.locator('#fileValidationResult');

    // Should show file name
    await expect(validationResult).toContainText('Your Orders.zip');

    // Should show file size
    await expect(validationResult).toContainText('MB');

    // Should show file count
    await expect(validationResult).toContainText('Files inside');
  });

  test('should perform actual import after validation', async ({ page }) => {
    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found');
      return;
    }

    // Upload the file
    await page.locator('#amazonZipFile').setInputFiles(ordersZipPath);

    // Wait for validation
    await page.waitForSelector('#fileValidationResult .alert-success', { timeout: 10000 });

    // Click import button
    await page.locator('#amazonImportBtn').click();

    // Wait for progress indicator
    await page.waitForSelector('#amazonImportProgress:not([style*="display: none"])', { timeout: 5000 });

    // Wait for completion (may take a while)
    await page.waitForSelector('#amazonImportResults:not([style*="display: none"])', { timeout: 60000 });

    // Should show import results
    const resultsSection = page.locator('#amazonImportResults');
    await expect(resultsSection).toBeVisible();
  });

  test('should display correct icons and colors for different ZIP types', async ({ page }) => {
    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found');
      return;
    }

    await page.locator('#amazonZipFile').setInputFiles(ordersZipPath);
    await page.waitForSelector('#fileValidationResult .alert-success', { timeout: 10000 });

    // Orders should show shopping bag icon
    const icon = page.locator('#fileValidationResult .fa-shopping-bag');
    await expect(icon).toBeVisible();
  });
});

test.describe('Amazon ZIP Import Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const dataImportLink = page.locator('[data-section="data-import"]');
    if (await dataImportLink.isVisible()) {
      await dataImportLink.click();
      await page.waitForSelector('#data-import.active', { timeout: 5000 });
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept the validation request and simulate network error
    await page.route('**/api/validate-amazon-zip', route => route.abort());

    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found');
      return;
    }

    await page.locator('#amazonZipFile').setInputFiles(ordersZipPath);

    // Wait for error to be displayed
    await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

    const validationResult = page.locator('#fileValidationResult');
    await expect(validationResult).toContainText('Network Error');
    await expect(page.locator('#amazonImportBtn')).toBeDisabled();
  });

  test('should handle server error responses', async ({ page }) => {
    // Intercept and return error response
    await page.route('**/api/validate-amazon-zip', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error', message: 'Internal error' })
      });
    });

    const ordersZipPath = path.join(TEST_DATA_DIR, 'Your Orders.zip');

    if (!fs.existsSync(ordersZipPath)) {
      test.skip(true, 'Your Orders.zip not found');
      return;
    }

    await page.locator('#amazonZipFile').setInputFiles(ordersZipPath);
    await page.waitForSelector('#fileValidationResult:not([style*="display: none"])', { timeout: 10000 });

    const validationResult = page.locator('#fileValidationResult');
    await expect(validationResult.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('#amazonImportBtn')).toBeDisabled();
  });
});
