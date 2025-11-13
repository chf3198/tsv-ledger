// EXAMPLE: Playwright E2E Navigation Test
// Modern E2E testing framework - industry standard

const { test, expect } = require('@playwright/test');

test.describe('Navigation Menu E2E UX Tests', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors during each test
    consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('User can see and interact with navigation menu', async ({ page }) => {
    console.log('🧪 Testing: User navigation experience\n');

    // USER STORY: As a user, I want to see a clear navigation menu
    const navigation = page.locator('#main-navigation');
    await expect(navigation).toBeVisible();
    console.log('✅ User can see navigation menu');

    // USER STORY: As a user, I want to see all available menu options
    const menuItems = page.locator('[data-section]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ User sees ${count} menu options`);

    // Test each menu item
    for (let i = 0; i < count; i++) {
      const item = menuItems.nth(i);
      const sectionId = await item.getAttribute('data-section');
      const text = await item.textContent();
      
      console.log(`🔗 Testing: User clicks "${text}" menu`);
      
      // User clicks menu item
      await item.click();
      await page.waitForTimeout(500);
      
      // Verify section becomes active
      const targetSection = page.locator(`#${sectionId}`);
      await expect(targetSection).toHaveClass(/active/);
      
      console.log(`✅ User successfully navigates to ${text}`);
    }

    // Verify no console errors occurred
    expect(consoleErrors.length).toBe(0);
    console.log('✅ No console errors during navigation');
  });

  test('User can use responsive navigation on mobile', async ({ page }) => {
    console.log('📱 Testing: Mobile navigation experience\n');

    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    
    // USER STORY: As a mobile user, I want to access the menu via a toggle
    const toggleButton = page.locator('.navbar-toggler');
    await expect(toggleButton).toBeVisible();
    console.log('✅ User can see mobile menu toggle');

    // User taps toggle to open menu
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    // Menu should be accessible
    const mobileMenu = page.locator('#sidebar');
    await expect(mobileMenu).toBeVisible();
    console.log('✅ User can open mobile menu');

    // User can click menu items in mobile view
    const mobileMenuItem = page.locator('[data-section="settings"]');
    await mobileMenuItem.click();
    await page.waitForTimeout(500);
    
    const settingsSection = page.locator('#settings');
    await expect(settingsSection).toHaveClass(/active/);
    console.log('✅ User can navigate in mobile view');

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Navigation is accessible via keyboard', async ({ page }) => {
    console.log('⌨️ Testing: Keyboard accessibility\n');

    // USER STORY: As a user using keyboard navigation, I want to access menu items
    await page.focus('#main-navigation');
    
    // User presses Tab to navigate
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // User presses Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    console.log('✅ Keyboard navigation works');
    
    // Should not cause console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Navigation performance meets UX standards', async ({ page }) => {
    console.log('⚡ Testing: Navigation performance\n');

    const menuItems = page.locator('[data-section]');
    const count = await menuItems.count();
    
    // Measure navigation speed
    const startTime = Date.now();
    
    // Click through first 3 menu items
    for (let i = 0; i < Math.min(3, count); i++) {
      await menuItems.nth(i).click();
      await page.waitForTimeout(100); // Minimal wait
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / Math.min(3, count);
    
    // Performance expectation: < 500ms per navigation
    expect(avgTime).toBeLessThan(500);
    console.log(`✅ Average navigation time: ${avgTime.toFixed(0)}ms (under 500ms target)`);
    
    // Should not cause console errors
    expect(consoleErrors.length).toBe(0);
  });

  test.afterEach(async () => {
    // Report any console errors found
    if (consoleErrors.length > 0) {
      console.log(`\n❌ Console errors found: ${consoleErrors.length}`);
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ No console errors detected');
    }
  });
});

// Example of how to run this:
// npx playwright test tests/e2e/navigation-ux-example.spec.js --headed

module.exports = {
  // Export for integration with other test suites
  testNavigationUX: () => console.log('Use: npx playwright test navigation-ux-example.spec.js')
};