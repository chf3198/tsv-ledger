/**
 * TSV Expenses - User Flow Tests
 * Complete end-to-end user workflows
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Complete User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('complete expense management workflow', async ({ page }) => {
    // 1. Import CSV
    await page.click('[data-nav="import"]');
    const csv = `Date,Description,Location,Amount\n2026-01-15,Printer ink,Dallas,89.99\n2026-01-20,Lunch meeting,Austin,45.00`;
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.locator('text=Imported 2')).toBeVisible();

    // 2. Add manual expense
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Office chair');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '299.99');
    await page.click('button[type="submit"]');

    // 3. Verify totals (ink $89.99 + chair $299.99 = $389.98 supplies, lunch $45 benefits)
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-supplies .amount')).toContainText('$389.98');

    // 4. Recategorize lunch to benefits
    await page.click('[data-nav="expenses"]');
    const lunchRow = page.locator('tr', { has: page.locator('td:has-text("Lunch meeting")') });
    await lunchRow.locator('select').selectOption('Employee Benefits');
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-benefits .amount')).toContainText('$45.00');

    // 5. Filter by category
    await page.click('[data-nav="expenses"]');
    await page.selectOption('.filters select', 'Office Supplies');
    await expect(page.locator('tbody tr')).toHaveCount(2);

    // 6. Clear filters
    await page.click('button:has-text("Clear")');
    await expect(page.locator('tbody tr')).toHaveCount(3);

    // 7. Delete expense
    page.on('dialog', d => d.accept());
    await page.locator('tr', { has: page.locator('td:has-text("Office chair")') }).locator('button:has-text("🗑️")').click();
    await expect(page.locator('td:has-text("Office chair")')).not.toBeVisible();

    // 8. Verify persistence
    await page.reload();
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  test('date range filtering', async ({ page }) => {
    await page.click('[data-nav="import"]');
    const csv = `Date,Description,Amount\n2026-01-01,Jan expense,100\n2026-02-15,Feb expense,200\n2026-03-30,Mar expense,300`;
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('tbody tr')).toHaveCount(3);

    // Filter to February only
    await page.fill('.filters input[type="date"]:first-of-type', '2026-02-01');
    await page.fill('.filters input[type="date"]:last-of-type', '2026-02-28');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('td:has-text("Feb expense")')).toBeVisible();
  });

  test('export contains correct data', async ({ page }) => {
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.fill('form input[type="date"]', '2026-02-09');
    await page.fill('input[placeholder="Description"]', 'Export test item');
    await page.selectOption('form select', 'Employee Benefits');
    await page.fill('input[placeholder="Amount"]', '123.45');
    await page.click('button[type="submit"]');

    // Verify data is in table before export
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Export test item")')).toBeVisible();
    await page.click('[data-nav="dashboard"]');
    await expect(page.locator('.category-benefits .amount')).toContainText('$123.45');
  });
});
