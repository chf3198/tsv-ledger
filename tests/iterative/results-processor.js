/**
 * Results Processor Module
 * Processes and displays analysis results and improvement suggestions
 * @module tests/iterative/results-processor
 */

class ResultsProcessor {
  constructor() {
    this.issues = [];
    this.analysis = null;
  }

  /**
   * Set analysis results and issues
   * @param {Object} analysis - Analysis results
   * @param {Array} issues - Validation issues
   */
  setResults(analysis, issues) {
    this.analysis = analysis;
    this.issues = issues;
  }

  /**
   * Generate improvement suggestions based on issues
   * @returns {Array} Array of improvement suggestions
   */
  generateImprovementSuggestions() {
    console.log('\n💡 Analysis Improvement Suggestions:');
    console.log('='.repeat(50));

    const suggestions = [];

    this.issues.forEach((issue) => {
      switch (issue.rule) {
      case 'Subscribe & Save Detection Accuracy':
        suggestions.push({
          priority: 'HIGH',
          area: 'Subscribe & Save Detection',
          suggestion:
              'Review S&S detection keywords and patterns. Consider adding more indicators.',
          implementation:
              'Update TSVCategorizer.detectSubscribeAndSave() method with additional patterns.'
        });
        break;

      case 'Amount Validation':
        suggestions.push({
          priority: 'CRITICAL',
          area: 'Data Integrity',
          suggestion:
              'Fix amount calculation discrepancies between total and category sums.',
          implementation:
              'Debug category assignment logic and ensure all orders are properly categorized.'
        });
        break;

      case 'Category Distribution Logic':
        suggestions.push({
          priority: 'MEDIUM',
          area: 'Categorization',
          suggestion:
              'Expand category recognition patterns or review categorization rules.',
          implementation:
              'Add more category keywords and improve fallback categorization logic.'
        });
        break;

      case 'Data Completeness Check':
        suggestions.push({
          priority: 'MEDIUM',
          area: 'Data Quality',
          suggestion:
              'Improve data preprocessing to handle missing or malformed fields.',
          implementation:
              'Add data validation and cleaning steps in CSV parsing.'
        });
        break;
      }
    });

    suggestions.forEach((suggestion, index) => {
      console.log(
        `\n${index + 1}. [${suggestion.priority}] ${suggestion.area}`
      );
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
    console.log('='.repeat(70));

    // Overview
    console.log('\n📈 OVERVIEW:');
    console.log(`   Total Orders: ${this.analysis.overview.amazonOrders}`);
    console.log(
      `   Total Amount: $${this.analysis.overview.totalAmount.toFixed(2)}`
    );
    console.log(
      `   Average Order: $${this.analysis.overview.averageOrderValue.toFixed(
        2
      )}`
    );
    console.log(
      `   Date Range: ${this.analysis.overview.dateRange.start} to ${this.analysis.overview.dateRange.end}`
    );

    // Subscribe & Save
    const ssRate = (
      (this.analysis.subscribeAndSave.count /
        this.analysis.overview.amazonOrders) *
      100
    ).toFixed(1);
    console.log('\n🔄 SUBSCRIBE & SAVE:');
    console.log(
      `   Detected: ${this.analysis.subscribeAndSave.count} orders (${ssRate}%)`
    );
    console.log(
      `   S&S Total: $${this.analysis.subscribeAndSave.total.toFixed(2)}`
    );
    console.log(
      `   Avg Confidence: ${(
        this.analysis.subscribeAndSave.averageConfidence * 100
      ).toFixed(1)}%`
    );

    // Categories
    console.log('\n📂 TOP CATEGORIES:');
    Object.entries(this.analysis.categories)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .forEach(([name, data]) => {
        console.log(
          `   ${name}: $${data.total.toFixed(2)} (${data.count} orders)`
        );
      });

    // Data Quality
    console.log('\n🔍 DATA QUALITY:');
    console.log(
      `   Completeness: ${(
        this.analysis.dataQuality.amazonDataCompleteness * 100
      ).toFixed(1)}%`
    );
    console.log(
      `   Integrity: ${(this.analysis.dataQuality.dataIntegrity * 100).toFixed(
        1
      )}%`
    );
    console.log(
      `   Overall: ${(
        this.analysis.dataQuality.overallCompleteness * 100
      ).toFixed(1)}%`
    );

    // Issues Summary
    const errorCount = this.issues.filter((i) => i.severity === 'error').length;
    const warningCount = this.issues.filter(
      (i) => i.severity === 'warning'
    ).length;
    console.log('\n⚠️  ISSUES DETECTED:');
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Warnings: ${warningCount}`);
    console.log(`   Total Issues: ${this.issues.length}`);
  }

  /**
   * Get issues count by severity
   * @returns {Object} Issues count by severity
   */
  getIssuesSummary() {
    return {
      errors: this.issues.filter((i) => i.severity === 'error').length,
      warnings: this.issues.filter((i) => i.severity === 'warning').length,
      info: this.issues.filter((i) => i.severity === 'info').length,
      total: this.issues.length
    };
  }
}

module.exports = ResultsProcessor;
