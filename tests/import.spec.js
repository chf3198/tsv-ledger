const { test, expect } = require('@playwright/test');

test.describe('Data Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof expenseApp === 'function');
    await page.waitForTimeout(1000);
  });

  test('shows file input in import section', async ({ page }) => {
    await page.click('a[data-nav="import"]');
    await page.waitForTimeout(300);
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', '.csv,.dat,.zip');
  });

  test('imports Amazon CSV and displays expenses', async ({ page }) => {
    await page.click('a[href="#/import"]');
    await page.locator('input[type="file"]').setInputFiles('test-data/amazon-sample.csv');
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    await page.click('a[href="#/"]');
    
    const expenseCards = page.locator('[data-expense-card]');
    expect(await expenseCards.count()).toBe(20);
    
    const firstCard = expenseCards.first();
    await expect(firstCard).toContainText('Beachcombers Shell Dishes');
    await expect(firstCard).toContainText('14.52');
    await expect(firstCard).toContainText('Feb');
    await expect(firstCard).toContainText('2026');
  });

  test('imports BOA DAT and displays expenses', async ({ page }) => {
    await page.click('a[href="#/import"]');
    await page.locator('input[type="file"]').setInputFiles('test-data/boa-sample.dat');
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    await page.click('a[href="#/"]');
    
    const count = await page.locator('[data-expense-card]').count();
    expect(count).toBeGreaterThan(0);
    
    const airbnbCard = page.locator('[data-expense-card]:has-text("AIRBNB")').first();
    await expect(airbnbCard).toBeVisible();
  });

  test('categorizes imports automatically', async ({ page }) => {
    await page.click('a[href="#/import"]');
    await page.locator('input[type="file"]').setInputFiles('test-data/amazon-sample.csv');
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    await page.click('a[href="#/"]');
    
    const paperTowels = page.locator('[data-expense-card]:has-text("Paper Towels")').first();
    await expect(paperTowels).toContainText('Office Supplies');
  });

  test('shows import progress feedback', async ({ page }) => {
    await page.click('a[href="#/import"]');
    await page.locator('input[type="file"]').setInputFiles('test-data/amazon-sample.csv');
    
    const progress = page.locator('[data-import-status]');
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('data-import-status', 'complete', { timeout: 5000 });
  });
});
