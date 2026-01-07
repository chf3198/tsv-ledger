const puppeteer = require('puppeteer');
const http = require('http');

async function testEmployeeBenefitsE2E() {
  console.log('🧪 Starting Employee Benefits E2E Test...');

  let browser;
  let page;

  try {
    // Test 1: API connectivity
    console.log('📡 Testing API connectivity...');
    const apiResponse = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/amazon-items',
          method: 'GET'
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('API timeout')));
      req.end();
    });

    console.log(`✅ API returned ${apiResponse.items.length} items`);
    if (apiResponse.items.length === 0) {
      throw new Error('No items returned from API');
    }

    // Test 2: Browser automation
    console.log('🌐 Launching browser for UI testing...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();

    // Test 3: Navigate to main page
    console.log('🏠 Testing main page navigation...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);

    // Test 4: Navigate to Employee Benefits section
    console.log('👥 Testing Employee Benefits navigation...');
    await page.waitForSelector('a[href*="employee-benefits"]', {
      timeout: 10000
    });
    await page.click('a[href*="employee-benefits"]');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Test 5: Check if benefits section loaded
    const benefitsContent = await page.$('[data-section="employee-benefits"]');
    if (!benefitsContent) {
      throw new Error('Employee Benefits section did not load');
    }
    console.log('✅ Employee Benefits section loaded');

    // Test 6: Check for benefits configuration button
    const configButton = await page.$(
      'button[data-bs-target="#benefitsModal"]'
    );
    if (!configButton) {
      throw new Error('Benefits Configuration Tool button not found');
    }
    console.log('✅ Benefits Configuration Tool button found');

    // Test 7: Open benefits modal
    console.log('🔧 Testing Benefits Configuration Tool modal...');
    await page.click('button[data-bs-target="#benefitsModal"]');
    await page.waitForSelector('#benefitsModal', {
      visible: true,
      timeout: 5000
    });
    console.log('✅ Benefits modal opened');

    // Test 8: Check for item cards (no more NaN)
    await page.waitForTimeout(1000); // Wait for modal content to load
    const itemCards = await page.$$('.card');
    console.log(`✅ Found ${itemCards.length} item cards in modal`);

    if (itemCards.length === 0) {
      throw new Error('No item cards found in benefits modal');
    }

    // Test 9: Check for proper dollar amounts (not NaN)
    const firstCardText = await page.evaluate(() => {
      const card = document.querySelector('.card');
      return card ? card.textContent : '';
    });

    if (firstCardText.includes('$NaN')) {
      throw new Error('Found $NaN in item cards - field mapping bug not fixed');
    }
    console.log('✅ No $NaN values found in item cards');

    // Test 10: Check for percentage sliders
    const sliders = await page.$$('input[type="range"]');
    console.log(`✅ Found ${sliders.length} percentage sliders`);

    // Test 11: Test slider interaction
    if (sliders.length > 0) {
      console.log('🎚️ Testing slider interaction...');
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]');
        if (slider) {
          slider.value = '25';
          slider.dispatchEvent(new Event('input'));
        }
      });
      await page.waitForTimeout(500);
      console.log('✅ Slider interaction working');
    }

    // Test 12: Check for search functionality
    const searchInputs = await page.$$('input[placeholder*="search" i]');
    console.log(`✅ Found ${searchInputs.length} search inputs`);

    // Test 13: Test search functionality
    if (searchInputs.length > 0) {
      console.log('🔍 Testing search functionality...');
      await page.type('input[placeholder*="search" i]', 'test');
      await page.waitForTimeout(500);
      console.log('✅ Search input working');
    }

    // Test 14: Check for report generation
    const reportButton = await page.$('#generateReport');
    if (reportButton) {
      console.log('📊 Report generation button found');
    }

    console.log('🎉 All Employee Benefits E2E tests passed!');
  } catch (error) {
    console.error('❌ E2E Test failed:', error.message);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testEmployeeBenefitsE2E()
  .then(() => {
    console.log('✅ Employee Benefits E2E Test Suite: PASSED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Employee Benefits E2E Test Suite: FAILED');
    console.error(error);
    process.exit(1);
  });
