/**
 * Auth Button Responsive Tests - Visibility across viewport sizes
 * ADR-019: OAuth Integration
 */
const { test } = require('@playwright/test');
const { BASE_URL, assertAuthButtonVisible } = require('./helpers/auth-helpers');

test.describe('Auth Button Responsive', () => {
  test('mobile: Sign In button visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('tablet: Sign In button visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('desktop: Sign In button visible', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await assertAuthButtonVisible(page, 'Sign In');
  });
});
