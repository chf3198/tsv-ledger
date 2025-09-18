const { test, expect } = require('@playwright/test');

const pages = [
  '/',
  '/reconciliation.html',
  '/employee-benefits.html',
  '/geographic-analysis.html',
  '/index-basic.html',
  '/index-enhanced.html'
];

test.describe('Sidebar server-rendered (no JS)', () => {
  for (const p of pages) {
    test(`has server-rendered menu on ${p}`, async ({ browserName, browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(`http://localhost:3000${p}`);

      // Expect a nav#sidebar or ul.sidebar-nav to be present in the HTML
      const nav = await page.$('nav#sidebar');
      const ul = await page.$('.sidebar-nav');
      expect(nav || ul).toBeTruthy();

      // Count nav links
      const links = await page.$$eval('.sidebar-nav .nav-link', els => els.length);
      expect(links).toBeGreaterThanOrEqual(11);

      await context.close();
    });
  }
});
