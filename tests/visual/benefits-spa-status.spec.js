const { test, expect } = require('@playwright/test');

test.describe('Benefits SPA status', () => {
  test('navigating via SPA hash updates Current Status from Loading', async ({ page, baseURL }) => {
    await page.goto(baseURL || '/', { waitUntil: 'networkidle' });

    // Capture console messages from the page to help debug initialization race conditions
    page.on('console', msg => {
      const args = msg.args().map(a => a.toString()).join(' ');
      console.log(`[page] ${msg.type()}: ${args}`);
    });

    // Ensure sidebar is visible so SPA nav is available (testing helper)
    await page.evaluate(() => {
      try { if (window.__ensureSidebarState) window.__ensureSidebarState(false); } catch (e) {}
    });

    // Navigate via the app navigation: find a nav link containing 'Benefits' and click it
    const navInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.nav-link'));
      const texts = links.map(a => (a.textContent || '').trim());
      const matchIndex = links.findIndex(a => (a.textContent || '').toLowerCase().includes('benefit'));
      if (matchIndex >= 0) {
        links[matchIndex].click();
      }
      return { count: links.length, texts, matchIndex };
    });

    console.log('[test] navigation links:', navInfo.count, navInfo.texts.slice(0,10));

    if (navInfo.matchIndex < 0) {
      // Fallback: set a generic hash that older pages used
      await page.evaluate(() => { window.location.hash = 'benefits'; });
    }

    // Wait for the selectionStatus element to exist and become something other than Loading...
    await page.waitForFunction(() => {
      const el = document.getElementById('selectionStatus');
      if (!el) return false;
      const txt = (el.textContent || '').trim();
      return txt.length > 0 && !/loading/i.test(txt);
    }, { timeout: 20000 });

    const statusText = await page.evaluate(() => document.getElementById('selectionStatus')?.textContent || '');
    expect(statusText.toLowerCase()).not.toContain('loading');
  });
});
