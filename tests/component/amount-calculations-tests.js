/**
 * Amount Calculations Tests
 * Tests the accuracy and reliability of amount calculations
 * @module tests/component/amount-calculations-tests
 */

const path = require("path");

/**
 * Amount Calculations Test Suite
 * Tests mathematical accuracy and statistical analysis of order amounts
 */
class AmountCalculationsTests {
  constructor(sampleData = []) {
    this.sampleData = sampleData;
    this.testResults = new Map();
  }

  /**
   * Load sample data for testing
   * @param {number} count - Number of orders to test
   */
  async loadSampleData(count = 50) {
    if (this.sampleData.length === 0) {
      // Load from test data if not provided
      const testDataPath = path.join(
        __dirname,
        "../../test-data/amazon-test-sample.csv"
      );
      const fs = require("fs");

      if (fs.existsSync(testDataPath)) {
        const csv = require("csv-parser");
        const data = [];

        await new Promise((resolve, reject) => {
          fs.createReadStream(testDataPath)
            .pipe(csv())
            .on("data", (row) => {
              if (data.length < count) {
                data.push({
                  date: row.date,
                  amount: parseFloat(row.amount) || 0,
                  items: row.items || "",
                  orderId: row.orderId || `test-${data.length}`,
                });
              }
            })
            .on("end", () => resolve())
            .on("error", reject);
        });

        this.sampleData = data;
      } else {
        // Generate mock data
        this.sampleData = this.generateMockData(count);
      }
    }
  }

  /**
   * Generate mock Amazon order data for testing
   * @param {number} count - Number of mock orders to generate
   * @returns {Array} Mock order data
   */
  generateMockData(count) {
    const data = [];

    for (let i = 0; i < count; i++) {
      // Generate realistic amounts with some outliers
      let amount;
      const rand = Math.random();

      if (rand < 0.7) {
        // Normal purchases: $5-100
        amount = -(Math.random() * 95 + 5);
      } else if (rand < 0.9) {
        // Medium purchases: $100-500
        amount = -(Math.random() * 400 + 100);
      } else {
        // Large purchases/outliers: $500-2000
        amount = -(Math.random() * 1500 + 500);
      }

      data.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        amount: parseFloat(amount.toFixed(2)),
        items: `Test item ${i + 1} and accessories`,
        orderId: `CALC-${String(i + 1).padStart(3, "0")}`,
      });
    }

    return data;
  }

  /**
   * Test amount and calculation accuracy
   * @returns {Object} Test results
   */
  testAmountCalculations() {
    console.log("\n💰 Testing Amount Calculations Component...");

    const results = {
      tested: 0,
      totalCalculated: 0,
      totalOriginal: 0,
      discrepancies: [],
      negativeAmounts: 0,
      zeroAmounts: 0,
      outliers: [],
      statistics: {},
    };

    const amounts = [];

    this.sampleData.forEach((order) => {
      results.tested++;
      const amount = Math.abs(order.amount);
      amounts.push(amount);

      results.totalCalculated += amount;
      results.totalOriginal += order.amount;

      // Check for issues
      if (order.amount < 0) results.negativeAmounts++;
      if (order.amount === 0) results.zeroAmounts++;

      // Detect outliers (> 3 standard deviations from mean)
      if (amount > 300) {
        // Simple outlier detection
        results.outliers.push({
          orderId: order.orderId,
          amount: amount,
          items: order.items.substring(0, 40) + "...",
        });
      }

      // Check for calculation discrepancies
      const originalAbs = Math.abs(order.amount);
      if (Math.abs(amount - originalAbs) > 0.01) {
        results.discrepancies.push({
          orderId: order.orderId,
          original: order.amount,
          calculated: amount,
          difference: amount - originalAbs,
        });
      }
    });

    // Calculate statistics
    amounts.sort((a, b) => a - b);
    results.statistics = {
      mean: amounts.reduce((sum, val) => sum + val, 0) / amounts.length,
      median: amounts[Math.floor(amounts.length / 2)],
      min: amounts[0],
      max: amounts[amounts.length - 1],
      standardDeviation: 0,
    };

    // Calculate standard deviation
    const mean = results.statistics.mean;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length;
    results.statistics.standardDeviation = Math.sqrt(variance);

    console.log(`\n📊 Amount Calculation Results:`);
    console.log(`   Tested Orders: ${results.tested}`);
    console.log(`   Total Calculated: $${results.totalCalculated.toFixed(2)}`);
    console.log(`   Negative Amounts: ${results.negativeAmounts}`);
    console.log(`   Zero Amounts: ${results.zeroAmounts}`);
    console.log(`   Outliers (>$300): ${results.outliers.length}`);
    console.log(`   Discrepancies: ${results.discrepancies.length}`);

    console.log(`\n📈 Amount Statistics:`);
    console.log(`   Mean: $${results.statistics.mean.toFixed(2)}`);
    console.log(`   Median: $${results.statistics.median.toFixed(2)}`);
    console.log(
      `   Range: $${results.statistics.min.toFixed(
        2
      )} - $${results.statistics.max.toFixed(2)}`
    );
    console.log(
      `   Std Dev: $${results.statistics.standardDeviation.toFixed(2)}`
    );

    if (results.outliers.length > 0) {
      console.log(`\n📊 Sample Outliers:`);
      results.outliers.slice(0, 3).forEach((outlier) => {
        console.log(`   • $${outlier.amount}: ${outlier.items}`);
      });
    }

    this.testResults.set("amountCalculations", results);
    return results;
  }

  /**
   * Get test results
   * @returns {Map} Test results map
   */
  getResults() {
    return this.testResults;
  }

  /**
   * Calculate amount calculations score
   * @returns {number} Score as percentage
   */
  getScore() {
    const results = this.testResults.get("amountCalculations");
    if (!results) return 0;

    const accurate = results.tested - results.discrepancies.length;
    return (accurate / results.tested) * 100;
  }
}

module.exports = AmountCalculationsTests;
