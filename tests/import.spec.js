/**
 * TSV Expenses - Delete & Import Tests
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Delete & Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('can delete expense', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Delete Me');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '25.00');
    await page.click('button[type="submit"]');

    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Delete Me")')).toBeVisible();

    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("🗑️")');

    await expect(page.locator('td:has-text("Delete Me")')).not.toBeVisible();
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$0.00');
  });

  test('can import CSV file', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    const csvContent = `Date,Description,Location,Category,Amount
2026-01-15,Paper supplies,Dallas,Office Supplies,45.00
2026-01-20,Health insurance,Austin,Employee Benefits,500.00`;

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await expect(page.locator('text=Imported 2')).toBeVisible();
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Paper supplies")')).toBeVisible();
    await expect(page.locator('td:has-text("Health insurance")')).toBeVisible();
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$45.00');
    await expect(page.locator('.category-benefits .amount')).toContainText('$500.00');
  });
});
