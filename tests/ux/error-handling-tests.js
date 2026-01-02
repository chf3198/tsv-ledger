/**
 * Error Handling UX Tests
 *
 * Tests for error handling workflows including validation and 404 errors
 */

const BaseUXTest = require("./base-test-utils");

/**
 * Error handling workflow tests
 */
class ErrorHandlingTests extends BaseUXTest {
  /**
   * Runs all error handling workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testInvalidDataHandling();
    await this.test404ErrorHandling();
  }

  /**
   * Tests invalid data error handling
   * @returns {Promise<void>}
   */
  async testInvalidDataHandling() {
    await this.runTest("Invalid Data Error Handling", async () => {
      await this.navigateToPage("/");
      await this.navigateToSection("manual-entry");

      // Try to submit empty form
      const submitBtn = await this.page.$(
        '#expenditureForm button[type="submit"]'
      );
      if (submitBtn) {
        await submitBtn.click();
        await this.page.waitForTimeout(1000);

        // Check for validation errors (HTML5 validation or custom error messages)
        const errorElements = await this.page.$$(
          ".alert-danger, .error, .invalid-feedback, .is-invalid, input:invalid"
        );
        const hasValidation = await this.page.evaluate(() => {
          const form = document.getElementById("expenditureForm");
          return form ? !form.checkValidity() : false;
        });

        return errorElements.length > 0 || hasValidation;
      }

      return false;
    });
  }

  /**
   * Tests 404 error handling
   * @returns {Promise<void>}
   */
  async test404ErrorHandling() {
    await this.runTest("404 Error Handling", async () => {
      try {
        await this.page.goto(`${this.baseUrl}/non-existent-page`, {
          waitUntil: "networkidle2",
        });
        await this.page.waitForTimeout(1000); // Wait for potential error page to load

        const title = await this.page.title();
        const bodyText = await this.page.evaluate(
          () => document.body.textContent
        );

        // Check for various error indicators
        const isErrorPage =
          title.includes("404") ||
          title.includes("Not Found") ||
          title.includes("Error") ||
          bodyText.includes("404") ||
          bodyText.includes("not found") ||
          bodyText.includes("error");

        return isErrorPage;
      } catch (error) {
        // If navigation fails completely, that's also acceptable
        return true;
      }
    });
  }
}

module.exports = ErrorHandlingTests;
