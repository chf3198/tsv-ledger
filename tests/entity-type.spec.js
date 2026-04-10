const { test, expect } = require('@playwright/test');

test.describe('Entity Type Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-local-profile', JSON.stringify({ alias: 'Test' }));
    });
    await page.reload();
  });

  test('settings shows entity type selector', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    const section = page.locator('[data-testid="entity-type-section"]');
    await expect(section).toBeVisible();
    const select = section.locator('[data-testid="entity-type-select"]');
    await expect(select).toBeVisible();
  });

  test('selecting S Corp shows tax warning in settings', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await page.selectOption('[data-testid="entity-type-select"]', 's-corp');
    const warning = page.locator('[data-testid="entity-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('S Corp');
  });

  test('entity type warning appears in benefits column', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-entity-type', 's-corp');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'e1', date: '2026-04-10', description: 'Gift', amount: 50, businessPercent: 0 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    const warn = page.locator('[data-testid="entity-benefit-warning"]');
    await expect(warn).toBeVisible();
    await expect(warn).toContainText('S Corp');
  });

  test('entity type is persisted to localStorage', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await page.selectOption('[data-testid="entity-type-select"]', 'partnership');
    const stored = await page.evaluate(() => localStorage.getItem('tsv-entity-type'));
    expect(stored).toBe('partnership');
  });

  test('C Corp shows no warning', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-entity-type', 'c-corp');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'e2', date: '2026-04-10', description: 'Gift', amount: 50, businessPercent: 0 }
      ]));
    });
    await page.reload();
    await page.click('[data-nav="expenses"]');
    const warn = page.locator('[data-testid="entity-benefit-warning"]');
    await expect(warn).toBeHidden();
  });
});
