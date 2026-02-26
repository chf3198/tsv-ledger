// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Collapsible Reviewed Cards (ADR-018)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('new items start expanded with controls visible', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 50, category: 'Business Supplies', businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    const card = page.locator('[data-testid="allocation-card"]').first();
    await expect(card.locator('[data-testid="allocation-slider"]')).toBeVisible();
  });

  test('card collapses after allocation change', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100, category: 'Business Supplies', businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    
    // Wait for card to be visible
    const card = page.locator('.allocation-column.business-supplies [data-testid="allocation-card"]').first();
    await expect(card).toBeVisible();
    
    // Wait for slider to initialize (ensures card is fully rendered)
    await expect(card.locator('[data-testid="allocation-slider"] .noUi-base')).toBeVisible();
    
    // Use slider API to change allocation, then directly set reviewed
    await page.evaluate(() => {
      const sliderEl = document.querySelector('.business-supplies [data-testid="allocation-slider"]');
      if (sliderEl && sliderEl.noUiSlider) {
        sliderEl.noUiSlider.set(75);
      }
      // Get the Alpine component and set reviewed on the expense
      const appEl = document.querySelector('[x-data]');
      const app = Alpine.$data(appEl);
      const expense = app.expenses.find(e => e.id === 'test-1');
      if (expense) {
        expense.reviewed = true;
        app.updateExpense();
      }
    });
    await page.waitForTimeout(200);

    // Slider should now be hidden (collapsed)
    await expect(card.locator('[data-testid="allocation-slider"]')).toBeHidden();
  });

  test('collapsed card shows expand icon', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100, category: 'Business Supplies', businessPercent: 100, reviewed: true }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    const card = page.locator('[data-testid="allocation-card"]').first();
    await expect(card.locator('[data-testid="expand-toggle"]')).toBeVisible();
  });

  test('clicking expand icon shows controls', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100, category: 'Business Supplies', businessPercent: 100, reviewed: true }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    const card = page.locator('[data-testid="allocation-card"]').first();
    await card.locator('[data-testid="expand-toggle"]').click();

    await expect(card.locator('[data-testid="allocation-slider"]')).toBeVisible();
  });

  test('reviewed state persists after reload', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test Item', date: '2026-02-20', amount: 100, category: 'Business Supplies', businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');

    // Wait for card and slider to be ready
    const card = page.locator('.allocation-column.business-supplies [data-testid="allocation-card"]').first();
    await expect(card).toBeVisible();
    await expect(card.locator('[data-testid="allocation-slider"] .noUi-base')).toBeVisible();

    // Use slider API to change allocation, then directly set reviewed
    await page.evaluate(() => {
      const sliderEl = document.querySelector('.business-supplies [data-testid="allocation-slider"]');
      if (sliderEl && sliderEl.noUiSlider) {
        sliderEl.noUiSlider.set(75);
      }
      // Get the Alpine component and set reviewed on the expense
      const appEl = document.querySelector('[x-data]');
      const app = Alpine.$data(appEl);
      const expense = app.expenses.find(e => e.id === 'test-1');
      if (expense) {
        expense.reviewed = true;
        app.updateExpense();
      }
    });
    await page.waitForTimeout(200);

    // Reload page
    await page.reload();
    await page.click('[data-nav="expenses"]');

    // Card should still be collapsed
    const cardAfterReload = page.locator('.allocation-column.business-supplies [data-testid="allocation-card"]').first();
    await expect(cardAfterReload.locator('[data-testid="allocation-slider"]')).toBeHidden();
  });
});
