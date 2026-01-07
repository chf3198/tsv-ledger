/**
 * Visual Consistency UX Tests
 *
 * Tests for visual consistency including navigation, colors, and cross-page elements
 */

const BaseUXTest = require('./base-test-utils');

/**
 * Visual consistency workflow tests
 */
class VisualConsistencyTests extends BaseUXTest {
  /**
   * Runs all visual consistency workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testNavigationMenuVisibility();
    await this.testNavigationMenuTextColor();
    await this.testEmployeeBenefitsNavigation();
    await this.testCrossPageNavigationConsistency();
  }

  /**
   * Tests navigation menu visibility and positioning
   * @returns {Promise<void>}
   */
  async testNavigationMenuVisibility() {
    await this.runTest('Navigation Menu Visibility', async () => {
      await this.navigateToPage('/');

      // Check if navbar exists and is visible
      const navbar = await this.page.$('.navbar');
      if (!navbar) {
        return 'Navbar not found';
      }

      // Check navbar visibility and positioning
      const navbarVisible = await this.page.evaluate(() => {
        const nav = document.querySelector('.navbar');
        if (!nav) {
          return false;
        }

        const rect = nav.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(nav);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden' &&
          computedStyle.position === 'fixed' &&
          rect.top === 0
        ); // Should be at top of viewport
      });

      if (!navbarVisible) {
        return 'Navbar is not properly visible or positioned';
      }

      // Check if menu toggle button exists and is visible
      const menuButton = await this.page.$('.navbar-toggler');
      if (!menuButton) {
        return 'Menu toggle button not found';
      }

      const buttonVisible = await this.page.evaluate(() => {
        const btn = document.querySelector('.navbar-toggler');
        if (!btn) {
          return false;
        }

        const rect = btn.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(btn);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden'
        );
      });

      if (!buttonVisible) {
        return 'Menu toggle button is not visible';
      }

      // Check if menu button is within viewport (not scrolled off screen)
      const buttonInViewport = await this.page.evaluate(() => {
        const btn = document.querySelector('.navbar-toggler');
        if (!btn) {
          return false;
        }

        const rect = btn.getBoundingClientRect();
        return (
          rect.left >= 0 &&
          rect.right <= window.innerWidth &&
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight
        );
      });

      if (!buttonInViewport) {
        return 'Menu toggle button is outside viewport (possibly scrolled off screen)';
      }

      return true;
    });
  }

  /**
   * Tests navigation menu text color consistency
   * @returns {Promise<void>}
   */
  async testNavigationMenuTextColor() {
    await this.runTest('Navigation Menu Text Color', async () => {
      await this.navigateToPage('/');

      // Check navbar brand text color
      const brandColor = await this.page.evaluate(() => {
        const brand = document.querySelector('.navbar-brand');
        if (!brand) {
          return null;
        }

        const computedStyle = window.getComputedStyle(brand);
        return computedStyle.color;
      });

      if (!brandColor) {
        return 'Navbar brand text color not found';
      }

      // For dark navbar, text should be white or light colored
      const isDarkNavbar = await this.page.evaluate(() => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
          return false;
        }

        const computedStyle = window.getComputedStyle(navbar);
        const bgColor = computedStyle.backgroundColor;

        // Check if background is dark (common dark navbar colors)
        return (
          bgColor.includes('rgb(0, 0, 0)') ||
          bgColor.includes('rgb(13, 110, 253)') || // Bootstrap primary blue
          bgColor.includes('#0d6efd') ||
          computedStyle.backgroundColor === 'black' ||
          computedStyle.backgroundColor.includes('dark')
        );
      });

      if (isDarkNavbar) {
        // For dark navbar, text should be white/light
        const isLightText =
          brandColor.includes('rgb(255, 255, 255)') ||
          brandColor.includes('white') ||
          brandColor.includes('#fff') ||
          brandColor.includes('#ffffff');

        if (!isLightText) {
          return `Navbar brand text color ${brandColor} is not suitable for dark navbar`;
        }
      }

      return true;
    });
  }

  /**
   * Tests employee benefits page navigation consistency
   * @returns {Promise<void>}
   */
  async testEmployeeBenefitsNavigation() {
    await this.runTest('Employee Benefits Navigation', async () => {
      await this.navigateToPage('/employee-benefits.html');

      // Check if navbar exists on employee benefits page
      const navbar = await this.page.$('.navbar');
      if (!navbar) {
        return 'Navbar not found on employee benefits page';
      }

      // Check navbar visibility and positioning
      const navbarVisible = await this.page.evaluate(() => {
        const nav = document.querySelector('.navbar');
        if (!nav) {
          return false;
        }

        const rect = nav.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(nav);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden'
        );
      });

      if (!navbarVisible) {
        return 'Navbar is not visible on employee benefits page';
      }

      // Check if menu toggle button exists and is visible
      const menuButton = await this.page.$('.navbar-toggler');
      if (!menuButton) {
        return 'Menu toggle button not found on employee benefits page';
      }

      const buttonVisible = await this.page.evaluate(() => {
        const btn = document.querySelector('.navbar-toggler');
        if (!btn) {
          return false;
        }

        const rect = btn.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(btn);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden'
        );
      });

      if (!buttonVisible) {
        return 'Menu toggle button is not visible on employee benefits page';
      }

      return true;
    });
  }

  /**
   * Tests cross-page navigation consistency
   * @returns {Promise<void>}
   */
  async testCrossPageNavigationConsistency() {
    await this.runTest('Cross-Page Navigation Consistency', async () => {
      // Test navigation consistency between main page and employee benefits page

      // First check main page navbar
      await this.navigateToPage('/');
      const mainNavbarColor = await this.page.evaluate(() => {
        const navbar = document.querySelector('.navbar');
        return navbar ? window.getComputedStyle(navbar).backgroundColor : null;
      });

      const mainBrandColor = await this.page.evaluate(() => {
        const brand = document.querySelector('.navbar-brand');
        return brand ? window.getComputedStyle(brand).color : null;
      });

      // Then check employee benefits page navbar
      await this.navigateToPage('/employee-benefits.html');
      const benefitsNavbarColor = await this.page.evaluate(() => {
        const navbar = document.querySelector('.navbar');
        return navbar ? window.getComputedStyle(navbar).backgroundColor : null;
      });

      const benefitsBrandColor = await this.page.evaluate(() => {
        const brand = document.querySelector('.navbar-brand');
        return brand ? window.getComputedStyle(brand).color : null;
      });

      // Compare navbar colors (they should be consistent)
      if (mainNavbarColor !== benefitsNavbarColor) {
        return `Navbar background colors differ: main page (${mainNavbarColor}) vs employee benefits (${benefitsNavbarColor})`;
      }

      // Compare brand text colors (they should be consistent)
      if (mainBrandColor !== benefitsBrandColor) {
        return `Brand text colors differ: main page (${mainBrandColor}) vs employee benefits (${benefitsBrandColor})`;
      }

      return true;
    });
  }
}

module.exports = VisualConsistencyTests;
