/**
 * Validation Rules Module
 * Defines and executes validation rules for analysis results
 * @module tests/iterative/validation-rules
 */

class ValidationRules {
  constructor() {
    this.validationRules = [];
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
          const ssRate =
            analysis.subscribeAndSave.count / analysis.overview.amazonOrders;
          return ssRate >= 0.15 && ssRate <= 0.6; // 15-60% is realistic range
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
        description:
          'Should have at least 3 categories including Food/Household items'
      },
      {
        name: 'Amount Validation',
        test: (analysis) => {
          const total = analysis.overview.totalAmount;
          const categorySum = Object.values(analysis.categories).reduce(
            (sum, cat) => sum + cat.total,
            0
          );
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
          const nonZeroLocations = locations.filter((val) => val > 0).length;
          return nonZeroLocations >= 1 && nonZeroLocations <= 2;
        },
        severity: 'info',
        description:
          'Location distribution should be reasonable (1-2 locations)'
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
          const nonZeroSeasons = seasons.filter((val) => val > 0).length;
          return nonZeroSeasons >= 2; // At least 2 seasons should have data
        },
        severity: 'info',
        description: 'Should have data across multiple seasons'
      }
    ];
  }

  /**
   * Run validation suite against analysis results
   * @param {Object} analysis - Analysis results to validate
   * @returns {Object} Validation results
   */
  runValidationSuite(analysis) {
    console.log('\n🔍 Running validation suite...');

    const issues = [];
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      info: 0
    };

    this.validationRules.forEach((rule) => {
      try {
        const passed = rule.test(analysis);
        const status = passed ? '✅' : '❌';
        const severity = passed ? 'PASS' : rule.severity.toUpperCase();

        console.log(`${status} ${rule.name}: ${severity}`);
        if (!passed) {
          console.log(`   └─ ${rule.description}`);
          issues.push({
            rule: rule.name,
            severity: rule.severity,
            description: rule.description,
            details: this.getValidationDetails(rule.name, analysis)
          });
        }

        if (passed) {
          results.passed++;
        } else {
          results[rule.severity]++;
        }
      } catch (error) {
        console.log(`⚠️  ${rule.name}: ERROR - ${error.message}`);
        issues.push({
          rule: rule.name,
          severity: 'error',
          description: `Validation error: ${error.message}`,
          details: null
        });
        results.failed++;
      }
    });

    return { results, issues };
  }

  /**
   * Get detailed information for failed validations
   * @param {string} ruleName - Name of the validation rule
   * @param {Object} analysis - Analysis results
   * @returns {Object} Detailed validation information
   */
  getValidationDetails(ruleName, analysis) {
    switch (ruleName) {
    case 'Subscribe & Save Detection Accuracy':
      const ssRate =
          analysis.subscribeAndSave.count / analysis.overview.amazonOrders;
      return {
        currentRate: `${(ssRate * 100).toFixed(2)}%`,
        expectedRange: '15-60%',
        detected: analysis.subscribeAndSave.count,
        total: analysis.overview.amazonOrders,
        averageConfidence: `${(
          analysis.subscribeAndSave.averageConfidence * 100
        ).toFixed(1)}%`
      };

    case 'Amount Validation':
      const total = analysis.overview.totalAmount;
      const categorySum = Object.values(analysis.categories).reduce(
        (sum, cat) => sum + cat.total,
        0
      );
      return {
        totalAmount: total.toFixed(2),
        categorySum: categorySum.toFixed(2),
        difference: (total - categorySum).toFixed(2),
        percentageDiff: `${(
          (Math.abs(total - categorySum) / total) *
            100
        ).toFixed(2)}%`
      };

    case 'Category Distribution Logic':
      return {
        categoriesFound: Object.keys(analysis.categories),
        categoryCount: Object.keys(analysis.categories).length,
        topCategories: Object.entries(analysis.categories)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([name, data]) => ({
            name,
            total: data.total.toFixed(2),
            count: data.count
          }))
      };

    default:
      return null;
    }
  }

  /**
   * Get all validation rules
   * @returns {Array} Array of validation rules
   */
  getRules() {
    return this.validationRules;
  }
}

module.exports = ValidationRules;
