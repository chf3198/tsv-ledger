const { test, expect } = require('@playwright/test');

test.describe('Data Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    // Wait for expenseApp function to be defined
    await page.waitForFunction(() => typeof expenseApp === 'function');
    // Wait a bit more for Alpine to fully mount
    await page.waitForTimeout(1000);
  });

  test('shows file input in import section', async ({ page }) => {
    // Navigate to import section by clicking the link
    await page.click('a[data-nav="import"]');
    await page.waitForTimeout(300);
    
    // Verify file input exists and is visible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', '.csv,.dat');
  });

  test('imports Amazon CSV and displays expenses', async ({ page }) => {
    await page.click('a[href="#/import"]');
    
    // Upload Amazon test data
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/amazon-sample.csv');
    
    // Wait for import to complete
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    
    // Navigate to dashboard
    await page.click('a[href="#/"]');
    
    // Verify expenses appear (limited to 20 on dashboard)
    const expenseCards = page.locator('[data-expense-card]');
    const count = await expenseCards.count();
    expect(count).toBe(20); // Dashboard shows first 20
    
    // Verify first expense details
    const firstCard = expenseCards.first();
    await expect(firstCard).toContainText('Beachcombers Shell Dishes');
    await expect(firstCard).toContainText('14.52');
    // Date should be present (format: Feb 9, 2026 or similar)
    await expect(firstCard).toContainText('Feb');
    await expect(firstCard).toContainText('2026');
  });

  test('imports BOA DAT and displays expenses', async ({ page }) => {
    await page.click('a[href="#/import"]');
    
    // Upload BOA test data
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/boa-sample.dat');
    
    // Wait for import to complete
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    
    // Navigate to dashboard
    await page.click('a[href="#/"]');
    
    // Verify expenses appear
    const expenseCards = page.locator('[data-expense-card]');
    const count = await expenseCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify BOA transaction appears
    const airbnbCard = page.locator('[data-expense-card]:has-text("AIRBNB")').first();
    await expect(airbnbCard).toBeVisible();
  });

  test('categorizes imports automatically', async ({ page }) => {
    await page.click('a[href="#/import"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/amazon-sample.csv');
    await page.waitForSelector('[data-import-status="complete"]', { timeout: 5000 });
    
    await page.click('a[href="#/"]');
    
    // Find paper towels (should be Office Supplies)
    const paperTowels = page.locator('[data-expense-card]:has-text("Paper Towels")').first();
    await expect(paperTowels).toContainText('Office Supplies');
  });

  test('shows import progress feedback', async ({ page }) => {
    await page.click('a[href="#/import"]');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Start upload
    await fileInput.setInputFiles('test-data/amazon-sample.csv');
    
    // Verify progress indicator appears
    const progress = page.locator('[data-import-status]');
    await expect(progress).toBeVisible();
    
    // Wait for completion
    await expect(progress).toHaveAttribute('data-import-status', 'complete', { timeout: 5000 });
  });
});
