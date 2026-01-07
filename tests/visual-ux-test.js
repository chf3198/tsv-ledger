#!/usr/bin/env node

/**
 * Visual UX Testing for Benefits Zero Allocation Fix
 *
 * This script uses Puppeteer to perform visual testing in an external Chrome browser,
 * allowing you to observe the benefits allocation fix in action.
 */

const puppeteer = require('puppeteer-core');

async function performVisualTesting() {
  console.log('🚀 Starting Visual UX Testing for Benefits Allocation Fix\n');

  let browser;
  let page;

  try {
    // Launch browser in non-headless mode so you can see it
    console.log('📱 Launching Chrome browser...');
    browser = await puppeteer.launch({
      executablePath: '/home/curtisfranks/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
      headless: false, // This makes the browser visible
      defaultViewport: { width: 1200, height: 800 },
      slowMo: 1000, // Human-speed interactions (1 second delay)
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222']
    });

    console.log('🌐 Opening benefits page...');
    page = await browser.newPage();

    // Set up console logging to see our fix messages
    page.on('console', msg => {
      if (msg.text().includes('Benefits fix:')) {
        console.log('🔧 FIX LOG:', msg.text());
      }
    });

    // Navigate to the benefits page
    await page.goto('http://localhost:3000/employee-benefits.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully');

    // Wait for the benefits manager to be ready
    console.log('⏳ Waiting for EmployeeBenefitsManager to initialize...');
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ?
          employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });

    console.log('✅ Benefits manager ready');

    // Open the modal
    console.log('🖱️  Opening Benefits Configuration modal...');
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ?
        employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });

    // Wait for modal to appear
    await page.waitForSelector('#employeeBenefitsModal', { timeout: 10000 });
    await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
    await page.waitForSelector('#benefitsList', { timeout: 10000 });

    // Wait for items to load
    await page.waitForFunction(() => {
      const businessList = document.querySelector('#businessSuppliesList');
      const benefitsList = document.querySelector('#benefitsList');
      return businessList && benefitsList && businessList.querySelectorAll('[data-item-id]').length > 0;
    }, { timeout: 10000 });

    console.log('✅ Modal opened with columns visible');

    // Get initial state
    const initialBusinessCount = await page.$$eval('#businessSuppliesList [data-item-id]', els => els.length);
    const initialBenefitsCount = await page.$$eval('#benefitsList [data-item-id]', els => els.length);

    console.log(`📊 Initial state: ${initialBusinessCount} business items, ${initialBenefitsCount} benefits items`);

    if (initialBusinessCount === 0) {
      console.log('⚠️  No business items to test. Please add some items first.');
      return;
    }

    // Select first business item
    console.log('🎯 Selecting first item from Business Supplies column...');
    const firstItem = await page.$('#businessSuppliesList [data-item-id]');
    console.log('First item found:', !!firstItem);
    if (!firstItem) {
      throw new Error('No business items found to test');
    }
    const itemId = await firstItem.evaluate(el => el.getAttribute('data-item-id'));

    console.log(`📝 Testing item: ${itemId}`);
    await firstItem.click();

    // Wait for allocation controls
    await page.waitForSelector('input[type="range"]', { timeout: 5000 });

    // Set to 100% benefits (0% business)
    console.log('🔄 Setting allocation to 100% Benefits (0% Business)...');
    const benefitsSlider = await page.$('input[type="range"]:nth-of-type(2)'); // Assuming second slider

    if (benefitsSlider) {
      await benefitsSlider.fill('100');
      await benefitsSlider.dispatchEvent('change');
      console.log('✅ Allocation set via slider');
    } else {
      // Fallback to direct manager manipulation
      await page.evaluate((id) => {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ?
          employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ?
            mgr.itemProgressiveAllocations.get(id) : mgr.itemProgressiveAllocations[id];
          if (alloc) {
            alloc.benefits = 100;
            alloc.business = 0;
            console.log('Set allocation via manager:', alloc);
          }
        }
      }, itemId);
      console.log('✅ Allocation set via manager');
    }

    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check results
    const businessItemsAfter = await page.$$eval('#businessSuppliesList [data-item-id]',
      els => els.map(el => el.getAttribute('data-item-id'))
    );
    const benefitsItemsAfter = await page.$$eval('#benefitsList [data-item-id]',
      els => els.map(el => el.getAttribute('data-item-id'))
    );

    console.log(`📊 After 100% Benefits: ${businessItemsAfter.length} business items, ${benefitsItemsAfter.length} benefits items`);

    const itemInBusiness = businessItemsAfter.includes(itemId);
    const itemInBenefits = benefitsItemsAfter.includes(itemId);

    console.log(`🎯 Item ${itemId} in Business column: ${itemInBusiness ? '❌ YES (BUG)' : '✅ NO'}`);
    console.log(`🎯 Item ${itemId} in Benefits column: ${itemInBenefits ? '✅ YES' : '❌ NO (BUG)'}`);

    if (!itemInBusiness && itemInBenefits) {
      console.log('🎉 TEST PASSED: Item correctly moved to Benefits column only!');
    } else {
      console.log('💥 TEST FAILED: Item allocation not working properly');
    }

    // Wait for user to observe
    console.log('\n👀 Please observe the browser. The item should have disappeared from Business Supplies.');
    console.log('Press Enter in this terminal when ready to continue with reverse test...');

    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

    // Now test reverse: set to 100% business
    console.log('\n🔄 Testing reverse: Setting to 100% Business (0% Benefits)...');

    const businessSlider = await page.$('input[type="range"]:nth-of-type(1)'); // Assuming first slider

    if (businessSlider) {
      await businessSlider.fill('100');
      await businessSlider.dispatchEvent('change');
      console.log('✅ Reverse allocation set via slider');
    } else {
      await page.evaluate((id) => {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ?
          employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ?
            mgr.itemProgressiveAllocations.get(id) : mgr.itemProgressiveAllocations[id];
          if (alloc) {
            alloc.business = 100;
            alloc.benefits = 0;
            console.log('Set reverse allocation via manager:', alloc);
          }
        }
      }, itemId);
      console.log('✅ Reverse allocation set via manager');
    }

    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final results
    const finalBusinessItems = await page.$$eval('#businessSuppliesList [data-item-id]',
      els => els.map(el => el.getAttribute('data-item-id'))
    );
    const finalBenefitsItems = await page.$$eval('#benefitsList [data-item-id]',
      els => els.map(el => el.getAttribute('data-item-id'))
    );

    console.log(`📊 After 100% Business: ${finalBusinessItems.length} business items, ${finalBenefitsItems.length} benefits items`);

    const itemInBusinessFinal = finalBusinessItems.includes(itemId);
    const itemInBenefitsFinal = finalBenefitsItems.includes(itemId);

    console.log(`🎯 Item ${itemId} in Business column: ${itemInBusinessFinal ? '✅ YES' : '❌ NO (BUG)'}`);
    console.log(`🎯 Item ${itemId} in Benefits column: ${itemInBenefitsFinal ? '❌ YES (BUG)' : '✅ NO'}`);

    if (itemInBusinessFinal && !itemInBenefitsFinal) {
      console.log('🎉 REVERSE TEST PASSED: Item correctly moved to Business column only!');
    } else {
      console.log('💥 REVERSE TEST FAILED: Item allocation not working properly');
    }

    console.log('\n👀 Please observe the browser again. The item should now be in Business Supplies only.');
    console.log('Press Enter to close the browser and finish testing...');

    // Wait for final user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
    console.log('✅ Visual UX testing completed');
  }
}

// Run the test
performVisualTesting().catch(console.error);
