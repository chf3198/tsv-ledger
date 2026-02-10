/**
 * TSV Expenses - Basic Tests
 * Tests for initial load and manual expense entry
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('loads with empty state', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/TSV Expenses/);
    await expect(page.locator('[data-testid="logo"]')).toContainText('TSV');
    await expect(page.locator('.category-supplies .amount')).toContainText('$0.00');
    await expect(page.locator('.category-benefits .amount')).toContainText('$0.00');
  });

  test('can add expense manually', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]'); // Navigate to Import
    await page.click('summary:has-text("Add")');
    await page.fill('form input[type="date"]', '2026-02-09');
    await page.fill('input[placeholder="Description"]', 'Test Office Supplies');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '150.00');
    await page.click('button[type="submit"]');

    await page.click('[data-nav="expenses"]'); // Navigate to Expenses to see table
    await expect(page.locator('td:has-text("Test Office Supplies")')).toBeVisible();
    await expect(page.locator('tbody td:has-text("$150.00")')).toBeVisible();
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$150.00');
  });

  test('persists data in localStorage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Persistent Item');
    await page.selectOption('form select', 'Employee Benefits');
    await page.fill('input[placeholder="Amount"]', '200.00');
    await page.click('button[type="submit"]');

    await page.reload();
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Persistent Item")')).toBeVisible();
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-benefits .amount')).toContainText('$200.00');
  });
});
