/**
 * Base Component Test Utilities
 *
 * Common utilities for component-level testing
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const TSVCategorizer = require("../../src/tsv-categorizer");

/**
 * Base class for component testing with common utilities
 */
class BaseComponentTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testResults = new Map();
    this.sampleData = [];

    console.log("🔬 TSV Ledger - Component-Level Unit Testing");
    console.log("=".repeat(60));
  }

  /**
   * Load sample data for testing
   * @param {number} limit - Maximum number of samples to load
   * @returns {Promise<Array>} Array of sample data
   */
  async loadSampleData(limit = 50) {
    const dataFile = path.join(__dirname, "../../data/amazon-test-sample.csv");

    return new Promise((resolve, reject) => {
      const samples = [];
      let count = 0;

      fs.createReadStream(dataFile)
        .pipe(csv())
        .on("data", (row) => {
          if (count < limit) {
            const order = {
              date: row["Order Date"] || row.date,
              amount: parseFloat(row["Item Total"] || row.total || 0),
              items: row["Title"] || row.items || "",
              payments: row["Payment Method"] || row.payments || "",
              shipping: row["Item Subtotal Tax"] || row.shipping || "0",
              orderId: row["Order ID"] || `test-${count}`,
              quantity: parseInt(row["Quantity"] || 1),
            };
            samples.push(order);
            count++;
          }
        })
        .on("end", () => {
          this.sampleData = samples;
          console.log(`📊 Loaded ${samples.length} sample orders for testing`);
          resolve(samples);
        })
        .on("error", reject);
    });
  }

  /**
   * Generate test summary
   * @returns {void}
   */
  generateSummary() {
    console.log("\n📊 Component Testing Summary", "info");
    console.log("==========================", "info");

    let totalTests = 0;
    let totalPassed = 0;

    for (const [testName, results] of this.testResults) {
      console.log(`\n${testName}:`);
      if (results.detectionRate !== undefined) {
        console.log(`   Detection Rate: ${results.detectionRate}%`);
      }
      if (results.accuracyRate !== undefined) {
        console.log(`   Accuracy Rate: ${results.accuracyRate}%`);
      }
      if (results.coverage !== undefined) {
        console.log(`   Coverage: ${results.coverage}%`);
      }
      if (results.issues && results.issues.length > 0) {
        console.log(`   Issues: ${results.issues.length}`);
      }
      totalTests++;
      if (results.passed) totalPassed++;
    }

    const successRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    console.log(
      `\n✅ Component Testing Complete! Success Rate: ${successRate}%`
    );
  }
}

module.exports = BaseComponentTester;
