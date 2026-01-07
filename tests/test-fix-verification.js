const puppeteer = require('puppeteer');

async function testBenefitsAllocationFix() {
  console.log('🧪 Testing benefits allocation fix...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the benefits page
    await page.goto('http://localhost:3000/employee-benefits.html');
    await page.waitForSelector('#employeeBenefitsModal', { timeout: 10000 });

    // Open the modal
    await page.click('#openBenefitsModal');
    await page.waitForSelector('#businessSuppliesList', { timeout: 5000 });

    // Wait for items to load
    await page.waitForFunction(() => {
      const businessList = document.getElementById('businessSuppliesList');
      const benefitsList = document.getElementById('benefitsList');
      return businessList && benefitsList && businessList.children.length > 0;
    }, { timeout: 10000 });

    console.log('✅ Modal opened and items loaded');

    // Get initial item counts
    const initialBusinessCount = await page.$$eval('#businessSuppliesList [data-item-id]', items => items.length);
    const initialBenefitsCount = await page.$$eval('#benefitsList [data-item-id]', items => items.length);

    console.log(`📊 Initial: Business=${initialBusinessCount}, Benefits=${initialBenefitsCount}`);

    // Find an item and set it to 100% benefits (0% business)
    const firstItem = await page.$('[data-item-id]');
    if (!firstItem) {
      throw new Error('No items found in the modal');
    }

    const itemId = await firstItem.evaluate(el => el.dataset.itemId);
    console.log(`🎯 Testing with item: ${itemId}`);

    // Find the slider for this item and set to 100% benefits
    const slider = await page.$(`input[data-item-id="${itemId}"][data-type="benefits"]`);
    if (!slider) {
      throw new Error(`Slider not found for item ${itemId}`);
    }

    // Set to 100% benefits
    await slider.focus();
    await page.keyboard.press('ArrowRight', { delay: 100 });
    await page.keyboard.press('ArrowRight', { delay: 100 });
    await page.keyboard.press('ArrowRight', { delay: 100 });
    await page.keyboard.press('ArrowRight', { delay: 100 });

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Check final counts
    const finalBusinessCount = await page.$$eval('#businessSuppliesList [data-item-id]', items => items.length);
    const finalBenefitsCount = await page.$$eval('#benefitsList [data-item-id]', items => items.length);

    console.log(`📊 Final: Business=${finalBusinessCount}, Benefits=${finalBenefitsCount}`);

    // Verify the item is NOT in business column (should be 0% business)
    const itemInBusiness = await page.$(`#businessSuppliesList [data-item-id="${itemId}"]`);
    const itemInBenefits = await page.$(`#benefitsList [data-item-id="${itemId}"]`);

    console.log(`🔍 Item ${itemId} in Business column: ${!!itemInBusiness}`);
    console.log(`🔍 Item ${itemId} in Benefits column: ${!!itemInBenefits}`);

    // Test result
    if (!itemInBusiness && itemInBenefits) {
      console.log('✅ SUCCESS: Item correctly appears only in Benefits column (0% business allocation)');
      return true;
    } else {
      console.log('❌ FAILURE: Item incorrectly appears in wrong column');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testBenefitsAllocationFix().then(success => {
  process.exit(success ? 0 : 1);
});
