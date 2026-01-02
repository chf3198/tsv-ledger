#!/usr/bin/env node

/**
 * TSV Ledger - Component-Level Unit Testing Orchestrator
 *
 * @fileoverview Orchestrates modular component testing with detailed
 *               validation and interactive debugging capabilities.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-07
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// Import modular test components
const SubscribeSaveTests = require('./component/subscribe-save-tests');
const CategoryClassificationTests = require('./component/category-classification-tests');
const AmountCalculationsTests = require('./component/amount-calculations-tests');
const DataQualityTests = require('./component/data-quality-tests');
const TSVCategorizer = require('../src/tsv-categorizer');

class ComponentTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testResults = new Map();
    this.sampleData = [];

    // Initialize modular test components
    this.subscribeSaveTests = new SubscribeSaveTests(this.categorizer);
    this.categoryTests = new CategoryClassificationTests(this.categorizer);
    this.amountTests = new AmountCalculationsTests();
    this.dataQualityTests = new DataQualityTests();

    console.log("🔬 TSV Ledger - Component-Level Unit Testing");
    console.log("=".repeat(60));
  }

  /**
   * Load sample data for testing all components
   */
  async loadSampleData(limit = 50) {
    const dataFile = path.join(__dirname, "../../data/amazon-test-sample.csv");

    return new Promise((resolve, reject) => {
      const samples = [];
      let count = 0;

      // Try to load from test data first
      if (fs.existsSync(dataFile)) {
        fs.createReadStream(dataFile)
          .pipe(csv())
          .on("data", (row) => {
            if (count < limit) {
              const order = {
                date: row["Order Date"] || row.date,
                amount: parseFloat(
                  row["Item Total"] || row.total || row.amount || 0
                ),
                items: row["Title"] || row.items || "",
                payments: row["Payment Method"] || row.payments || "",
                shipping: row["Item Subtotal Tax"] || row.shipping || "0",
                orderId: row["Order ID"] || row.orderId || `test-${count}`,
                quantity: parseInt(row["Quantity"] || 1),
              };

              if (order.date && order.amount && order.items) {
                samples.push(order);
                count++;
              }
            }
          })
          .on("end", () => {
            this.sampleData = samples;
            // Load data into all test components
            this.subscribeSaveTests.sampleData = samples;
            this.categoryTests.sampleData = samples;
            this.amountTests.sampleData = samples;
            this.dataQualityTests.sampleData = samples;

            console.log(
              `✅ Loaded ${samples.length} sample orders for component testing`
            );
            resolve(samples);
          })
          .on("error", reject);
      } else {
        // Generate mock data if file doesn't exist
        this.sampleData = this.generateMockData(limit);
        this.subscribeSaveTests.sampleData = this.sampleData;
        this.categoryTests.sampleData = this.sampleData;
        this.amountTests.sampleData = this.sampleData;
        this.dataQualityTests.sampleData = this.sampleData;

        console.log(
          `✅ Generated ${this.sampleData.length} mock orders for component testing`
        );
        resolve(this.sampleData);
      }
    });
  }

  /**
   * Generate mock Amazon order data for testing
   */
  generateMockData(count) {
    const data = [];

    for (let i = 0; i < count; i++) {
      data.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        amount: -(Math.random() * 100 + 5).toFixed(2),
        items: `Test item ${i + 1} and accessories`,
        orderId: `MOCK-${String(i + 1).padStart(3, "0")}`,
        payments: "Credit Card",
        shipping: "0.00",
        quantity: 1,
      });
    }

    return data;
  }

  /**
   * Test Subscribe & Save detection component
   */
  testSubscribeAndSaveDetection() {
    const results = this.subscribeSaveTests.testSubscribeAndSaveDetection();
    this.testResults.set("subscribeAndSave", results);
    return results;
  }

  /**
   * Test category classification component
   */
  testCategoryClassification() {
    const results = this.categoryTests.testCategoryClassification();
    this.testResults.set("categoryClassification", results);
    return results;
  }

  /**
   * Test amount and calculation accuracy
   */
  testAmountCalculations() {
    const results = this.amountTests.testAmountCalculations();
    this.testResults.set('amountCalculations', results);
    return results;
  }

  /**
   * Test data quality and validation
   */
  testDataQuality() {
    const results = this.dataQualityTests.testDataQuality();
    this.testResults.set('dataQuality', results);
    return results;
  }

  /**
   * Generate comprehensive component test report
   */
  generateComponentReport() {
    console.log("\n📋 COMPREHENSIVE COMPONENT TEST REPORT");
    console.log("=".repeat(70));

    let overallScore = 0;
    let componentCount = 0;

    // Subscribe & Save Component
    if (this.testResults.has("subscribeAndSave")) {
      const ss = this.testResults.get("subscribeAndSave");
      const ssScore =
        ((ss.detected - ss.falsePositives.length) / ss.tested) * 100;
      console.log(
        `\n🔄 Subscribe & Save Detection: ${ssScore.toFixed(1)}% accuracy`
      );
      overallScore += ssScore;
      componentCount++;
    }

    // Category Classification Component
    if (this.testResults.has("categoryClassification")) {
      const cat = this.testResults.get("categoryClassification");
      const catScore =
        ((cat.tested - cat.uncategorized.length) / cat.tested) * 100;
      console.log(
        `📂 Category Classification: ${catScore.toFixed(1)}% categorized`
      );
      overallScore += catScore;
      componentCount++;
    }

    // Amount Calculations Component
    if (this.testResults.has("amountCalculations")) {
      const amt = this.testResults.get("amountCalculations");
      const amtScore =
        ((amt.tested - amt.discrepancies.length) / amt.tested) * 100;
      console.log(`💰 Amount Calculations: ${amtScore.toFixed(1)}% accurate`);
      overallScore += amtScore;
      componentCount++;
    }

    // Data Quality Component
    if (this.testResults.has("dataQuality")) {
      const dq = this.testResults.get("dataQuality");
      console.log(`🔍 Data Quality: ${dq.qualityScore.toFixed(1)}% valid`);
      overallScore += dq.qualityScore;
      componentCount++;
    }

    const avgScore = componentCount > 0 ? overallScore / componentCount : 0;
    console.log(`\n🎯 OVERALL COMPONENT SCORE: ${avgScore.toFixed(1)}%`);

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (avgScore >= 90) {
      console.log(`   ✅ Excellent! All components performing well.`);
    } else if (avgScore >= 80) {
      console.log(`   ⚠️  Good performance with room for minor improvements.`);
    } else if (avgScore >= 70) {
      console.log(`   🔧 Moderate performance - several areas need attention.`);
    } else {
      console.log(`   ❌ Poor performance - significant improvements needed.`);
    }

    return {
      overallScore: avgScore,
      componentScores: Object.fromEntries(this.testResults),
      recommendations: this.generateRecommendations(avgScore),
    };
  }

  /**
   * Generate specific recommendations based on test results
   */
  generateRecommendations(overallScore) {
    const recommendations = [];

    if (this.testResults.has("subscribeAndSave")) {
      const ss = this.testResults.get("subscribeAndSave");
      if (ss.falsePositives.length > 2) {
        recommendations.push(
          "Refine Subscribe & Save detection patterns to reduce false positives"
        );
      }
      if (ss.missed.length > 2) {
        recommendations.push(
          "Add more Subscribe & Save indicators to improve detection"
        );
      }
    }

    if (this.testResults.has("categoryClassification")) {
      const cat = this.testResults.get("categoryClassification");
      if (cat.uncategorized.length > cat.tested * 0.2) {
        recommendations.push(
          "Expand category classification rules - too many uncategorized items"
        );
      }
    }

    if (this.testResults.has("dataQuality")) {
      const dq = this.testResults.get("dataQuality");
      if (dq.qualityScore < 80) {
        recommendations.push("Improve data preprocessing and validation steps");
      }
    }

    return recommendations;
  }

  /**
   * Run all component tests
   */
  async runAllComponentTests() {
    try {
      console.log("\n🚀 Starting comprehensive component testing...");

      // Load sample data
      await this.loadSampleData(100); // Test with 100 orders

      // Run individual component tests
      this.testSubscribeAndSaveDetection();
      this.testCategoryClassification();
      this.testAmountCalculations();
      this.testDataQuality();

      // Generate comprehensive report
      const report = this.generateComponentReport();

      console.log("\n✅ Component testing complete!");
      return report;
    } catch (error) {
      console.error("\n❌ Component testing failed:", error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const tester = new ComponentTester();

  if (args.includes("--help")) {
    console.log(`
Usage: node component-tester.js [options]

Options:
  --help              Show this help message
  --ss-only           Test only Subscribe & Save detection
  --category-only     Test only category classification
  --amount-only       Test only amount calculations
  --quality-only      Test only data quality
  
Examples:
  node component-tester.js
  node component-tester.js --ss-only
    `);
    process.exit(0);
  }

  if (args.includes("--ss-only")) {
    tester.loadSampleData().then(() => tester.testSubscribeAndSaveDetection());
  } else if (args.includes("--category-only")) {
    tester.loadSampleData().then(() => tester.testCategoryClassification());
  } else if (args.includes("--amount-only")) {
    tester.loadSampleData().then(() => tester.testAmountCalculations());
  } else if (args.includes("--quality-only")) {
    tester.loadSampleData().then(() => tester.testDataQuality());
  } else {
    tester.runAllComponentTests().catch(console.error);
  }
}

module.exports = ComponentTester;
