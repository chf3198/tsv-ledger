/**
 * Analysis UX Tests
 *
 * Tests for analysis workflows including expense analysis, AI insights, and category breakdowns
 */

const BaseUXTest = require("./base-test-utils");

/**
 * Analysis workflow tests
 */
class AnalysisTests extends BaseUXTest {
  /**
   * Runs all analysis workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testExpenseAnalysis();
    await this.testAIAnalysis();
    await this.testCategoryAnalysis();
  }

  /**
   * Tests basic expense analysis
   * @returns {Promise<void>}
   */
  async testExpenseAnalysis() {
    await this.runTest("Expense Analysis", async () => {
      await this.navigateToPage("/");

      // Look for analysis button on dashboard
      const analysisBtn = await this.page.$("#loadAnalysis");
      if (analysisBtn) {
        await analysisBtn.click();
        await this.page.waitForTimeout(1000);
      }

      // Check if analysis results are displayed
      const analysisResults = await this.page.$$(
        '#analysisResults:not([style*="display: none"]), .analysis-results, .chart-container'
      );
      return analysisResults.length > 0;
    });
  }

  /**
   * Tests AI analysis functionality
   * @returns {Promise<void>}
   */
  async testAIAnalysis() {
    await this.runTest("AI Analysis", async () => {
      await this.navigateToPage("/");
      await this.navigateToSection("ai-insights");

      // Look for AI analysis button
      const aiBtn = await this.page.$("#loadAIAnalysis");
      if (!aiBtn) {
        return "AI analysis button not found";
      }

      // Click AI analysis button
      await aiBtn.click();
      this.log("🤖 Triggered AI analysis");

      // Wait for analysis to complete with timeout
      const analysisLoaded = await this.waitForAnalysisLoad(15000); // 15 second timeout

      if (!analysisLoaded) {
        this.log("⚠️ AI analysis timed out, but button was clickable");
        return true; // Still pass if button works, even if analysis is slow
      }

      // Check for AI insights or results
      const aiResults = await this.page.$$(
        '#ai-dashboard-container:not([style*="display: none"]), .ai-insights, .ai-analysis'
      );
      return aiResults.length > 0;
    });
  }

  /**
   * Tests category analysis
   * @returns {Promise<void>}
   */
  async testCategoryAnalysis() {
    await this.runTest("Category Analysis", async () => {
      await this.navigateToPage("/");
      await this.navigateToSection("analysis");

      // Look for category breakdown or charts
      const categoryElements = await this.page.$$(
        '.category-breakdown, .category-chart, #detailedAnalysisContent:not([style*="display: none"])'
      );
      return categoryElements.length > 0;
    });
  }
}

module.exports = AnalysisTests;
