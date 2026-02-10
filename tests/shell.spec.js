/**
 * TSV Expenses - App Shell Tests
 * Tests for header, navigation, footer, and responsive layout
 * ADR-010: App Shell Architecture
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('App Shell Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('has semantic header with banner role', async ({ page }) => {
    const header = page.locator('header[role="banner"], header');
    await expect(header).toBeVisible();
    await expect(header.locator('h1, [data-testid="logo"]')).toBeVisible();
  });

  test('has navigation with menu items', async ({ page }) => {
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('[data-nav="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-nav="expenses"]')).toBeVisible();
    await expect(page.locator('[data-nav="import"]')).toBeVisible();
    await expect(page.locator('[data-nav="settings"]')).toBeVisible();
  });

  test('has main content area', async ({ page }) => {
    const main = page.locator('main[role="main"], main');
    await expect(main).toBeVisible();
  });

  test('has footer with version info', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"], footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/TSV|v\d/i);
  });
});

test.describe('App Shell Responsive', () => {
  test('mobile: shows hamburger menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    const hamburger = page.locator('[data-testid="menu-toggle"]');
    await expect(hamburger).toBeVisible();
  });

  test('mobile: nav hidden by default, shown on toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    const nav = page.locator('[data-testid="main-nav"]');
    const hamburger = page.locator('[data-testid="menu-toggle"]');
    
    // Nav should be hidden on mobile initially
    await expect(nav).not.toBeVisible();
    
    // Click hamburger to show nav
    await hamburger.click();
    await expect(nav).toBeVisible();
  });

  test('desktop: nav visible without toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toBeVisible();
  });
});
