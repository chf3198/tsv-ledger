const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser for multiselect allocations test...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });
    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    // Select first three business items and set varying allocations
    const ids = await page.$$eval('#businessSuppliesList .col-md-6', els => els.slice(0,3).map(e => e.dataset.itemId || e.querySelector('[data-item-id]')?.dataset.itemId).filter(Boolean));
    if (!ids || ids.length === 0) {
      throw new Error('No business items found for multiselect test');
    }

    await page.evaluate((ids) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) {
        return;
      }
      ids.forEach((id, idx) => {
        const benefits = 20 * (idx + 1); // 20,40,60
        mgr.itemProgressiveAllocations.set(id, { benefits, business: 100 - benefits, total: 100 });
        mgr.selectedItems.add(id);
      });
      if (typeof mgr.updateModalDisplay === 'function') {
        mgr.updateModalDisplay();
      }
    }, ids);

    // Wait for benefits count to reflect the selections
    await page.waitForFunction((count) => {
      const be = parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0;
      return be >= count;
    }, { timeout: 8000 }, ids.length);

    const counts = await page.evaluate(() => ({ business: parseInt(document.getElementById('businessItemsCount')?.textContent || '0', 10) || 0, benefits: parseInt(document.getElementById('benefitsItemsCount')?.textContent || '0', 10) || 0 }));

    console.log('Counts after multiselect allocations', counts);
    if (counts.benefits < ids.length) {
      throw new Error('Benefits count does not reflect multiselect selections');
    }

    console.log('\u2705 Multiselect allocations test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\u274c Multiselect allocations test failed:', err);
    console.error('---- Browser logs ----'); logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
