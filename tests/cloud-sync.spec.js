// @ts-check
const { test, expect } = require('@playwright/test');

// Cloud Sync Integration Tests (ADR-023, ADR-024)
test.describe('Cloud Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('cloudSync module is available with required methods', async ({ page }) => {
    const methods = await page.evaluate(() => ({
      hasModule: typeof window.cloudSync === 'object',
      syncToCloud: typeof window.cloudSync?.syncToCloud === 'function',
      fetchFromCloud: typeof window.cloudSync?.fetchFromCloud === 'function',
      fullSync: typeof window.cloudSync?.fullSync === 'function',
      isAuthenticated: typeof window.cloudSync?.isAuthenticated === 'function'
    }));
    expect(methods.hasModule).toBe(true);
    expect(methods.syncToCloud).toBe(true);
    expect(methods.fetchFromCloud).toBe(true);
    expect(methods.fullSync).toBe(true);
    expect(methods.isAuthenticated).toBe(true);
  });

  test('local mode does not call cloud API', async ({ page }) => {
    const apiCalls = [];
    await page.route('**/api/expenses/**', route => {
      apiCalls.push(route.request().url());
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([{ id: 'test-1', description: 'Test', amount: 10 }]));
    });
    await page.reload();
    await page.waitForTimeout(500);
    expect(apiCalls.length).toBe(0);
  });

  test('cloud mode user fetches from cloud on load', async ({ page }) => {
    let listCalled = false;
    await page.route('**/api/expenses/list', route => {
      listCalled = true;
      route.fulfill({ status: 200, body: JSON.stringify({ expenses: [{ id: 'cloud-1', description: 'Cloud' }], importHistory: [] }) });
    });
    await page.route('**/auth/session/get', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 'u1', email: 'test@test.com' } }) });
    });
    await page.evaluate(() => {
      localStorage.setItem('tsv-session', 'mock-token');
      localStorage.setItem('tsv-storage-mode', 'cloud');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    await page.waitForTimeout(1000);
    expect(listCalled).toBe(true);
  });

  test('auth sets cloud mode automatically', async ({ page }) => {
    await page.route('**/auth/session/get', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 'u1', email: 'test@test.com' } }) });
    });
    await page.route('**/api/expenses/list', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ expenses: [], importHistory: [] }) });
    });
    await page.evaluate(() => localStorage.setItem('tsv-session', 'new-token'));
    await page.reload();
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => localStorage.getItem('tsv-storage-mode'));
    expect(mode).toBe('cloud');
  });
});
