# Cross-Browser Testing

## Overview

Cross-browser testing ensures consistent functionality and appearance across different browsers and versions. TSV Ledger must work correctly on all supported browsers with identical behavior and visual consistency.

## Browser Support Matrix

### Supported Browsers
- **Chrome**: Latest 2 versions + current version
- **Firefox**: Latest 2 versions + current version
- **Safari**: Latest 2 versions + current version
- **Edge**: Latest 2 versions + current version

### Browser Configuration
```javascript
// playwright.config.js
module.exports = {
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    },
    {
      name: 'Microsoft Edge',
      use: { browserName: 'chromium', channel: 'msedge' }
    }
  ]
};
```

## Cross-Browser Test Structure

### Shared Test Logic
```javascript
// tests/e2e/cross-browser.spec.js
const { test } = require('@playwright/test');

test.describe('Cross-Browser Compatibility', () => {
  // Tests that run on all browsers
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle user login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Browser-Specific Tests
```javascript
test.describe('Browser-Specific Features', () => {
  test('should work with Chrome extensions', async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    // Test Chrome extension compatibility
    // Verify extension APIs work correctly
  });

  test('should handle Safari privacy features', async ({ browserName, page }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    // Test Safari Intelligent Tracking Prevention
    // Verify cookie and storage behavior
  });
});
```

## Visual Consistency Testing

### Screenshot Comparison
```javascript
test('should maintain visual consistency', async ({ page, browserName }) => {
  await page.goto('/dashboard');

  // Take screenshot for comparison
  const screenshot = await page.screenshot({
    fullPage: true
  });

  // Compare with baseline (would be stored per browser)
  // expect(screenshot).toMatchSnapshot(`${browserName}-dashboard.png`);
});
```

### Layout Testing
```javascript
test('should maintain layout across browsers', async ({ page }) => {
  await page.goto('/transactions');

  // Check critical layout elements
  const headerHeight = await page.locator('header').boundingBox();
  const sidebarWidth = await page.locator('.sidebar').boundingBox();
  const contentArea = await page.locator('.main-content').boundingBox();

  // Verify layout proportions are consistent
  expect(headerHeight.height).toBeGreaterThan(50);
  expect(sidebarWidth.width).toBeGreaterThan(200);
  expect(contentArea.width).toBeGreaterThan(600);
});
```

## JavaScript Compatibility

### ES6+ Feature Testing
```javascript
test('should support modern JavaScript features', async ({ page }) => {
  // Test async/await
  const asyncResult = await page.evaluate(async () => {
    const result = await Promise.resolve('test');
    return result;
  });
  expect(asyncResult).toBe('test');

  // Test arrow functions
  const arrowResult = await page.evaluate(() => {
    const arr = [1, 2, 3];
    return arr.map(x => x * 2);
  });
  expect(arrowResult).toEqual([2, 4, 6]);

  // Test destructuring
  const destructuringResult = await page.evaluate(() => {
    const { a, b } = { a: 1, b: 2 };
    return a + b;
  });
  expect(destructuringResult).toBe(3);
});
```

### API Compatibility
```javascript
test('should support required browser APIs', async ({ page }) => {
  // Test Fetch API
  const fetchSupport = await page.evaluate(() => {
    return typeof window.fetch !== 'undefined';
  });
  expect(fetchSupport).toBe(true);

  // Test localStorage
  const storageSupport = await page.evaluate(() => {
    try {
      localStorage.setItem('test', 'value');
      const result = localStorage.getItem('test');
      localStorage.removeItem('test');
      return result === 'value';
    } catch (e) {
      return false;
    }
  });
  expect(storageSupport).toBe(true);

  // Test WebSocket (if used)
  const wsSupport = await page.evaluate(() => {
    return typeof WebSocket !== 'undefined';
  });
  expect(wsSupport).toBe(true);
});
```

## CSS and Styling Compatibility

### CSS Feature Support
```javascript
test('should support CSS Grid and Flexbox', async ({ page }) => {
  await page.setContent(`
    <div class="grid-container">
      <div class="grid-item">1</div>
      <div class="grid-item">2</div>
    </div>
    <style>
      .grid-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .flex-container {
        display: flex;
        justify-content: space-between;
      }
    </style>
  `);

  // Verify grid layout works
  const gridItems = page.locator('.grid-item');
  const firstItem = await gridItems.first().boundingBox();
  const secondItem = await gridItems.last().boundingBox();

  // Items should be side by side (grid working)
  expect(Math.abs(firstItem.x - secondItem.x)).toBeGreaterThan(firstItem.width);
});
```

### Font and Typography
```javascript
test('should render fonts consistently', async ({ page }) => {
  await page.goto('/dashboard');

  // Check font loading
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check('12px "Inter", sans-serif');
  });

  // Verify text is readable
  const headingText = await page.locator('h1').textContent();
  expect(headingText).toBeTruthy();

  // Check for font fallback issues
  const computedFont = await page.locator('body').evaluate(el => {
    return window.getComputedStyle(el).fontFamily;
  });

  expect(computedFont).toMatch(/Inter|sans-serif/);
});
```

## Form and Input Handling

### Form Element Compatibility
```javascript
test('should handle form inputs consistently', async ({ page }) => {
  await page.goto('/transactions/new');

  // Test text inputs
  await page.fill('[data-testid="description"]', 'Test transaction');
  const descriptionValue = await page.inputValue('[data-testid="description"]');
  expect(descriptionValue).toBe('Test transaction');

  // Test number inputs
  await page.fill('[data-testid="amount"]', '123.45');
  const amountValue = await page.inputValue('[data-testid="amount"]');
  expect(amountValue).toBe('123.45');

  // Test date inputs
  await page.fill('[data-testid="date"]', '2023-12-01');
  const dateValue = await page.inputValue('[data-testid="date"]');
  expect(dateValue).toBe('2023-12-01');

  // Test select dropdowns
  await page.selectOption('[data-testid="category"]', 'Office');
  const selectedValue = await page.inputValue('[data-testid="category"]');
  expect(selectedValue).toBe('Office');
});
```

### File Upload Compatibility
```javascript
test('should handle file uploads', async ({ page }) => {
  await page.goto('/import');

  // Upload a test file
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles('./test-data/sample.csv');

  // Verify file was accepted
  const files = await fileInput.evaluate(el => el.files);
  expect(files.length).toBe(1);
  expect(files[0].name).toBe('sample.csv');
});
```

## Event Handling

### Click and Interaction Events
```javascript
test('should handle click events consistently', async ({ page }) => {
  await page.goto('/dashboard');

  // Test button clicks
  await page.click('[data-testid="add-transaction-button"]');
  await expect(page).toHaveURL('/transactions/new');

  // Test link navigation
  await page.goBack();
  await page.click('[data-testid="transactions-link"]');
  await expect(page).toHaveURL('/transactions');

  // Test form submission
  await page.click('[data-testid="new-transaction-submit"]');
  // Verify form validation or submission
});
```

### Keyboard Navigation
```javascript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/transactions/new');

  // Tab through form fields
  await page.keyboard.press('Tab'); // Focus first field
  await page.keyboard.type('Test Description');
  await page.keyboard.press('Tab');
  await page.keyboard.type('99.99');

  // Submit with Enter
  await page.keyboard.press('Enter');

  // Verify form submission
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Network and AJAX Handling

### XMLHttpRequest and Fetch
```javascript
test('should handle AJAX requests', async ({ page }) => {
  // Intercept network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push(request.url());
    }
  });

  await page.goto('/transactions');

  // Trigger data loading
  await page.click('[data-testid="load-more-button"]');

  // Verify API calls were made
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.some(url => url.includes('/api/transactions'))).toBe(true);
});
```

### CORS and Security
```javascript
test('should handle CORS correctly', async ({ page }) => {
  // Test cross-origin requests if applicable
  const corsError = await page.evaluate(async () => {
    try {
      const response = await fetch('https://api.example.com/data');
      return response.ok;
    } catch (error) {
      return error.message;
    }
  });

  // Verify CORS behavior is consistent
  // (This would depend on your CORS configuration)
});
```

## Browser-Specific Issues

### Chrome-Specific Testing
```javascript
test('Chrome-specific features', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium');

  // Test Chrome extension APIs
  // Test Chrome-specific CSS features
  // Test Chrome performance APIs
});
```

### Firefox-Specific Testing
```javascript
test('Firefox-specific features', async ({ browserName, page }) => {
  test.skip(browserName !== 'firefox');

  // Test Firefox-specific APIs
  // Test Firefox privacy features
  // Test Firefox developer tools compatibility
});
```

### Safari-Specific Testing
```javascript
test('Safari-specific features', async ({ browserName, page }) => {
  test.skip(browserName !== 'webkit');

  // Test Safari privacy features
  // Test Safari-specific CSS issues
  // Test iOS Safari touch events
});
```

### Edge-Specific Testing
```javascript
test('Edge-specific features', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium' || channel !== 'msedge');

  // Test Edge-specific features
  // Test Microsoft integration points
});
```

## Performance Consistency

### Load Time Testing
```javascript
test('should load within acceptable time', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/dashboard', { waitUntil: 'networkidle' });

  const loadTime = Date.now() - startTime;

  // Different browsers may have different load times
  // Set browser-specific thresholds
  const thresholds = {
    chromium: 3000,
    firefox: 4000,
    webkit: 3500
  };

  expect(loadTime).toBeLessThan(thresholds[browserName] || 5000);
});
```

### Memory Usage
```javascript
test('should not have memory leaks', async ({ page, browserName }) => {
  // Navigate through multiple pages
  await page.goto('/dashboard');
  await page.goto('/transactions');
  await page.goto('/reports');

  // Check for memory issues (limited browser support)
  const memoryInfo = await page.evaluate(() => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  });

  if (memoryInfo) {
    const usageRatio = memoryInfo.used / memoryInfo.limit;
    expect(usageRatio).toBeLessThan(0.8); // Less than 80% heap usage
  }
});
```

## Automated Cross-Browser Testing

### CI/CD Integration
```yaml
# .github/workflows/cross-browser.yml
name: Cross-Browser Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
```

### Parallel Test Execution
```javascript
// playwright.config.js
module.exports = {
  workers: process.env.CI ? 2 : undefined, // Parallel workers
  shard: process.env.CI ? { current: 1, total: 3 } : undefined, // Test sharding
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

## Browser Version Testing

### Version-Specific Tests
```javascript
test('should work on different browser versions', async ({ browser }) => {
  // Test with specific browser versions if needed
  const version = await browser.version();
  console.log(`Testing with browser version: ${version}`);

  // Version-specific logic can be added here
});
```

This comprehensive cross-browser testing ensures TSV Ledger provides a consistent, high-quality experience across all supported browsers and versions.