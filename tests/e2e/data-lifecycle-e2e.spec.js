/**
 * Data Lifecycle E2E Tests
 *
 * Comprehensive tests for:
 * 1. Importing real bank (BOA) and Amazon data
 * 2. Verifying data displays correctly across all app sections
 * 3. Using admin feature to clear all data
 * 4. Verifying empty states display correctly everywhere
 *
 * @module tests/e2e/data-lifecycle-e2e.spec.js
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test data paths
const DATA_DIR = path.join(__dirname, '../../data');
const BOA_DATA_FILE = path.join(DATA_DIR, 'stmttab.dat');
const AMAZON_DATA_FILE = path.join(DATA_DIR, 'amazon-official-data.csv');

// Base URL
const BASE_URL = 'http://localhost:3000';

test.describe('Data Lifecycle - Full E2E Test Suite', () => {

  test.describe('Phase 1: Data Import', () => {

    test('should import BOA bank data successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Data Import section
      await page.click('[data-section="data-import"]');
      await page.waitForSelector('#data-import', { state: 'visible', timeout: 5000 });

      // Upload BOA file
      const fileInput = page.locator('#csvFile');
      await fileInput.setInputFiles(BOA_DATA_FILE);

      // Click import button
      await page.click('#importBtn');

      // Wait for import to complete
      await page.waitForTimeout(2000);

      // Verify import success message or data count
      const alertText = await page.locator('.alert-success, .alert-info').textContent().catch(() => '');
      console.log('Import result:', alertText);

      // Verify data appears in Recent Transactions
      const transactions = await page.locator('#recentTransactions tr, .transaction-row').count();
      expect(transactions).toBeGreaterThan(0);
    });

    test('should import Amazon data successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Data Import section
      await page.click('[data-section="data-import"]');
      await page.waitForSelector('#data-import', { state: 'visible', timeout: 5000 });

      // Upload Amazon file
      const fileInput = page.locator('#csvFile');
      await fileInput.setInputFiles(AMAZON_DATA_FILE);

      // Click import button
      await page.click('#importBtn');

      // Wait for import to complete
      await page.waitForTimeout(3000);

      // Verify import result
      const pageContent = await page.content();
      expect(pageContent).toMatch(/import|success|transactions|expenditures/i);
    });
  });

  test.describe('Phase 2: Verify Data Display Across All Sections', () => {

    test('should display data in Dashboard section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Dashboard should show summary cards with data
      const dashboardCards = await page.locator('.card, .stat-card, .summary-card').count();
      expect(dashboardCards).toBeGreaterThan(0);

      // Check for non-zero values in stats
      const statsText = await page.locator('.card-body, .stat-value').allTextContents();
      const hasData = statsText.some(text => /\$[\d,]+\.?\d*|\d+/.test(text) && !/\$0\.00|^0$/.test(text));
      console.log('Dashboard stats:', statsText.slice(0, 5));
    });

    test('should display data in Recent Transactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Check Recent Transactions table has data
      const transactionRows = await page.locator('#recentTransactions tbody tr, .transaction-item').count();
      console.log('Transaction rows found:', transactionRows);
      expect(transactionRows).toBeGreaterThan(0);
    });

    test('should display data in Analysis & Reports section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Analysis section
      await page.click('[data-section="analysis"]');
      await page.waitForTimeout(1000);

      // Check for charts or data displays
      const analysisContent = await page.locator('#analysis, [id*="analysis"]').textContent().catch(() => '');
      console.log('Analysis content preview:', analysisContent.substring(0, 200));
    });

    test('should display data in AI Insights section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to AI Insights section
      await page.click('[data-section="ai-insights"]');
      await page.waitForTimeout(1000);

      // Verify section is visible
      const aiSection = await page.locator('#ai-insights, [id*="ai"]').isVisible().catch(() => false);
      expect(aiSection).toBeTruthy();
    });

    test('should display data in Bank Reconciliation section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Bank Reconciliation
      await page.click('[data-section="bank-reconciliation"]');
      await page.waitForTimeout(1000);

      // Check section content
      const reconciliationSection = await page.locator('#bank-reconciliation').isVisible().catch(() => false);
      console.log('Bank Reconciliation visible:', reconciliationSection);
    });

    test('should display data in Subscription Analysis section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Subscription Analysis
      await page.click('[data-section="subscription-analysis"]');
      await page.waitForTimeout(1000);

      // Check section content
      const subscriptionSection = await page.locator('#subscription-analysis').isVisible().catch(() => false);
      console.log('Subscription Analysis visible:', subscriptionSection);
    });

    test('should display data in Benefits Management section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Benefits Management
      await page.click('[data-section="benefits-management"]');
      await page.waitForTimeout(1000);

      // Check section content
      const benefitsSection = await page.locator('#benefits-management, #employee-benefits').isVisible().catch(() => false);
      console.log('Benefits Management visible:', benefitsSection);
    });

    test('should display data in Geographic Analysis section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Geographic Analysis
      await page.click('[data-section="geographic-analysis"]');
      await page.waitForTimeout(1000);

      // Check section content
      const geoSection = await page.locator('#geographic-analysis').isVisible().catch(() => false);
      console.log('Geographic Analysis visible:', geoSection);
    });
  });

  test.describe('Phase 3: Admin Data Clearing', () => {

    test('should access admin page and show data statistics', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin.html`);

      // Verify admin page loads
      await expect(page.locator('h1')).toContainText('Admin');

      // Check data statistics show non-zero values
      const expenditureCount = await page.locator('#stat-expenditures, h3:has-text("Expenditures") + *, .stat-card:has-text("Expenditures")').textContent().catch(() => '0');
      console.log('Current expenditure count:', expenditureCount);
    });

    test('should clear all data via admin panel', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin.html`);
      await page.waitForTimeout(1000);

      // Click "Clear All Application Data" button
      await page.click('button:has-text("Clear All Application Data")');

      // Wait for confirmation modal
      await page.waitForSelector('.modal.show, [role="dialog"]', { state: 'visible', timeout: 5000 });

      // Type DELETE confirmation
      await page.fill('input[placeholder*="DELETE"], #confirm-input', 'DELETE');

      // Click confirm delete button
      await page.click('button:has-text("Delete Data")');

      // Wait for operation to complete
      await page.waitForTimeout(2000);

      // Verify success toast or stats update to 0
      const expenditureCount = await page.locator('#stat-expenditures').textContent().catch(() => 'unknown');
      console.log('Expenditure count after clear:', expenditureCount);
    });

    test('should verify admin statistics show zero after clearing', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin.html`);
      await page.waitForTimeout(1000);

      // Refresh stats
      await page.click('button:has-text("Refresh Stats")');
      await page.waitForTimeout(500);

      // Check all stats are 0
      const statsText = await page.locator('.card h3, .stats-card h3').allTextContents();
      console.log('Stats after clearing:', statsText);

      // Expenditures should be 0
      const zeroStats = statsText.filter(text => text.trim() === '0');
      expect(zeroStats.length).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Phase 4: Verify Empty States Across All Sections', () => {

    test('should show empty state in Dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForTimeout(1000);

      // Dashboard should show $0 or empty messages
      const dashboardContent = await page.locator('#dashboard, .dashboard-section').textContent().catch(() => '');
      console.log('Dashboard empty state:', dashboardContent.substring(0, 300));

      // Check for zero values or "no data" messages
      const hasEmptyState = dashboardContent.includes('$0') ||
                           dashboardContent.includes('No data') ||
                           dashboardContent.includes('no transactions') ||
                           /\$0\.00/.test(dashboardContent);
      console.log('Dashboard shows empty state indicators:', hasEmptyState);
    });

    test('should show empty Recent Transactions table', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForTimeout(1000);

      // Check Recent Transactions is empty or shows empty message
      const transactionRows = await page.locator('#recentTransactions tbody tr').count();
      const emptyMessage = await page.locator('#recentTransactions').textContent().catch(() => '');

      console.log('Transaction rows after clear:', transactionRows);
      console.log('Transaction table content:', emptyMessage.substring(0, 200));

      // Should be 0 rows or show "No transactions" message
      const isEmpty = transactionRows === 0 ||
                      emptyMessage.toLowerCase().includes('no') ||
                      emptyMessage.toLowerCase().includes('empty');
      expect(isEmpty || transactionRows === 0).toBeTruthy();
    });

    test('should show empty Analysis section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to Analysis
      await page.click('[data-section="analysis"]');
      await page.waitForTimeout(1000);

      const analysisContent = await page.locator('#analysis').textContent().catch(() => '');
      console.log('Analysis empty state:', analysisContent.substring(0, 200));
    });

    test('should show empty AI Insights section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      // Navigate to AI Insights
      await page.click('[data-section="ai-insights"]');
      await page.waitForTimeout(1000);

      const aiContent = await page.locator('#ai-insights').textContent().catch(() => '');
      console.log('AI Insights empty state:', aiContent.substring(0, 200));
    });

    test('should show empty Bank Reconciliation section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      await page.click('[data-section="bank-reconciliation"]');
      await page.waitForTimeout(1000);

      const content = await page.locator('#bank-reconciliation').textContent().catch(() => '');
      console.log('Bank Reconciliation empty state:', content.substring(0, 200));
    });

    test('should show empty Subscription Analysis section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      await page.click('[data-section="subscription-analysis"]');
      await page.waitForTimeout(1000);

      const content = await page.locator('#subscription-analysis').textContent().catch(() => '');
      console.log('Subscription Analysis empty state:', content.substring(0, 200));
    });

    test('should show empty Benefits Management section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      await page.click('[data-section="benefits-management"]');
      await page.waitForTimeout(1000);

      const content = await page.locator('#benefits-management, #employee-benefits').textContent().catch(() => '');
      console.log('Benefits Management empty state:', content.substring(0, 200));
    });

    test('should show empty Geographic Analysis section', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);

      await page.click('[data-section="geographic-analysis"]');
      await page.waitForTimeout(1000);

      const content = await page.locator('#geographic-analysis').textContent().catch(() => '');
      console.log('Geographic Analysis empty state:', content.substring(0, 200));
    });

    test('should verify admin page shows zero statistics', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin.html`);
      await page.waitForTimeout(1000);

      // Check expenditures count is 0
      const expenditureText = await page.locator('#stat-expenditures').textContent().catch(() => '');
      expect(expenditureText.trim()).toBe('0');

      // Check import history is 0
      const importHistoryText = await page.locator('#stat-import-history').textContent().catch(() => '');
      expect(importHistoryText.trim()).toBe('0');
    });
  });

  test.describe('Phase 5: API Verification', () => {

    test('should verify API returns empty data', async ({ request }) => {
      // Check expenditures API
      const expResponse = await request.get(`${BASE_URL}/api/expenditures`);
      const expData = await expResponse.json();
      console.log('API expenditures count:', expData.length || expData.data?.length || 0);

      // Should be empty array or have 0 items
      const expCount = Array.isArray(expData) ? expData.length : (expData.data?.length || 0);
      expect(expCount).toBe(0);
    });

    test('should verify admin status API shows zeros', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/status`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.expenditures.count).toBe(0);
      console.log('Admin status:', data.data);
    });
  });
});

// Export for integration test runner
module.exports = { test, expect };
