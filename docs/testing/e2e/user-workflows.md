# User Workflow Testing

## Overview

End-to-end testing validates complete user journeys from start to finish, ensuring all system components work together to deliver the expected user experience. These tests simulate real user interactions across the entire application.

## Test Setup and Configuration

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  use: {
    browserName: 'chromium',
    headless: process.env.CI ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:3000'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

### Test Structure
```javascript
// tests/e2e/user-registration.test.js
const { test, expect } = require('@playwright/test');

test.describe('User Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to registration page
    await page.goto('/register');
  });

  test('should complete full registration process', async ({ page }) => {
    // Test implementation
  });
});
```

## User Registration and Authentication

### Registration Flow
```javascript
test('should complete user registration', async ({ page }) => {
  // Fill registration form
  await page.fill('[data-testid="name-input"]', 'John Doe');
  await page.fill('[data-testid="email-input"]', 'john@example.com');
  await page.fill('[data-testid="password-input"]', 'SecurePass123!');
  await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');

  // Submit form
  await page.click('[data-testid="register-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('Registration successful');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

### Login Flow
```javascript
test('should complete user login', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Enter credentials
  await page.fill('[data-testid="email-input"]', 'john@example.com');
  await page.fill('[data-testid="password-input"]', 'SecurePass123!');

  // Submit login
  await page.click('[data-testid="login-button"]');

  // Verify successful login
  await expect(page.locator('[data-testid="welcome-message"]'))
    .toContainText('Welcome, John Doe');

  // Verify dashboard access
  await expect(page).toHaveURL('/dashboard');
});
```

### Password Reset Flow
```javascript
test('should complete password reset', async ({ page }) => {
  // Request password reset
  await page.goto('/forgot-password');
  await page.fill('[data-testid="email-input"]', 'john@example.com');
  await page.click('[data-testid="reset-button"]');

  // Verify reset email sent
  await expect(page.locator('[data-testid="reset-sent-message"]'))
    .toBeVisible();

  // Simulate email link click (in real test, would check email)
  const resetLink = 'http://localhost:3000/reset-password?token=reset-token-123';
  await page.goto(resetLink);

  // Set new password
  await page.fill('[data-testid="new-password-input"]', 'NewSecurePass123!');
  await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePass123!');
  await page.click('[data-testid="update-password-button"]');

  // Verify password updated
  await expect(page.locator('[data-testid="password-updated-message"]'))
    .toBeVisible();
});
```

## Data Import and Management

### CSV Import Workflow
```javascript
test('should import CSV data successfully', async ({ page }) => {
  // Login first
  await loginUser(page, 'admin@example.com', 'password');

  // Navigate to import page
  await page.goto('/import');

  // Upload CSV file
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles('./test-data/sample-transactions.csv');

  // Configure import settings
  await page.selectOption('[data-testid="date-format-select"]', 'MM/DD/YYYY');
  await page.check('[data-testid="skip-first-row-checkbox"]');

  // Start import
  await page.click('[data-testid="import-button"]');

  // Verify import progress
  await expect(page.locator('[data-testid="import-progress"]'))
    .toContainText('Importing...');

  // Wait for completion
  await page.waitForSelector('[data-testid="import-complete"]');

  // Verify results
  await expect(page.locator('[data-testid="imported-count"]'))
    .toContainText('150 transactions imported');

  // Verify data appears in application
  await page.goto('/transactions');
  await expect(page.locator('[data-testid="transaction-list"]'))
    .toBeVisible();
});
```

### Data Validation and Error Handling
```javascript
test('should handle import validation errors', async ({ page }) => {
  await loginUser(page, 'admin@example.com', 'password');
  await page.goto('/import');

  // Upload invalid CSV
  await page.locator('[data-testid="file-input"]')
    .setInputFiles('./test-data/invalid-data.csv');

  await page.click('[data-testid="import-button"]');

  // Verify validation errors displayed
  await expect(page.locator('[data-testid="validation-errors"]'))
    .toBeVisible();

  await expect(page.locator('[data-testid="error-row-5"]'))
    .toContainText('Invalid date format');

  await expect(page.locator('[data-testid="error-row-10"]'))
    .toContainText('Missing required field: amount');
});
```

## Transaction Management

### Transaction Creation
```javascript
test('should create new transaction', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/transactions/new');

  // Fill transaction form
  await page.selectOption('[data-testid="type-select"]', 'expense');
  await page.fill('[data-testid="amount-input"]', '49.99');
  await page.fill('[data-testid="description-input"]', 'Office supplies');
  await page.fill('[data-testid="date-input"]', '2023-12-01');
  await page.selectOption('[data-testid="category-select"]', 'Office');

  // Add tags
  await page.fill('[data-testid="tags-input"]', 'supplies, office');
  await page.keyboard.press('Enter');

  // Submit transaction
  await page.click('[data-testid="save-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-toast"]'))
    .toContainText('Transaction saved successfully');

  // Verify transaction appears in list
  await page.goto('/transactions');
  await expect(page.locator('[data-testid="transaction-item"]'))
    .toContainText('Office supplies');
});
```

### Transaction Editing and Deletion
```javascript
test('should edit existing transaction', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');

  // Navigate to existing transaction
  await page.goto('/transactions');
  await page.click('[data-testid="transaction-item"]:first-child');

  // Click edit button
  await page.click('[data-testid="edit-button"]');

  // Modify transaction
  await page.fill('[data-testid="amount-input"]', '59.99');
  await page.fill('[data-testid="description-input"]', 'Updated office supplies');

  // Save changes
  await page.click('[data-testid="save-button"]');

  // Verify changes
  await expect(page.locator('[data-testid="transaction-amount"]'))
    .toContainText('$59.99');

  await expect(page.locator('[data-testid="transaction-description"]'))
    .toContainText('Updated office supplies');
});

test('should delete transaction', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/transactions');

  const initialCount = await page.locator('[data-testid="transaction-item"]').count();

  // Delete first transaction
  await page.click('[data-testid="transaction-item"]:first-child [data-testid="delete-button"]');

  // Confirm deletion
  await page.click('[data-testid="confirm-delete-button"]');

  // Verify transaction removed
  const finalCount = await page.locator('[data-testid="transaction-item"]').count();
  expect(finalCount).toBe(initialCount - 1);
});
```

## Reporting and Analytics

### Report Generation
```javascript
test('should generate financial report', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/reports');

  // Select report type
  await page.click('[data-testid="report-type-expense-summary"]');

  // Set date range
  await page.fill('[data-testid="start-date-input"]', '2023-01-01');
  await page.fill('[data-testid="end-date-input"]', '2023-12-31');

  // Select categories
  await page.check('[data-testid="category-office"]');
  await page.check('[data-testid="category-travel"]');

  // Generate report
  await page.click('[data-testid="generate-report-button"]');

  // Verify report generation
  await page.waitForSelector('[data-testid="report-content"]');

  // Verify report content
  await expect(page.locator('[data-testid="report-title"]'))
    .toContainText('Expense Summary Report');

  await expect(page.locator('[data-testid="total-expenses"]'))
    .toBeVisible();

  await expect(page.locator('[data-testid="category-breakdown"]'))
    .toBeVisible();
});
```

### Data Export
```javascript
test('should export transaction data', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/transactions');

  // Select export format
  await page.selectOption('[data-testid="export-format-select"]', 'csv');

  // Set filters
  await page.fill('[data-testid="export-start-date"]', '2023-01-01');
  await page.fill('[data-testid="export-end-date"]', '2023-12-31');

  // Start export
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-button"]');
  const download = await downloadPromise;

  // Verify download
  expect(download.suggestedFilename()).toMatch(/transactions.*\.csv$/);

  // Verify file content (if accessible)
  const stream = await download.createReadStream();
  const content = await stream.toString();

  expect(content).toContain('Date,Description,Amount,Category');
});
```

## Amazon Integration Workflows

### Amazon Data Import
```javascript
test('should import Amazon order data', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/amazon-import');

  // Upload Amazon ZIP file
  await page.locator('[data-testid="zip-file-input"]')
    .setInputFiles('./test-data/amazon-orders.zip');

  // Configure import options
  await page.check('[data-testid="include-returns-checkbox"]');
  await page.check('[data-testid="include-subscriptions-checkbox"]');

  // Start import
  await page.click('[data-testid="import-amazon-data-button"]');

  // Monitor progress
  await page.waitForSelector('[data-testid="import-progress-bar"]');

  // Wait for completion
  await expect(page.locator('[data-testid="import-status"]'))
    .toContainText('Import completed successfully');

  // Verify imported data
  await page.goto('/transactions');
  await expect(page.locator('[data-testid="amazon-transaction"]'))
    .toBeVisible();
});
```

### Amazon Data Synchronization
```javascript
test('should sync latest Amazon data', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/amazon-sync');

  const initialTransactionCount = await getTransactionCount(page);

  // Trigger sync
  await page.click('[data-testid="sync-amazon-data-button"]');

  // Verify sync progress
  await expect(page.locator('[data-testid="sync-status"]'))
    .toContainText('Synchronizing...');

  // Wait for completion
  await page.waitForSelector('[data-testid="sync-complete"]');

  // Verify new data imported
  const finalTransactionCount = await getTransactionCount(page);
  expect(finalTransactionCount).toBeGreaterThan(initialTransactionCount);
});
```

## Search and Filtering

### Transaction Search
```javascript
test('should search transactions', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/transactions');

  // Enter search term
  await page.fill('[data-testid="search-input"]', 'office supplies');

  // Verify filtered results
  await expect(page.locator('[data-testid="transaction-item"]'))
    .toHaveCount(3);

  await expect(page.locator('[data-testid="transaction-item"]:first-child'))
    .toContainText('office supplies');

  // Test advanced search
  await page.click('[data-testid="advanced-search-toggle"]');
  await page.selectOption('[data-testid="category-filter"]', 'Office');
  await page.fill('[data-testid="amount-min-input"]', '10');
  await page.fill('[data-testid="amount-max-input"]', '100');

  await page.click('[data-testid="apply-filters-button"]');

  // Verify advanced filters applied
  const results = page.locator('[data-testid="transaction-item"]');
  await expect(results).toHaveCount(2);
});
```

## Mobile Responsiveness

### Mobile Navigation
```javascript
test('should work on mobile devices', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });
  const page = await context.newPage();

  await loginUser(page, 'user@example.com', 'password');

  // Test mobile menu
  await page.click('[data-testid="mobile-menu-button"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

  // Navigate using mobile menu
  await page.click('[data-testid="mobile-menu-transactions"]');
  await expect(page).toHaveURL('/transactions');

  // Test responsive forms
  await page.click('[data-testid="add-transaction-button"]');
  await expect(page.locator('[data-testid="transaction-form"]')).toBeVisible();

  // Verify form elements are properly sized for mobile
  const formWidth = await page.locator('[data-testid="transaction-form"]').boundingBox();
  expect(formWidth.width).toBeLessThanOrEqual(375);
});
```

## Error Handling and Recovery

### Network Error Handling
```javascript
test('should handle network errors gracefully', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');

  // Simulate network failure
  await page.route('**/api/transactions', route => route.abort());

  await page.goto('/transactions');

  // Verify error message displayed
  await expect(page.locator('[data-testid="network-error-message"]'))
    .toContainText('Unable to load transactions');

  // Test retry functionality
  await page.click('[data-testid="retry-button"]');

  // After fixing network, should load successfully
  await page.unroute('**/api/transactions');
  await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
});
```

### Form Validation
```javascript
test('should validate form inputs', async ({ page }) => {
  await loginUser(page, 'user@example.com', 'password');
  await page.goto('/transactions/new');

  // Try to submit empty form
  await page.click('[data-testid="save-button"]');

  // Verify validation errors
  await expect(page.locator('[data-testid="amount-error"]'))
    .toContainText('Amount is required');

  await expect(page.locator('[data-testid="description-error"]'))
    .toContainText('Description is required');

  // Fill form with invalid data
  await page.fill('[data-testid="amount-input"]', 'invalid-amount');
  await page.fill('[data-testid="date-input"]', 'invalid-date');

  await page.click('[data-testid="save-button"]');

  // Verify field-specific errors
  await expect(page.locator('[data-testid="amount-error"]'))
    .toContainText('Please enter a valid amount');

  await expect(page.locator('[data-testid="date-error"]'))
    .toContainText('Please enter a valid date');
});
```

This comprehensive user workflow testing ensures all critical user journeys work correctly across different scenarios and devices.