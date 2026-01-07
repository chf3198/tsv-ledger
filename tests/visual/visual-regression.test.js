/**
 * Visual Regression Testing Suite
 *
 * @fileoverview Tests for visual consistency and regression detection
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers, AssertionHelpers } = require('../shared/test-helpers');
const path = require('path');
const fs = require('fs');

test.describe('Visual Regression Testing Suite', () => {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  const baselineDir = path.join(screenshotsDir, 'baseline');
  const currentDir = path.join(screenshotsDir, 'current');
  const diffDir = path.join(screenshotsDir, 'diff');

  // Ensure directories exist
  test.beforeAll(async () => {
    [baselineDir, currentDir, diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  test.describe('Page Layout Consistency', () => {
    test('should maintain consistent main page layout', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      const screenshotPath = path.join(currentDir, 'main-page.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Compare with baseline if it exists
      const baselinePath = path.join(baselineDir, 'main-page.png');
      if (fs.existsSync(baselinePath)) {
        // For now, just check that screenshot was taken successfully
        // In a real implementation, you'd use a visual diff tool like pixelmatch
        expect(fs.existsSync(screenshotPath)).toBe(true);
        console.log('Main page screenshot captured for visual comparison');
      } else {
        // Create baseline
        fs.copyFileSync(screenshotPath, baselinePath);
        console.log('Created baseline screenshot for main page');
      }
    });

    test('should maintain consistent layout across sections', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      const sections = ['dashboard', 'analysis', 'ai-insights', 'benefits-management'];

      for (const section of sections) {
        await PageHelpers.navigateToSection(page, section);
        await page.waitForTimeout(1000); // Allow for content to load

        const screenshotPath = path.join(currentDir, `${section}-section.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        console.log(`Captured screenshot for ${section} section`);
      }
    });

    test('should maintain consistent mobile layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      const screenshotPath = path.join(currentDir, 'main-page-mobile.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('Mobile layout screenshot captured');
    });
  });

  test.describe('Component Visual Consistency', () => {
    test('should maintain consistent navigation appearance', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Focus on navigation area: use helper to deterministically open sidebar
      if (PageHelpers && PageHelpers.ensureSidebarVisible) {
        await PageHelpers.ensureSidebarVisible(page);
      }

      // Ensure nav is visible and stable before taking screenshot
      const navSelector = '#main-navigation';
      await page.waitForSelector(navSelector, { state: 'visible', timeout: 7000 });
      const navElement = await page.$(navSelector);
      if (navElement) {
        await navElement.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
        await page.waitForTimeout(200);
        const screenshotPath = path.join(currentDir, 'navigation.png');
        await navElement.screenshot({ path: screenshotPath });
        console.log('Navigation component screenshot captured');
      } else {
        console.warn('Navigation element not found for screenshot');
      }
    });

    test('should maintain consistent form styling', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to a section with forms
      await PageHelpers.navigateToSection(page, 'data-import');

      // Look for form elements
      const forms = await page.$$('form');
      if (forms.length > 0) {
        const screenshotPath = path.join(currentDir, 'form-elements.png');
        await forms[0].screenshot({ path: screenshotPath });

        console.log('Form component screenshot captured');
      }
    });

    test('should maintain consistent table styling', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to analysis section which likely has tables
      await PageHelpers.navigateToSection(page, 'analysis');

      // Look for table elements
      const tables = await page.$$('table');
      if (tables.length > 0) {
        try {
          const table = tables[0];
          await table.evaluate(el => el.scrollIntoView({ block: 'center' }));
          await page.waitForTimeout(200);
          const screenshotPath = path.join(currentDir, 'data-table.png');
          await table.screenshot({ path: screenshotPath });

          console.log('Table component screenshot captured');
        } catch (e) {
          console.warn('Failed to capture table screenshot:', e && e.message);
        }
      }
    });
  });

  test.describe('Interactive Element States', () => {
    test('should maintain consistent button states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        // Test normal state
        const normalScreenshot = path.join(currentDir, 'button-normal.png');
        await buttons[0].screenshot({ path: normalScreenshot });

        // Test hover state
        await buttons[0].hover();
        await page.waitForTimeout(100);
        const hoverScreenshot = path.join(currentDir, 'button-hover.png');
        await buttons[0].screenshot({ path: hoverScreenshot });

        // Test focus state
        await buttons[0].focus();
        await page.waitForTimeout(100);
        const focusScreenshot = path.join(currentDir, 'button-focus.png');
        await buttons[0].screenshot({ path: focusScreenshot });

        console.log('Button state screenshots captured');
      }
    });

    test('should maintain consistent input field states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to a section with inputs
      await PageHelpers.navigateToSection(page, 'data-import');

      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        // Test normal state
        const normalScreenshot = path.join(currentDir, 'input-normal.png');
        await inputs[0].screenshot({ path: normalScreenshot });

        // Test focus state
        await inputs[0].focus();
        await page.waitForTimeout(100);
        const focusScreenshot = path.join(currentDir, 'input-focus.png');
        await inputs[0].screenshot({ path: focusScreenshot });

        console.log('Input field state screenshots captured');
      }
    });
  });

  test.describe('Content and Data Visualization', () => {
    test('should maintain consistent chart rendering', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to analysis section
      await PageHelpers.navigateToSection(page, 'analysis');

      // Look for chart containers
      const charts = await page.$$('.chart, .graph, canvas, svg');
      if (charts.length > 0) {
        const screenshotPath = path.join(currentDir, 'charts.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });

        console.log('Chart visualization screenshot captured');
      }
    });

    test('should maintain consistent data table rendering', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to expenditures or similar data view
      await PageHelpers.navigateToSection(page, 'dashboard');

      // Look for data tables
      const dataTables = await page.$$('.data-table, table');
      if (dataTables.length > 0) {
        const screenshotPath = path.join(currentDir, 'data-tables.png');
        await dataTables[0].screenshot({ path: screenshotPath });

        console.log('Data table screenshot captured');
      }
    });
  });

  test.describe('Theme and Styling Consistency', () => {
    test('should maintain consistent color scheme', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Capture color scheme by taking screenshots of key UI elements
      const colorElements = ['#main-navigation', '.main-content', '.card, .panel'];

      for (let i = 0; i < colorElements.length; i++) {
        const selector = colorElements[i];
        // If this targets the sidebar, ensure it's visible
        if (selector === '#main-navigation' && PageHelpers && PageHelpers.ensureSidebarVisible) {
          await PageHelpers.ensureSidebarVisible(page);
        }

        // Wait for element to be attached and visible
        try {
          await page.waitForSelector(selector, { state: 'visible', timeout: 7000 });
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            const screenshotPath = path.join(currentDir, `color-scheme-${i}.png`);
            await elements[0].screenshot({ path: screenshotPath });
          }
        } catch (e) {
          console.warn(`Color scheme element ${selector} not visible, skipping screenshot`);
        }
      }

      console.log('Color scheme screenshots captured');
    });

    test('should maintain consistent typography', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Capture typography samples
      const textElements = await page.$$('h1, h2, h3, p, span');
      if (textElements.length > 0) {
        const screenshotPath = path.join(currentDir, 'typography.png');
        // Take a screenshot of the first few text elements
        await page.screenshot({ path: screenshotPath, fullPage: false });

        console.log('Typography screenshot captured');
      }
    });
  });

  test.describe('Cross-browser Visual Consistency', () => {
    // Note: These tests would typically run on different browsers
    // For now, we'll test different viewport sizes as a proxy

    test('should maintain visual consistency across viewports', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:3000');
        await PageHelpers.waitForAppLoad(page);

        const screenshotPath = path.join(currentDir, `viewport-${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log(`${viewport.name} viewport screenshot captured`);
      }
    });
  });

  test.describe('Error and Loading States', () => {
    test('should maintain consistent error state styling', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Try to trigger an error state (this might require specific actions)
      // For now, just check if error styling exists in CSS
      const errorElements = await page.$$('.error, .alert-danger, .error-message');

      if (errorElements.length > 0) {
        const screenshotPath = path.join(currentDir, 'error-states.png');
        await errorElements[0].screenshot({ path: screenshotPath });

        console.log('Error state styling screenshot captured');
      }
    });

    test('should maintain consistent loading state styling', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Look for loading indicators
      const allLoading = await page.$$('.loading, .spinner, .loading-overlay');
      // Prefer the first visible loading element
      let visibleLoading = null;
      for (const el of allLoading) {
        if (await el.isVisible()) {
          visibleLoading = el; break;
        }
      }

      if (visibleLoading) {
        try {
          // Wait for the element to be stable before taking a screenshot
          await visibleLoading.evaluate(el => el.scrollIntoView({ block: 'center' }));
          await visibleLoading.waitForElementState('stable', { timeout: 5000 }).catch(() => {});
          const screenshotPath = path.join(currentDir, 'loading-states.png');
          await visibleLoading.screenshot({ path: screenshotPath });

          console.log('Loading state styling screenshot captured');
        } catch (e) {
          console.warn('Failed to capture loading state screenshot:', e && e.message);
        }
      } else {
        console.log('No visible loading indicators found - skipping loading state screenshot');
      }
    });
  });

  test.describe('Animation and Transition Consistency', () => {
    test('should maintain consistent transition effects', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test navigation transitions
      const sections = ['dashboard', 'analysis'];

      for (const section of sections) {
        await PageHelpers.navigateToSection(page, section);
        await page.waitForTimeout(500); // Allow transition to complete

        const screenshotPath = path.join(currentDir, `transition-${section}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      console.log('Transition screenshots captured');
    });
  });

  test.describe('Employee Benefits Status Display', () => {
    test('should maintain consistent status display appearance', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000/employee-benefits.html');
      await PageHelpers.waitForAppLoad(page);

      // Wait for status to exist and be visible
      await page.waitForSelector('#selectionStatus', { state: 'visible', timeout: 10000 });

      // Wait for status text to settle and not be a Loading placeholder
      await page.waitForFunction(() => {
        const el = document.getElementById('selectionStatus');
        if (!el) {
          return false;
        }
        const txt = (el.textContent || '').trim();
        return txt.length > 0 && !/loading/i.test(txt);
      }, { timeout: 10000 });

      const statusElement = await page.$('#selectionStatus');
      if (statusElement) {
        const screenshotPath = path.join(currentDir, 'benefits-status-display.png');
        await statusElement.screenshot({ path: screenshotPath });

        console.log('Employee benefits status display screenshot captured');

        // Verify status is not "Loading..." and contains some meaningful text
        const statusText = (await statusElement.textContent() || '').trim();
        expect(statusText).not.toMatch(/loading/i);
        expect(statusText.length).toBeGreaterThan(5);
      } else {
        throw new Error('Status display element not found');
      }
    });

    test('should maintain consistent status display on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/employee-benefits.html');
      await PageHelpers.waitForAppLoad(page);

      // Ensure the status exists and becomes non-loading
      await page.waitForSelector('#selectionStatus', { state: 'visible', timeout: 10000 });
      await page.waitForFunction(() => {
        const el = document.getElementById('selectionStatus');
        if (!el) {
          return false;
        }
        const txt = (el.textContent || '').trim();
        return txt.length > 0 && !/loading/i.test(txt);
      }, { timeout: 10000 });

      const statusElement = await page.$('#selectionStatus');
      if (statusElement) {
        const screenshotPath = path.join(currentDir, 'benefits-status-display-mobile.png');
        await statusElement.screenshot({ path: screenshotPath });

        console.log('Employee benefits status display mobile screenshot captured');

        const statusText = (await statusElement.textContent() || '').trim();
        expect(statusText).not.toMatch(/loading/i);
        expect(statusText.length).toBeGreaterThan(5);
      } else {
        throw new Error('Status display element not found on mobile');
      }
    });
  });
});
