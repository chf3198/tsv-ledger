const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine } = require('./helpers/auth-helpers');

test.describe('Session Timeout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAlpine(page);
  });

  test('times out stale authenticated cloud session', async ({ page }) => {
    await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      app.storageIntent = 'cloud';
      app.onboardingComplete = true;
      app.auth = { authenticated: true, user: { name: 'Timed User' } };
      app.sessionState = 'authenticated';
      localStorage.setItem('tsv-session', 'mock-token');
      localStorage.setItem('tsv-auth', JSON.stringify(app.auth));
      localStorage.setItem('tsv-session-last-active', String(Date.now() - 31 * 60 * 1000));
      app.enforceSessionTimeout();
    });

    const state = await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      return {
        sessionState: app.sessionState,
        authenticated: app.auth.authenticated,
        storageIntent: app.storageIntent,
        sessionToken: localStorage.getItem('tsv-session')
      };
    });

    expect(state.sessionState).toBe('unauthenticated');
    expect(state.authenticated).toBe(false);
    expect(state.storageIntent).toBe('cloud');
    expect(state.sessionToken).toBeNull();
  });

  test('keeps active authenticated cloud session', async ({ page }) => {
    const state = await page.evaluate(() => {
      const app = document.querySelector('body[x-data]')._x_dataStack[0];
      app.storageIntent = 'cloud';
      app.auth = { authenticated: true, user: { name: 'Active User' } };
      app.sessionState = 'authenticated';
      localStorage.setItem('tsv-session', 'mock-token');
      localStorage.setItem('tsv-session-last-active', String(Date.now()));
      app.enforceSessionTimeout();
      return {
        sessionState: app.sessionState,
        authenticated: app.auth.authenticated,
        sessionToken: localStorage.getItem('tsv-session')
      };
    });

    expect(state.sessionState).toBe('authenticated');
    expect(state.authenticated).toBe(true);
    expect(state.sessionToken).toBe('mock-token');
  });
});
