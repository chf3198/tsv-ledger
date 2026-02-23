const { test, expect } = require('@playwright/test');

test.describe('Allocation Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows percentage slider for each expense', async ({ page }) => {
    // Add test expense
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([{
        id: 'test-1',
        date: '2026-02-20',
        description: 'Coffee beans',
        amount: 50.00,
        category: 'Uncategorized',
        businessPercent: 100
      }]));
    });
    await page.reload();

    await page.click('[data-nav="expenses"]');

    // Should show noUiSlider
    const slider = page.locator('[data-testid="allocation-slider"]').first();
    await expect(slider).toBeVisible();
    
    // Check that noUiSlider was initialized (has .noUi-base child)
    const sliderBase = slider.locator('.noUi-base');
    await expect(sliderBase).toBeVisible();
    
    // Verify tooltip shows 100%
    const tooltip = slider.locator('.noUi-tooltip');
    await expect(tooltip).toContainText('100%');
  });

  test('updates allocation percentage when slider changes', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([{
        id: 'test-1',
        date: '2026-02-20',
        description: 'Coffee beans',
        amount: 100.00,
        category: 'Uncategorized',
        businessPercent: 100
      }]));
    });
    await page.reload();

    await page.click('[data-nav="expenses"]');

    // Set slider to 75% using noUiSlider API
    await page.evaluate(() => {
      const sliderEl = document.querySelector('[data-testid="allocation-slider"]');
      if (sliderEl && sliderEl.noUiSlider) {
        sliderEl.noUiSlider.set(75);
      }
    });

    // Wait for update
    await page.waitForTimeout(100);

    // Should show split amounts
    const suppliesAmount = page.locator('[data-testid="supplies-amount"]').first();
    const benefitsAmount = page.locator('[data-testid="benefits-amount"]').first();

    await expect(suppliesAmount).toContainText('$75.00');
    await expect(benefitsAmount).toContainText('$25.00');
  });
});
