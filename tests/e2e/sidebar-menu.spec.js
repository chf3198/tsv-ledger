const { test, expect } = require('@playwright/test');

const canonical = [
  'Dashboard',
  'Bank Reconciliation',
  'Subscription Analysis',
  'Employee Benefits',
  'Geographic Analysis',
  'Analysis & Reports',
  'AI Insights',
  'Data Import',
  'Manual Entry',
  'Premium Features',
  'Settings'
];

test.describe('Sidebar canonical menu', () => {
  ['/', '/reconciliation.html', '/employee-benefits.html', '/geographic-analysis.html'].forEach(path => {
    test(`has canonical menu on ${path}`, async ({ page }) => {
      await page.goto(`http://localhost:3000${path}`);

      // Wait for sidebar to exist
      await page.waitForSelector('#sidebar, .sidebar');
      const items = await page.$$eval('.sidebar-nav .nav-link', els => els.map(e => e.textContent.trim()));

      // Expect at least the canonical entries to appear (some pages may include extra whitespace)
      for (const name of canonical) {
        expect(items.some(i => i.includes(name))).toBeTruthy();
      }

      // Also assert count >= 11
      expect(items.length).toBeGreaterThanOrEqual(canonical.length);
    });
  });
});
