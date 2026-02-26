/**
 * Auth button test helpers - shared utilities for auth button tests
 * ADR-019: OAuth Integration
 */
const { expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

/** Get computed style of auth button */
async function getAuthButtonStyles(page) {
  return page.locator('[data-testid="auth-button"]').evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      display: s.display, visibility: s.visibility, opacity: parseFloat(s.opacity),
      color: s.color, width: el.offsetWidth, height: el.offsetHeight, text: el.textContent.trim()
    };
  });
}

/** Assert button is visually present */
async function assertAuthButtonVisible(page, expectedText = null) {
  const btn = page.locator('[data-testid="auth-button"]');
  await expect(btn).toBeVisible();
  const styles = await getAuthButtonStyles(page);
  expect(styles.display).not.toBe('none');
  expect(styles.visibility).not.toBe('hidden');
  expect(styles.opacity).toBeGreaterThan(0);
  expect(styles.width).toBeGreaterThan(20);
  expect(styles.height).toBeGreaterThan(10);
  expect(styles.text.length).toBeGreaterThan(0);
  if (expectedText) expect(styles.text).toBe(expectedText);
  return styles;
}

/** Wait for Alpine.js to initialize */
async function waitForAlpine(page) {
  await page.waitForFunction(() => {
    const body = document.querySelector('body[x-data]');
    return body && body._x_dataStack && body._x_dataStack.length > 0;
  });
}

/** Clear auth state from localStorage */
async function clearAuthState(page) {
  await page.evaluate(() => {
    localStorage.removeItem('tsv-auth');
    localStorage.removeItem('tsv-session');
  });
}

module.exports = { BASE_URL, getAuthButtonStyles, assertAuthButtonVisible, waitForAlpine, clearAuthState };
