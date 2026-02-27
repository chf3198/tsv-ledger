const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Clear storage first
  await page.goto('https://fix-sign-in-button.tsv-ledger.pages.dev/');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(2000);

  // Check auth state
  const authState = await page.evaluate(() => {
    const app = document.querySelector('[x-data]').__x.$data;
    return { auth: app.auth, hasSession: !!localStorage.getItem('tsv-session') };
  });
  console.log('Auth state after fresh load:', JSON.stringify(authState, null, 2));

  // Check button visibility
  const btn = await page.locator('[data-testid="login-button"]');
  console.log('Button visible:', await btn.isVisible());
  console.log('Button display style:', await btn.evaluate(el => getComputedStyle(el).display));

  await browser.close();
})();
