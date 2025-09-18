const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser for search test...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Ensure manager available and open modal
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) { return false; }
    }, { timeout: 20000 });

    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') mgr.showSelectionModal();
    });

    await page.waitForSelector('#businessSuppliesList .col-md-6', { timeout: 10000 });

    // Grab a visible card title and search for a distinctive substring
    const sample = await page.$eval('#businessSuppliesList .col-md-6 .card-title', el => el && el.textContent ? el.textContent.trim() : '');
    if (!sample) throw new Error('No sample card title found for search test');
    const token = sample.split(' ').slice(0,2).join(' ').slice(0,6);

    // Apply search and ensure filtered set is <= original
    const before = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
    await page.focus('#searchBusiness');
    await page.click('#searchBusiness');
    await page.type('#searchBusiness', token, { delay: 40 });
    await page.waitForTimeout(400);

    const after = await page.$$eval('#businessSuppliesList .col-md-6', els => els.filter(e => {
      const style = window.getComputedStyle(e);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
    }).length);

    console.log('Search token:', token, 'counts', { before, after });
    if (after > before) throw new Error('Search increased visible items unexpectedly');

    // Clear search and ensure count returns to >= after
    await page.click('#searchBusiness', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    console.log('\u2705 Search test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\u274c Search test failed:', err);
    console.error('---- Browser logs ----'); logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
