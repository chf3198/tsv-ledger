const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Import History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      // Set local storage mode to prevent modal blocking tests (ADR-024)
      localStorage.setItem('tsv-storage-mode', 'local');
    });
  });

  test('shows empty state when no imports exist', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    await expect(page.locator('text=No imports yet')).toBeVisible();
  });

  test('displays import record after successful BOA import', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    // Upload BOA file
    const boaData = '01/15/2024|AMAZON.COM|45.67|1234.56\n01/16/2024|TARGET|23.45|1211.11';
    const buffer = Buffer.from(boaData);
    await page.setInputFiles('input[type="file"]', {
      name: 'bank_statement.dat',
      mimeType: 'text/plain',
      buffer
    });

    await page.waitForSelector('text=2 new');

    // Verify import card exists (scroll down on same page)
    const importCard = page.locator('[data-testid="import-card"]').first();
    await expect(page.locator('[data-testid="import-card"]')).toHaveCount(1);
    await expect(importCard.locator('text=bank_statement.dat')).toBeVisible();
    await expect(importCard.locator('text=2 new')).toBeVisible();
  });

  test('detects and reports duplicates on re-import', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    const boaData = '01/15/2024|AMAZON.COM|45.67|1234.56\n01/16/2024|TARGET|23.45|1211.11';
    const buffer = Buffer.from(boaData);

    // First import
    await page.setInputFiles('input[type="file"]', {
      name: 'jan_statement.dat',
      mimeType: 'text/plain',
      buffer
    });
    await page.waitForSelector('text=2 new');

    // Re-import same data
    await page.setInputFiles('input[type="file"]', {
      name: 'jan_statement_duplicate.dat',
      mimeType: 'text/plain',
      buffer
    });
    await page.waitForSelector('text=0 new, 2 duplicates');

    // Import history is on same page - should have 2 import cards
    const cards = page.locator('[data-testid="import-card"]');
    await expect(cards).toHaveCount(2);

    // Second import should show duplicates
    const newestCard = cards.first();
    await expect(newestCard.locator('text=2 duplicates')).toBeVisible();
  });

  test('shows newest imports first', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-nav="import"]');

    // Import 1
    const data1 = '01/15/2024|STORE A|10.00|1000.00';
    await page.setInputFiles('input[type="file"]', {
      name: 'import1.dat',
      mimeType: 'text/plain',
      buffer: Buffer.from(data1)
    });
    await page.waitForSelector('text=1 new');

    // Import 2
    const data2 = '02/15/2024|STORE B|20.00|2000.00';
    await page.setInputFiles('input[type="file"]', {
      name: 'import2.dat',
      mimeType: 'text/plain',
      buffer: Buffer.from(data2)
    });
    await page.waitForSelector('text=1 new');

    // Import history is on same page
    const cards = page.locator('[data-testid="import-card"]');
    const firstCard = cards.first();

    // Newest (import2.dat) should be first
    await expect(firstCard.locator('text=import2.dat')).toBeVisible();
  });
});
