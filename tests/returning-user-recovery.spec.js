/**
 * Returning User Recovery Tests
 * When a user returns with cloud intent but no session,
 * they must see BOTH a Sign In CTA and a local recovery path.
 * Prevents UX dead-end (no "Get Started" for returning visitors).
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Returning User Recovery (cloud-locked state)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tsv-storage-mode', 'cloud');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
  });

  test('shows Start Fresh button alongside Sign In', async ({ page }) => {
    const banner = page.locator('[data-testid="cloud-auth-required-banner"]');
    await expect(banner).toBeVisible();
    const startFresh = banner.locator('[data-testid="start-fresh-local"]');
    await expect(startFresh).toBeVisible();
    await expect(startFresh).toContainText(/start fresh|start locally/i);
  });

  test('clicking Start Fresh resets to onboarding step 1', async ({ page }) => {
    const banner = page.locator('[data-testid="cloud-auth-required-banner"]');
    await banner.locator('[data-testid="start-fresh-local"]').click();
    // Should see welcome wizard at step 1
    const wizard = page.locator('[data-testid="welcome-wizard"]');
    await expect(wizard).toBeVisible();
    await expect(page.locator('[data-testid="get-started-btn"]')).toBeVisible();
  });

  test('Start Fresh clears cloud intent from localStorage', async ({ page }) => {
    const banner = page.locator('[data-testid="cloud-auth-required-banner"]');
    await banner.locator('[data-testid="start-fresh-local"]').click();
    const intent = await page.evaluate(() =>
      localStorage.getItem('tsv-storage-mode')
    );
    expect(intent).toBeNull();
  });
});
