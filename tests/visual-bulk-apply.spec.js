// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Visual Test: Apply to All Collapse Behavior', () => {
  test('bulk apply collapses all matched item sliders', async ({ page }) => {
    // Setup: 3 matching items (Toilet Paper)
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'tp-1', date: '2025-12-04', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false },
        { id: 'tp-2', date: '2025-12-03', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false },
        { id: 'tp-3', date: '2025-12-02', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false },
        { id: 'other', date: '2025-12-01', description: 'Coffee', amount: 15.00, businessPercent: 100, adjusted: false }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-nav="expenses"]');
    await page.waitForTimeout(1000);

    // STEP 1: Verify all 4 sliders visible initially
    const initialSliders = await page.locator('.slider-with-arrows:visible').count();
    console.log(`Initial visible sliders: ${initialSliders}`);
    expect(initialSliders).toBeGreaterThanOrEqual(3);

    // STEP 2: Simulate user adjusting first Toilet Paper item to 0% business
    await page.evaluate(() => {
      const expenses = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      expenses[0] = { ...expenses[0], businessPercent: 0, adjusted: true };
      localStorage.setItem('tsv-expenses', JSON.stringify(expenses));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-nav="expenses"]');
    await page.waitForTimeout(1000);

    // STEP 3: Now simulate bulk apply to remaining 2 Toilet Paper items
    await page.evaluate(() => {
      const expenses = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      const updated = expenses.map(e =>
        e.description === 'Toilet Paper'
          ? { ...e, businessPercent: 0, adjusted: true }
          : e
      );
      localStorage.setItem('tsv-expenses', JSON.stringify(updated));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-nav="expenses"]');
    await page.waitForTimeout(1000);

    // STEP 4: VERIFY - All 3 Toilet Paper items should be in Benefits column with collapsed sliders
    // Count visible sliders in Benefits column
    const benefitsSliders = await page.locator('.benefits .slider-with-arrows:visible').count();
    console.log(`Visible sliders in Benefits after bulk apply: ${benefitsSliders}`);

    // There should be 0 visible sliders in Benefits (all 3 Toilet Paper items collapsed)
    expect(benefitsSliders).toBe(0);

    // STEP 5: Verify Coffee item in Business column still has visible slider
    const businessSliders = await page.locator('.business-supplies .slider-with-arrows:visible').count();
    console.log(`Visible sliders in Business: ${businessSliders}`);
    expect(businessSliders).toBe(1); // Coffee should still be expandable

    // STEP 6: Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/bulk-apply-collapsed-state.png', fullPage: true });
    console.log('✅ Screenshot saved: test-results/bulk-apply-collapsed-state.png');
  });

  test('expand button toggles adjusted state', async ({ page }) => {
    // Setup: 1 item with adjusted=true
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'tp-1', date: '2025-12-04', description: 'Toilet Paper', amount: 24.99, businessPercent: 0, adjusted: true }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('[data-nav="expenses"]');
    await page.waitForTimeout(1000);

    // Slider should be hidden initially (adjusted=true)
    const sliderHidden = await page.locator('.slider-with-arrows').first().isHidden();
    expect(sliderHidden).toBe(true);

    // Click expand button
    const expandBtn = await page.locator('[data-testid="expand-toggle"]').first();
    await expandBtn.click();
    await page.waitForTimeout(500);

    // Slider should now be visible (adjusted=false)
    const sliderVisible = await page.locator('.slider-with-arrows').first().isVisible();
    expect(sliderVisible).toBe(true);

    console.log('✅ Expand/collapse toggle works correctly');
  });
});
