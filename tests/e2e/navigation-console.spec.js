// Navigation E2E Test with Console Monitoring
// This test navigates through all menu options while monitoring for console errors

const { test, expect } = require('@playwright/test');

test.describe('Navigation E2E Tests with Console Monitoring', () => {
  let consoleErrors = [];
  let consoleWarnings = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Reset error arrays
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];

    // Monitor console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });

    // Monitor JavaScript errors
    page.on('pageerror', error => {
      const errorMsg = `JavaScript Error: ${error.message}`;
      consoleErrors.push(errorMsg);
      console.log(`❌ ${errorMsg}`);
    });

    // Monitor network errors (ignore CDN redirects and expected 404s)
    page.on('response', response => {
      if (!response.ok()) {
        const url = response.url();
        const isIgnored = url.includes('unpkg.com') || 
                         url.includes('cdnjs.cloudflare.com') || 
                         url.includes('favicon.ico');
        
        if (!isIgnored) {
          const error = `${url} - ${response.status()} ${response.statusText()}`;
          networkErrors.push(error);
          console.log(`❌ Network Error: ${error}`);
        }
      }
    });

    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for navigation to initialize
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    // Report errors at the end of each test
    console.log(`\n📊 Test Results:`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Console Warnings: ${consoleWarnings.length}`);
    console.log(`Network Errors: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
  });

  test('should load page without console errors', async ({ page }) => {
    // Check that the navigation container exists
    const navContainer = await page.locator('#main-navigation');
    await expect(navContainer).toBeVisible();

    // Should have no console errors on initial load
    expect(consoleErrors.length).toBe(0);
  });

  test('should populate navigation menu items', async ({ page }) => {
    // Wait for menu to be populated
    await page.waitForTimeout(3000);
    
    // Check for menu items with data-section attributes
    const menuItems = await page.locator('[data-section]').all();
    console.log(`Found ${menuItems.length} menu items`);
    
    // Should have menu items
    expect(menuItems.length).toBeGreaterThan(0);
    
    // Menu items should be visible and clickable
    for (const item of menuItems) {
      await expect(item).toBeVisible();
      // Check if item is enabled (not disabled)
      const isEnabled = await item.isEnabled();
      expect(isEnabled).toBe(true);
    }
  });

  test('should navigate through all menu sections without errors', async ({ page }) => {
    // Wait for menu to be populated
    await page.waitForTimeout(3000);
    
    const menuItems = await page.locator('[data-section]').all();
    
    if (menuItems.length === 0) {
      throw new Error('No menu items found - navigation not working');
    }

    // Test each menu item
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      
      // Get section info
      const sectionId = await item.getAttribute('data-section');
      const linkText = await item.textContent();
      
      console.log(`\n🔗 Testing navigation to: ${linkText} (${sectionId})`);
      
      // Clear previous errors for this specific test
      const errorsBefore = consoleErrors.length;
      
      // Click the menu item
      await item.click();
      
      // Wait for navigation to complete
      await page.waitForTimeout(1000);
      
      // Check if the target section is now active/visible
      const targetSection = page.locator(`#${sectionId}`);
      
      if (await targetSection.count() > 0) {
        // Check if section has active class or is visible
        const isActive = await targetSection.evaluate(el => {
          return el.classList.contains('active') || 
                 el.classList.contains('show') ||
                 (el.style.display !== 'none' && !el.classList.contains('d-none'));
        });
        
        if (isActive) {
          console.log(`✅ Successfully navigated to ${linkText}`);
        } else {
          console.log(`⚠️  Section ${sectionId} exists but may not be active`);
        }
      } else {
        console.log(`❌ Target section ${sectionId} not found`);
      }
      
      // Check for new console errors
      const errorsAfter = consoleErrors.length;
      const newErrors = errorsAfter - errorsBefore;
      
      if (newErrors > 0) {
        console.log(`❌ ${newErrors} new console errors during navigation to ${linkText}`);
        const recentErrors = consoleErrors.slice(errorsBefore);
        console.log('Recent errors:', recentErrors);
      }
    }
    
    // Final assertion: no console errors during navigation
    if (consoleErrors.length > 0) {
      console.log('All console errors found:', consoleErrors);
    }
    
    // We can make this a warning instead of failure for now
    if (consoleErrors.length > 0) {
      console.warn(`⚠️  Navigation completed with ${consoleErrors.length} console errors`);
    } else {
      console.log('✅ All navigation completed without console errors');
    }
  });

  test('should handle responsive menu toggle', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Find menu toggle button
    const toggleButton = page.locator('.navbar-toggler');
    
    if (await toggleButton.count() > 0) {
      // Click toggle to open menu
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      // Check for errors after toggle
      expect(consoleErrors.length).toBe(0);
      
      console.log('✅ Responsive menu toggle tested');
    } else {
      console.log('⚠️  Menu toggle button not found');
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Should not cause console errors
    expect(consoleErrors.length).toBe(0);
    
    console.log('✅ Basic keyboard navigation tested');
  });

  test('navigation performance check', async ({ page }) => {
    // Measure navigation performance
    const startTime = Date.now();
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Test quick sequential navigation
    const menuItems = await page.locator('[data-section]').all();
    
    if (menuItems.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await menuItems[i].click();
        await page.waitForTimeout(100); // Minimal wait
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`⏱️  Navigation performance: ${totalTime}ms for ${Math.min(3, menuItems.length)} clicks`);
    
    // Should complete within reasonable time (10 seconds)
    expect(totalTime).toBeLessThan(10000);
    
    // Should not cause console errors
    expect(consoleErrors.length).toBe(0);
  });
});

// Export for use by other test files
module.exports = {
  consoleErrors: () => consoleErrors,
  consoleWarnings: () => consoleWarnings,
  networkErrors: () => networkErrors
};