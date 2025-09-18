const { test, expect } = require('@playwright/test');

const canonical = [
  'Dashboard','Bank Reconciliation','Subscription Analysis','Employee Benefits','Geographic Analysis','Analysis & Reports','AI Insights','Data Import','Manual Entry','Premium Features','Settings'
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
});
