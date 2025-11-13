const { test, expect } = require('@playwright/test');

const canonical = [
  'Dashboard','Bank Reconciliation','Subscription Analysis','Benefits Management','Geographic Analysis','Analysis & Reports','AI Insights','Data Import','Manual Entry','Premium Features','Settings'
];

test.describe('merged sidebar menu', () => {
  test('JS-enabled: canonical items + page tools are in same sidebar', async ({ page }) => {
    await page.goto('http://localhost:3000/geographic-analysis.html');

    // wait for sidebar
    await page.waitForSelector('#sidebar');

    const sidebarText = await page.locator('#sidebar').innerText();

    for (const item of canonical) {
      expect(sidebarText).toContain(item);
    }

    // Page-specific heading (Analysis Views) and one of its links
    expect(sidebarText).toContain('Analysis Views');
    expect(sidebarText).toContain('Overview');
  });

  test('Non-JS: server rendered sidebar includes page tools', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/geographic-analysis.html');

    // The server should have injected the sidebar with the page tools merged
    const sidebar = await page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    const text = await sidebar.innerText();
    for (const item of canonical) {
      expect(text).toContain(item);
    }
    expect(text).toContain('Analysis Views');
    expect(text).toContain('Overview');

    await context.close();
  });

  test('JS-enabled: Dashboard page shows Dashboard as active', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await page.waitForSelector('#sidebar');

    // Check that Dashboard link has active class
    const dashboardLink = await page.locator('#sidebar .nav-link[href="/"]');
    await expect(dashboardLink).toHaveClass(/active/);

    // Check that other main navigation items don't have active class
    const reconciliationLink = await page.locator('#sidebar .nav-link[href="/reconciliation.html"]');
    await expect(reconciliationLink).not.toHaveClass(/active/);
  });

  test('JS-enabled: Bank Reconciliation page shows Bank Reconciliation as active', async ({ page }) => {
    await page.goto('http://localhost:3000/reconciliation.html');

    await page.waitForSelector('#sidebar');

    // Check that Bank Reconciliation link has active class
    const reconciliationLink = await page.locator('#sidebar .nav-link[href="/reconciliation.html"]');
    await expect(reconciliationLink).toHaveClass(/active/);

    // Check that Dashboard doesn't have active class
    const dashboardLink = await page.locator('#sidebar .nav-link[href="/"]');
    await expect(dashboardLink).not.toHaveClass(/active/);
  });

  test('Non-JS: Dashboard page shows Dashboard as active', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/');

    // Check that Dashboard link has active class in server-rendered HTML
    const dashboardLink = await page.locator('#sidebar .nav-link[href="/"]');
    await expect(dashboardLink).toHaveClass(/active/);

    await context.close();
  });

  test('Non-JS: Bank Reconciliation page shows Bank Reconciliation as active', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/reconciliation.html');

    // Check that Bank Reconciliation link has active class in server-rendered HTML
    const reconciliationLink = await page.locator('#sidebar .nav-link[href="/reconciliation.html"]');
    await expect(reconciliationLink).toHaveClass(/active/);

    await context.close();
  });
});
