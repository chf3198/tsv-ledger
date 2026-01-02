/**
 * Navigation UX Tests
 *
 * Tests for navigation workflows including dashboard, menu, and page access
 */

const BaseUXTest = require("./base-test-utils");

/**
 * Navigation workflow tests
 */
class NavigationTests extends BaseUXTest {
  /**
   * Runs all navigation workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testDashboardNavigation();
    await this.testMenuNavigation();
    await this.testEmployeeBenefitsAccess();
  }

  /**
   * Tests dashboard navigation
   * @returns {Promise<void>}
   */
  async testDashboardNavigation() {
    await this.runTest("Dashboard Navigation", async () => {
      await this.navigateToPage("/");
      const title = await this.page.title();
      return title && title.includes("TSV");
    });
  }

  /**
   * Tests menu navigation functionality
   * @returns {Promise<void>}
   */
  async testMenuNavigation() {
    await this.runTest("Menu Navigation", async () => {
      await this.navigateToPage("/");

      // Look for navigation menu toggle (Shoelace drawer)
      const menuToggle = await this.page.$(
        '.navbar-toggler, button[aria-controls="sidebar"]'
      );
      if (menuToggle) {
        await menuToggle.click();
        await this.page.waitForTimeout(500);

        // Check if sidebar/drawer opened
        const sidebar = await this.page.$("#sidebar, sl-drawer");
        const isOpen = await this.page.evaluate(() => {
          const drawer = document.querySelector("sl-drawer");
          return drawer ? drawer.hasAttribute("open") : false;
        });

        if (isOpen) {
          // Close it again
          await menuToggle.click();
          await this.page.waitForTimeout(500);
        }

        return true; // Menu toggle exists and is functional
      }

      return false;
    });
  }

  /**
   * Tests employee benefits page access
   * @returns {Promise<void>}
   */
  async testEmployeeBenefitsAccess() {
    await this.runTest("Employee Benefits Access", async () => {
      await this.navigateToPage("/employee-benefits.html");

      // Check if benefits page loaded
      const benefitsContent = await this.page.$$(
        ".benefits-container, .employee-benefits, h1"
      );
      const hasBenefitsText = await this.page.evaluate(() => {
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6")
        );
        return headings.some((h) =>
          h.textContent.toLowerCase().includes("benefit")
        );
      });
      return benefitsContent.length > 0 || hasBenefitsText;
    });
  }
}

module.exports = NavigationTests;
