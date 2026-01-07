/**
 * Employee Benefits UX Tests
 *
 * Tests for employee benefits workflow including status loading, modal functionality, and allocation
 */

const BaseUXTest = require('./base-test-utils');

/**
 * Employee benefits workflow tests
 */
class EmployeeBenefitsTests extends BaseUXTest {
  /**
   * Runs all employee benefits workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testEmployeeBenefitsStatusLoading();
    await this.testEmployeeBenefitsModalFunctionality();
    await this.testEmployeeBenefitsAllocationFunctionality();
  }

  /**
   * Tests employee benefits status loading
   * @returns {Promise<void>}
   */
  async testEmployeeBenefitsStatusLoading() {
    await this.runTest('Employee Benefits Status Loading', async () => {
      await this.navigateToPage('/employee-benefits.html');

      // Wait for page to load and check if status is not stuck on "Loading..."
      await this.page.waitForTimeout(3000); // Wait for async initialization

      const statusElement = await this.page.$('#selectionStatus');
      if (!statusElement) {
        return 'Status element not found';
      }

      const statusText = await this.page.evaluate(() => {
        const element = document.getElementById('selectionStatus');
        return element ? element.textContent.trim() : '';
      });

      // Status should not be "Loading..." after initialization
      if (statusText === 'Loading...') {
        return 'Status is stuck on "Loading..." - initialization failed';
      }

      // Status should contain item counts
      if (
        !statusText.includes('total items') ||
        !statusText.includes('business supplies')
      ) {
        return `Status text format incorrect: "${statusText}"`;
      }

      return true;
    });
  }

  /**
   * Tests employee benefits modal functionality
   * @returns {Promise<void>}
   */
  async testEmployeeBenefitsModalFunctionality() {
    await this.runTest('Employee Benefits Modal Functionality', async () => {
      await this.navigateToPage('/employee-benefits.html');
      await this.page.waitForTimeout(3000); // Wait for initialization

      // Check if Configure Selection button exists
      const configButton = await this.page.$('#openSelectionModal');
      if (!configButton) {
        return 'Configure Selection button not found';
      }

      // Click the button to open modal
      await configButton.click();
      await this.page.waitForTimeout(1000);

      // Check if modal is visible
      const modalVisible = await this.page.evaluate(() => {
        const modal = document.getElementById('employeeBenefitsModal');
        return modal && modal.classList.contains('show');
      });

      if (!modalVisible) {
        return 'Benefits configuration modal did not open';
      }

      // Check if modal has content
      const businessItems = await this.page.$$('#businessSuppliesList .card');
      const benefitsItems = await this.page.$$('#benefitsList .card');

      if (businessItems.length === 0) {
        return 'Business Supplies column is empty';
      }

      // Initially, benefits should be empty (0% allocation)
      if (benefitsItems.length > 0) {
        return 'Benefits column should be empty initially but contains items';
      }

      return true;
    });
  }

  /**
   * Tests employee benefits allocation functionality
   * @returns {Promise<void>}
   */
  async testEmployeeBenefitsAllocationFunctionality() {
    await this.runTest(
      'Employee Benefits Allocation Functionality',
      async () => {
        await this.navigateToPage('/employee-benefits.html');
        await this.page.waitForTimeout(3000);

        // Open modal
        const configButton = await this.page.$('#openSelectionModal');
        if (configButton) {
          await configButton.click();
          await this.page.waitForTimeout(1000);
        }

        // Find first business supplies item with a slider
        const firstSlider = await this.page.$(
          '#businessSuppliesList input[type="range"]'
        );
        if (!firstSlider) {
          return 'No allocation sliders found in modal';
        }

        // Move slider to allocate 50% to benefits
        await firstSlider.evaluate((slider) => (slider.value = '50'));
        await firstSlider.evaluate((slider) =>
          slider.dispatchEvent(new Event('input', { bubbles: true }))
        );
        await this.page.waitForTimeout(500);

        // Check if benefits column now has items
        const benefitsItems = await this.page.$$('#benefitsList .card');
        if (benefitsItems.length === 0) {
          return 'Benefits column still empty after allocation';
        }

        // Check if status updated
        const statusText = await this.page.evaluate(() => {
          const element = document.getElementById('selectionStatus');
          return element ? element.textContent.trim() : '';
        });

        if (!statusText.includes('benefits')) {
          return 'Status did not update to show benefits allocation';
        }

        return true;
      }
    );
  }
}

module.exports = EmployeeBenefitsTests;
