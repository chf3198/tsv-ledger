const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser for allocations test...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Ensure manager is ready (supports lexical global or window property) and invoke modal safely
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });

    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });

    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    const initial = await page.evaluate(() => {
      const b = document.getElementById('businessItemsCount')?.textContent || '0';
      const be = document.getElementById('benefitsItemsCount')?.textContent || '0';
      return { businessCount: parseInt(b, 10) || 0, benefitsCount: parseInt(be, 10) || 0 };
    });

    console.log('Initial counts', initial);
    if (initial.businessCount === 0) {
      throw new Error('No business items present for allocation test');
    }

    // Pick the first business card's item id and set allocation to 50%
    const firstItemId = await page.$eval('#businessSuppliesList .col-md-6', el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId || '');
    if (!firstItemId) {
      throw new Error('Could not determine first business item id');
    }

    console.log('Setting allocation 50% for', firstItemId, 'by writing canonical allocation and refreshing display');
    await page.evaluate((id) => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (!mgr) {
          return;
        }
        // Set canonical allocation shape expected by updateModalDisplay
        mgr.itemProgressiveAllocations.set(id, { benefits: 50, business: 50, total: 100 });
        // ensure selected items state is consistent
        mgr.selectedItems.add(id);
        // Refresh UI
        if (typeof mgr.updateModalDisplay === 'function') {
          mgr.updateModalDisplay();
        }
      } catch (e) {
        console.error('Error setting allocation in page context', e);
      }
    }, firstItemId);

    // Wait until benefits count increases (allow a bit more time)
    await page.waitForFunction(() => {
      const be = document.getElementById('benefitsItemsCount')?.textContent || '0';
      return (parseInt(be, 10) || 0) > 0;
    }, { timeout: 8000 });

    const after = await page.evaluate(() => ({
      businessCount: parseInt(document.getElementById('businessItemsCount')?.textContent || '0', 10) || 0,
      benefitsCount: parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0
    }));

    console.log('Counts after allocation', after);

    if (after.benefitsCount <= initial.benefitsCount) {
      throw new Error('Benefits count did not increase after allocation');
    }

    console.log('\u2705 Allocations behavior test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\u274c Allocations test failed:', err);
    console.error('---- Browser logs ----');
    logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
