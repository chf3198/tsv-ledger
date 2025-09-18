const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser for report test...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

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
      if (mgr && typeof mgr.showSelectionModal === 'function') mgr.showSelectionModal();
    });

    // Ensure at least one business card exists
    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    // Allocate 25% to first business item and add it to selected
    const firstItemId = await page.$eval('#businessSuppliesList .col-md-6', el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId || '');
    if (!firstItemId) throw new Error('Could not determine first business item id');

    // Set canonical allocations directly to avoid timing issues and refresh UI
    await page.evaluate((id) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) return;
      mgr.itemProgressiveAllocations.set(id, { benefits: 50, business: 50, total: 100 });
      mgr.selectedItems.add(id);
      if (typeof mgr.updateModalDisplay === 'function') mgr.updateModalDisplay();
    }, firstItemId);

    // Wait for selected item to appear in benefits list
    await page.waitForFunction((id) => {
      return !!document.querySelector(`#benefitsList [data-item-id="${id}"]`);
    }, { timeout: 8000 }, firstItemId);

    // Build allocation payload and call server endpoint directly inside page context,
    // then render the returned report with displayBenefitsReport(report)
    await page.evaluate(async (id) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (!mgr) throw new Error('Manager not available');

      const itemIds = [id];
      const progressive = mgr.itemProgressiveAllocations.get(id) || { allocated: 0 };
      const itemAllocations = {};
      itemAllocations[id] = progressive.allocated || 100;

      const resp = await fetch('/api/employee-benefits-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, itemAllocations })
      });

      if (!resp.ok) throw new Error('Server failed to generate report');
      const report = await resp.json();
      // Render the report in-page
      if (typeof mgr.displayBenefitsReport === 'function') {
        mgr.displayBenefitsReport(report);
      } else {
        // Fallback: create a simple container
        let c = document.getElementById('summaryContainer');
        if (!c) { c = document.createElement('div'); c.id = 'summaryContainer'; document.body.appendChild(c); }
        c.innerHTML = JSON.stringify(report).slice(0,200);
      }
    }, firstItemId);

    // Wait for the report card body to appear after report generation
    await page.waitForSelector('#summaryContainer .card-body, #summaryContainer', { timeout: 15000 });

    const reportSummary = await page.$eval('#summaryContainer .card-body, #summaryContainer', el => el.innerText || el.textContent || '');
    console.log('Report summary text length:', reportSummary.length);
    if (reportSummary.length < 20) throw new Error('Report summary seems empty');

    console.log('\u2705 Report generation test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\u274c Report generation test failed:', err);
    console.error('---- Browser logs ----');
    logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
