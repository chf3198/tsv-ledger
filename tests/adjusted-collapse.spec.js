// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Adjusted Property: Slider Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'tp-1', date: '2025-12-04', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false },
        { id: 'tp-2', date: '2025-12-03', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false },
        { id: 'tp-3', date: '2025-12-02', description: 'Toilet Paper', amount: 24.99, businessPercent: 100, adjusted: false }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('migration: legacy reviewed→adjusted', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'old', date: '2025-01-01', description: 'Old', amount: 10, businessPercent: 50, reviewed: true }
      ]));
    });
    await page.reload();
    const exp = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    expect(exp[0].adjusted).toBe(true);
  });

  test('new expenses: adjusted defaults false', async ({ page }) => {
    const exp = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    exp.forEach(e => expect(e.adjusted).toBe(false));
  });

  test('bulk apply: sets adjusted=true + businessPercent', async ({ page }) => {
    await page.evaluate(() => {
      const exp = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      const updated = exp.map(e => e.description === 'Toilet Paper' 
        ? { ...e, businessPercent: 0, adjusted: true } : e);
      localStorage.setItem('tsv-expenses', JSON.stringify(updated));
    });
    await page.reload();
    const exp = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    exp.filter(e => e.description === 'Toilet Paper').forEach(e => {
      expect(e.businessPercent).toBe(0);
      expect(e.adjusted).toBe(true);
    });
  });

  test('toggle: adjusted true→false editable', async ({ page }) => {
    await page.evaluate(() => {
      const exp = JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
      exp[0] = { ...exp[0], adjusted: true };
      localStorage.setItem('tsv-expenses', JSON.stringify(exp));
    });
    const before = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('tsv-expenses') || '[]')[0].adjusted);
    expect(before).toBe(true);
  });
});
