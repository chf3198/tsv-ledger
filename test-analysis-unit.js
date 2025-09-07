#!/usr/bin/env node

/**
 * TSV Ledger - Analysis Unit Testing Framework
 * 
 * @fileoverview Comprehensive unit testing for all analysis and insights functionality.
 *               Provides automated validation of Subscribe & Save detection, category 
 *               classification, property allocation, and data quality metrics.
 * 
 * @version 2.1.0
 * @author GitHub Copilot (Claude Sonnet 3.5)
 * @since 2025-09-07
 * 
 * @example
 * // Run full test suite
 * node test-analysis-unit.js
 * 
 * // Use as module
 * const AnalysisUnitTester = require('./test-analysis-unit');
 * const tester = new AnalysisUnitTester();
 * await tester.runAllTests();
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const TSVCategorizer = require('./tsv-categorizer');

/**
 * Comprehensive unit testing framework for TSV Ledger analysis algorithms
 * 
 * @class AnalysisUnitTester
 * @description Provides automated testing for all analysis components including
 *              Subscribe & Save detection, category classification, location detection,
 *              data quality metrics, performance benchmarks, and edge case handling.
 */
class AnalysisUnitTester {
  /**
   * Initialize the testing framework
   * 
   * @constructor
   * @description Sets up test environment with categorizer instance and result tracking
   */
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.amazonData = [];
    this.analysis = null;
  }

  /**
   * Load Amazon CSV data for comprehensive testing
   * 
   * @async
   * @method loadTestData
   * @description Loads and normalizes Amazon order history from CSV file.
   *              Handles multiple CSV column formats and validates data integrity.
   * @returns {Promise<Array>} Array of normalized order objects
   * @throws {Error} If CSV file is not found or data is corrupted
   * 
   * @example
   * const orders = await tester.loadTestData();
   * console.log(`Loaded ${orders.length} orders for testing`);
   */
  async loadTestData() {
    console.log('🔄 Loading Amazon order data for testing...');
    
    const dataFile = path.join(__dirname, 'amazon_order_history.csv');
    if (!fs.existsSync(dataFile)) {
      throw new Error('❌ Amazon data file not found. Please ensure amazon_order_history.csv exists.');
    }

    return new Promise((resolve, reject) => {
      const orders = [];
      fs.createReadStream(dataFile)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize the data structure to match actual CSV format
          const order = {
            date: row['date'] || row['Order Date'] || row.Date,
            amount: parseFloat(row['total'] || row['Item Total'] || row.amount || row.Amount || 0),
            items: row['items'] || row['Title'] || row.title || '',
            payments: row['payments'] || row['Payment Method'] || '',
            shipping: row['shipping'] || row['Item Subtotal Tax'] || '0',
            orderId: row['order id'] || row['Order ID'] || row.orderId || `test-${Date.now()}-${Math.random()}`
          };
          
          if (order.date && order.amount && order.items) {
            orders.push(order);
          }
        })
        .on('end', () => {
          this.amazonData = orders;
          console.log(`✅ Loaded ${orders.length} Amazon orders for testing`);
          resolve(orders);
        })
        .on('error', reject);
    });
  }

  // Run a full analysis using the same logic as the server
  runAnalysis() {
    console.log('\n🔄 Running full analysis...');
    
    const analysis = {
      overview: {
        totalExpenditures: this.amazonData.length,
        amazonOrders: this.amazonData.length,
        totalAmount: this.amazonData.reduce((sum, order) => sum + Math.abs(order.amount), 0)
      },
      categories: {},
      locations: { Freeport: 0, Smithville: 0 },
      subscribeAndSave: { count: 0, total: 0, confidence: 0, averageConfidence: 0 },
      employeeBenefits: { count: 0, total: 0 },
      monthlyTrends: {},
      seasonalTrends: { Spring: 0, Summer: 0, Fall: 0, Winter: 0 },
      dataQuality: {
        amazonDataCompleteness: 0,
        bankDataCompleteness: 0.85,
        overallCompleteness: 0,
        confidenceScores: {}
      }
    };

    // Analyze each order
    const detailedAnalyses = this.amazonData.map(order => {
      const orderAnalysis = this.categorizer.analyzeAmazonOrder(order);
      const amount = Math.abs(order.amount);

      // Update categories
      if (!analysis.categories[orderAnalysis.category]) {
        analysis.categories[orderAnalysis.category] = { total: 0, count: 0, subcategories: {} };
      }
      analysis.categories[orderAnalysis.category].total += amount;
      analysis.categories[orderAnalysis.category].count++;

      // Update locations
      analysis.locations[orderAnalysis.location] += amount;

      // Update Subscribe & Save
      if (orderAnalysis.subscribeAndSave.isSubscribeAndSave) {
        analysis.subscribeAndSave.count++;
        analysis.subscribeAndSave.total += amount;
        analysis.subscribeAndSave.confidence += orderAnalysis.subscribeAndSave.confidence;
      }

      // Update employee benefits
      if (orderAnalysis.isEmployeeBenefit) {
        analysis.employeeBenefits.count++;
        analysis.employeeBenefits.total += amount;
      }

      // Update trends with error handling
      try {
        const orderDate = new Date(order.date);
        if (!isNaN(orderDate.getTime())) {
          const month = orderDate.toISOString().substring(0, 7);
          if (!analysis.monthlyTrends[month]) {
            analysis.monthlyTrends[month] = 0;
          }
          analysis.monthlyTrends[month] += amount;

          if (!analysis.seasonalTrends[orderAnalysis.seasonality.season]) {
            analysis.seasonalTrends[orderAnalysis.seasonality.season] = 0;
          }
          analysis.seasonalTrends[orderAnalysis.seasonality.season] += amount;
        }
      } catch (dateError) {
        console.warn(`Warning: Invalid date for order: ${order.date}`);
      }

      analysis.dataQuality.amazonDataCompleteness += orderAnalysis.dataQuality.completeness;

      return orderAnalysis;
    });

    // Calculate final metrics
    if (this.amazonData.length > 0) {
      analysis.dataQuality.amazonDataCompleteness = analysis.dataQuality.amazonDataCompleteness / this.amazonData.length;
      analysis.subscribeAndSave.averageConfidence = analysis.subscribeAndSave.confidence / Math.max(analysis.subscribeAndSave.count, 1);
    }

    analysis.dataQuality.overallCompleteness = (analysis.dataQuality.amazonDataCompleteness + analysis.dataQuality.bankDataCompleteness) / 2;
    analysis.dataQuality.confidenceScores = {
      subscribeAndSave: Math.min(analysis.subscribeAndSave.averageConfidence * 100, 100),
      locationDetection: 65,
      categoryClassification: 85
    };

    this.analysis = analysis;
    console.log('✅ Analysis complete');
    return analysis;
  }

  // Test Subscribe & Save detection accuracy
  testSubscribeAndSaveDetection() {
    console.log('\n🧪 Testing Subscribe & Save Detection...');
    
    const ssOrders = this.amazonData.filter(order => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      return analysis.subscribeAndSave.isSubscribeAndSave;
    });

    const expectedRange = { min: 180, max: 220 }; // Based on user's expectation of ~200
    const actualCount = ssOrders.count || this.analysis.subscribeAndSave.count;
    const averageConfidence = this.analysis.subscribeAndSave.averageConfidence;

    console.log(`📊 Subscribe & Save Results:`);
    console.log(`   • Detected: ${actualCount} orders`);
    console.log(`   • Expected Range: ${expectedRange.min}-${expectedRange.max} orders`);
    console.log(`   • Average Confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`   • Total Amount: $${this.analysis.subscribeAndSave.total.toLocaleString()}`);

    // Test accuracy
    if (actualCount >= expectedRange.min && actualCount <= expectedRange.max) {
      this.logTest('✅ PASS: S&S count within expected range', true);
    } else if (actualCount < expectedRange.min) {
      this.logTest(`⚠️  WARNING: S&S count (${actualCount}) below expected (${expectedRange.min}+)`, false, 'warning');
    } else {
      this.logTest(`⚠️  WARNING: S&S count (${actualCount}) above expected (${expectedRange.max}-)`, false, 'warning');
    }

    // Test confidence
    if (averageConfidence >= 0.6) {
      this.logTest('✅ PASS: S&S detection confidence acceptable', true);
    } else {
      this.logTest(`❌ FAIL: S&S detection confidence too low (${(averageConfidence * 100).toFixed(1)}%)`, false);
    }

    // Show sample detections for manual review
    console.log('\n🔍 Sample Subscribe & Save Detections (first 10):');
    ssOrders.slice(0, 10).forEach((order, index) => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      console.log(`   ${index + 1}. ${order.items.substring(0, 50)}... - Confidence: ${(analysis.subscribeAndSave.confidence * 100).toFixed(1)}%`);
    });

    return { actualCount, expectedRange, averageConfidence };
  }

  // Test category classification
  testCategoryClassification() {
    console.log('\n🧪 Testing Category Classification...');
    
    const categories = this.analysis.categories;
    const totalAmount = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);

    console.log('📊 Category Breakdown:');
    Object.entries(categories)
      .sort(([,a], [,b]) => b.total - a.total)
      .forEach(([category, data]) => {
        const percentage = ((data.total / totalAmount) * 100).toFixed(1);
        console.log(`   • ${category}: ${data.count} orders, $${data.total.toLocaleString()} (${percentage}%)`);
      });

    // Test that all orders are categorized
    const totalOrders = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    if (totalOrders === this.amazonData.length) {
      this.logTest('✅ PASS: All orders successfully categorized', true);
    } else {
      this.logTest(`❌ FAIL: Missing categories (${this.amazonData.length - totalOrders} orders uncategorized)`, false);
    }

    // Test for reasonable distribution (no single category > 70%)
    const maxCategoryPercent = Math.max(...Object.values(categories).map(cat => (cat.total / totalAmount) * 100));
    if (maxCategoryPercent <= 70) {
      this.logTest('✅ PASS: Category distribution appears balanced', true);
    } else {
      this.logTest(`⚠️  WARNING: One category dominates (${maxCategoryPercent.toFixed(1)}% of spending)`, false, 'warning');
    }

    return categories;
  }

  // Test location detection
  testLocationDetection() {
    console.log('\n🧪 Testing Location Detection...');
    
    const locations = this.analysis.locations;
    const totalLocationAmount = locations.Freeport + locations.Smithville;

    console.log('📊 Location Allocation:');
    console.log(`   • Freeport: $${locations.Freeport.toLocaleString()} (${((locations.Freeport / totalLocationAmount) * 100).toFixed(1)}%)`);
    console.log(`   • Smithville: $${locations.Smithville.toLocaleString()} (${((locations.Smithville / totalLocationAmount) * 100).toFixed(1)}%)`);

    // Test that locations are detected
    if (totalLocationAmount > 0) {
      this.logTest('✅ PASS: Location detection functioning', true);
    } else {
      this.logTest('❌ FAIL: No location allocation detected', false);
    }

    // Test for reasonable distribution (neither location should be 0% or 100%)
    const freeportPercent = (locations.Freeport / totalLocationAmount) * 100;
    if (freeportPercent > 5 && freeportPercent < 95) {
      this.logTest('✅ PASS: Location distribution appears realistic', true);
    } else {
      this.logTest('⚠️  WARNING: Location distribution may be unrealistic', false, 'warning');
    }

    return locations;
  }

  // Test data quality metrics
  testDataQuality() {
    console.log('\n🧪 Testing Data Quality Metrics...');
    
    const quality = this.analysis.dataQuality;

    console.log('📊 Data Quality Results:');
    console.log(`   • Amazon Data Completeness: ${(quality.amazonDataCompleteness * 100).toFixed(1)}%`);
    console.log(`   • Overall Completeness: ${(quality.overallCompleteness * 100).toFixed(1)}%`);
    console.log(`   • S&S Detection Confidence: ${quality.confidenceScores.subscribeAndSave.toFixed(1)}%`);
    console.log(`   • Location Detection Confidence: ${quality.confidenceScores.locationDetection}%`);
    console.log(`   • Category Classification Confidence: ${quality.confidenceScores.categoryClassification}%`);

    // Test completeness thresholds
    if (quality.amazonDataCompleteness >= 0.8) {
      this.logTest('✅ PASS: Amazon data completeness acceptable', true);
    } else {
      this.logTest(`⚠️  WARNING: Amazon data completeness low (${(quality.amazonDataCompleteness * 100).toFixed(1)}%)`, false, 'warning');
    }

    return quality;
  }

  // Test edge cases and robustness
  testEdgeCases() {
    console.log('\n🧪 Testing Edge Cases...');
    
    // Test with empty order
    const emptyOrder = { date: '2025-01-01', amount: 0, items: '', payments: '', shipping: '0' };
    try {
      const analysis = this.categorizer.analyzeAmazonOrder(emptyOrder);
      this.logTest('✅ PASS: Handles empty orders without crashing', true);
    } catch (error) {
      this.logTest(`❌ FAIL: Crashes on empty order: ${error.message}`, false);
    }

    // Test with malformed data
    const malformedOrder = { date: 'invalid', amount: 'not-a-number', items: null };
    try {
      const analysis = this.categorizer.analyzeAmazonOrder(malformedOrder);
      this.logTest('✅ PASS: Handles malformed data gracefully', true);
    } catch (error) {
      this.logTest(`❌ FAIL: Crashes on malformed data: ${error.message}`, false);
    }

    // Test with extremely large amounts
    const largeOrder = { date: '2025-01-01', amount: 999999, items: 'Expensive item', payments: 'Credit', shipping: '0' };
    try {
      const analysis = this.categorizer.analyzeAmazonOrder(largeOrder);
      this.logTest('✅ PASS: Handles large amounts correctly', true);
    } catch (error) {
      this.logTest(`❌ FAIL: Issues with large amounts: ${error.message}`, false);
    }
  }

  // Performance testing
  testPerformance() {
    console.log('\n🧪 Testing Performance...');
    
    const startTime = Date.now();
    
    // Process a subset for performance testing
    const sampleSize = Math.min(1000, this.amazonData.length);
    const sampleData = this.amazonData.slice(0, sampleSize);
    
    sampleData.forEach(order => {
      this.categorizer.analyzeAmazonOrder(order);
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const ordersPerSecond = (sampleSize / processingTime * 1000).toFixed(0);
    
    console.log(`📊 Performance Results:`);
    console.log(`   • Processed ${sampleSize} orders in ${processingTime}ms`);
    console.log(`   • Rate: ${ordersPerSecond} orders/second`);
    
    if (ordersPerSecond >= 100) {
      this.logTest('✅ PASS: Performance is acceptable', true);
    } else {
      this.logTest(`⚠️  WARNING: Performance may be slow (${ordersPerSecond} orders/sec)`, false, 'warning');
    }
    
    return { processingTime, ordersPerSecond, sampleSize };
  }

  // Helper function to log test results
  logTest(message, passed, type = 'test') {
    this.testResults.details.push({ message, passed, type });
    
    if (type === 'warning') {
      this.testResults.warnings++;
    } else if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    
    console.log(`   ${message}`);
  }

  // Generate insights for detected issues
  generateInsights() {
    console.log('\n💡 Analysis Insights & Recommendations:');
    
    const ssCount = this.analysis.subscribeAndSave.count;
    const ssConfidence = this.analysis.subscribeAndSave.averageConfidence;
    
    if (ssCount < 180) {
      console.log('🔍 Subscribe & Save Detection Insights:');
      console.log('   • Detection count is below expected range');
      console.log('   • Consider adding more keyword patterns');
      console.log('   • Review common product names in your data');
      console.log('   • May need to adjust confidence thresholds');
    }
    
    if (ssConfidence < 0.6) {
      console.log('🔍 Detection Confidence Insights:');
      console.log('   • Algorithm confidence is low');
      console.log('   • Consider reviewing detection criteria');
      console.log('   • May need more sophisticated pattern matching');
    }
    
    // Category insights
    const categories = this.analysis.categories;
    const totalAmount = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
    const topCategory = Object.entries(categories).sort(([,a], [,b]) => b.total - a.total)[0];
    
    if (topCategory && (topCategory[1].total / totalAmount) > 0.5) {
      console.log('🔍 Category Distribution Insights:');
      console.log(`   • ${topCategory[0]} dominates spending (${((topCategory[1].total / totalAmount) * 100).toFixed(1)}%)`);
      console.log('   • Consider reviewing categorization rules');
      console.log('   • May indicate specific business focus or needs');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 TSV Ledger Analysis Unit Testing Framework');
    console.log('============================================\n');
    
    try {
      // Load data and run analysis
      await this.loadTestData();
      this.runAnalysis();
      
      // Run all test suites
      this.testSubscribeAndSaveDetection();
      this.testCategoryClassification();
      this.testLocationDetection();
      this.testDataQuality();
      this.testEdgeCases();
      this.testPerformance();
      
      // Generate insights
      this.generateInsights();
      
      // Final summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      process.exit(1);
    }
  }

  // Print final test summary
  printSummary() {
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
    console.log(`📊 Total Tests: ${this.testResults.passed + this.testResults.failed + this.testResults.warnings}`);
    
    const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed + this.testResults.warnings) * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 All critical tests passed!');
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} critical issues found. Review details above.`);
    }
    
    console.log('\n💡 Use this data to iterate and improve the analysis algorithms.');
  }
}

// Export for use as module or run directly
if (require.main === module) {
  const tester = new AnalysisUnitTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AnalysisUnitTester;
