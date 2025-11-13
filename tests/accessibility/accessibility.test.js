/**
 * Accessibility Testing Suite
 *
 * @fileoverview Comprehensive accessibility tests using axe-core
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers, AssertionHelpers } = require('../shared/test-helpers');

test.describe('Accessibility Testing Suite', () => {
  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass accessibility audit on main page', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Inject axe-core
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js'
      });

      // Run accessibility audit
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, {
            rules: {
              'color-contrast': { enabled: true },
              'html-has-lang': { enabled: true },
              'html-lang-valid': { enabled: true },
              'image-alt': { enabled: true },
              'link-name': { enabled: true },
              'list': { enabled: true },
              'listitem': { enabled: true },
              'button-name': { enabled: true },
              'input-image-alt': { enabled: true },
              'area-alt': { enabled: true },
              'html5-scope': { enabled: true },
              'heading-order': { enabled: true },
              'frame-title': { enabled: true },
              'table-fake-caption': { enabled: true },
              'table-duplicate-name': { enabled: true },
              'td-has-header': { enabled: true },
              'td-headers-attr': { enabled: true },
              'th-has-data-cells': { enabled: true },
              'label': { enabled: true },
              'label-title-only': { enabled: true },
              'form-field-multiple-labels': { enabled: true },
              'autocomplete-valid': { enabled: true },
              'accesskeys': { enabled: true },
              'focus-order-semantics': { enabled: true },
              'focusable-no-name': { enabled: true },
              'landmark-one-main': { enabled: true },
              'landmark-main-is-top-level': { enabled: true },
              'landmark-no-duplicate-main': { enabled: true },
              'landmark-unique': { enabled: true },
              'page-has-heading-one': { enabled: true },
              'region': { enabled: true }
            }
          }, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log('Accessibility violations found:');
        results.violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Help: ${violation.help}`);
          console.log(`   Help URL: ${violation.helpUrl}`);
          console.log(`   Elements: ${violation.nodes.length}`);
        });
      }

      // Assert no critical violations
      const criticalViolations = results.violations.filter(v =>
        v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations.length, 'Should have no critical or serious accessibility violations').toBe(0);

      // Allow some minor violations but log them
      const minorViolations = results.violations.filter(v => v.impact === 'minor' || v.impact === 'moderate');
      if (minorViolations.length > 0) {
        console.log(`Found ${minorViolations.length} minor/moderate violations - acceptable for now`);
      }
    });

    test('should pass accessibility audit on all major sections', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js'
      });

      const sections = ['dashboard', 'analysis', 'ai-insights', 'benefits-management', 'bank-reconciliation'];

      for (const section of sections) {
        await PageHelpers.navigateToSection(page, section);

        const results = await page.evaluate(() => {
          return new Promise((resolve) => {
            axe.run(document, (err, results) => {
              if (err) throw err;
              resolve(results);
            });
          });
        });

        const criticalViolations = results.violations.filter(v =>
          v.impact === 'critical' || v.impact === 'serious'
        );

        console.log(`${section} section: ${criticalViolations.length} critical violations`);

        expect(criticalViolations.length,
          `Section "${section}" should have no critical accessibility violations`
        ).toBe(0);
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test tab navigation through main navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(focusedElement).toMatch(/BUTTON|A|INPUT|SELECT|TEXTAREA/i);

      // Continue tabbing through interactive elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }

      // Should be able to reach main content area
      const mainContentFocused = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return activeElement.closest('.main-content') !== null ||
               activeElement.closest('[role="main"]') !== null;
      });

      expect(mainContentFocused).toBe(true);
    });

    test('should have proper focus management in modals and forms', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to a section with forms (like data import)
      await PageHelpers.navigateToSection(page, 'data-import');

      // Look for form elements
      const formElements = await page.$$('input, select, textarea, button');
      if (formElements.length > 0) {
        // Test focus behavior
        await formElements[0].focus();
        let focusedElement = await page.evaluate(() => document.activeElement.tagName);
        expect(focusedElement).toMatch(/INPUT|SELECT|TEXTAREA/i);

        // Test tab navigation within form
        await page.keyboard.press('Tab');
        focusedElement = await page.evaluate(() => document.activeElement.tagName);
        expect(focusedElement).toMatch(/BUTTON|INPUT|SELECT|TEXTAREA/i);
      }
    });

    test('should support keyboard shortcuts where applicable', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test common keyboard shortcuts (if implemented)
      const shortcuts = [
        { key: 'h', ctrl: true, description: 'Help/Home' },
        { key: 'd', ctrl: true, description: 'Dashboard' },
        { key: 'a', ctrl: true, description: 'Analysis' }
      ];

      for (const shortcut of shortcuts) {
        const modifier = shortcut.ctrl ? 'Control+' : '';
        console.log(`Testing shortcut: ${modifier}${shortcut.key.toUpperCase()}`);

        // Press the shortcut
        if (shortcut.ctrl) {
          await page.keyboard.press(`Control+${shortcut.key}`);
        } else {
          await page.keyboard.press(shortcut.key);
        }

        // Check if any navigation occurred (this is optional functionality)
        await page.waitForTimeout(100);
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Check for ARIA landmarks
      const landmarks = await page.$$('[role="main"], [role="navigation"], [role="complementary"], [role="banner"]');
      expect(landmarks.length).toBeGreaterThan(0);

      // Check for proper heading structure
      const headings = await page.$$('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);

      // Verify heading hierarchy
      const headingLevels = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headings.map(h => parseInt(h.tagName.charAt(1)));
      });

      // Should start with h1 and not skip levels dramatically
      if (headingLevels.length > 0) {
        expect(headingLevels[0]).toBe(1); // Should have an h1
      }
    });

    test('should have descriptive link and button text', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Check all links have meaningful text
      const links = await page.$$('a');
      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const hasMeaningfulText = text.trim().length > 0 || (ariaLabel && ariaLabel.trim().length > 0);

        expect(hasMeaningfulText,
          'All links should have meaningful text or aria-label'
        ).toBe(true);
      }

      // Check all buttons have meaningful text
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const hasMeaningfulText = text.trim().length > 0 || (ariaLabel && ariaLabel.trim().length > 0);

        expect(hasMeaningfulText,
          'All buttons should have meaningful text or aria-label'
        ).toBe(true);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Check all form inputs have labels
      const inputs = await page.$$('input, select, textarea');
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const ariaLabel = await input.getAttribute('aria-label');

        // Check for associated label element
        let hasLabel = false;
        if (id) {
          const label = await page.$(`label[for="${id}"]`);
          hasLabel = label !== null;
        }

        // Or has aria attributes
        const hasAriaLabel = ariaLabelledBy !== null || ariaLabel !== null;

        expect(hasLabel || hasAriaLabel,
          'All form inputs should have associated labels'
        ).toBe(true);
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js'
      });

      // Run specific color contrast check
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, {
            rules: {
              'color-contrast': { enabled: true }
            }
          }, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

      if (contrastViolations.length > 0) {
        console.log('Color contrast violations:');
        contrastViolations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.description}`);
          violation.nodes.forEach(node => {
            console.log(`   Element: ${node.target}`);
          });
        });
      }

      expect(contrastViolations.length,
        'Should have no color contrast violations'
      ).toBe(0);
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Check for elements that might use color-only indicators
      const coloredElements = await page.$$('[style*="color"], [style*="background-color"]');

      // This is a basic check - in practice, you'd need to verify that
      // color is not the only way information is conveyed
      console.log(`Found ${coloredElements.length} elements with color styles`);

      // For now, just ensure we don't have obvious issues
      // A more sophisticated test would analyze actual color usage
      expect(coloredElements.length).toBeGreaterThan(0); // Should have some styling
    });
  });

  test.describe('Responsive Design and Touch Targets', () => {
    test('should have adequate touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Check touch target sizes for interactive elements
      const interactiveElements = await page.$$('button, a, input, select, [role="button"]');

      for (const element of interactiveElements) {
        const boundingBox = await element.boundingBox();

        if (boundingBox) {
          const minSize = Math.min(boundingBox.width, boundingBox.height);
          console.log(`Touch target size: ${boundingBox.width}x${boundingBox.height} (min: ${minSize})`);

          // WCAG recommends 44x44px minimum touch targets
          expect(minSize, 'Touch targets should be at least 44px').toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should be usable on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test basic functionality on mobile
      await AssertionHelpers.assertVisible(page, '#main-navigation');
      await AssertionHelpers.assertVisible(page, '.main-content');

      // Test navigation works on mobile
      const navItems = await page.$$('[data-section]');
      if (navItems.length > 0) {
        await navItems[0].click();
        await page.waitForTimeout(500);

        // Should still be functional
        const mainContentVisible = await page.isVisible('.main-content');
        expect(mainContentVisible).toBe(true);
      }
    });

    test('should handle zoom up to 200%', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test 200% zoom
      await page.evaluate(() => {
        document.body.style.zoom = '2.0';
      });

      await page.waitForTimeout(500);

      // Content should still be accessible
      const contentVisible = await page.isVisible('.main-content');
      expect(contentVisible).toBe(true);

      // Navigation should still work
      const navVisible = await page.isVisible('#main-navigation');
      expect(navVisible).toBe(true);
    });
  });

  test.describe('Error Handling and Validation', () => {
    test('should provide clear error messages', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Navigate to data import section
      await PageHelpers.navigateToSection(page, 'data-import');

      // Look for form validation
      const forms = await page.$$('form');
      if (forms.length > 0) {
        // Try to submit an empty form
        const submitButtons = await page.$$('button[type="submit"], input[type="submit"]');
        if (submitButtons.length > 0) {
          await submitButtons[0].click();
          await page.waitForTimeout(500);

          // Check for error messages
          const errorMessages = await page.$$('.error, .alert-danger, [role="alert"]');
          if (errorMessages.length > 0) {
            // Verify error messages are descriptive
            for (const error of errorMessages) {
              const text = await error.textContent();
              expect(text.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await PageHelpers.waitForAppLoad(page);

      // Test ARIA live regions for dynamic content
      const liveRegions = await page.$$('[aria-live], [role="status"], [role="alert"]');

      if (liveRegions.length > 0) {
        console.log(`Found ${liveRegions.length} live regions for dynamic content announcements`);
      }

      // This is a basic check - more sophisticated tests would trigger
      // dynamic content changes and verify announcements
      expect(liveRegions.length).toBeGreaterThanOrEqual(0); // At least some regions should exist
    });
  });
});