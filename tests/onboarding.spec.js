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

  test('clicking Get Started shows storage choice', async ({ page }) => {
    await page.locator('[data-testid="get-started-btn"]').click();

    // Should see storage choice step
    const storageStep = page.locator('[data-testid="storage-choice-step"]');
    await expect(storageStep).toBeVisible();

    // Both options should be visible
    await expect(page.locator('[data-testid="choose-cloud"]')).toBeVisible();
    await expect(page.locator('[data-testid="choose-local"]')).toBeVisible();
  });

  test('choosing Local proceeds to import step', async ({ page }) => {
    await page.locator('[data-testid="get-started-btn"]').click();
    await page.locator('[data-testid="choose-local"]').click();

    // Should see import step
    const importStep = page.locator('[data-testid="import-step"]');
    await expect(importStep).toBeVisible();

    // Should have file drop area (within wizard)
    await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible();
  });

  test('successful import reveals navigation', async ({ page }) => {
    // Complete wizard flow
    await page.locator('[data-testid="get-started-btn"]').click();
    await page.locator('[data-testid="choose-local"]').click();

    // Import a file (use the wizard's file input)
    const fileInput = page.locator('[data-testid="import-step"] input[type="file"]');
    await fileInput.setInputFiles('test-data/amazon-sample.csv');

    // Wait for import complete and button to appear
    await expect(page.locator('[data-testid="view-dashboard-btn"]')).toBeVisible({ timeout: 15000 });

    // Click to view dashboard
    await page.locator('[data-testid="view-dashboard-btn"]').click();

    // Nav should now be visible
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toBeVisible();

    // Welcome wizard should be gone
    const welcomeScreen = page.locator('[data-testid="welcome-wizard"]');
    await expect(welcomeScreen).toBeHidden();
  });

  test('returning user with data sees nav immediately', async ({ page }) => {
    // Simulate returning user with existing data
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Test', amount: 10, date: '2024-01-01' }
      ]));
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();

    // Should see nav immediately
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toBeVisible();

    // Should NOT see welcome wizard
    const welcomeScreen = page.locator('[data-testid="welcome-wizard"]');
    await expect(welcomeScreen).toBeHidden();
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

    await page.locator('[data-testid="get-started-btn"]').click();

    // Step 2 (Storage choice)
    await expect(page.locator('[data-step="2"][data-active="true"]')).toBeVisible();

    await page.locator('[data-testid="choose-local"]').click();

    // Step 3 (Import)
    await expect(page.locator('[data-step="3"][data-active="true"]')).toBeVisible();
  });
});
