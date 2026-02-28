// @ts-check
const { test, expect } = require('@playwright/test');

// Cloud Sync Integration Tests (ADR-023)
test.describe('Cloud Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tsv-guest-acknowledged', 'true'));
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

  test('guest mode does not call sync API', async ({ page }) => {
    const apiCalls = [];
    await page.route('**/api/expenses/**', route => {
      apiCalls.push(route.request().url());
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([{ id: 'test-1', description: 'Test', amount: 10, date: '2026-01-01', businessPercent: 100 }]));
    });
    await page.reload();
    await page.waitForTimeout(500);
    expect(apiCalls.length).toBe(0);
  });

  test('authenticated user syncs on page load', async ({ page }) => {
    let syncCalled = false, listCalled = false;
    await page.route('**/api/expenses/sync', route => { syncCalled = true; route.fulfill({ status: 200, body: JSON.stringify({ success: true }) }); });
    await page.route('**/api/expenses/list', route => { listCalled = true; route.fulfill({ status: 200, body: JSON.stringify({ expenses: [], importHistory: [] }) }); });
    await page.route('**/auth/session/get', route => { route.fulfill({ status: 200, body: JSON.stringify({ user: { id: 'user-1', email: 'test@example.com' } }) }); });
    await page.evaluate(() => {
      localStorage.setItem('tsv-session', 'mock-token');
      localStorage.setItem('tsv-expenses', JSON.stringify([{ id: 'test-1', description: 'Test', amount: 10, date: '2026-01-01', businessPercent: 100 }]));
    });
    await page.reload();
    await page.waitForTimeout(1500);
    expect(syncCalled).toBe(true);
    expect(listCalled).toBe(true);
  });

  test('sign-in triggers fullSync', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tsv-expenses', JSON.stringify([{ id: 'local-1', description: 'Local', amount: 50, date: '2026-01-01', businessPercent: 100 }])));
    await page.reload();
    let syncCalled = false, listCalled = false;
    await page.route('**/api/expenses/sync', route => { syncCalled = true; route.fulfill({ status: 200, body: JSON.stringify({ success: true }) }); });
    await page.route('**/api/expenses/list', route => { listCalled = true; route.fulfill({ status: 200, body: JSON.stringify({ expenses: [], importHistory: [] }) }); });
    await page.evaluate(async () => { localStorage.setItem('tsv-session', 'new-token'); await window.cloudSync.fullSync(); });
    await page.waitForTimeout(500);
    expect(syncCalled).toBe(true);
    expect(listCalled).toBe(true);
  });
});
