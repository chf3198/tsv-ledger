const { test, expect } = require('@playwright/test');

test.describe('Benefits Allocation - Zero Percent Items', () => {
  test('should not display item cards with 0% allocation in wrong columns', async ({ page }) => {
    // Set slow motion for visual review
    page.context().setDefaultTimeout(30000);
    await page.context().addInitScript(() => {
      // Slow down all animations and transitions for better observation
      const style = document.createElement('style');
      style.textContent = '* { transition-duration: 1s !important; animation-duration: 1s !important; }';
      document.head.appendChild(style);
    });

    const base = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${base}/employee-benefits.html`;

    console.log('🌐 Navigating to benefits page...');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Allow page to fully load

    console.log('⏳ Waiting for manager to be ready...');
    // Wait for manager to be ready
    await page.waitForFunction(() => {
      try {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        return !!(mgr && typeof mgr.showSelectionModal === 'function');
      } catch (e) {
        return false;
      }
    }, { timeout: 20000 });

    console.log('🖱️ Opening benefits modal...');
    // Open the modal
    await page.evaluate(() => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && typeof mgr.showSelectionModal === 'function') {
        mgr.showSelectionModal();
      }
    });
    await page.waitForTimeout(2000);

    console.log('📋 Waiting for modal and columns...');
    // Wait for modal and lists
    await page.waitForSelector('#employeeBenefitsModal', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.waitForSelector('#businessSuppliesList', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.waitForSelector('#benefitsList', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get initial counts
    const initialBusiness = await page.$$eval('#businessSuppliesList [data-item-id]', els => els.length);
    const initialBenefits = await page.$$eval('#benefitsList [data-item-id]', els => els.length);
    console.log(`📊 Initial state: ${initialBusiness} business items, ${initialBenefits} benefits items`);
    console.log('🎯 Taking inventory of current items...');
    await page.waitForTimeout(3000); // Give user time to see initial state

    if (initialBusiness === 0) {
      console.log('⚠️ No business items to test allocation');
      return;
    }

    console.log('🎯 Selecting first business item...');
    // Select the first business item
    const firstItem = await page.$('#businessSuppliesList [data-item-id]');
    const itemId = await firstItem.getAttribute('data-item-id');
    console.log(`📝 Testing item: ${itemId}`);

    // Check if our injected script is present
    const scriptPresent = await page.evaluate(() => {
      return !!document.querySelector('script') &&
             document.documentElement.innerHTML.includes('moveFullyAllocatedItems');
    });
    console.log(`🔧 Injected script present: ${scriptPresent ? '✅' : '❌'}`);

    // Listen for console messages from our script
    page.on('console', msg => {
      if (msg.text().includes('Benefits fix') || msg.text().includes('🔧')) {
        console.log(`📋 BROWSER CONSOLE: ${msg.text()}`);
      }
    });

    // Check initial allocation before changing it
    const initialAlloc = await page.evaluate((id) => {
      const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
      if (mgr && mgr.itemProgressiveAllocations) {
        const alloc = mgr.itemProgressiveAllocations.get ? mgr.itemProgressiveAllocations.get(id) : mgr.itemProgressiveAllocations[id];
        return alloc ? { business: alloc.business, benefits: alloc.benefits } : null;
      }
      return null;
    }, itemId);

    console.log(`📊 Initial allocation: ${initialAlloc ? `${initialAlloc.business}% Business, ${initialAlloc.benefits}% Benefits` : 'Unknown'}`);
    await page.waitForTimeout(2000); // Let user see initial state

    // Click on the item to open allocation controls
    console.log('🖱️ Clicking item to open allocation controls...');
    await firstItem.click();
    await page.waitForTimeout(3000); // Wait for controls to appear and let user see

    console.log('🎚️ Waiting for allocation controls...');
    // Wait for allocation controls to appear
    await page.waitForSelector('input[type="range"]', { timeout: 5000 });
    console.log('🎚️ Allocation controls visible! Setting to 100% Benefits (0% Business)...');
    await page.waitForTimeout(3000); // Let user observe the controls

    // Set benefits to 100% (business to 0%)
    const benefitsSlider = await page.$('input[type="range"]:nth-of-type(2)'); // Assuming second slider is benefits
    if (benefitsSlider) {
      console.log('🎚️ Using slider to set benefits to 100%...');
      await benefitsSlider.fill('100');
      await benefitsSlider.dispatchEvent('change');
      console.log('✅ Slider set to 100% benefits');
    } else {
      // Try setting via evaluate
      console.log('🔧 Using JavaScript to set benefits to 100%...');
      await page.evaluate((id) => {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ? mgr.itemProgressiveAllocations.get(id) : mgr.itemProgressiveAllocations[id];
          if (alloc) {
            alloc.benefits = 100;
            alloc.business = 0;
          }
        }
      }, itemId);
      console.log('✅ JavaScript allocation set to 100% benefits');
    }

    // Wait for UI to update
    console.log('⏳ Waiting for UI to update after allocation change...');
    console.log('👀 WATCH: Item should disappear from Business Supplies column');
    await page.waitForTimeout(5000); // Longer wait for user to observe

    // Check browser console for our script logs
    console.log('🔍 Checking browser console for script execution...');
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('Benefits fix:')) {
        console.log('📝 Script log:', msg.text());
      }
    });

    await page.waitForTimeout(1000); // Give time for any console messages

    // Check that the item is NOT in business column
    const businessItems = await page.$$eval('#businessSuppliesList [data-item-id]', els =>
      els.map(el => el.getAttribute('data-item-id'))
    );
    expect(businessItems).not.toContain(itemId);

    // Additional verification: ensure no items in business column have 0% business allocation
    console.log('🔍 Verifying no items in Business column show 0% business allocation...');
    const businessAllocations = await page.$$eval('#businessSuppliesList [data-item-id]', async (els) => {
      const results = [];
      for (const el of els) {
        const itemId = el.getAttribute('data-item-id');
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ? mgr.itemProgressiveAllocations.get(itemId) : mgr.itemProgressiveAllocations[itemId];
          if (alloc) {
            results.push({ itemId, business: alloc.business, benefits: alloc.benefits });
          }
        }
      }
      return results;
    });

    // Ensure no item in business column has 0% business allocation
    for (const alloc of businessAllocations) {
      expect(alloc.business).toBeGreaterThan(0);
      console.log(`✅ Item ${alloc.itemId}: Business ${alloc.business}%, Benefits ${alloc.benefits}%`);
    }

    // Check that the item IS in benefits column
    const benefitsItems = await page.$$eval('#benefitsList [data-item-id]', els =>
      els.map(el => el.getAttribute('data-item-id'))
    );
    expect(benefitsItems).toContain(itemId);

    // Now test reverse: set business to 100%
    console.log('🔄 Testing reverse: setting business to 100%...');
    await page.waitForTimeout(2000); // Pause before reverse test

    const businessSlider = await page.$('input[type="range"]:nth-of-type(1)'); // Assuming first slider is business
    if (businessSlider) {
      console.log('🎚️ Using slider to set business to 100%...');
      await businessSlider.fill('100');
      await businessSlider.dispatchEvent('change');
      console.log('✅ Slider set to 100% business');
    } else {
      console.log('🔧 Using JavaScript to set business to 100%...');
      await page.evaluate((id) => {
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ? mgr.itemProgressiveAllocations.get(id) : mgr.itemProgressiveAllocations[id];
          if (alloc) {
            alloc.business = 100;
            alloc.benefits = 0;
          }
        }
      }, itemId);
      console.log('✅ JavaScript allocation set to 100% business');
    }

    // Wait for UI to update
    console.log('⏳ Waiting for UI to update after reverse allocation...');
    console.log('👀 WATCH: Item should disappear from Board Benefits column');
    await page.waitForTimeout(5000); // Longer wait for user to observe

    // Check that the item is NOT in benefits column
    const benefitsItemsAfter = await page.$$eval('#benefitsList [data-item-id]', els =>
      els.map(el => el.getAttribute('data-item-id'))
    );
    expect(benefitsItemsAfter).not.toContain(itemId);

    // Additional verification: ensure no items in benefits column have 0% benefits allocation
    console.log('🔍 Verifying no items in Benefits column show 0% benefits allocation...');
    const benefitsAllocations = await page.$$eval('#benefitsList [data-item-id]', async (els) => {
      const results = [];
      for (const el of els) {
        const itemId = el.getAttribute('data-item-id');
        const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
        if (mgr && mgr.itemProgressiveAllocations) {
          const alloc = mgr.itemProgressiveAllocations.get ? mgr.itemProgressiveAllocations.get(itemId) : mgr.itemProgressiveAllocations[itemId];
          if (alloc) {
            results.push({ itemId, business: alloc.business, benefits: alloc.benefits });
          }
        }
      }
      return results;
    });

    // Ensure no item in benefits column has 0% benefits allocation
    for (const alloc of benefitsAllocations) {
      expect(alloc.benefits).toBeGreaterThan(0);
      console.log(`✅ Item ${alloc.itemId}: Business ${alloc.business}%, Benefits ${alloc.benefits}%`);
    }

    // Check that the item IS in business column
    const businessItemsAfter = await page.$$eval('#businessSuppliesList [data-item-id]', els =>
      els.map(el => el.getAttribute('data-item-id'))
    );
    expect(businessItemsAfter).toContain(itemId);

    console.log('✅ Zero allocation test passed');
  });
});
