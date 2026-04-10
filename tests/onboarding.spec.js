/**
 * TSV Expenses - Onboarding Wizard Tests
 * Tests for first-time user experience (ADR-025)
 * Verifies: Welcome screen, storage choice, import flow, nav visibility
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

// Helper to clear all localStorage for fresh start
const clearStorage = async (page) => {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
};

test.describe('First-Time User Experience (ADR-025)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
  });

  test('shows welcome wizard for first-time user', async ({ page }) => {
    // First-time user should see welcome screen, not dashboard
    const welcomeScreen = page.locator('[data-testid="welcome-wizard"]');
    await expect(welcomeScreen).toBeVisible();

    // Should NOT see regular nav items yet
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toBeHidden();
  });

  test('welcome screen has Get Started button', async ({ page }) => {
    const getStartedBtn = page.locator('[data-testid="get-started-btn"]');
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toContainText(/get started|start/i);
  });

  test('requires terms acceptance before enabling Get Started', async ({ page }) => {
    const getStartedBtn = page.locator('[data-testid="get-started-btn"]');
    const termsCheckbox = page.locator('[data-testid="accept-terms-checkbox"]');

    await expect(termsCheckbox).toBeVisible();
    await expect(getStartedBtn).toBeDisabled();

    await termsCheckbox.check();
    await expect(getStartedBtn).toBeEnabled();
  });

  test('clicking Get Started shows storage choice', async ({ page }) => {
    await page.locator('[data-testid="accept-terms-checkbox"]').check();
    await page.locator('[data-testid="get-started-btn"]').click();

    // Should see storage choice step
    const storageStep = page.locator('[data-testid="storage-choice-step"]');
    await expect(storageStep).toBeVisible();

    // Both options should be visible
    await expect(page.locator('[data-testid="choose-cloud"]')).toBeVisible();
    await expect(page.locator('[data-testid="choose-local"]')).toBeVisible();
  });

});

test.describe('Onboarding Progress Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
  });

  test('shows step indicator during wizard', async ({ page }) => {
    const stepIndicator = page.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();
  });

  test('step indicator updates as user progresses', async ({ page }) => {
    // Step 1 (Welcome)
    await expect(page.locator('[data-step="1"][data-active="true"]')).toBeVisible();

    await page.locator('[data-testid="accept-terms-checkbox"]').check();
    await page.locator('[data-testid="get-started-btn"]').click();

    // Step 2 (Storage choice)
    await expect(page.locator('[data-step="2"][data-active="true"]')).toBeVisible();

    await page.locator('[data-testid="choose-local"]').click();

    // Step 3 (Import)
    await expect(page.locator('[data-step="3"][data-active="true"]')).toBeVisible();
  });
});
