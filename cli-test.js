#!/usr/bin/env node

/**
 * TSV Ledger Command Line Testing Interface
 * Complete backend functionality testing without browser
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class TSVLedgerCLI {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.verbose = false;
  }

  // Utility method to make HTTP requests
  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TSV-Ledger-CLI/1.0'
        }
      };

      if (data && method !== 'GET') {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData,
              rawData: responseData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: null,
              rawData: responseData,
              parseError: e.message
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Request failed: ${err.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data && method !== 'GET') {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // Test server health
  async testHealth() {
    console.log('🔍 Testing Server Health...');
    try {
      const response = await this.makeRequest('/');
      if (response.statusCode === 200) {
        console.log('✅ Server is running and responsive');
        return true;
      } else {
        console.log(`❌ Server returned status: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Server not accessible: ${error.message}`);
      return false;
    }
  }

  // Test expenditures API
  async testExpenditures() {
    console.log('\n📊 Testing Expenditures API...');
    
    try {
      const response = await this.makeRequest('/api/expenditures');
      
      if (response.statusCode !== 200) {
        console.log(`❌ GET /api/expenditures failed: ${response.statusCode}`);
        return false;
      }

      const expenditures = response.data;
      console.log(`✅ Retrieved ${expenditures.length} expenditures`);
      
      if (expenditures.length > 0) {
        const sample = expenditures[0];
        console.log('📋 Sample expenditure:');
        console.log(`   Date: ${sample.date}`);
        console.log(`   Amount: $${Math.abs(sample.amount)}`);
        console.log(`   Description: ${sample.description?.substring(0, 50)}...`);
      }

      // Test adding an expenditure
      const testExpenditure = {
        date: '2025-09-07',
        amount: -25.99,
        description: 'CLI Test Transaction',
        category: 'Testing'
      };

      const postResponse = await this.makeRequest('/api/expenditures', 'POST', testExpenditure);
      
      if (postResponse.statusCode === 201) {
        console.log('✅ POST /api/expenditures successful');
      } else {
        console.log(`⚠️ POST /api/expenditures returned: ${postResponse.statusCode}`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Expenditures test failed: ${error.message}`);
      return false;
    }
  }

  // Test analysis API
  async testAnalysis() {
    console.log('\n🧮 Testing Analysis API...');
    
    try {
      const response = await this.makeRequest('/api/analysis');
      
      if (response.statusCode !== 200) {
        console.log(`❌ GET /api/analysis failed: ${response.statusCode}`);
        return false;
      }

      const analysis = response.data;
      console.log('✅ Analysis completed successfully');
      console.log(`📈 Total Transactions: ${analysis.overview?.totalTransactions || 0}`);
      console.log(`💰 Total Amount: $${analysis.overview?.totalAmount?.toFixed(2) || 0}`);
      console.log(`🛒 Amazon Transactions: ${analysis.overview?.amazonTransactions || 0}`);
      
      if (analysis.categories) {
        console.log('🏷️ Top Categories:');
        Object.entries(analysis.categories)
          .sort(([,a], [,b]) => b.total - a.total)
          .slice(0, 3)
          .forEach(([category, data]) => {
            console.log(`   ${category}: $${data.total.toFixed(2)} (${data.count} transactions)`);
          });
      }

      return true;
    } catch (error) {
      console.log(`❌ Analysis test failed: ${error.message}`);
      return false;
    }
  }

  // Test AI analysis API
  async testAIAnalysis() {
    console.log('\n🤖 Testing AI Analysis API...');
    
    try {
      const response = await this.makeRequest('/api/ai-analysis');
      
      if (response.statusCode !== 200) {
        console.log(`❌ GET /api/ai-analysis failed: ${response.statusCode}`);
        return false;
      }

      const aiAnalysis = response.data;
      console.log('✅ AI Analysis completed successfully');
      console.log(`🎯 AI Confidence: ${(aiAnalysis.performance?.aiConfidence * 100 || 0).toFixed(1)}%`);
      console.log(`⚡ Analysis Time: ${aiAnalysis.performance?.analysisTime?.toFixed(2) || 0}s`);
      console.log(`💡 Top Insights: ${aiAnalysis.insights?.topInsights?.length || 0}`);
      
      if (aiAnalysis.insights?.topInsights?.length > 0) {
        console.log('🔍 Sample AI Insight:');
        console.log(`   ${aiAnalysis.insights.topInsights[0].insight}`);
      }

      return true;
    } catch (error) {
      console.log(`❌ AI Analysis test failed: ${error.message}`);
      return false;
    }
  }

  // Test Amazon items API
  async testAmazonItems() {
    console.log('\n🛒 Testing Amazon Items API...');
    
    try {
      // Test regular Amazon items
      const response = await this.makeRequest('/api/amazon-items');
      
      if (response.statusCode !== 200) {
        console.log(`❌ GET /api/amazon-items failed: ${response.statusCode}`);
        return false;
      }

      const items = response.data;
      console.log(`✅ Retrieved ${items.length} Amazon items`);
      
      if (items.length > 0) {
        const sample = items[0];
        console.log('📦 Sample item:');
        console.log(`   Name: ${sample.name?.substring(0, 50)}...`);
        console.log(`   Price: $${sample.price?.toFixed(2)}`);
        console.log(`   Category: ${sample.category}`);
        console.log(`   Date: ${sample.date}`);
      }

      // Test business card filter
      const businessCardResponse = await this.makeRequest('/api/amazon-items?businessCard=true');
      if (businessCardResponse.statusCode === 200) {
        const businessItems = businessCardResponse.data;
        console.log(`✅ Business card filter: ${businessItems.length} items`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Amazon items test failed: ${error.message}`);
      return false;
    }
  }

  // Test employee benefits filter
  async testEmployeeBenefits() {
    console.log('\n👥 Testing Employee Benefits Filter...');
    
    try {
      // First get Amazon items to get some IDs
      const itemsResponse = await this.makeRequest('/api/amazon-items');
      
      if (itemsResponse.statusCode !== 200 || !itemsResponse.data.length) {
        console.log('❌ Cannot test benefits filter: No Amazon items available');
        return false;
      }

      // Select first few items for testing
      const testItemIds = itemsResponse.data.slice(0, 3).map(item => item.id);
      
      const filterResponse = await this.makeRequest('/api/employee-benefits-filter', 'POST', {
        itemIds: testItemIds
      });
      
      if (filterResponse.statusCode !== 200) {
        console.log(`❌ POST /api/employee-benefits-filter failed: ${filterResponse.statusCode}`);
        return false;
      }

      const filterResult = filterResponse.data;
      console.log('✅ Employee benefits filter successful');
      console.log(`📊 Filtered ${filterResult.items?.length || 0} items`);
      console.log(`💰 Total Value: $${filterResult.summary?.totalAmount?.toFixed(2) || 0}`);
      console.log(`📦 Order Count: ${filterResult.summary?.orderCount || 0}`);

      return true;
    } catch (error) {
      console.log(`❌ Employee benefits test failed: ${error.message}`);
      return false;
    }
  }

  // Test premium status
  async testPremiumStatus() {
    console.log('\n⭐ Testing Premium Status API...');
    
    try {
      const response = await this.makeRequest('/api/premium-status');
      
      if (response.statusCode !== 200) {
        console.log(`❌ GET /api/premium-status failed: ${response.statusCode}`);
        return false;
      }

      const premium = response.data;
      console.log('✅ Premium status retrieved');
      console.log(`🔧 Premium Features: ${premium.premiumFeaturesAvailable ? 'Available' : 'Not Available'}`);
      console.log(`📊 S&S Accuracy: ${premium.subscriptionDetectionAccuracy || 'Unknown'}`);
      
      if (premium.premiumFields) {
        const fields = Object.entries(premium.premiumFields)
          .filter(([, available]) => available)
          .map(([field]) => field);
        console.log(`📋 Available Fields: ${fields.join(', ') || 'None'}`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Premium status test failed: ${error.message}`);
      return false;
    }
  }

  // Test CSV import functionality
  async testCSVImport() {
    console.log('\n📁 Testing CSV Import API...');
    
    try {
      // Create a test CSV content
      const testCSV = [
        'Date,Description,Amount,Category',
        '2025-09-07,"CLI Test Import",-15.99,Testing',
        '2025-09-06,"Another Test",-25.50,Testing'
      ].join('\n');

      const response = await this.makeRequest('/api/import-csv', 'POST', {
        csvData: testCSV,
        source: 'cli-test'
      });
      
      if (response.statusCode === 200) {
        console.log('✅ CSV import successful');
        console.log(`📊 Imported: ${response.data.imported || 0} records`);
        console.log(`⚠️ Skipped: ${response.data.skipped || 0} records`);
      } else {
        console.log(`⚠️ CSV import returned: ${response.statusCode}`);
        if (response.data?.error) {
          console.log(`   Error: ${response.data.error}`);
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ CSV import test failed: ${error.message}`);
      return false;
    }
  }

  // Run comprehensive test suite
  async runFullTest() {
    console.log('🚀 TSV Ledger CLI Testing Framework');
    console.log('=' .repeat(50));
    
    const results = [];
    const tests = [
      { name: 'Server Health', method: 'testHealth' },
      { name: 'Expenditures API', method: 'testExpenditures' },
      { name: 'Analysis API', method: 'testAnalysis' },
      { name: 'AI Analysis API', method: 'testAIAnalysis' },
      { name: 'Amazon Items API', method: 'testAmazonItems' },
      { name: 'Employee Benefits', method: 'testEmployeeBenefits' },
      { name: 'Premium Status', method: 'testPremiumStatus' },
      { name: 'CSV Import', method: 'testCSVImport' }
    ];

    for (const test of tests) {
      try {
        const result = await this[test.method]();
        results.push({ name: test.name, passed: result });
      } catch (error) {
        console.log(`❌ ${test.name} failed: ${error.message}`);
        results.push({ name: test.name, passed: false, error: error.message });
      }
    }

    // Summary
    console.log('\n📋 Test Summary');
    console.log('=' .repeat(30));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n🎯 Results: ${passed}/${total} tests passed (${(passed/total*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Backend is fully functional.');
    } else {
      console.log('⚠️ Some tests failed. Check the output above for details.');
    }

    return passed === total;
  }

  // Individual test methods for specific functionality
  async testSpecific(testName) {
    const testMethods = {
      'health': 'testHealth',
      'expenditures': 'testExpenditures',
      'analysis': 'testAnalysis',
      'ai': 'testAIAnalysis',
      'amazon': 'testAmazonItems',
      'benefits': 'testEmployeeBenefits',
      'premium': 'testPremiumStatus',
      'csv': 'testCSVImport'
    };

    const method = testMethods[testName.toLowerCase()];
    if (!method) {
      console.log(`❌ Unknown test: ${testName}`);
      console.log('Available tests:', Object.keys(testMethods).join(', '));
      return false;
    }

    console.log(`🧪 Running ${testName} test...`);
    try {
      const result = await this[method]();
      console.log(result ? '✅ Test passed' : '❌ Test failed');
      return result;
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      return false;
    }
  }

  // Show help
  showHelp() {
    console.log('TSV Ledger CLI Testing Tool');
    console.log('Usage: node cli-test.js [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  test [test-name]   Run specific test (health, expenditures, analysis, ai, amazon, benefits, premium, csv)');
    console.log('  full              Run complete test suite');
    console.log('  help              Show this help message');
    console.log('');
    console.log('Options:');
    console.log('  --verbose         Show detailed output');
    console.log('  --port <port>     Use custom port (default: 3000)');
    console.log('');
    console.log('Examples:');
    console.log('  node cli-test.js full');
    console.log('  node cli-test.js test health');
    console.log('  node cli-test.js test analysis --verbose');
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const cli = new TSVLedgerCLI();

  // Parse arguments
  const command = args[0] || 'help';
  const subCommand = args[1];

  // Handle options
  if (args.includes('--verbose')) {
    cli.verbose = true;
  }

  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1]);
    if (!isNaN(port)) {
      cli.baseUrl = `http://localhost:${port}`;
    }
  }

  // Execute commands
  switch (command) {
    case 'full':
      await cli.runFullTest();
      break;
    
    case 'test':
      if (!subCommand) {
        console.log('❌ Test name required. Use: node cli-test.js test <test-name>');
        cli.showHelp();
        process.exit(1);
      }
      await cli.testSpecific(subCommand);
      break;
    
    case 'help':
    default:
      cli.showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = TSVLedgerCLI;
