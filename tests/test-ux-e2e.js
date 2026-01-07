/**
 * UX/E2E Testing Suite - Manual HTTP-based Testing
 *
 * Comprehensive UX testing for all workflows using HTTP requests
 * Simulates user interactions through API calls
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class UXTestingSuite {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.testResults = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${status}: ${message}`);
    this.testResults.push({ timestamp, status, message });
  }

  async makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const client = options.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            };
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testDashboardAccess() {
    this.log('🖥️ Testing Dashboard Access');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
      });

      if (response.statusCode === 200 && response.body.includes('TSV Ledger')) {
        this.log('✅ Dashboard loads successfully', 'PASS');
        return true;
      } else {
        this.log('❌ Dashboard failed to load', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Dashboard error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testDataImportWorkflow() {
    this.log('📊 Testing Data Import Workflow');

    try {
      // Test CSV import endpoint
      const testData = {
        csvData: 'Date,Amount,Description,Vendor,Category\n2025-01-15,29.99,Office Supplies,Amazon,Office Supplies',
        importType: 'csv'
      };

      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/import-csv',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, testData);

      if (response.statusCode === 200) {
        this.log('✅ CSV import successful', 'PASS');
        return true;
      } else {
        this.log(`❌ CSV import failed: ${response.statusCode}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Import workflow error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testExpenditureManagement() {
    this.log('💰 Testing Expenditure Management');

    try {
      // Test adding expenditure
      const newExpense = {
        date: '2025-01-20',
        amount: 75.50,
        description: 'Team Lunch',
        category: 'Food & Dining',
        vendor: 'Texas Roadhouse'
      };

      const addResponse = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/expenditures',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, newExpense);

      if (addResponse.statusCode !== 200) {
        this.log(`❌ Add expenditure failed: ${addResponse.statusCode}`, 'FAIL');
        return false;
      }

      // Test retrieving expenditures
      const getResponse = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/expenditures',
        method: 'GET'
      });

      if (getResponse.statusCode === 200) {
        const expenses = JSON.parse(getResponse.body);
        if (Array.isArray(expenses) && expenses.length > 0) {
          this.log(`✅ Expenditure management successful - ${expenses.length} expenses retrieved`, 'PASS');
          return true;
        }
      }

      this.log('❌ Expenditure retrieval failed', 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ Expenditure management error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testAnalysisWorkflow() {
    this.log('📈 Testing Analysis Workflow');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/analysis',
        method: 'GET'
      });

      if (response.statusCode === 200) {
        const analysis = JSON.parse(response.body);
        if (analysis && typeof analysis === 'object') {
          this.log('✅ Analysis workflow successful', 'PASS');
          return true;
        }
      }

      this.log(`❌ Analysis failed: ${response.statusCode}`, 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ Analysis workflow error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testAIAnalysisWorkflow() {
    this.log('🤖 Testing AI Analysis Workflow');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai-analysis',
        method: 'GET'
      });

      if (response.statusCode === 200) {
        const aiAnalysis = JSON.parse(response.body);
        if (aiAnalysis && typeof aiAnalysis === 'object') {
          this.log('✅ AI Analysis workflow successful', 'PASS');
          return true;
        }
      }

      this.log(`❌ AI Analysis failed: ${response.statusCode}`, 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ AI Analysis workflow error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testAmazonDataWorkflow() {
    this.log('📦 Testing Amazon Data Workflow');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/amazon-items',
        method: 'GET'
      });

      if (response.statusCode === 200) {
        const amazonData = JSON.parse(response.body);
        if (Array.isArray(amazonData)) {
          this.log(`✅ Amazon data workflow successful - ${amazonData.length} items`, 'PASS');
          return true;
        }
      }

      this.log(`❌ Amazon data failed: ${response.statusCode}`, 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ Amazon data workflow error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testPremiumFeatures() {
    this.log('⭐ Testing Premium Features');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/premium-analytics',
        method: 'GET'
      });

      if (response.statusCode === 200) {
        const premiumData = JSON.parse(response.body);
        if (premiumData && typeof premiumData === 'object') {
          this.log('✅ Premium features successful', 'PASS');
          return true;
        }
      }

      this.log(`❌ Premium features failed: ${response.statusCode}`, 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ Premium features error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testErrorHandling() {
    this.log('🚨 Testing Error Handling');

    try {
      // Test invalid data
      const invalidData = {
        date: 'invalid-date',
        amount: 'not-a-number',
        description: '',
        category: 'Invalid'
      };

      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/expenditures',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, invalidData);

      // Should return error status
      if (response.statusCode >= 400) {
        this.log('✅ Error handling working correctly', 'PASS');
        return true;
      } else {
        this.log('❌ Error handling not working - accepted invalid data', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error handling test error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async testMenuNavigation() {
    this.log('🧭 Testing Menu Navigation');

    try {
      // Test menu API
      const menuResponse = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/menu.json',
        method: 'GET'
      });

      if (menuResponse.statusCode === 200) {
        const menuData = JSON.parse(menuResponse.body);
        if (menuData && typeof menuData === 'object') {
          this.log('✅ Menu navigation successful', 'PASS');
          return true;
        }
      }

      this.log(`❌ Menu navigation failed: ${menuResponse.statusCode}`, 'FAIL');
      return false;
    } catch (error) {
      this.log(`❌ Menu navigation error: ${error.message}`, 'FAIL');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive UX/E2E Testing Suite');
    this.log('================================================');

    const tests = [
      { name: 'Dashboard Access', fn: this.testDashboardAccess.bind(this) },
      { name: 'Data Import Workflow', fn: this.testDataImportWorkflow.bind(this) },
      { name: 'Expenditure Management', fn: this.testExpenditureManagement.bind(this) },
      { name: 'Analysis Workflow', fn: this.testAnalysisWorkflow.bind(this) },
      { name: 'AI Analysis Workflow', fn: this.testAIAnalysisWorkflow.bind(this) },
      { name: 'Amazon Data Workflow', fn: this.testAmazonDataWorkflow.bind(this) },
      { name: 'Premium Features', fn: this.testPremiumFeatures.bind(this) },
      { name: 'Error Handling', fn: this.testErrorHandling.bind(this) },
      { name: 'Menu Navigation', fn: this.testMenuNavigation.bind(this) }
    ];

    const results = {
      passed: 0,
      failed: 0,
      total: tests.length
    };

    for (const test of tests) {
      this.log(`\n📋 Running: ${test.name}`);
      try {
        const success = await test.fn();
        if (success) {
          results.passed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        this.log(`❌ Test ${test.name} crashed: ${error.message}`, 'ERROR');
        results.failed++;
      }
    }

    // Summary
    this.log('\n📊 UX/E2E Testing Summary');
    this.log('========================');
    this.log(`Total Tests: ${results.total}`);
    this.log(`Passed: ${results.passed}`, results.passed === results.total ? 'PASS' : 'WARN');
    this.log(`Failed: ${results.failed}`, results.failed === 0 ? 'PASS' : 'FAIL');

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'PASS' : 'WARN');

    return results;
  }

  saveResults() {
    const resultsPath = path.join(__dirname, 'ux-e2e-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    this.log(`\n💾 Results saved to: ${resultsPath}`);
  }
}

// Run the tests
async function main() {
  const tester = new UXTestingSuite();

  try {
    const results = await tester.runAllTests();
    tester.saveResults();

    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ UX Testing Suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UXTestingSuite;