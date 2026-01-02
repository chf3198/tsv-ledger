/**
 * Browser Manager for UX Tests
 *
 * Handles Puppeteer browser and page setup
 */

const puppeteer = require("puppeteer");

/**
 * Manages browser and page lifecycle
 */
class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = "http://localhost:3000";
  }

  /**
   * Logs messages with different levels
   * @param {string} message - Message to log
   * @param {string} level - Log level
   */
  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "ℹ️",
        error: "❌",
        success: "✅",
        progress: "🔄",
      }[level] || "ℹ️";

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Initializes browser and page
   * @returns {Promise<void>}
   */
  async initialize() {
    this.log("🌐 Launching browser...");
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    // Set up console logging
    this.page.on("console", (msg) => {
      this.log(`Browser console: ${msg.text()}`, "info");
    });

    this.page.on("pageerror", (error) => {
      this.log(`Browser page error: ${error.message}`, "error");
    });

    this.log("✅ Browser initialized");
  }

  /**
   * Cleans up browser and page
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.log("🧹 Cleaning up browser...");

    if (this.page) {
      await this.page.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    this.log("✅ Browser cleanup complete");
  }

  /**
   * Navigates to a page
   * @param {string} pagePath - Path to navigate to
   * @returns {Promise<void>}
   */
  async navigateToPage(pagePath = "/") {
    const url = `${this.baseUrl}${pagePath}`;
    this.log(`📍 Navigating to ${url}`);
    await this.page.goto(url, { waitUntil: "networkidle2" });
  }

  /**
   * Waits for an element to appear
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.log(`Element not found: ${selector}`, "error");
      return false;
    }
  }

  /**
   * Clicks an element
   * @param {string} selector - CSS selector
   * @param {string} description - Description for logging
   * @returns {Promise<boolean>}
   */
  async clickElement(selector, description = "element") {
    try {
      await this.page.click(selector);
      this.log(`🖱️ Clicked ${description}`);
      return true;
    } catch (error) {
      this.log(`Failed to click ${description}: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Fills a form field
   * @param {string} selector - CSS selector
   * @param {string} value - Value to fill
   * @param {string} description - Description for logging
   * @returns {Promise<boolean>}
   */
  async fillFormField(selector, value, description = "field") {
    try {
      await this.page.type(selector, value);
      this.log(`✏️ Filled ${description} with: ${value}`);
      return true;
    } catch (error) {
      this.log(`Failed to fill ${description}: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Waits for analysis to load
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForAnalysisLoad(timeout = 30000) {
    try {
      await this.page.waitForFunction(
        () => {
          const loadingElements =
            document.querySelectorAll(".loading, .spinner");
          return loadingElements.length === 0;
        },
        { timeout }
      );
      this.log("📊 Analysis loaded successfully");
      return true;
    } catch (error) {
      this.log(`Analysis load timeout: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Navigates to a section
   * @param {string} sectionId - Section ID to navigate to
   * @returns {Promise<boolean>}
   */
  async navigateToSection(sectionId) {
    try {
      await this.page.evaluate((id) => {
        // Hide all sections
        const sections = document.querySelectorAll(".section");
        sections.forEach((sec) => sec.classList.remove("active"));

        // Show target section
        const targetSection = document.getElementById(id);
        if (targetSection) {
          targetSection.classList.add("active");
          return true;
        }
        return false;
      }, sectionId);

      this.log(`📑 Navigated to section: ${sectionId}`);
      return true;
    } catch (error) {
      this.log(
        `Failed to navigate to section ${sectionId}: ${error.message}`,
        "error"
      );
      return false;
    }
  }

  /**
   * Tests server health
   * @returns {Promise<boolean>}
   */
  async testServerHealth() {
    try {
      await this.navigateToPage("/");
      const title = await this.page.title();
      if (title.includes("TSV Ledger")) {
        this.log("✅ Server is healthy and responding");
        return true;
      } else {
        this.log(`❌ Unexpected page title: ${title}`, "error");
        return false;
      }
    } catch (error) {
      this.log(`❌ Server health check failed: ${error.message}`, "error");
      return false;
    }
  }
}

module.exports = BrowserManager;
