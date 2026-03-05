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

/** Clears auth + storage state, waits for Alpine, reloads */
async function setupFreshAuth(page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForAlpine(page);
}

/**
 * Analyzes page screenshot with Claude Vision API
 * Effect: Calls Anthropic API (requires ANTHROPIC_API_KEY env var)
 * @param {Page} page - Playwright page object
 * @param {string} prompt - What to analyze in the screenshot
 * @returns {Promise<string>} Claude's analysis or 'API_UNAVAILABLE' if key missing
 */
async function analyzeScreenshotWithClaude(page, prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set - skipping Claude Vision analysis');
    return 'API_UNAVAILABLE';
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });
    const screenshot = await page.screenshot({ encoding: 'base64' });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: screenshot,
          },
        }, {
          type: 'text',
          text: prompt,
        }],
      }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'No analysis';
  } catch (error) {
    console.error('Claude Vision API error:', error.message);
    return 'API_ERROR';
  }
}

module.exports = { BASE_URL, getAuthButtonStyles, assertAuthButtonVisible, waitForAlpine, clearAuthState, setupFreshAuth, analyzeScreenshotWithClaude };
