/**
 * Base UX Test Utilities
 *
 * Common utilities for UX testing with Puppeteer browser automation
 * Provides server management, browser setup, and shared test helpers
 */

const ServerManager = require('./server-manager');
const BrowserManager = require('./browser-manager');
const TestRunner = require('./test-runner');

/**
 * Base class for UX testing with common browser and server utilities
 */
class BaseUXTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.serverManager = new ServerManager();
    this.browserManager = new BrowserManager();
    this.testRunner = new TestRunner();

    // Expose commonly used methods
    this.browser = null;
    this.page = null;
    this.testResults = this.testRunner.testResults;
  }

  /**
   * Logs messages with different levels
   * @param {string} message - Message to log
   * @param {string} level - Log level (info, error, success, progress)
   */
  log(message, level = 'info') {
    this.testRunner.log(message, level);
  }

  /**
   * Starts the test server
   * @returns {Promise<void>}
   */
  async startServer() {
    await this.serverManager.startServer();
  }

  /**
   * Stops the test server
   * @returns {Promise<void>}
   */
  async stopServer() {
    await this.serverManager.stopServer();
  }

  /**
   * Initializes browser and page
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.browserManager.initialize();
    this.browser = this.browserManager.browser;
    this.page = this.browserManager.page;
  }

  /**
   * Cleans up browser and server
   * @returns {Promise<void>}
   */
  async cleanup() {
    await this.browserManager.cleanup();
    await this.stopServer();
  }

  /**
   * Navigates to a page
   * @param {string} pagePath - Path to navigate to
   * @returns {Promise<void>}
   */
  async navigateToPage(pagePath = '/') {
    await this.browserManager.navigateToPage(pagePath);
  }

  /**
   * Waits for an element to appear
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForElement(selector, timeout = 5000) {
    return await this.browserManager.waitForElement(selector, timeout);
  }

  /**
   * Clicks an element
   * @param {string} selector - CSS selector
   * @param {string} description - Description for logging
   * @returns {Promise<boolean>}
   */
  async clickElement(selector, description = 'element') {
    return await this.browserManager.clickElement(selector, description);
  }

  /**
   * Fills a form field
   * @param {string} selector - CSS selector
   * @param {string} value - Value to fill
   * @param {string} description - Description for logging
   * @returns {Promise<boolean>}
   */
  async fillFormField(selector, value, description = 'field') {
    return await this.browserManager.fillFormField(
      selector,
      value,
      description
    );
  }

  /**
   * Waits for analysis to load
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForAnalysisLoad(timeout = 30000) {
    return await this.browserManager.waitForAnalysisLoad(timeout);
  }

  /**
   * Navigates to a section
   * @param {string} sectionId - Section ID to navigate to
   * @returns {Promise<boolean>}
   */
  async navigateToSection(sectionId) {
    return await this.browserManager.navigateToSection(sectionId);
  }

  /**
   * Tests server health
   * @returns {Promise<boolean>}
   */
  async testServerHealth() {
    return await this.browserManager.testServerHealth();
  }

  /**
   * Runs a test function with error handling
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to run
   * @returns {Promise<boolean>}
   */
  async runTest(testName, testFunction) {
    return await this.testRunner.runTest(testName, testFunction);
  }

  /**
   * Gets test results summary
   * @returns {Object} Test results
   */
  getResults() {
    return this.testRunner.getResults();
  }

  /**
   * Generates test summary
   * @returns {void}
   */
  generateSummary() {
    this.testRunner.generateSummary();
  }
}

module.exports = BaseUXTest;
