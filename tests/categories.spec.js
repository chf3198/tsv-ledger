/**
 * TSV Expenses - Category & Filter Tests
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Categories & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('can change expense category', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Category Test');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '100.00');
    await page.click('button[type="submit"]');

    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$100.00');
    await expect(page.locator('.category-benefits .amount')).toContainText('$0.00');

    await page.click('[data-nav="expenses"]');
    await page.selectOption('tbody select', 'Employee Benefits');
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$0.00');
    await expect(page.locator('.category-benefits .amount')).toContainText('$100.00');
  });

  test('can filter by category', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    // Add supplies item
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Supplies Item');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '50.00');
    await page.click('button[type="submit"]');

    // Add benefits item
    await page.fill('input[placeholder="Description"]', 'Benefits Item');
    await page.selectOption('form select', 'Employee Benefits');
    await page.fill('input[placeholder="Amount"]', '75.00');
    await page.click('button[type="submit"]');

    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Supplies Item")')).toBeVisible();
    await expect(page.locator('td:has-text("Benefits Item")')).toBeVisible();

    // Filter by Office Supplies
    await page.selectOption('.filters select', 'Office Supplies');
    await expect(page.locator('td:has-text("Supplies Item")')).toBeVisible();
    await expect(page.locator('td:has-text("Benefits Item")')).not.toBeVisible();
  });
});
