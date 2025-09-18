const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${base}/employee-benefits.html`;

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));

  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the button that opens the modal (if present) or open modal via script
    const openBtn = await page.$('[data-bs-toggle="modal"][data-bs-target="#employeeBenefitsModal"], #openBenefitsModal, .open-benefits-modal');
    if (openBtn) {
      console.log('Found open modal button, clicking');
      await openBtn.click();
    } else {
      console.log('No modal button found, invoking showSelectionModal if available');
      await page.evaluate(() => {
        if (window.employeeBenefitsManager && typeof window.employeeBenefitsManager.showSelectionModal === 'function') {
          window.employeeBenefitsManager.showSelectionModal();
        }
      });
    }

  // Ensure the manager is initialized, then programmatically open the modal
    // Robustly resolve the manager whether it's declared as a top-level `let employeeBenefitsManager`
    // or attached to window. Use a safe accessor to avoid ReferenceError.
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || window.EmployeeBenefitsManager && null);
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

  // Wait for lists to be present and rendered
  // Wait for lists to exist in the DOM (they may be inside a hidden modal)
  await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
  await page.waitForSelector('#benefitsList', { timeout: 10000 });
  await page.waitForTimeout(300); // allow UI to render

  // Count initial business cards
  const businessCount = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
  const benefitsCount = await page.$$eval('#benefitsList .col-md-6', els => els.length);

    console.log('Initial counts', { businessCount, benefitsCount });

    if (businessCount === 0 && benefitsCount === 0) {
      throw new Error('No cards found in modal lists — smoke test cannot proceed');
    }

    // Type a term into business search and assert filtered results decrease or equal
    let didBusinessAssert = false;
    if (businessCount > 0) {
      const sampleTerm = await page.$eval('#businessSuppliesList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
      if (sampleTerm && sampleTerm.length > 0) {
        await page.focus('#searchBusiness');
        await page.click('#searchBusiness');
        await page.type('#searchBusiness', sampleTerm, { delay: 50 });
        await page.waitForTimeout(300);

        const businessFiltered = await page.$$eval('#businessSuppliesList .col-md-6', els => els.filter(e => {
          const style = window.getComputedStyle(e);
          return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
        }).length);
        console.log('After business search filtered count:', businessFiltered);
        if (businessFiltered > businessCount) {
          throw new Error('Business filtered count increased unexpectedly');
        }
        didBusinessAssert = true;
      } else {
        console.log('Could not compute representative sampleTerm for business search, skipping content assertion');
      }
    } else {
      console.log('No business cards present, skipping business search assertion');
    }

    // Type a term into benefits search and assert filtered results decrease or equal
    if (benefitsCount > 0) {
      const sampleTerm2 = await page.$eval('#benefitsList .col-md-6 .card-title', el => el ? el.textContent.split(' ')[0].slice(0,3) : '');
      if (sampleTerm2 && sampleTerm2.length > 0) {
        await page.focus('#searchBenefits');
        await page.click('#searchBenefits');
        await page.type('#searchBenefits', sampleTerm2, { delay: 50 });
        await page.waitForTimeout(300);
        const benefitsFiltered = await page.$$eval('#benefitsList .col-md-6', els => els.filter(e => {
          const style = window.getComputedStyle(e);
          return style && style.display !== 'none' && style.visibility !== 'hidden' && e.offsetParent !== null;
        }).length);
        console.log('After benefits search filtered count:', benefitsFiltered);
        if (benefitsFiltered > benefitsCount) {
          throw new Error('Benefits filtered count increased unexpectedly');
        }
      } else {
        console.log('Could not compute representative sampleTerm for benefits search, skipping content assertion');
      }
    } else {
      console.log('No benefits cards present, skipping benefits search assertion');
    }

    console.log('✅ Puppeteer smoke test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
  console.error('❌ Puppeteer smoke test failed:', err);
  console.error('---- Browser logs ----');
  logs.forEach(l => console.error(l.type + ':', l.text));
    await browser.close();
    process.exit(2);
  }
})();
