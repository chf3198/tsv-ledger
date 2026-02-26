/**
 * TSV Expenses - Auth Button Visibility Tests
 * Tests that Sign In button remains visible across all auth states
 * ADR-019: OAuth Integration
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

/** Helper: Get computed style of auth button */
async function getAuthButtonStyles(page) {
  return page.locator('[data-testid="auth-button"]').evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      display: s.display,
      visibility: s.visibility,
      opacity: parseFloat(s.opacity),
      color: s.color,
      width: el.offsetWidth,
      height: el.offsetHeight,
      text: el.textContent.trim()
    };
  });
}

/** Helper: Assert button is visually present */
async function assertAuthButtonVisible(page, expectedText = null) {
  const btn = page.locator('[data-testid="auth-button"]');
  await expect(btn).toBeVisible();

  const styles = await getAuthButtonStyles(page);

  // Must have valid display
  expect(styles.display).not.toBe('none');
  expect(styles.visibility).not.toBe('hidden');
  expect(styles.opacity).toBeGreaterThan(0);

  // Must have dimensions (not collapsed)
  expect(styles.width).toBeGreaterThan(0);
  expect(styles.height).toBeGreaterThan(0);

  // Must have text content
  expect(styles.text.length).toBeGreaterThan(0);

  if (expectedText) {
    expect(styles.text).toBe(expectedText);
  }

  return styles;
}

test.describe('Auth Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored auth state
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem('tsv-auth');
      localStorage.removeItem('tsv-session');
    });
    await page.reload();
    // Wait for Alpine.js to initialize
    await page.waitForFunction(() => {
      const body = document.querySelector('body[x-data]');
      return body && body._x_dataStack && body._x_dataStack.length > 0;
    });
  });

  test('shows Sign In button on initial load', async ({ page }) => {
    const styles = await assertAuthButtonVisible(page, 'Sign In');
    // Verify readable contrast (white text #fff = rgb(255,255,255))
    expect(styles.color).toMatch(/rgb\(255,\s*255,\s*255\)|#fff|white/i);
  });

  test('Sign In button clickable and opens modal', async ({ page }) => {
    const btn = page.locator('[data-testid="auth-button"]');
    await expect(btn).toBeVisible();
    await btn.click();

    const modal = page.locator('[data-testid="auth-modal"]');
    await expect(modal).toBeVisible();
  });

  test('Sign In button visible after modal close', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="auth-button"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    // Close modal
    await page.locator('[data-testid="auth-modal-close"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();

    // Button should still be visible
    await assertAuthButtonVisible(page, 'Sign In');
  });

  test('Sign In button visible after auth state changes', async ({ page }) => {
    // Simulate authenticated state
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      if (body && body._x_dataStack) {
        body._x_dataStack[0].auth = {
          authenticated: true,
          user: { name: 'Test User', email: 'test@example.com' }
        };
      }
    });

    // Should show user name
    await assertAuthButtonVisible(page, 'Test User');

    // Now simulate logout
    await page.evaluate(() => {
      const body = document.querySelector('body[x-data]');
      if (body && body._x_dataStack) {
        body._x_dataStack[0].auth = { authenticated: false, user: null };
        body._x_dataStack[0].showUserMenu = false;
      }
    });

    // Should show Sign In again
    await assertAuthButtonVisible(page, 'Sign In');
  });
});

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
