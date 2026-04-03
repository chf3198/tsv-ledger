// @ts-check
const { test, expect } = require('@playwright/test');

/** @param {import('@playwright/test').Locator} locator */
const getBox = async (locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Missing slider bounding box');
  return box;
};

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

  test('shows modal when matching expenses exist', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    await firstSlider.waitFor({ state: 'visible' });
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await getBox(firstSlider);
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: sliderBox.width * 0.8, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    const modal = page.locator('.bulk-apply-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('2 matching');
  });

  test('apply to all updates all matching percentages', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await getBox(firstSlider);
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: sliderBox.width * 0.6, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Apply to All")');
    await page.waitForTimeout(500);
    /** @type {{businessPercent:number}[]} */
    const expenses = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    expect(expenses.every(e => e.businessPercent === 60)).toBeTruthy();
  });

  test('apply to all at 100% benefits collapses all matched cards', async ({ page }) => {
    const firstSlider = page.locator('[data-expense-id="ghee-1"]').first();
    const sliderHandle = firstSlider.locator('.noUi-handle');
    const sliderBox = await getBox(firstSlider);
    await sliderHandle.dragTo(firstSlider, { targetPosition: { x: 2, y: sliderBox.height / 2 } });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Apply to All")');
    await page.waitForTimeout(800);

    /** @type {{id:string,bp:number,reviewed:boolean}[]} */
    const state = await page.evaluate(() => {
      /** @type {{id:string,description:string,businessPercent:number,reviewed:boolean}[]} */
      const exp = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      return exp.filter(e => e.description === '4th & Heart Ghee').map(e => ({ id: e.id, bp: e.businessPercent, reviewed: e.reviewed }));
    });
    state.forEach(e => {
      expect(e.bp).toBe(0);
      expect(e.reviewed).toBe(true);
    });
  });
});
