/**
 * TSV Expenses - User Registration Tests
 * Tests for registration form and flows
 * ADR-009: Auth.js Multi-Provider Authentication
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('can switch from login to register mode', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="auth-modal"] h3')).toContainText('Sign In');
    
    await page.click('[data-testid="auth-register-link"]');
    await expect(page.locator('[data-testid="auth-modal"] h3')).toContainText('Create Account');
  });

  test('register form shows name and email fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="auth-register-link"]');
    
    await expect(page.locator('[data-testid="auth-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-email-reg"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-register-passkey"]')).toBeVisible();
  });

  test('passkey button requires email in login mode', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    const passkeyBtn = page.locator('[data-testid="auth-passkey"]');
    
    // Button should be disabled without email
    await expect(passkeyBtn).toBeDisabled();
    
    // Enter email
    await page.fill('[data-testid="auth-email"]', 'test@example.com');
    await expect(passkeyBtn).not.toBeDisabled();
  });

  test('can switch back from register to login mode', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="auth-register-link"]');
    await expect(page.locator('[data-testid="auth-modal"] h3')).toContainText('Create Account');
    
    await page.click('[data-testid="auth-login-link"]');
    await expect(page.locator('[data-testid="auth-modal"] h3')).toContainText('Sign In');
  });
});
