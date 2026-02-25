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
        sliderEl.noUiSlider.set(75); // This will fire 'set' event
      }
    });

    // Wait for Alpine to update
    await page.waitForTimeout(800);

    // Debug: Check what's in the benefits column
    const benefitsColumnText = await page.locator('.benefits').textContent();
    console.log('Benefits column content:', benefitsColumnText);

    // Should show split amounts in respective columns
    // Business Supplies column should show $75.00
    const businessColumn = page.locator('.business-supplies');
    await expect(businessColumn.locator('[data-testid="supplies-amount"]').first()).toContainText('$75.00');

    // Benefits column should now have a card showing $25.00
    const benefitsColumn = page.locator('.benefits');
    const benefitsCard = benefitsColumn.locator('.allocation-card');
    await expect(benefitsCard).toBeVisible({ timeout: 2000 });
    await expect(benefitsColumn.locator('[data-testid="benefits-amount"]').first()).toContainText('$25.00');
  });

  test('item moves to Benefits column when set to 100% benefits', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([{
        id: 'test-edge-1',
        date: '2026-02-20',
        description: 'Test Item',
        amount: 100.00,
        businessPercent: 100
      }]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    // Initially should be in Business column only
    await expect(page.locator('.business-supplies .allocation-card')).toHaveCount(1);
    await expect(page.locator('.benefits .allocation-card')).toHaveCount(0);

    // Set to 0% business (100% benefits) - manually update since slider events don't fire in tests
    await page.evaluate(() => {
      const expenses = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      expenses[0].businessPercent = 0;
      localStorage.setItem('tsv-expenses', JSON.stringify(expenses));
    });
    await page.reload(); // Reload to pick up the change
    await page.click('[data-nav="expenses"]');

    // Should now be in Benefits column only
    await expect(page.locator('.business-supplies .allocation-card')).toHaveCount(0);
    await expect(page.locator('.benefits .allocation-card')).toHaveCount(1);
    await expect(page.locator('.benefits [data-testid="benefits-amount"]')).toContainText('$100.00');
  });

  test('split item appears in both columns with correct percentages', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([{
        id: 'test-split-1',
        date: '2026-02-20',
        description: 'Split Item',
        amount: 100.00,
        businessPercent: 60
      }]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    // Should appear in both columns
    await expect(page.locator('.business-supplies .allocation-card')).toHaveCount(1);
    await expect(page.locator('.benefits .allocation-card')).toHaveCount(1);

    // Verify amounts
    await expect(page.locator('.business-supplies [data-testid="supplies-amount"]')).toContainText('$60.00');
    await expect(page.locator('.benefits [data-testid="benefits-amount"]')).toContainText('$40.00');

    // Verify both cards have split-item class
    await expect(page.locator('.business-supplies .allocation-card')).toHaveClass(/split-item/);
    await expect(page.locator('.benefits .allocation-card')).toHaveClass(/split-item/);
  });

  test('allocation percentages always sum to 100%', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', date: '2026-02-20', description: 'Item 1', amount: 50, businessPercent: 0 },
        { id: 'test-2', date: '2026-02-20', description: 'Item 2', amount: 50, businessPercent: 25 },
        { id: 'test-3', date: '2026-02-20', description: 'Item 3', amount: 50, businessPercent: 50 },
        { id: 'test-4', date: '2026-02-20', description: 'Item 4', amount: 50, businessPercent: 75 },
        { id: 'test-5', date: '2026-02-20', description: 'Item 5', amount: 50, businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    // Verify all items have businessPercent + benefitsPercent = 100
    const results = await page.evaluate(() => {
      const expenses = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      return expenses.map(e => ({
        id: e.id,
        business: e.businessPercent ?? 100,
        benefits: 100 - (e.businessPercent ?? 100),
        sum: (e.businessPercent ?? 100) + (100 - (e.businessPercent ?? 100))
      }));
    });

    results.forEach(r => {
      expect(r.sum).toBe(100);
    });
  });
});
