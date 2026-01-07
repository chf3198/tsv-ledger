const puppeteer = require('puppeteer');

async function comprehensiveVisualInspectionTest() {
  console.log('🔍 Starting Comprehensive Visual Inspection E2E Test...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    // Test 1: Main page load and navigation
    console.log('🏠 Testing main page and navigation...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Check for any immediate visual issues
    const mainPageErrors = await page.$$eval('*', (elements) =>
      elements
        .filter((el) => {
          const text = el.textContent || '';
          return (
            text.includes('$NaN') ||
            text.includes('NaN') ||
            text.includes('undefined')
          );
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          class: el.className
        }))
    );

    if (mainPageErrors.length > 0) {
      console.error('❌ Found visual errors on main page:', mainPageErrors);
      throw new Error(`Main page has ${mainPageErrors.length} visual errors`);
    }

    // Test 2: Navigate to Employee Benefits
    console.log('👥 Testing Employee Benefits navigation...');
    await page.click('a[href*="employee-benefits"]');
    await page.waitForTimeout(2000);

    // Check benefits page for visual errors
    const benefitsPageErrors = await page.$$eval('*', (elements) =>
      elements
        .filter((el) => {
          const text = el.textContent || '';
          return (
            text.includes('$NaN') ||
            text.includes('NaN') ||
            text.includes('undefined')
          );
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          class: el.className
        }))
    );

    if (benefitsPageErrors.length > 0) {
      console.error(
        '❌ Found visual errors on benefits page:',
        benefitsPageErrors
      );
      throw new Error(
        `Benefits page has ${benefitsPageErrors.length} visual errors`
      );
    }

    // Test 3: Open Benefits Configuration Modal
    console.log('🔧 Testing Benefits Configuration Tool modal...');
    await page.evaluate(() => {
      if (
        window.employeeBenefitsManager &&
        window.employeeBenefitsManager.showSelectionModal
      ) {
        window.employeeBenefitsManager.showSelectionModal();
      }
    });

    await page.waitForSelector('#employeeBenefitsModal', {
      visible: true,
      timeout: 5000
    });

    // Wait for modal content to load
    await page.waitForTimeout(2000);

    // Test 4: Comprehensive visual inspection of modal header stats
    console.log('📊 Testing modal header summary statistics...');

    const headerStats = await page.$$eval(
      '.bg-light.p-3.border-bottom .card h5',
      (elements) =>
        elements.map((el) => ({
          text: el.textContent.trim(),
          id: el.id,
          class: el.className
        }))
    );

    console.log('Header stats found:', headerStats);

    // Check each stat for NaN or invalid values
    for (const stat of headerStats) {
      if (
        stat.text.includes('$NaN') ||
        stat.text.includes('NaN') ||
        stat.text === '$-' ||
        stat.text === '-%'
      ) {
        throw new Error(
          `Invalid stat value in header: ${stat.id} = "${stat.text}"`
        );
      }
      console.log(`✅ ${stat.id}: ${stat.text}`);
    }

    // Test 5: Check item cards for visual issues
    console.log('🎴 Testing item cards for visual issues...');

    const cardBadges = await page.$$eval('.card .badge', (badges) =>
      badges.map((badge) => badge.textContent.trim())
    );

    console.log(`Found ${cardBadges.length} card badges`);

    for (let i = 0; i < cardBadges.length; i++) {
      const badge = cardBadges[i];
      if (badge.includes('$NaN') || badge.includes('NaN')) {
        throw new Error(`Card badge ${i + 1} contains NaN: "${badge}"`);
      }
      console.log(`✅ Badge ${i + 1}: ${badge}`);
    }

    // Test 6: Test slider interactions and visual updates
    console.log('🎚️ Testing slider interactions...');

    const initialStats = await page.$$eval(
      '.bg-light.p-3.border-bottom .card h5',
      (elements) => elements.map((el) => el.textContent.trim())
    );

    console.log('Initial stats:', initialStats);

    // Move a slider
    await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      if (sliders.length > 0) {
        sliders[0].value = '75';
        sliders[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.waitForTimeout(1000);

    const updatedStats = await page.$$eval(
      '.bg-light.p-3.border-bottom .card h5',
      (elements) => elements.map((el) => el.textContent.trim())
    );

    console.log('Updated stats after slider:', updatedStats);

    // Check that stats updated (should be different)
    const statsChanged = initialStats.some(
      (stat, i) => stat !== updatedStats[i]
    );
    if (!statsChanged) {
      console.warn('⚠️ Stats did not update after slider interaction');
    } else {
      console.log('✅ Stats updated after slider interaction');
    }

    // Test 7: Check for any remaining NaN values anywhere in modal
    const allModalText = await page.$eval('#employeeBenefitsModal', (modal) => {
      const elements = modal.querySelectorAll('*');
      const texts = [];
      elements.forEach((el) => {
        const text = el.textContent.trim();
        if (
          text &&
          (text.includes('$NaN') ||
            text.includes('NaN') ||
            text.includes('undefined'))
        ) {
          texts.push({
            text: text.substring(0, 50),
            tag: el.tagName,
            class: el.className
          });
        }
      });
      return texts;
    });

    if (allModalText.length > 0) {
      console.error('❌ Found NaN/undefined values in modal:', allModalText);
      throw new Error(`Modal contains ${allModalText.length} invalid values`);
    }

    console.log('🎉 Comprehensive visual inspection passed!');
  } catch (error) {
    console.error('❌ Visual inspection test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
comprehensiveVisualInspectionTest()
  .then(() => {
    console.log('✅ Comprehensive Visual Inspection Test: PASSED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive Visual Inspection Test: FAILED');
    console.error(error);
    process.exit(1);
  });
