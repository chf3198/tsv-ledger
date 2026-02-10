/**
 * TSV Expenses - Authentication Tests
 * Tests for user registration/login UI and flows
 * ADR-009: Auth.js Multi-Provider Authentication
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Authentication UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('shows login button when not authenticated', async ({ page }) => {
    await page.goto(BASE_URL);
    const loginBtn = page.locator('[data-testid="login-button"]');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toContainText(/sign in|log in/i);
  });

  test('login button opens auth modal with provider options', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-testid="login-button"]');
    
    const authModal = page.locator('[data-testid="auth-modal"]');
    await expect(authModal).toBeVisible();
    
    // Verify OAuth provider buttons exist
    await expect(page.locator('[data-testid="auth-google"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-github"]')).toBeVisible();
    
    // Verify passkey option exists
    await expect(page.locator('[data-testid="auth-passkey"]')).toBeVisible();
  });

  test('auth modal can be closed', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-testid="login-button"]');
    
    const authModal = page.locator('[data-testid="auth-modal"]');
    await expect(authModal).toBeVisible();
    
    await page.click('[data-testid="auth-modal-close"]');
    await expect(authModal).not.toBeVisible();
  });

  test('shows user menu when authenticated', async ({ page }) => {
    await page.goto(BASE_URL);
    // Simulate authenticated state via localStorage
    await page.evaluate(() => {
      localStorage.setItem('tsv-auth', JSON.stringify({
        user: { name: 'Test User', email: 'test@example.com' },
        authenticated: true
      }));
    });
    await page.reload();
    
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    await expect(userMenu).toContainText('Test User');
  });

  test('user menu has logout option', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('tsv-auth', JSON.stringify({
        user: { name: 'Test User', email: 'test@example.com' },
        authenticated: true
      }));
    });
    await page.reload();
    
    await page.click('[data-testid="user-menu"]');
    const logoutBtn = page.locator('[data-testid="logout-button"]');
    await expect(logoutBtn).toBeVisible();
  });
});
