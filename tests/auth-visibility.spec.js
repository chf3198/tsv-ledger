/**
 * Auth Button Visibility Tests - Core visibility checks
 * ADR-019: OAuth Integration
 */
const { test, expect } = require('@playwright/test');
const { BASE_URL, assertAuthButtonVisible, waitForAlpine, clearAuthState } = require('./helpers/auth-helpers');

test.describe('Auth Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearAuthState(page);
    await page.reload();
    await waitForAlpine(page);
  });

  test('shows Sign In button on initial load', async ({ page }) => {
    const styles = await assertAuthButtonVisible(page, 'Sign In');
    expect(styles.color).toMatch(/rgb\(255,\s*255,\s*255\)|#fff|white/i);
  });

  test('Sign In button clickable and opens modal', async ({ page }) => {
    await page.locator('[data-testid="auth-button"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
  });

  test('Sign In button visible after modal close', async ({ page }) => {
    await page.locator('[data-testid="auth-button"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    await page.locator('[data-testid="auth-modal-close"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('Sign In button visible after auth state changes', async ({ page }) => {
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      body._x_dataStack[0].auth = { authenticated: true, user: { name: 'Test User' } };
    });
    await assertAuthButtonVisible(page, 'Test User');
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      body._x_dataStack[0].auth = { authenticated: false, user: null };
      body._x_dataStack[0].showUserMenu = false;
    });
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('Sign In visible after page reload (OAuth cancel)', async ({ page }) => {
    await clearAuthState(page);
    await page.reload();
    await waitForAlpine(page);
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('Sign In visible after logout and reload', async ({ page }) => {
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      body._x_dataStack[0].auth = { authenticated: true, user: { name: 'Test' } };
    });
    await assertAuthButtonVisible(page, 'Test');
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      body._x_dataStack[0].logout();
    });
    await assertAuthButtonVisible(page, 'Sign In');
    await page.reload();
    await waitForAlpine(page);
    await assertAuthButtonVisible(page, 'Sign In');
  });
});
