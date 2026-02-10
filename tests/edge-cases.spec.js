/**
 * TSV Expenses - Edge Case Tests
 * Tests for boundary conditions and error handling
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('handles malformed CSV content', async ({ page }) => {
    await page.click('[data-nav="import"]');
    // File with .csv extension but invalid content should still try to parse
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('not,valid\n\n') });
    // Should show imported 0 for malformed data
    await expect(page.locator('text=Imported 0')).toBeVisible();
  });

  test('handles CSV with missing columns gracefully', async ({ page }) => {
    await page.click('[data-nav="import"]');
    const csv = `Name,Price\nPaper,10.00\nPens,5.50`;
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.locator('text=Imported 2')).toBeVisible();
  });

  test('handles empty CSV file', async ({ page }) => {
    await page.click('[data-nav="import"]');
    const csv = `Date,Description,Amount`;
    await page.locator('input[type="file"]').setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.locator('text=Imported 0')).toBeVisible();
  });

  test('skips rows with zero/negative amounts', async ({ page }) => {
    await page.click('[data-nav="import"]');
    const csv = `Date,Description,Amount\n2026-01-01,Valid,100\n2026-01-02,Zero,0\n2026-01-03,Negative,-50`;
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.locator('text=Imported 1')).toBeVisible();
    await expect(page.locator('text=skipped 2')).toBeVisible();
  });

  test('handles special characters in descriptions', async ({ page }) => {
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.fill('input[placeholder="Description"]', 'Test "quoted" & <special>');
    await page.selectOption('form select', 'Office Supplies');
    await page.fill('input[placeholder="Amount"]', '50');
    await page.click('button[type="submit"]');
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('td:has-text("Test \\"quoted\\" & <special>")')).toBeVisible();
  });

  test('validates required fields in add form', async ({ page }) => {
    await page.click('[data-nav="import"]');
    await page.click('summary:has-text("Add")');
    await page.click('button[type="submit"]');
    // Form should not submit without required fields
    await page.click('[data-nav="expenses"]');
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });
});
