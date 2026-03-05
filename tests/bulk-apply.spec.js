// @ts-check
const { test, expect } = require('@playwright/test');
const { analyzeScreenshotWithClaude } = require('./helpers/auth-helpers');

/** Full-stack E2E tests for bulk allocation with visual validation */
test.describe('Bulk Allocation: Apply to All', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'ghee-1', date: '2025-12-04', description: '4th & Heart Ghee', amount: 21.73, businessPercent: 100 },
        { id: 'ghee-2', date: '2025-10-02', description: '4th & Heart Ghee', amount: 21.73, businessPercent: 50 },
        { id: 'ghee-3', date: '2025-09-04', description: '4th & Heart Ghee', amount: 21.73, businessPercent: 75 }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-nav="expenses"]');
    await page.waitForTimeout(500);
  });

  test('bulk apply modal appears when matching expenses exist', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    await firstSlider.waitFor({ state: 'visible' });
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await firstSlider.boundingBox();
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: sliderBox.width * 0.8, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    const modal = page.locator('[data-testid="bulk-apply-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('2 matching');
  });

  test('apply to all updates all matching expenses immutably', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await firstSlider.boundingBox();
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: sliderBox.width * 0.6, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Apply to All")');
    await page.waitForTimeout(500);
    const expenses = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses')));
    expect(expenses.every(e => e.businessPercent === 60)).toBeTruthy();
    const allSliders = page.locator('[data-expense-id^="ghee-"]');
    const count = await allSliders.count();
    for (let i = 0; i < count; i++) {
      const tooltip = allSliders.nth(i).locator('.noUi-tooltip');
      await expect(tooltip).toContainText('60%');
    }
  });

  test('apply to all at 100% sets reviewed=true to collapse sliders', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await firstSlider.boundingBox();

    await sliderHandle.dragTo(firstSlider, {
      targetPosition: { x: sliderBox.width * 0.99, y: sliderBox.height / 2 }
    });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Apply to All")');
    await page.waitForTimeout(500);

    const expenses = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses')));
    expenses.forEach(e => {
      expect(e.businessPercent).toBe(100);
      expect(e.reviewed).toBe(true);
    });

    const allSliders = page.locator('[data-expense-id^="ghee-"]');
    const count = await allSliders.count();
    for (let i = 0; i < count; i++) {
      await expect(allSliders.nth(i)).toBeHidden();
    }
  });

  test('visual: sliders align after bulk apply', async ({ page }) => {
    await page.evaluate(() => {
      const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
      if (app) { app.expenses[0].businessPercent = 100; app.updateExpense(); }
    });
    await page.waitForTimeout(1000);
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await firstSlider.boundingBox();
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: sliderBox.width * 0.7, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Apply to All")');
    await page.waitForTimeout(800);
    const analysis = await analyzeScreenshotWithClaude(page, `Check expense sliders:
1. All "4th & Heart Ghee" sliders at same % (≈70%)?
2. Slider handles horizontally aligned?
3. Tooltips show matching values?
Report: "✅ PASS" or "❌ ISSUE: description"`);
    console.log('Bulk Apply Visual:', analysis);
  });
});
