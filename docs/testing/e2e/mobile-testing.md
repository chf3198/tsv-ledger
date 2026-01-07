# Mobile Testing

## Overview

Mobile testing ensures TSV Ledger works correctly on mobile devices and tablets, providing an optimal experience for users on smartphones and touch-based devices. All functionality must be accessible and usable on mobile platforms.

## Mobile Device Configuration

### Playwright Mobile Emulation
```javascript
// playwright.config.js
module.exports = {
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    },
    {
      name: 'Mobile Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 375, height: 667 }
      }
    },
    {
      name: 'Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 }
      }
    }
  ]
};
```

### Device Presets
```javascript
const devices = {
  iPhone12: {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  iPad: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  SamsungGalaxy: {
    viewport: { width: 360, height: 640 },
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
  }
};
```

## Touch and Gesture Testing

### Touch Event Handling
```javascript
test('should handle touch events', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Touch events not supported in Firefox');

  await page.goto('/transactions');

  // Simulate touch tap
  await page.tap('[data-testid="transaction-item"]:first-child');

  // Verify item selection or navigation
  await expect(page.locator('[data-testid="transaction-detail"]')).toBeVisible();
});
```

### Swipe Gestures
```javascript
test('should support swipe gestures', async ({ page }) => {
  await page.goto('/transactions');

  // Swipe to delete (if implemented)
  const transactionItem = page.locator('[data-testid="transaction-item"]:first-child');

  // Simulate swipe left
  await transactionItem.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 100 }] });
  await transactionItem.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 100 }] });
  await transactionItem.dispatchEvent('touchend', { touches: [] });

  // Verify delete action appears
  await expect(page.locator('[data-testid="delete-action"]')).toBeVisible();
});
```

### Pinch and Zoom
```javascript
test('should handle pinch-to-zoom', async ({ page }) => {
  await page.goto('/dashboard');

  // Simulate pinch gesture (if zoom is supported)
  const viewport = page.viewportSize();
  if (viewport) {
    // Zoom in
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });

    // Verify layout adapts
    const contentWidth = await page.locator('.main-content').boundingBox();
    expect(contentWidth.width).toBeGreaterThan(viewport.width * 0.8);
  }
});
```

## Mobile Navigation Testing

### Hamburger Menu
```javascript
test('should work with mobile hamburger menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // Mobile size

  await loginUser(page, 'user@example.com', 'password');

  // Open hamburger menu
  await page.click('[data-testid="hamburger-menu"]');

  // Verify menu is visible
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

  // Navigate using mobile menu
  await page.click('[data-testid="mobile-menu-transactions"]');
  await expect(page).toHaveURL('/transactions');

  // Close menu
  await page.click('[data-testid="menu-close"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
});
```

### Bottom Navigation
```javascript
test('should support bottom navigation bar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await loginUser(page, 'user@example.com', 'password');

  // Test bottom navigation tabs
  const navTabs = ['dashboard', 'transactions', 'reports', 'settings'];

  for (const tab of navTabs) {
    await page.click(`[data-testid="bottom-nav-${tab}"]`);
    await expect(page).toHaveURL(`/${tab === 'dashboard' ? '' : tab}`);
  }
});
```

### Back Navigation
```javascript
test('should handle mobile back navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/dashboard');
  await page.click('[data-testid="transactions-link"]');
  await expect(page).toHaveURL('/transactions');

  // Use browser back button
  await page.goBack();
  await expect(page).toHaveURL('/dashboard');

  // Test mobile-specific back button if present
  const backButton = page.locator('[data-testid="mobile-back-button"]');
  if (await backButton.isVisible()) {
    await page.click('[data-testid="mobile-back-button"]');
    await expect(page).toHaveURL('/dashboard');
  }
});
```

## Responsive Design Testing

### Breakpoint Testing
```javascript
const breakpoints = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1200, height: 800 }
];

breakpoints.forEach(({ name, width, height }) => {
  test(`should adapt to ${name} breakpoint`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/dashboard');

    // Verify layout adapts appropriately
    if (width < 768) {
      // Mobile layout checks
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();
    } else if (width < 1200) {
      // Tablet layout checks
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    } else {
      // Desktop layout checks
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    }
  });
});
```

### Fluid Layout Testing
```javascript
test('should maintain usability across screen sizes', async ({ page }) => {
  const sizes = [
    { width: 320, height: 568 }, // iPhone SE
    { width: 375, height: 667 }, // iPhone 6/7/8
    { width: 414, height: 896 }, // iPhone 11
    { width: 768, height: 1024 }, // iPad
    { width: 1024, height: 1366 } // iPad Pro
  ];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/transactions');

    // Verify critical elements are accessible
    await expect(page.locator('[data-testid="add-transaction-button"]')).toBeVisible();

    // Verify text is readable (not too small)
    const buttonFontSize = await page.locator('[data-testid="add-transaction-button"]').evaluate(el => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(buttonFontSize).toBeGreaterThanOrEqual(14); // Minimum readable size

    // Verify no horizontal scroll on mobile
    const bodyScrollWidth = await page.evaluate(() => {
      return document.body.scrollWidth;
    });
    expect(bodyScrollWidth).toBeLessThanOrEqual(size.width);
  }
});
```

## Mobile Form Handling

### Virtual Keyboard Testing
```javascript
test('should handle virtual keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions/new');

  // Focus input field
  await page.click('[data-testid="amount-input"]');

  // Type using virtual keyboard simulation
  await page.keyboard.type('99.99');

  // Verify input value
  const inputValue = await page.inputValue('[data-testid="amount-input"]');
  expect(inputValue).toBe('99.99');

  // Verify viewport adjusts for keyboard (if implemented)
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(viewportHeight).toBeLessThan(667); // Keyboard should reduce viewport
});
```

### Input Type Optimization
```javascript
test('should use appropriate input types', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions/new');

  // Verify numeric input shows number keypad
  const amountInput = page.locator('[data-testid="amount-input"]');
  const inputType = await amountInput.getAttribute('type');
  expect(inputType).toBe('number');

  // Verify date input shows date picker
  const dateInput = page.locator('[data-testid="date-input"]');
  const dateType = await dateInput.getAttribute('type');
  expect(dateType).toBe('date');

  // Verify email input shows email keypad
  const emailInput = page.locator('[data-testid="email-input"]');
  const emailType = await emailInput.getAttribute('type');
  expect(emailType).toBe('email');
});
```

## Mobile Performance Testing

### Mobile Loading Performance
```javascript
test('should load quickly on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  const startTime = Date.now();

  await page.goto('/dashboard', {
    waitUntil: 'networkidle',
    // Simulate slower mobile network
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });

  const loadTime = Date.now() - startTime;

  // Mobile should load within 3 seconds
  expect(loadTime).toBeLessThan(3000);
});
```

### Touch Responsiveness
```javascript
test('should respond quickly to touch', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions');

  const button = page.locator('[data-testid="add-transaction-button"]');

  // Measure touch response time
  const startTime = Date.now();
  await button.tap();
  const responseTime = Date.now() - startTime;

  // Should respond within 100ms
  expect(responseTime).toBeLessThan(100);

  // Verify navigation occurred
  await expect(page).toHaveURL('/transactions/new');
});
```

## Mobile-Specific Features

### Pull to Refresh
```javascript
test('should support pull-to-refresh', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions');

  // Simulate pull-to-refresh gesture
  const content = page.locator('.transaction-list');

  // Touch start at top
  await content.dispatchEvent('touchstart', {
    touches: [{ clientX: 200, clientY: 50 }]
  });

  // Drag down
  await content.dispatchEvent('touchmove', {
    touches: [{ clientX: 200, clientY: 150 }]
  });

  // Release
  await content.dispatchEvent('touchend', {
    touches: []
  });

  // Verify refresh occurred (if implemented)
  await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
});
```

### Offline Support
```javascript
test('should work offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  // Go online first to load app
  await page.goto('/dashboard');
  await loginUser(page, 'user@example.com', 'password');

  // Simulate going offline
  await context.setOffline(true);

  // Try to access cached data
  await page.click('[data-testid="transactions-link"]');

  // Verify offline message or cached content
  await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

  // Or verify cached transactions are shown
  await expect(page.locator('[data-testid="cached-transactions"]')).toBeVisible();
});
```

## Mobile Browser Compatibility

### iOS Safari Testing
```javascript
test('iOS Safari compatibility', async ({ browserName, page }) => {
  test.skip(browserName !== 'webkit');

  await page.setViewportSize({ width: 375, height: 667 });

  // Test iOS-specific features
  await page.goto('/dashboard');

  // Verify Safari handles CSS correctly
  const safariStyles = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.webkitAppearance = 'none'; // iOS-specific property
    document.body.appendChild(el);
    const computed = window.getComputedStyle(el);
    document.body.removeChild(el);
    return computed.webkitAppearance;
  });

  // Test iOS touch events
  await page.tap('[data-testid="menu-button"]');
  await expect(page.locator('[data-testid="menu"]')).toBeVisible();
});
```

### Android Chrome Testing
```javascript
test('Android Chrome compatibility', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium');

  await page.setViewportSize({ width: 360, height: 640 });

  // Set Android user agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
  });

  await page.goto('/dashboard');

  // Test Android-specific features
  // Verify Chrome mobile UI elements work
  // Test Android back button handling
});
```

## Accessibility on Mobile

### Touch Target Sizes
```javascript
test('should have adequate touch target sizes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions');

  // Check button sizes
  const buttons = await page.locator('button, [role="button"]').all();

  for (const button of buttons) {
    const box = await button.boundingBox();
    if (box) {
      // Minimum 44px touch target (Apple guideline)
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});
```

### Screen Reader Support
```javascript
test('should support screen readers on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions/new');

  // Verify ARIA labels
  const amountInput = page.locator('[data-testid="amount-input"]');
  const ariaLabel = await amountInput.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();

  // Verify form labels are associated
  const amountLabel = await amountInput.getAttribute('id');
  const labelFor = await page.locator(`label[for="${amountLabel}"]`).textContent();
  expect(labelFor).toBeTruthy();
});
```

## Mobile Network Testing

### Slow Network Simulation
```javascript
test('should work on slow mobile networks', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  // Simulate slow 3G network
  await page.route('**/*', async route => {
    // Add delay to simulate slow network
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });

  const startTime = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - startTime;

  // Should still load within reasonable time
  expect(loadTime).toBeLessThan(10000); // 10 seconds max

  // Verify loading indicators are shown
  await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
});
```

### Network Interruption Handling
```javascript
test('should handle network interruptions', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/transactions/new');

  // Fill form
  await page.fill('[data-testid="description"]', 'Test transaction');
  await page.fill('[data-testid="amount"]', '50.00');

  // Simulate network loss during submission
  await context.setOffline(true);

  await page.click('[data-testid="save-button"]');

  // Should show offline message
  await expect(page.locator('[data-testid="offline-error"]')).toBeVisible();

  // Restore connection and retry
  await context.setOffline(false);
  await page.click('[data-testid="retry-button"]');

  // Should succeed after reconnection
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

This comprehensive mobile testing ensures TSV Ledger provides an excellent user experience across all mobile devices and platforms.