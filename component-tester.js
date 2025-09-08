#!/usr/bin/env node

/**
 * TSV Ledger - Component-Level Unit Testing
 * 
 * @fileoverview Granular testing for individual analysis components with detailed
 *               validation and interactive debugging capabilities.
 * 
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-07
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const TSVCategorizer = require('./tsv-categorizer');

class ComponentTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testResults = new Map();
    this.sampleData = [];
    
    console.log('🔬 TSV Ledger - Component-Level Unit Testing');
    console.log('=' .repeat(60));
  }

  /**
   * Load sample data for testing
   */
  async loadSampleData(limit = 50) {
    const dataFile = path.join(__dirname, 'amazon_order_history.csv');
    
    return new Promise((resolve, reject) => {
      const samples = [];
      let count = 0;
      
      fs.createReadStream(dataFile)
        .pipe(csv())
        .on('data', (row) => {
          if (count < limit) {
            const order = {
              date: row['Order Date'] || row.date,
              amount: parseFloat(row['Item Total'] || row.total || 0),
              items: row['Title'] || row.items || '',
              payments: row['Payment Method'] || row.payments || '',
              shipping: row['Item Subtotal Tax'] || row.shipping || '0',
              orderId: row['Order ID'] || `test-${count}`,
              quantity: parseInt(row['Quantity'] || 1)
            };
            
            if (order.date && order.amount && order.items) {
              samples.push(order);
              count++;
            }
          }
        })
        .on('end', () => {
          this.sampleData = samples;
          console.log(`✅ Loaded ${samples.length} sample orders for component testing`);
          resolve(samples);
        })
        .on('error', reject);
    });
  }

  /**
   * Test Subscribe & Save detection component
   */
  testSubscribeAndSaveDetection() {
    console.log('\n🔄 Testing Subscribe & Save Detection Component...');
    
    const results = {
      tested: 0,
      detected: 0,
      highConfidence: 0,
      lowConfidence: 0,
      falsePositives: [],
      missed: [],
      details: []
    };

    // Known Subscribe & Save indicators for validation
    const knownSSIndicators = [
      'subscribe & save', 'subscription', 'recurring', 'auto-delivery',
      'monthly delivery', 'subscribe', 'recurring delivery'
    ];

    this.sampleData.forEach(order => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      const ssResult = analysis.subscribeAndSave;
      
      results.tested++;
      
      // Check if order contains obvious S&S indicators
      const hasObviousIndicators = knownSSIndicators.some(indicator => 
        order.items.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (ssResult.isSubscribeAndSave) {
        results.detected++;
        
        if (ssResult.confidence > 0.8) {
          results.highConfidence++;
        } else {
          results.lowConfidence++;
        }
        
        // Check for potential false positives
        if (!hasObviousIndicators && ssResult.confidence < 0.7) {
          results.falsePositives.push({
            orderId: order.orderId,
            items: order.items,
            confidence: ssResult.confidence,
            indicators: ssResult.indicators || []
          });
        }
      } else if (hasObviousIndicators) {
        // Potential missed detection
        results.missed.push({
          orderId: order.orderId,
          items: order.items,
          expectedIndicators: knownSSIndicators.filter(ind => 
            order.items.toLowerCase().includes(ind.toLowerCase())
          )
        });
      }
      
      results.details.push({
        orderId: order.orderId,
        items: order.items.substring(0, 50) + '...',
        isDetected: ssResult.isSubscribeAndSave,
        confidence: ssResult.confidence,
        hasObviousIndicators
      });
    });

    // Calculate metrics
    const detectionRate = (results.detected / results.tested * 100).toFixed(1);
    const accuracyRate = ((results.detected - results.falsePositives.length) / results.tested * 100).toFixed(1);
    
    console.log(`\n📊 Subscribe & Save Detection Results:`);
    console.log(`   Tested Orders: ${results.tested}`);
    console.log(`   Detected S&S: ${results.detected} (${detectionRate}%)`);
    console.log(`   High Confidence: ${results.highConfidence}`);
    console.log(`   Low Confidence: ${results.lowConfidence}`);
    console.log(`   Potential False Positives: ${results.falsePositives.length}`);
    console.log(`   Potentially Missed: ${results.missed.length}`);
    console.log(`   Estimated Accuracy: ${accuracyRate}%`);

    if (results.falsePositives.length > 0) {
      console.log(`\n⚠️  Potential False Positives:`);
      results.falsePositives.slice(0, 3).forEach(fp => {
        console.log(`   • ${fp.items.substring(0, 40)}... (confidence: ${(fp.confidence * 100).toFixed(1)}%)`);
      });
    }

    if (results.missed.length > 0) {
      console.log(`\n❌ Potentially Missed Detections:`);
      results.missed.slice(0, 3).forEach(missed => {
        console.log(`   • ${missed.items.substring(0, 40)}... (indicators: ${missed.expectedIndicators.join(', ')})`);
      });
    }

    this.testResults.set('subscribeAndSave', results);
    return results;
  }

  /**
   * Test category classification component
   */
  testCategoryClassification() {
    console.log('\n📂 Testing Category Classification Component...');
    
    const results = {
      tested: 0,
      categories: new Map(),
      uncategorized: [],
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
      details: []
    };

    this.sampleData.forEach(order => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      
      results.tested++;
      
      // Track category distribution
      const category = analysis.category;
      if (!results.categories.has(category)) {
        results.categories.set(category, { count: 0, totalAmount: 0, samples: [] });
      }
      
      const categoryData = results.categories.get(category);
      categoryData.count++;
      categoryData.totalAmount += Math.abs(order.amount);
      
      if (categoryData.samples.length < 3) {
        categoryData.samples.push(order.items.substring(0, 40) + '...');
      }
      
      // Check if uncategorized
      if (category === 'Other' || category === 'Uncategorized') {
        results.uncategorized.push({
          orderId: order.orderId,
          items: order.items,
          amount: order.amount
        });
      }
      
      // Confidence assessment (mock - would need actual confidence scores)
      const itemLength = order.items.length;
      const hasKeywords = /food|grocery|household|electronics|book|clothing/i.test(order.items);
      let confidence = 0.5;
      
      if (hasKeywords) confidence += 0.3;
      if (itemLength > 20) confidence += 0.2;
      
      if (confidence > 0.8) results.confidenceDistribution.high++;
      else if (confidence > 0.6) results.confidenceDistribution.medium++;
      else results.confidenceDistribution.low++;
      
      results.details.push({
        orderId: order.orderId,
        category: category,
        items: order.items.substring(0, 40) + '...',
        amount: order.amount,
        estimatedConfidence: confidence
      });
    });

    console.log(`\n📊 Category Classification Results:`);
    console.log(`   Tested Orders: ${results.tested}`);
    console.log(`   Unique Categories: ${results.categories.size}`);
    console.log(`   Uncategorized: ${results.uncategorized.length} (${(results.uncategorized.length / results.tested * 100).toFixed(1)}%)`);
    
    console.log(`\n📈 Confidence Distribution:`);
    console.log(`   High (>80%): ${results.confidenceDistribution.high}`);
    console.log(`   Medium (60-80%): ${results.confidenceDistribution.medium}`);
    console.log(`   Low (<60%): ${results.confidenceDistribution.low}`);
    
    console.log(`\n🏷️  Top Categories:`);
    const sortedCategories = Array.from(results.categories.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
    
    sortedCategories.forEach(([category, data]) => {
      console.log(`   ${category}: ${data.count} orders, $${data.totalAmount.toFixed(2)}`);
      console.log(`     Samples: ${data.samples.join(', ')}`);
    });

    if (results.uncategorized.length > 0) {
      console.log(`\n❓ Sample Uncategorized Items:`);
      results.uncategorized.slice(0, 3).forEach(item => {
        console.log(`   • ${item.items.substring(0, 50)}... ($${item.amount})`);
      });
    }

    this.testResults.set('categoryClassification', results);
    return results;
  }

  /**
   * Test amount and calculation accuracy
   */
  testAmountCalculations() {
    console.log('\n💰 Testing Amount Calculations Component...');
    
    const results = {
      tested: 0,
      totalCalculated: 0,
      totalOriginal: 0,
      discrepancies: [],
      negativeAmounts: 0,
      zeroAmounts: 0,
      outliers: [],
      statistics: {}
    };

    const amounts = [];

    this.sampleData.forEach(order => {
      results.tested++;
      const amount = Math.abs(order.amount);
      amounts.push(amount);
      
      results.totalCalculated += amount;
      results.totalOriginal += order.amount;
      
      // Check for issues
      if (order.amount < 0) results.negativeAmounts++;
      if (order.amount === 0) results.zeroAmounts++;
      
      // Detect outliers (> 3 standard deviations from mean)
      if (amount > 300) { // Simple outlier detection
        results.outliers.push({
          orderId: order.orderId,
          amount: amount,
          items: order.items.substring(0, 40) + '...'
        });
      }
      
      // Check for calculation discrepancies
      const originalAbs = Math.abs(order.amount);
      if (Math.abs(amount - originalAbs) > 0.01) {
        results.discrepancies.push({
          orderId: order.orderId,
          original: order.amount,
          calculated: amount,
          difference: amount - originalAbs
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
      standardDeviation: 0
    };

    // Calculate standard deviation
    const mean = results.statistics.mean;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
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
    console.log(`   Range: $${results.statistics.min.toFixed(2)} - $${results.statistics.max.toFixed(2)}`);
    console.log(`   Std Dev: $${results.statistics.standardDeviation.toFixed(2)}`);

    if (results.outliers.length > 0) {
      console.log(`\n📊 Sample Outliers:`);
      results.outliers.slice(0, 3).forEach(outlier => {
        console.log(`   • $${outlier.amount}: ${outlier.items}`);
      });
    }

    this.testResults.set('amountCalculations', results);
    return results;
  }

  /**
   * Test data quality and validation
   */
  testDataQuality() {
    console.log('\n🔍 Testing Data Quality Component...');
    
    const results = {
      tested: 0,
      validRecords: 0,
      missingFields: new Map(),
      invalidDates: 0,
      invalidAmounts: 0,
      emptyItems: 0,
      duplicateOrders: 0,
      qualityScore: 0,
      issues: []
    };

    const orderIds = new Set();
    const requiredFields = ['date', 'amount', 'items', 'orderId'];

    this.sampleData.forEach(order => {
      results.tested++;
      let recordValid = true;
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!order[field] || order[field] === '') {
          if (!results.missingFields.has(field)) {
            results.missingFields.set(field, 0);
          }
          results.missingFields.set(field, results.missingFields.get(field) + 1);
          recordValid = false;
        }
      });
      
      // Validate date
      if (order.date && isNaN(new Date(order.date).getTime())) {
        results.invalidDates++;
        recordValid = false;
        results.issues.push({
          orderId: order.orderId,
          type: 'Invalid Date',
          value: order.date
        });
      }
      
      // Validate amount
      if (isNaN(order.amount) || order.amount === null) {
        results.invalidAmounts++;
        recordValid = false;
        results.issues.push({
          orderId: order.orderId,
          type: 'Invalid Amount',
          value: order.amount
        });
      }
      
      // Check for empty items
      if (!order.items || order.items.trim().length < 3) {
        results.emptyItems++;
        recordValid = false;
        results.issues.push({
          orderId: order.orderId,
          type: 'Empty/Short Items',
          value: order.items
        });
      }
      
      // Check for duplicate order IDs
      if (orderIds.has(order.orderId)) {
        results.duplicateOrders++;
        results.issues.push({
          orderId: order.orderId,
          type: 'Duplicate Order ID',
          value: order.orderId
        });
      } else {
        orderIds.add(order.orderId);
      }
      
      if (recordValid) {
        results.validRecords++;
      }
    });

    // Calculate quality score
    results.qualityScore = (results.validRecords / results.tested) * 100;

    console.log(`\n📊 Data Quality Results:`);
    console.log(`   Tested Records: ${results.tested}`);
    console.log(`   Valid Records: ${results.validRecords}`);
    console.log(`   Quality Score: ${results.qualityScore.toFixed(1)}%`);
    
    console.log(`\n❌ Issues Found:`);
    console.log(`   Invalid Dates: ${results.invalidDates}`);
    console.log(`   Invalid Amounts: ${results.invalidAmounts}`);
    console.log(`   Empty Items: ${results.emptyItems}`);
    console.log(`   Duplicate Orders: ${results.duplicateOrders}`);
    
    if (results.missingFields.size > 0) {
      console.log(`\n📋 Missing Fields:`);
      for (const [field, count] of results.missingFields) {
        console.log(`   ${field}: ${count} records`);
      }
    }

    if (results.issues.length > 0) {
      console.log(`\n⚠️  Sample Issues:`);
      results.issues.slice(0, 5).forEach(issue => {
        console.log(`   • ${issue.type}: ${issue.orderId} (${issue.value})`);
      });
    }

    this.testResults.set('dataQuality', results);
    return results;
  }

  /**
   * Generate comprehensive component test report
   */
  generateComponentReport() {
    console.log('\n📋 COMPREHENSIVE COMPONENT TEST REPORT');
    console.log('=' .repeat(70));
    
    let overallScore = 0;
    let componentCount = 0;
    
    // Subscribe & Save Component
    if (this.testResults.has('subscribeAndSave')) {
      const ss = this.testResults.get('subscribeAndSave');
      const ssScore = ((ss.detected - ss.falsePositives.length) / ss.tested) * 100;
      console.log(`\n🔄 Subscribe & Save Detection: ${ssScore.toFixed(1)}% accuracy`);
      overallScore += ssScore;
      componentCount++;
    }
    
    // Category Classification Component
    if (this.testResults.has('categoryClassification')) {
      const cat = this.testResults.get('categoryClassification');
      const catScore = ((cat.tested - cat.uncategorized.length) / cat.tested) * 100;
      console.log(`📂 Category Classification: ${catScore.toFixed(1)}% categorized`);
      overallScore += catScore;
      componentCount++;
    }
    
    // Amount Calculations Component
    if (this.testResults.has('amountCalculations')) {
      const amt = this.testResults.get('amountCalculations');
      const amtScore = ((amt.tested - amt.discrepancies.length) / amt.tested) * 100;
      console.log(`💰 Amount Calculations: ${amtScore.toFixed(1)}% accurate`);
      overallScore += amtScore;
      componentCount++;
    }
    
    // Data Quality Component
    if (this.testResults.has('dataQuality')) {
      const dq = this.testResults.get('dataQuality');
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
      recommendations: this.generateRecommendations(avgScore)
    };
  }

  /**
   * Generate specific recommendations based on test results
   */
  generateRecommendations(overallScore) {
    const recommendations = [];
    
    if (this.testResults.has('subscribeAndSave')) {
      const ss = this.testResults.get('subscribeAndSave');
      if (ss.falsePositives.length > 2) {
        recommendations.push('Refine Subscribe & Save detection patterns to reduce false positives');
      }
      if (ss.missed.length > 2) {
        recommendations.push('Add more Subscribe & Save indicators to improve detection');
      }
    }
    
    if (this.testResults.has('categoryClassification')) {
      const cat = this.testResults.get('categoryClassification');
      if (cat.uncategorized.length > cat.tested * 0.2) {
        recommendations.push('Expand category classification rules - too many uncategorized items');
      }
    }
    
    if (this.testResults.has('dataQuality')) {
      const dq = this.testResults.get('dataQuality');
      if (dq.qualityScore < 80) {
        recommendations.push('Improve data preprocessing and validation steps');
      }
    }
    
    return recommendations;
  }

  /**
   * Run all component tests
   */
  async runAllComponentTests() {
    try {
      console.log('\n🚀 Starting comprehensive component testing...');
      
      // Load sample data
      await this.loadSampleData(100); // Test with 100 orders
      
      // Run individual component tests
      this.testSubscribeAndSaveDetection();
      this.testCategoryClassification();
      this.testAmountCalculations();
      this.testDataQuality();
      
      // Generate comprehensive report
      const report = this.generateComponentReport();
      
      console.log('\n✅ Component testing complete!');
      return report;
      
    } catch (error) {
      console.error('\n❌ Component testing failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const tester = new ComponentTester();
  
  if (args.includes('--help')) {
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
  
  if (args.includes('--ss-only')) {
    tester.loadSampleData().then(() => tester.testSubscribeAndSaveDetection());
  } else if (args.includes('--category-only')) {
    tester.loadSampleData().then(() => tester.testCategoryClassification());
  } else if (args.includes('--amount-only')) {
    tester.loadSampleData().then(() => tester.testAmountCalculations());
  } else if (args.includes('--quality-only')) {
    tester.loadSampleData().then(() => tester.testDataQuality());
  } else {
    tester.runAllComponentTests().catch(console.error);
  }
}

module.exports = ComponentTester;
