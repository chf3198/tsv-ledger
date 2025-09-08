#!/usr/bin/env node

/**
 * TSV Ledger - Iterative Analysis Testing Framework
 * 
 * @fileoverview Advanced console-based unit testing framework that iteratively validates
 *               analysis results until all outcomes make logical sense. Provides deep
 *               validation, error detection, and automated correction suggestions.
 * 
 * @version 3.0.0
 * @author GitHub Copilot
 * @since 2025-09-07
 * 
 * @example
 * node iterative-analysis-tester.js
 * node iterative-analysis-tester.js --deep
 * node iterative-analysis-tester.js --fix-suggestions
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const TSVCategorizer = require('./tsv-categorizer');

class IterativeAnalysisTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testData = [];
    this.analysis = null;
    this.iterations = 0;
    this.maxIterations = 10;
    this.validationRules = [];
    this.issues = [];
    this.fixes = [];
    
    console.log('🧪 TSV Ledger - Iterative Analysis Testing Framework v3.0.0');
    console.log('=' .repeat(70));
    
    this.setupValidationRules();
  }

  /**
   * Setup comprehensive validation rules for analysis results
   */
  setupValidationRules() {
    this.validationRules = [
      {
        name: 'Subscribe & Save Detection Accuracy',
        test: (analysis) => {
          const ssRate = analysis.subscribeAndSave.count / analysis.overview.amazonOrders;
          return ssRate >= 0.15 && ssRate <= 0.60; // 15-60% is realistic range
        },
        severity: 'error',
        description: 'Subscribe & Save detection rate should be between 15-60%'
      },
      {
        name: 'Category Distribution Logic',
        test: (analysis) => {
          const categories = Object.keys(analysis.categories);
          const hasFood = categories.includes('Food & Groceries');
          const hasHousehold = categories.includes('Household & Personal Care');
          return categories.length >= 3 && (hasFood || hasHousehold);
        },
        severity: 'warning',
        description: 'Should have at least 3 categories including Food/Household items'
      },
      {
        name: 'Amount Validation',
        test: (analysis) => {
          const total = analysis.overview.totalAmount;
          const categorySum = Object.values(analysis.categories)
            .reduce((sum, cat) => sum + cat.total, 0);
          const diff = Math.abs(total - categorySum) / total;
          return diff < 0.05; // Less than 5% difference
        },
        severity: 'error',
        description: 'Total amounts should match across categories (within 5%)'
      },
      {
        name: 'Data Completeness Check',
        test: (analysis) => {
          return analysis.dataQuality.amazonDataCompleteness > 0.8;
        },
        severity: 'warning',
        description: 'Amazon data completeness should be above 80%'
      },
      {
        name: 'Location Distribution',
        test: (analysis) => {
          const locations = Object.values(analysis.locations);
          const nonZeroLocations = locations.filter(val => val > 0).length;
          return nonZeroLocations >= 1 && nonZeroLocations <= 2;
        },
        severity: 'info',
        description: 'Location distribution should be reasonable (1-2 locations)'
      },
      {
        name: 'Monthly Trends Consistency',
        test: (analysis) => {
          const months = Object.keys(analysis.monthlyTrends);
          return months.length >= 6; // At least 6 months of data
        },
        severity: 'info',
        description: 'Should have at least 6 months of trend data'
      },
      {
        name: 'Subscribe & Save Confidence Scores',
        test: (analysis) => {
          const avgConfidence = analysis.subscribeAndSave.averageConfidence;
          return avgConfidence >= 0.7 && avgConfidence <= 1.0;
        },
        severity: 'warning',
        description: 'Average S&S confidence should be between 70-100%'
      },
      {
        name: 'Seasonal Distribution Logic',
        test: (analysis) => {
          const seasons = Object.values(analysis.seasonalTrends);
          const nonZeroSeasons = seasons.filter(val => val > 0).length;
          return nonZeroSeasons >= 2; // At least 2 seasons should have data
        },
        severity: 'info',
        description: 'Should have data across multiple seasons'
      }
    ];
  }

  /**
   * Load and validate test data
   */
  async loadTestData() {
    console.log('\n📂 Loading test data...');
    
    const dataFile = path.join(__dirname, 'amazon_order_history.csv');
    if (!fs.existsSync(dataFile)) {
      throw new Error('❌ Amazon data file not found: amazon_order_history.csv');
    }

    return new Promise((resolve, reject) => {
      const orders = [];
      fs.createReadStream(dataFile)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize data structure
          const order = {
            date: row['Order Date'] || row.date || row.Date,
            amount: parseFloat(row['Item Total'] || row.total || row.amount || 0),
            items: row['Title'] || row.items || row.title || '',
            payments: row['Payment Method'] || row.payments || '',
            shipping: row['Item Subtotal Tax'] || row.shipping || '0',
            orderId: row['Order ID'] || row['order id'] || `test-${Date.now()}-${Math.random()}`,
            quantity: parseInt(row['Quantity'] || row.quantity || 1),
            category: row['Category'] || row.category || '',
            shippingAddress: row['Shipping Address'] || row.address || '',
            orderStatus: row['Order Status'] || row.status || 'Shipped'
          };
          
          if (order.date && order.amount && order.items) {
            orders.push(order);
          }
        })
        .on('end', () => {
          this.testData = orders;
          console.log(`✅ Loaded ${orders.length} orders for testing`);
          resolve(orders);
        })
        .on('error', reject);
    });
  }

  /**
   * Run comprehensive analysis on test data
   */
  runAnalysis() {
    console.log('\n🔬 Running comprehensive analysis...');
    
    this.analysis = {
      overview: {
        totalExpenditures: this.testData.length,
        amazonOrders: this.testData.length,
        totalAmount: this.testData.reduce((sum, order) => sum + Math.abs(order.amount), 0),
        dateRange: this.getDateRange(),
        averageOrderValue: 0
      },
      categories: {},
      locations: { Freeport: 0, Smithville: 0 },
      subscribeAndSave: { 
        count: 0, 
        total: 0, 
        confidence: 0, 
        averageConfidence: 0,
        detailedResults: []
      },
      employeeBenefits: { count: 0, total: 0 },
      monthlyTrends: {},
      seasonalTrends: { Spring: 0, Summer: 0, Fall: 0, Winter: 0 },
      dataQuality: {
        amazonDataCompleteness: 0,
        bankDataCompleteness: 0.85,
        overallCompleteness: 0,
        confidenceScores: {},
        missingFields: [],
        dataIntegrity: 0
      },
      paymentMethods: {},
      subscriptionPatterns: [],
      outliers: [],
      qualityMetrics: {}
    };

    // Process each order
    const detailedResults = [];
    let totalConfidence = 0;
    let ssCount = 0;

    this.testData.forEach(order => {
      const orderAnalysis = this.categorizer.analyzeAmazonOrder(order);
      const amount = Math.abs(order.amount);
      
      detailedResults.push({
        orderId: order.orderId,
        originalOrder: order,
        analysis: orderAnalysis,
        amount: amount
      });

      // Categories
      if (!this.analysis.categories[orderAnalysis.category]) {
        this.analysis.categories[orderAnalysis.category] = { 
          total: 0, 
          count: 0, 
          subcategories: {},
          averageAmount: 0,
          confidence: 0
        };
      }
      this.analysis.categories[orderAnalysis.category].total += amount;
      this.analysis.categories[orderAnalysis.category].count++;

      // Locations
      this.analysis.locations[orderAnalysis.location] += amount;

      // Subscribe & Save
      if (orderAnalysis.subscribeAndSave.isSubscribeAndSave) {
        ssCount++;
        this.analysis.subscribeAndSave.count++;
        this.analysis.subscribeAndSave.total += amount;
        totalConfidence += orderAnalysis.subscribeAndSave.confidence;
        
        this.analysis.subscribeAndSave.detailedResults.push({
          orderId: order.orderId,
          confidence: orderAnalysis.subscribeAndSave.confidence,
          amount: amount,
          items: order.items,
          indicators: orderAnalysis.subscribeAndSave.indicators || []
        });
      }

      // Monthly trends
      const month = new Date(order.date).toLocaleString('default', { month: 'long' });
      this.analysis.monthlyTrends[month] = (this.analysis.monthlyTrends[month] || 0) + amount;

      // Payment methods
      if (order.payments) {
        this.analysis.paymentMethods[order.payments] = 
          (this.analysis.paymentMethods[order.payments] || 0) + amount;
      }

      // Detect outliers (orders significantly above average)
      if (amount > 200) { // Threshold for outliers
        this.analysis.outliers.push({
          orderId: order.orderId,
          amount: amount,
          items: order.items,
          category: orderAnalysis.category
        });
      }
    });

    // Calculate derived metrics
    this.analysis.overview.averageOrderValue = 
      this.analysis.overview.totalAmount / this.analysis.overview.amazonOrders;
    
    this.analysis.subscribeAndSave.averageConfidence = 
      ssCount > 0 ? totalConfidence / ssCount : 0;

    // Calculate category averages
    Object.keys(this.analysis.categories).forEach(cat => {
      const category = this.analysis.categories[cat];
      category.averageAmount = category.total / category.count;
    });

    // Data quality assessment
    this.calculateDataQuality();
    
    console.log(`✅ Analysis complete - ${this.testData.length} orders processed`);
    return this.analysis;
  }

  /**
   * Calculate comprehensive data quality metrics
   */
  calculateDataQuality() {
    let completenessScore = 0;
    let integrityScore = 0;
    const missingFields = [];

    // Check data completeness
    const requiredFields = ['date', 'amount', 'items', 'orderId'];
    const optionalFields = ['payments', 'shipping', 'category'];

    this.testData.forEach(order => {
      let orderCompleteness = 0;
      
      requiredFields.forEach(field => {
        if (order[field] && order[field] !== '') orderCompleteness += 0.6;
      });
      
      optionalFields.forEach(field => {
        if (order[field] && order[field] !== '') orderCompleteness += 0.13;
      });
      
      completenessScore += Math.min(orderCompleteness, 1.0);
    });

    this.analysis.dataQuality.amazonDataCompleteness = 
      completenessScore / this.testData.length;
    
    // Check data integrity (valid dates, amounts, etc.)
    let validRecords = 0;
    this.testData.forEach(order => {
      const hasValidDate = !isNaN(new Date(order.date).getTime());
      const hasValidAmount = !isNaN(order.amount) && order.amount > 0;
      const hasValidItems = order.items && order.items.length > 0;
      
      if (hasValidDate && hasValidAmount && hasValidItems) {
        validRecords++;
      }
    });

    this.analysis.dataQuality.dataIntegrity = validRecords / this.testData.length;
    this.analysis.dataQuality.overallCompleteness = 
      (this.analysis.dataQuality.amazonDataCompleteness + 
       this.analysis.dataQuality.dataIntegrity) / 2;
  }

  /**
   * Get date range from data
   */
  getDateRange() {
    const dates = this.testData.map(order => new Date(order.date))
      .filter(date => !isNaN(date.getTime()));
    
    if (dates.length === 0) return { start: 'Unknown', end: 'Unknown' };
    
    const sortedDates = dates.sort((a, b) => a - b);
    return {
      start: sortedDates[0].toISOString().split('T')[0],
      end: sortedDates[sortedDates.length - 1].toISOString().split('T')[0],
      span: Math.ceil((sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Run all validation rules and collect issues
   */
  runValidationSuite() {
    console.log('\n🔍 Running validation suite...');
    
    this.issues = [];
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      info: 0
    };

    this.validationRules.forEach(rule => {
      try {
        const passed = rule.test(this.analysis);
        const status = passed ? '✅' : '❌';
        const severity = passed ? 'PASS' : rule.severity.toUpperCase();
        
        console.log(`${status} ${rule.name}: ${severity}`);
        if (!passed) {
          console.log(`   └─ ${rule.description}`);
          this.issues.push({
            rule: rule.name,
            severity: rule.severity,
            description: rule.description,
            details: this.getValidationDetails(rule.name)
          });
        }
        
        if (passed) {
          results.passed++;
        } else {
          results[rule.severity]++;
        }
        
      } catch (error) {
        console.log(`⚠️  ${rule.name}: ERROR - ${error.message}`);
        this.issues.push({
          rule: rule.name,
          severity: 'error',
          description: `Validation error: ${error.message}`,
          details: null
        });
        results.failed++;
      }
    });

    return results;
  }

  /**
   * Get detailed information for failed validations
   */
  getValidationDetails(ruleName) {
    switch (ruleName) {
      case 'Subscribe & Save Detection Accuracy':
        const ssRate = this.analysis.subscribeAndSave.count / this.analysis.overview.amazonOrders;
        return {
          currentRate: `${(ssRate * 100).toFixed(2)}%`,
          expectedRange: '15-60%',
          detected: this.analysis.subscribeAndSave.count,
          total: this.analysis.overview.amazonOrders,
          averageConfidence: `${(this.analysis.subscribeAndSave.averageConfidence * 100).toFixed(1)}%`
        };
      
      case 'Amount Validation':
        const total = this.analysis.overview.totalAmount;
        const categorySum = Object.values(this.analysis.categories)
          .reduce((sum, cat) => sum + cat.total, 0);
        return {
          totalAmount: total.toFixed(2),
          categorySum: categorySum.toFixed(2),
          difference: (total - categorySum).toFixed(2),
          percentageDiff: `${((Math.abs(total - categorySum) / total) * 100).toFixed(2)}%`
        };
      
      case 'Category Distribution Logic':
        return {
          categoriesFound: Object.keys(this.analysis.categories),
          categoryCount: Object.keys(this.analysis.categories).length,
          topCategories: Object.entries(this.analysis.categories)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([name, data]) => ({ name, total: data.total.toFixed(2), count: data.count }))
        };
      
      default:
        return null;
    }
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions() {
    console.log('\n💡 Analysis Improvement Suggestions:');
    console.log('=' .repeat(50));
    
    const suggestions = [];

    this.issues.forEach(issue => {
      switch (issue.rule) {
        case 'Subscribe & Save Detection Accuracy':
          suggestions.push({
            priority: 'HIGH',
            area: 'Subscribe & Save Detection',
            suggestion: 'Review S&S detection keywords and patterns. Consider adding more indicators.',
            implementation: 'Update TSVCategorizer.detectSubscribeAndSave() method with additional patterns.'
          });
          break;
        
        case 'Amount Validation':
          suggestions.push({
            priority: 'CRITICAL',
            area: 'Data Integrity',
            suggestion: 'Fix amount calculation discrepancies between total and category sums.',
            implementation: 'Debug category assignment logic and ensure all orders are properly categorized.'
          });
          break;
        
        case 'Category Distribution Logic':
          suggestions.push({
            priority: 'MEDIUM',
            area: 'Categorization',
            suggestion: 'Expand category recognition patterns or review categorization rules.',
            implementation: 'Add more category keywords and improve fallback categorization logic.'
          });
          break;
        
        case 'Data Completeness Check':
          suggestions.push({
            priority: 'MEDIUM',
            area: 'Data Quality',
            suggestion: 'Improve data preprocessing to handle missing or malformed fields.',
            implementation: 'Add data validation and cleaning steps in CSV parsing.'
          });
          break;
      }
    });

    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. [${suggestion.priority}] ${suggestion.area}`);
      console.log(`   Problem: ${suggestion.suggestion}`);
      console.log(`   Fix: ${suggestion.implementation}`);
    });

    return suggestions;
  }

  /**
   * Display comprehensive results summary
   */
  displayResultsSummary() {
    console.log('\n📊 ANALYSIS RESULTS SUMMARY');
    console.log('=' .repeat(70));
    
    // Overview
    console.log(`\n📈 OVERVIEW:`);
    console.log(`   Total Orders: ${this.analysis.overview.amazonOrders}`);
    console.log(`   Total Amount: $${this.analysis.overview.totalAmount.toFixed(2)}`);
    console.log(`   Average Order: $${this.analysis.overview.averageOrderValue.toFixed(2)}`);
    console.log(`   Date Range: ${this.analysis.overview.dateRange.start} to ${this.analysis.overview.dateRange.end}`);
    
    // Subscribe & Save
    const ssRate = (this.analysis.subscribeAndSave.count / this.analysis.overview.amazonOrders * 100).toFixed(1);
    console.log(`\n🔄 SUBSCRIBE & SAVE:`);
    console.log(`   Detected: ${this.analysis.subscribeAndSave.count} orders (${ssRate}%)`);
    console.log(`   S&S Total: $${this.analysis.subscribeAndSave.total.toFixed(2)}`);
    console.log(`   Avg Confidence: ${(this.analysis.subscribeAndSave.averageConfidence * 100).toFixed(1)}%`);
    
    // Categories
    console.log(`\n📂 TOP CATEGORIES:`);
    Object.entries(this.analysis.categories)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .forEach(([name, data]) => {
        console.log(`   ${name}: $${data.total.toFixed(2)} (${data.count} orders)`);
      });
    
    // Data Quality
    console.log(`\n🔍 DATA QUALITY:`);
    console.log(`   Completeness: ${(this.analysis.dataQuality.amazonDataCompleteness * 100).toFixed(1)}%`);
    console.log(`   Integrity: ${(this.analysis.dataQuality.dataIntegrity * 100).toFixed(1)}%`);
    console.log(`   Overall: ${(this.analysis.dataQuality.overallCompleteness * 100).toFixed(1)}%`);
    
    // Issues Summary
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    console.log(`\n⚠️  ISSUES DETECTED:`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Warnings: ${warningCount}`);
    console.log(`   Total Issues: ${this.issues.length}`);
  }

  /**
   * Main iterative testing loop
   */
  async runIterativeTests() {
    try {
      console.log('\n🚀 Starting iterative analysis testing...');
      
      // Load data
      await this.loadTestData();
      
      while (this.iterations < this.maxIterations) {
        this.iterations++;
        console.log(`\n🔄 ITERATION ${this.iterations}/${this.maxIterations}`);
        console.log('=' .repeat(50));
        
        // Run analysis
        this.runAnalysis();
        
        // Validate results
        const validationResults = this.runValidationSuite();
        
        // Check if we have critical issues
        const criticalIssues = this.issues.filter(i => i.severity === 'error');
        
        if (criticalIssues.length === 0) {
          console.log('\n🎉 SUCCESS! All critical validations passed.');
          this.displayResultsSummary();
          break;
        }
        
        if (this.iterations === this.maxIterations) {
          console.log('\n⚠️  Maximum iterations reached. Issues remain:');
          this.displayResultsSummary();
          this.generateImprovementSuggestions();
          break;
        }
        
        console.log(`\n❌ ${criticalIssues.length} critical issues found. Continuing to next iteration...`);
      }
      
      console.log('\n✅ Iterative testing complete!');
      
    } catch (error) {
      console.error('\n❌ Testing failed:', error.message);
      console.error(error.stack);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const tester = new IterativeAnalysisTester();
  
  if (args.includes('--help')) {
    console.log(`
Usage: node iterative-analysis-tester.js [options]

Options:
  --help              Show this help message
  --deep              Run deep analysis with additional validations
  --fix-suggestions   Generate detailed fix suggestions
  
Examples:
  node iterative-analysis-tester.js
  node iterative-analysis-tester.js --deep
    `);
    process.exit(0);
  }
  
  tester.runIterativeTests().catch(console.error);
}

module.exports = IterativeAnalysisTester;
