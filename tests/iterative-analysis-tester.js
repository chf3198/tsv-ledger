#!/usr/bin/env node

/**
 * TSV Ledger - Iterative Analysis Testing Framework Orchestrator
 *
 * @fileoverview Orchestrates modular iterative analysis testing with detailed
 *               validation and automated improvement suggestions.
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

const TSVCategorizer = require('../src/tsv-categorizer');

// Import modular components
const DataLoader = require('./iterative/data-loader');
const AnalysisRunner = require('./iterative/analysis-runner');
const ValidationRules = require('./iterative/validation-rules');
const ResultsProcessor = require('./iterative/results-processor');

class IterativeAnalysisTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
    this.testData = [];
    this.analysis = null;
    this.iterations = 0;
    this.maxIterations = 10;
    this.issues = [];
    this.fixes = [];

    // Initialize modular components
    this.dataLoader = new DataLoader();
    this.analysisRunner = new AnalysisRunner(this.categorizer);
    this.validationRules = new ValidationRules();
    this.resultsProcessor = new ResultsProcessor();

    console.log('🧪 TSV Ledger - Iterative Analysis Testing Framework v3.0.0');
    console.log('='.repeat(70));
  }

  /**
   * Load and validate test data
   */
  async loadTestData() {
    const data = await this.dataLoader.loadTestData();
    this.testData = data;
    this.analysisRunner.setTestData(data);
    return data;
  }

  /**
   * Run comprehensive analysis on test data
   */
  /**
   * Run comprehensive analysis on test data
   */
  runAnalysis() {
    this.analysis = this.analysisRunner.runAnalysis();
    return this.analysis;
  }

  /**
   * Calculate comprehensive data quality metrics
   */
  calculateDataQuality() {
    let completenessScore = 0;
    const integrityScore = 0;
    const missingFields = [];

    // Check data completeness
    const requiredFields = ['date', 'amount', 'items', 'orderId'];
    const optionalFields = ['payments', 'shipping', 'category'];

    this.testData.forEach((order) => {
      let orderCompleteness = 0;

      requiredFields.forEach((field) => {
        if (order[field] && order[field] !== '') {
          orderCompleteness += 0.6;
        }
      });

      optionalFields.forEach((field) => {
        if (order[field] && order[field] !== '') {
          orderCompleteness += 0.13;
        }
      });

      completenessScore += Math.min(orderCompleteness, 1.0);
    });

    this.analysis.dataQuality.amazonDataCompleteness =
      completenessScore / this.testData.length;

    // Check data integrity (valid dates, amounts, etc.)
    let validRecords = 0;
    this.testData.forEach((order) => {
      const hasValidDate = !isNaN(new Date(order.date).getTime());
      const hasValidAmount = !isNaN(order.amount) && order.amount > 0;
      const hasValidItems = order.items && order.items.length > 0;

      if (hasValidDate && hasValidAmount && hasValidItems) {
        validRecords++;
      }
    });

    this.analysis.dataQuality.dataIntegrity =
      validRecords / this.testData.length;
    this.analysis.dataQuality.overallCompleteness =
      (this.analysis.dataQuality.amazonDataCompleteness +
        this.analysis.dataQuality.dataIntegrity) /
      2;
  }

  /**
   * Get date range from data
   */
  getDateRange() {
    const dates = this.testData
      .map((order) => new Date(order.date))
      .filter((date) => !isNaN(date.getTime()));

    if (dates.length === 0) {
      return { start: 'Unknown', end: 'Unknown' };
    }

    const sortedDates = dates.sort((a, b) => a - b);
    return {
      start: sortedDates[0].toISOString().split('T')[0],
      end: sortedDates[sortedDates.length - 1].toISOString().split('T')[0],
      span: Math.ceil(
        (sortedDates[sortedDates.length - 1] - sortedDates[0]) /
          (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * Run all validation rules and collect issues
   */
  /**
   * Run all validation rules and collect issues
   */
  runValidationSuite() {
    const { results, issues } = this.validationRules.runValidationSuite(
      this.analysis
    );
    this.issues = issues;
    return results;
  }

  /**
   * Get detailed information for failed validations
   */
  getValidationDetails(ruleName) {
    return this.validationRules.getValidationDetails(ruleName, this.analysis);
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions() {
    this.resultsProcessor.setResults(this.analysis, this.issues);
    return this.resultsProcessor.generateImprovementSuggestions();
  }

  /**
   * Display comprehensive results summary
   */
  displayResultsSummary() {
    this.resultsProcessor.setResults(this.analysis, this.issues);
    this.resultsProcessor.displayResultsSummary();
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
        console.log('='.repeat(50));

        // Run analysis
        this.runAnalysis();

        // Validate results
        const validationResults = this.runValidationSuite();

        // Check if we have critical issues
        const criticalIssues = this.issues.filter(
          (i) => i.severity === 'error'
        );

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

        console.log(
          `\n❌ ${criticalIssues.length} critical issues found. Continuing to next iteration...`
        );
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
