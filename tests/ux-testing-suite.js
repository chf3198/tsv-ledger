/**
 * Modular E2E UX Testing Suite
 *
 * Comprehensive UX testing with Puppeteer browser automation
 * Uses modular test classes for better organization and maintainability
 */

const BaseUXTest = require('./ux/base-test-utils');
const DataImportTests = require('./ux/data-import-tests');
const AnalysisTests = require('./ux/analysis-tests');
const NavigationTests = require('./ux/navigation-tests');
const ErrorHandlingTests = require('./ux/error-handling-tests');
const DataIntegrityTests = require('./ux/data-integrity-tests');
const VisualConsistencyTests = require('./ux/visual-consistency-tests');
const EmployeeBenefitsTests = require('./ux/employee-benefits-tests');

/**
 * Main UX Testing Suite that orchestrates all test modules
 */
class UXTestingSuite extends BaseUXTest {
  constructor() {
    super();
    this.testModules = [
      new DataImportTests(),
      new AnalysisTests(),
      new NavigationTests(),
      new ErrorHandlingTests(),
      new DataIntegrityTests(),
      new VisualConsistencyTests(),
      new EmployeeBenefitsTests()
    ];
  }

  /**
   * Runs all UX tests across all modules
   * @returns {Promise<void>}
   */
  async runAllTests() {
    try {
      // Start test server
      await this.startServer();

      // Initialize browser for testing
      await this.initialize();

      this.log('🧪 Starting Comprehensive E2E UX Testing Suite', 'info');
      this.log('================================================', 'info');

      // Check server health first
      if (!(await this.testServerHealth())) {
        this.log(
          '❌ Cannot proceed with UX testing - server not healthy',
          'error'
        );
        return;
      }

      // Run all test modules
      for (const module of this.testModules) {
        // Share the browser and page instances with each module
        module.browser = this.browser;
        module.page = this.page;
        module.baseUrl = this.baseUrl;
        module.testResults = this.testResults; // Share results

        await module.runAllTests();
      }

      // Generate summary
      this.generateSummary();
    } finally {
      // Always cleanup
      await this.cleanup();
      await this.stopServer();
    }
  }

  /**
   * Generates test summary
   * @returns {void}
   */
  generateSummary() {
    this.log('\n📊 E2E UX Testing Summary', 'info');
    this.log('==========================', 'info');
    this.log(`Total Tests: ${this.testResults.total}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, 'error');

    const successRate =
      this.testResults.total > 0
        ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
        : 0;
    this.log(
      `Success Rate: ${successRate}%`,
      this.testResults.failed === 0 ? 'success' : 'warning'
    );

    if (this.testResults.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.testResults.details
        .filter((test) => test.status !== 'PASSED')
        .forEach((test) => {
          this.log(
            `   - ${test.name}: ${test.error || 'Unknown error'}`,
            'error'
          );
        });
    }

    this.log(
      '\n✅ UX Testing Complete!',
      this.testResults.failed === 0 ? 'success' : 'warning'
    );
  }
}

// Run the tests
async function main() {
  const tester = new UXTestingSuite();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 UX Testing Suite crashed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UXTestingSuite;
