/**
 * Category Classification Tests
 * Tests the AI categorization engine for Amazon orders
 * @module tests/component/category-classification-tests
 */

const path = require("path");

/**
 * Category Classification Test Suite
 * Tests the categorization accuracy and distribution of the AI engine
 */
class CategoryClassificationTests {
  constructor(categorizer, sampleData = []) {
    this.categorizer = categorizer;
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
    const categories = {
      Grocery: ["milk", "bread", "eggs", "apples", "chicken", "rice", "pasta"],
      Household: [
        "paper towels",
        "laundry detergent",
        "dish soap",
        "trash bags",
      ],
      Electronics: ["charger", "headphones", "mouse", "keyboard", "monitor"],
      Books: ["novel", "textbook", "cookbook", "biography"],
      Clothing: ["shirt", "pants", "shoes", "jacket", "socks"],
      Other: ["miscellaneous item", "unknown product"],
    };

    const data = [];
    const categoryNames = Object.keys(categories);

    for (let i = 0; i < count; i++) {
      const category =
        categoryNames[Math.floor(Math.random() * categoryNames.length)];
      const items = categories[category];
      const item = items[Math.floor(Math.random() * items.length)];

      data.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        amount: -(Math.random() * 100 + 5).toFixed(2),
        items: `${item} and other items`,
        orderId: `MOCK-${String(i + 1).padStart(3, "0")}`,
      });
    }

    return data;
  }

  /**
   * Test category classification component
   * @returns {Object} Test results
   */
  testCategoryClassification() {
    console.log("\n📂 Testing Category Classification Component...");

    const results = {
      tested: 0,
      categories: new Map(),
      uncategorized: [],
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
      details: [],
    };

    this.sampleData.forEach((order) => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);

      results.tested++;

      // Track category distribution
      const category = analysis.category;
      if (!results.categories.has(category)) {
        results.categories.set(category, {
          count: 0,
          totalAmount: 0,
          samples: [],
        });
      }

      const categoryData = results.categories.get(category);
      categoryData.count++;
      categoryData.totalAmount += Math.abs(order.amount);

      if (categoryData.samples.length < 3) {
        categoryData.samples.push(order.items.substring(0, 40) + "...");
      }

      // Check if uncategorized
      if (category === "Other" || category === "Uncategorized") {
        results.uncategorized.push({
          orderId: order.orderId,
          items: order.items,
          amount: order.amount,
        });
      }

      // Confidence assessment (mock - would need actual confidence scores)
      const itemLength = order.items.length;
      const hasKeywords =
        /food|grocery|household|electronics|book|clothing/i.test(order.items);
      let confidence = 0.5;

      if (hasKeywords) confidence += 0.3;
      if (itemLength > 20) confidence += 0.2;

      if (confidence > 0.8) results.confidenceDistribution.high++;
      else if (confidence > 0.6) results.confidenceDistribution.medium++;
      else results.confidenceDistribution.low++;

      results.details.push({
        orderId: order.orderId,
        category: category,
        items: order.items.substring(0, 40) + "...",
        amount: order.amount,
        estimatedConfidence: confidence,
      });
    });

    console.log(`\n📊 Category Classification Results:`);
    console.log(`   Tested Orders: ${results.tested}`);
    console.log(`   Unique Categories: ${results.categories.size}`);
    console.log(
      `   Uncategorized: ${results.uncategorized.length} (${(
        (results.uncategorized.length / results.tested) *
        100
      ).toFixed(1)}%)`
    );

    console.log(`\n📈 Confidence Distribution:`);
    console.log(`   High (>80%): ${results.confidenceDistribution.high}`);
    console.log(`   Medium (60-80%): ${results.confidenceDistribution.medium}`);
    console.log(`   Low (<60%): ${results.confidenceDistribution.low}`);

    console.log(`\n🏷️  Top Categories:`);
    const sortedCategories = Array.from(results.categories.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    sortedCategories.forEach(([category, data]) => {
      console.log(
        `   ${category}: ${data.count} orders, $${data.totalAmount.toFixed(2)}`
      );
      console.log(`     Samples: ${data.samples.join(", ")}`);
    });

    if (results.uncategorized.length > 0) {
      console.log(`\n❓ Sample Uncategorized Items:`);
      results.uncategorized.slice(0, 3).forEach((item) => {
        console.log(`   • ${item.items.substring(0, 50)}... ($${item.amount})`);
      });
    }

    this.testResults.set("categoryClassification", results);
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
   * Calculate category classification score
   * @returns {number} Score as percentage
   */
  getScore() {
    const results = this.testResults.get("categoryClassification");
    if (!results) return 0;

    const categorized = results.tested - results.uncategorized.length;
    return (categorized / results.tested) * 100;
  }
}

module.exports = CategoryClassificationTests;
