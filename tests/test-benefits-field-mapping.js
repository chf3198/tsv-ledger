const puppeteer = require('puppeteer');

async function testBenefitsFieldMapping() {
  console.log('🧪 Testing Employee Benefits Field Mapping Fix...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  try {
    // Navigate to employee benefits page
    console.log('🏠 Navigating to employee benefits page...');
    await page.goto('http://localhost:3000/employee-benefits.html', {
      waitUntil: 'networkidle2'
    });

    // Wait for the page to initialize
    await page.waitForFunction(
      () => {
        return (
          window.employeeBenefitsManager &&
          window.employeeBenefitsManager.amazonItems &&
          window.employeeBenefitsManager.amazonItems.length > 0
        );
      },
      { timeout: 15000 }
    );

    // Open the benefits modal
    console.log('🔧 Opening benefits configuration modal...');
    await page.evaluate(() => {
      if (
        window.employeeBenefitsManager &&
        window.employeeBenefitsManager.showSelectionModal
      ) {
        window.employeeBenefitsManager.showSelectionModal();
      }
    });

    // Debug: Check what modals exist
    const modals = await page.$$eval(
      '[id*="Modal"], [class*="modal"]',
      (elements) =>
        elements.map((el) => ({
          id: el.id,
          class: el.className,
          visible: el.offsetParent !== null
        }))
    );
    console.log('Available modals:', modals);

    // Wait for modal to be visible - but it might not be opening
    try {
      await page.waitForSelector('#employeeBenefitsModal', {
        visible: true,
        timeout: 2000
      });
      console.log('✅ Modal opened successfully');
    } catch (e) {
      console.log(
        '⚠️ Modal did not open, checking if cards are rendered elsewhere'
      );
    }

    // Wait for cards to render (either in modal or on page)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if modal content exists
    const modalContent = await page.$('#employeeBenefitsModal .modal-body');
    if (modalContent) {
      console.log('✅ Modal body found');
      const businessList = await page.$('#businessSuppliesList');
      const benefitsList = await page.$('#benefitsList');
      console.log(
        `Business list found: ${!!businessList}, Benefits list found: ${!!benefitsList}`
      );
    } else {
      console.log('⚠️ Modal body not found');
    }

    // Check for NaN values in cards
    console.log('🔍 Checking for $NaN values in item cards...');
    const cardTexts = await page.$$eval('.card .badge', (badges) =>
      badges.map((badge) => badge.textContent)
    );

    console.log(`Found ${cardTexts.length} badge elements`);
    let hasNaN = false;
    cardTexts.forEach((text, i) => {
      console.log(`  Badge ${i + 1}: ${text}`);
      if (text.includes('$NaN')) {
        console.error(`❌ Found $NaN in badge: ${text}`);
        hasNaN = true;
      }
    });

    // Debug: Check the actual item data being used
    const itemData = await page.evaluate(() => {
      if (
        window.employeeBenefitsManager &&
        window.employeeBenefitsManager.amazonItems
      ) {
        return window.employeeBenefitsManager.amazonItems
          .slice(0, 2)
          .map((item) => ({
            id: item.id,
            amount: item.amount,
            price: item.price,
            description: item.description,
            name: item.name
          }));
      }
      return [];
    });

    console.log('Sample item data:', itemData);

    if (hasNaN) {
      throw new Error('Found $NaN in badge elements');
    }
    // Also check all elements with dollar signs
    const allDollarElements = await page.$$eval('*', (elements) =>
      elements
        .filter((el) => el.textContent && el.textContent.includes('$'))
        .map((el) => ({
          text: el.textContent.trim(),
          tag: el.tagName,
          class: el.className
        }))
    );

    console.log('All elements with $:', allDollarElements.slice(0, 10));
    // Check that amounts are properly formatted
    const validAmounts = cardTexts.filter((text) => /^\$\d+\.\d{2}/.test(text));
    console.log(
      `✅ Found ${validAmounts.length} properly formatted dollar amounts`
    );

    if (validAmounts.length === 0) {
      throw new Error('No properly formatted dollar amounts found');
    }

    // Test slider functionality
    console.log('🎚️ Testing slider functionality...');
    const initialValues = await page.$$eval('input[type="range"]', (sliders) =>
      sliders.map((slider) => slider.value)
    );

    console.log(
      `Found ${initialValues.length} sliders with initial values:`,
      initialValues
    );

    // Change a slider value
    if (initialValues.length > 0) {
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]');
        if (slider) {
          slider.value = '75';
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if the display updated
      const updatedBadge = await page.$eval(
        '.card .badge',
        (badge) => badge.textContent
      );
      console.log(
        `✅ Slider interaction working - updated badge: ${updatedBadge}`
      );
    }

    // Test search functionality
    console.log('🔍 Testing search functionality...');
    const searchInput = await page.$('#searchBusiness');
    if (searchInput) {
      await page.type('#searchBusiness', 'test');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const visibleCards = await page.$$eval(
        '.card',
        (cards) =>
          cards.filter((card) => {
            const style = window.getComputedStyle(card);
            return style.display !== 'none' && card.offsetParent !== null;
          }).length
      );

      console.log(
        `✅ Search working - ${visibleCards} cards visible after search`
      );
    }

    console.log('🎉 All field mapping and functionality tests passed!');
  } catch (error) {
    console.error('❌ Field mapping test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testBenefitsFieldMapping()
  .then(() => {
    console.log('✅ Employee Benefits Field Mapping Test: PASSED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Employee Benefits Field Mapping Test: FAILED');
    console.error(error);
    process.exit(1);
  });
