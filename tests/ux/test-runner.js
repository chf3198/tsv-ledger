/**
 * Test Runner for UX Tests
 *
 * Handles test execution, results tracking, and reporting
 */

/**
 * Manages test execution and results
 */
class TestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * Logs messages with different levels
   * @param {string} message - Message to log
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: 'ℹ️',
        error: '❌',
        success: '✅',
        progress: '🔄'
      }[level] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Runs a test function with error handling
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to run
   * @returns {Promise<boolean>}
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    this.log(`Running: ${testName}`, 'progress');

    try {
      const result = await testFunction();
      if (result === true || result === undefined) {
        this.testResults.passed++;
        this.log(`PASSED: ${testName}`, 'success');
        this.testResults.details.push({ name: testName, status: 'PASSED' });
        return true;
      } else {
        this.testResults.failed++;
        this.log(`FAILED: ${testName} - ${result}`, 'error');
        this.testResults.details.push({
          name: testName,
          status: 'FAILED',
          error: result
        });
        return false;
      }
    } catch (error) {
      this.testResults.failed++;
      this.log(`ERROR: ${testName} - ${error.message}`, 'error');
      this.testResults.details.push({
        name: testName,
        status: 'ERROR',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Gets test results summary
   * @returns {Object} Test results
   */
  getResults() {
    return {
      ...this.testResults,
      successRate:
        this.testResults.total > 0
          ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(
            1
          )
          : 0
    };
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

module.exports = TestRunner;
