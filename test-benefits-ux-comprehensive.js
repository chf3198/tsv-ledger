#!/usr/bin/env node

/**
 * Comprehensive UX Testing Script for Benefits Zero Allocation Fix
 *
 * This script performs actual browser automation testing of the benefits
 * allocation zero-percent issue by simulating user interactions.
 */

const puppeteer = require('puppeteer');

async function performUXTesting() {
  console.log('🧪 Starting Comprehensive UX Testing for Benefits Zero Allocation Fix\n');

  let browser;
  let page;

  try {
    console.log('1. 🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show the browser for observation
      defaultViewport: null,
      args: ['--start-maximized']
    });

    console.log('2. 📄 Opening benefits page...');
    page = await browser.newPage();
    await page.goto('http://localhost:3000/employee-benefits.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('3. 🔍 Checking for benefits manager...');
    const managerReady = await page.evaluate(() => {
      return new Promise((resolve) => {
        const checkManager = () => {
          try {
            const mgr = window.employeeBenefitsManager;
            if (mgr && typeof mgr.showSelectionModal === 'function') {
              resolve(true);
            } else {
              setTimeout(checkManager, 100);
            }
          } catch (e) {
            setTimeout(checkManager, 100);
          }
        };
        checkManager();
        setTimeout(() => resolve(false), 10000); // Timeout after 10s
      });
    });

    if (!managerReady) {
      throw new Error('Benefits manager not ready');
    }
    console.log('✅ Benefits manager ready');

    console.log('4. 🎯 Opening benefits modal...');
    await page.evaluate(() => {
      const mgr = window.employeeBenefitsManager;
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });

    // Wait for modal to appear
    await page.waitForSelector('#employeeBenefitsModal', { timeout: 10000 });
    await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
    await page.waitForSelector('#benefitsList', { timeout: 10000 });

    console.log('✅ Modal opened successfully');

    // Get initial state
    const initialBusinessCount = await page.$$eval('#businessSuppliesList .col-md-6', els => els.length);
    const initialBenefitsCount = await page.$$eval('#benefitsList .col-md-6', els => els.length);

    console.log(`📊 Initial state: ${initialBusinessCount} business items, ${initialBenefitsCount} benefits items`);

    if (initialBusinessCount === 0) {
      console.log('⚠️ No business items to test - skipping allocation test');
      return;
    }

    console.log('5. 🎮 Testing 100% Benefits Allocation (0% Business)...');

    // Select first business item
    const firstItem = await page.$('#businessSuppliesList .col-md-6');
    const itemId = await firstItem.evaluate(el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId || '');

    console.log(`🎯 Testing item: ${itemId}`);

    // Click to open allocation controls
    await firstItem.click();

    // Wait for sliders to appear
    await page.waitForSelector('input[type="range"]', { timeout: 5000 });

    // Set benefits to 100% (business to 0%)
    console.log('🔄 Setting allocation to 100% Benefits...');
    await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      if (sliders.length >= 2) {
        sliders[1].value = '100'; // Benefits slider
        sliders[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait for UI update
    await page.waitForTimeout(1000);

    // Check results
    const businessItemsAfter = await page.$$eval('#businessSuppliesList .col-md-6',
      els => els.map(el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId).filter(Boolean)
    );
    const benefitsItemsAfter = await page.$$eval('#benefitsList .col-md-6',
      els => els.map(el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId).filter(Boolean)
    );

    const itemInBusiness = businessItemsAfter.includes(itemId);
    const itemInBenefits = benefitsItemsAfter.includes(itemId);

    console.log(`📊 After 100% Benefits allocation:`);
    console.log(`   - Item in Business column: ${itemInBusiness ? '❌ FAIL' : '✅ PASS'}`);
    console.log(`   - Item in Benefits column: ${itemInBenefits ? '✅ PASS' : '❌ FAIL'}`);

    // Check console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    console.log('📝 Console logs during allocation:');
    logs.filter(log => log.includes('Benefits fix:')).forEach(log => {
      console.log(`   ${log}`);
    });

    console.log('6. 🔄 Testing Reverse: 100% Business Allocation (0% Benefits)...');

    // Set business to 100% (benefits to 0%)
    await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      if (sliders.length >= 2) {
        sliders[0].value = '100'; // Business slider
        sliders[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait for UI update
    await page.waitForTimeout(1000);

    // Check results
    const businessItemsFinal = await page.$$eval('#businessSuppliesList .col-md-6',
      els => els.map(el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId).filter(Boolean)
    );
    const benefitsItemsFinal = await page.$$eval('#benefitsList .col-md-6',
      els => els.map(el => el.dataset.itemId || el.querySelector('[data-item-id]')?.dataset.itemId).filter(Boolean)
    );

    const itemInBusinessFinal = businessItemsFinal.includes(itemId);
    const itemInBenefitsFinal = benefitsItemsFinal.includes(itemId);

    console.log(`📊 After 100% Business allocation:`);
    console.log(`   - Item in Business column: ${itemInBusinessFinal ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Item in Benefits column: ${itemInBenefitsFinal ? '❌ FAIL' : '✅ PASS'}`);

    // Final results
    const testPassed = !itemInBusiness && itemInBenefits && itemInBusinessFinal && !itemInBenefitsFinal;

    console.log('\n🎯 TEST RESULTS:');
    console.log(`Overall: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);

    if (testPassed) {
      console.log('🎉 Zero allocation fix is working correctly!');
      console.log('Items with 0% allocation are properly removed from wrong columns.');
    } else {
      console.log('❌ Fix needs improvement.');
      console.log('Items are still appearing in columns where they have 0% allocation.');
    }

    console.log('\n⏹️ Keeping browser open for manual inspection...');
    console.log('Close the browser window when done.');

    // Keep browser open for manual inspection
    await new Promise(() => {}); // Never resolves

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  performUXTesting();
} catch (e) {
  console.log('❌ Puppeteer not available. Installing...');
  console.log('Please run: npm install puppeteer --save-dev');
  console.log('Then run this script again.');
}