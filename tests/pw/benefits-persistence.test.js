const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser for persistence test...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => {
      try { const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); return !!(mgr && typeof mgr.showSelectionModal === 'function'); } catch (e) { return false; }
    }, { timeout: 20000 });

    // Open modal and wait for business list to populate
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') mgr.showSelectionModal();
    });
    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    // Set selection state for persistence and use manager save helpers
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) return;
      // pick the first business item id
      const el = document.querySelector('#businessSuppliesList .col-md-6');
      const id = el ? (el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId) : null;
      if (!id) return;
      // Use progressive allocation system so reconcile will pick it up after reload
      mgr.itemProgressiveAllocations.set(id, { allocated: 30, remaining: 70 });
      mgr.selectedItems.add(id);
      if (typeof mgr.updateModalDisplay === 'function') mgr.updateModalDisplay();
      // Persist using manager helpers
      if (typeof mgr.saveProgressiveAllocations === 'function') mgr.saveProgressiveAllocations();
      if (typeof mgr.saveSelection === 'function') mgr.saveSelection();
    });

    // Reload page and verify selection persisted
    await page.reload({ waitUntil: 'networkidle2' });
    // Give manager time to initialize after reload
    await page.waitForFunction(() => {
      try { const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null); return !!mgr && typeof mgr.loadSavedSelection === 'function'; } catch (e) { return false; }
    }, { timeout: 20000 });

    // Check both localStorage key and manager.selectedItems
    const persisted = await page.evaluate(() => {
      const ls = (() => { try { return JSON.parse(localStorage.getItem('employeeBenefitsSelection') || '[]'); } catch (e) { return []; } })();
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      const mgrCount = mgr ? (mgr.selectedItems ? mgr.selectedItems.size : 0) : 0;
      return { lsCount: ls.length, mgrCount };
    });

    console.log('Persisted selection:', persisted);
    if (!persisted || (persisted.lsCount === 0 && persisted.mgrCount === 0)) throw new Error('Selection did not persist across reload');

    console.log('\u2705 Persistence test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\u274c Persistence test failed:', err);
    console.error('---- Browser logs ----'); logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
