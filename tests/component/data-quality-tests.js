/**
 * Data Quality Tests
 * Tests data validation, integrity, and quality metrics
 * @module tests/component/data-quality-tests
 */

const path = require('path');

/**
 * Data Quality Test Suite
 * Tests data validation, completeness, and integrity of order data
 */
class DataQualityTests {
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
        '../../test-data/amazon-test-sample.csv'
      );
      const fs = require('fs');

      if (fs.existsSync(testDataPath)) {
        const csv = require('csv-parser');
        const data = [];

        await new Promise((resolve, reject) => {
          fs.createReadStream(testDataPath)
            .pipe(csv())
            .on('data', (row) => {
              if (data.length < count) {
                data.push({
                  date: row.date,
                  amount: parseFloat(row.amount) || 0,
                  items: row.items || '',
                  orderId: row.orderId || `test-${data.length}`
                });
              }
            })
            .on('end', () => resolve())
            .on('error', reject);
        });

        this.sampleData = data;
      } else {
        // Generate mock data with intentional quality issues
        this.sampleData = this.generateMockData(count);
      }
    }
  }

  /**
   * Generate mock Amazon order data with intentional quality issues for testing
   * @param {number} count - Number of mock orders to generate
   * @returns {Array} Mock order data with quality issues
   */
  generateMockData(count) {
    const data = [];

    for (let i = 0; i < count; i++) {
      const order = {
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: -(Math.random() * 100 + 5).toFixed(2),
        items: `Test item ${i + 1} and accessories`,
        orderId: `QUAL-${String(i + 1).padStart(3, '0')}`
      };

      // Introduce intentional quality issues for testing
      const rand = Math.random();

      if (rand < 0.05) {
        // 5% invalid dates
        order.date = 'invalid-date';
      } else if (rand < 0.1) {
        // 5% missing dates
        order.date = '';
      }

      if (rand >= 0.05 && rand < 0.08) {
        // 3% invalid amounts
        order.amount = 'not-a-number';
      } else if (rand >= 0.08 && rand < 0.11) {
        // 3% missing amounts
        order.amount = null;
      }

      if (rand >= 0.11 && rand < 0.16) {
        // 5% empty/short items
        order.items = rand < 0.13 ? '' : 'x';
      }

      if (rand >= 0.16 && rand < 0.18) {
        // 2% duplicate order IDs
        order.orderId = 'QUAL-001'; // Force duplicate
      }

      data.push(order);
    }

    return data;
  }

  /**
   * Test data quality and validation
   * @returns {Object} Test results
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

    this.sampleData.forEach((order) => {
      results.tested++;
      let recordValid = true;

      // Check required fields
      requiredFields.forEach((field) => {
        if (!order[field] || order[field] === '') {
          if (!results.missingFields.has(field)) {
            results.missingFields.set(field, 0);
          }
          results.missingFields.set(
            field,
            results.missingFields.get(field) + 1
          );
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

    console.log('\n📊 Data Quality Results:');
    console.log(`   Tested Records: ${results.tested}`);
    console.log(`   Valid Records: ${results.validRecords}`);
    console.log(`   Quality Score: ${results.qualityScore.toFixed(1)}%`);

    console.log('\n❌ Issues Found:');
    console.log(`   Invalid Dates: ${results.invalidDates}`);
    console.log(`   Invalid Amounts: ${results.invalidAmounts}`);
    console.log(`   Empty Items: ${results.emptyItems}`);
    console.log(`   Duplicate Orders: ${results.duplicateOrders}`);

    if (results.missingFields.size > 0) {
      console.log('\n📋 Missing Fields:');
      for (const [field, count] of results.missingFields) {
        console.log(`   ${field}: ${count} records`);
      }
    }

    if (results.issues.length > 0) {
      console.log('\n⚠️  Sample Issues:');
      results.issues.slice(0, 5).forEach((issue) => {
        console.log(`   • ${issue.type}: ${issue.orderId} (${issue.value})`);
      });
    }

    this.testResults.set('dataQuality', results);
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
   * Calculate data quality score
   * @returns {number} Score as percentage
   */
  getScore() {
    const results = this.testResults.get('dataQuality');
    if (!results) {
      return 0;
    }

    return results.qualityScore;
  }
}

module.exports = DataQualityTests;
