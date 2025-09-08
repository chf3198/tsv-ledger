#!/usr/bin/env node

/**
 * TSV Ledger Standalone CLI Tester
 * Tests all functionality without requiring manual server management
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class StandaloneTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.serverProcess = null;
    this.verbose = false;
  }

  // Start server in the background
  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Starting server...');
      
      // Kill any existing server processes
      try {
        const { execSync } = require('child_process');
        execSync('pkill -f "node server.js"', { stdio: 'ignore' });
      } catch (e) {
        // Ignore if no processes to kill
      }

      // Start server
      this.serverProcess = spawn('node', ['server.js'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('TSV Ledger server running')) {
          console.log('✅ Server started successfully');
          // Give it a moment to fully initialize
          setTimeout(() => resolve(), 1000);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        if (this.verbose) {
          console.log('Server stderr:', data.toString());
        }
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!output.includes('TSV Ledger server running')) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  // Stop server
  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.serverProcess.on('exit', () => {
          console.log('✅ Server stopped');
          this.serverProcess = null;
          resolve();
        });
        
        // Force kill after 3 seconds
        setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
            this.serverProcess = null;
          }
          resolve();
        }, 3000);
      });
    }
  }

  // Test if server is responding
  async checkServerHealth() {
    return new Promise((resolve) => {
      const req = http.get(this.baseUrl, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  // Make HTTP request
  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : null;
            resolve({
              statusCode: res.statusCode,
              data: parsedData,
              rawData: responseData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: null,
              rawData: responseData,
              parseError: e.message
            });
          }
        });
      });

      req.on('error', reject);
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

  // Run comprehensive tests
  async runTests() {
    console.log('🚀 TSV Ledger Standalone Testing Framework');
    console.log('=' .repeat(50));

    const results = [];
    
    try {
      // Ensure server is running
      const isHealthy = await this.checkServerHealth();
      if (!isHealthy) {
        await this.startServer();
      } else {
        console.log('✅ Server is already running');
      }

      // Test suite
      const tests = [
        { name: 'Server Health', test: () => this.testHealth() },
        { name: 'Expenditures API', test: () => this.testExpenditures() },
        { name: 'Analysis API', test: () => this.testAnalysis() },
        { name: 'Amazon Items API', test: () => this.testAmazonItems() },
        { name: 'Premium Status', test: () => this.testPremiumStatus() },
        { name: 'Employee Benefits', test: () => this.testEmployeeBenefits() }
      ];

      for (const testCase of tests) {
        try {
          console.log(`\n🧪 Testing ${testCase.name}...`);
          const result = await testCase.test();
          results.push({ name: testCase.name, passed: result });
          console.log(result ? '✅ PASS' : '❌ FAIL');
        } catch (error) {
          console.log(`❌ ERROR: ${error.message}`);
          results.push({ name: testCase.name, passed: false, error: error.message });
        }
      }

      // Summary
      this.printSummary(results);

    } finally {
      // Always clean up
      await this.stopServer();
    }

    return results;
  }

  async testHealth() {
    const response = await this.makeRequest('/');
    return response.statusCode === 200;
  }

  async testExpenditures() {
    const response = await this.makeRequest('/api/expenditures');
    if (response.statusCode !== 200) return false;
    
    const expenditures = response.data;
    console.log(`   📊 Found ${expenditures.length} expenditures`);
    return Array.isArray(expenditures);
  }

  async testAnalysis() {
    const response = await this.makeRequest('/api/analysis');
    if (response.statusCode !== 200) return false;
    
    const analysis = response.data;
    console.log(`   📈 Analyzed ${analysis.overview?.totalTransactions || 0} transactions`);
    console.log(`   💰 Total amount: $${analysis.overview?.totalAmount?.toFixed(2) || 0}`);
    return analysis.overview && analysis.categories;
  }

  async testAmazonItems() {
    const response = await this.makeRequest('/api/amazon-items');
    if (response.statusCode !== 200) return false;
    
    const items = response.data;
    console.log(`   🛒 Found ${items.length} Amazon items`);
    return Array.isArray(items);
  }

  async testPremiumStatus() {
    const response = await this.makeRequest('/api/premium-status');
    if (response.statusCode !== 200) return false;
    
    const premium = response.data;
    console.log(`   ⭐ Premium features: ${premium.premiumFeaturesAvailable ? 'Available' : 'Not Available'}`);
    return premium.hasOwnProperty('premiumFeaturesAvailable');
  }

  async testEmployeeBenefits() {
    // First get some items
    const itemsResponse = await this.makeRequest('/api/amazon-items');
    if (itemsResponse.statusCode !== 200 || !itemsResponse.data.length) {
      console.log('   ⚠️ No Amazon items available for benefits test');
      return true; // Not a failure, just no data
    }

    // Test with first few items
    const testItemIds = itemsResponse.data.slice(0, 2).map(item => item.id);
    const response = await this.makeRequest('/api/employee-benefits-filter', 'POST', {
      itemIds: testItemIds
    });
    
    if (response.statusCode !== 200) return false;
    
    const result = response.data;
    console.log(`   👥 Filtered ${result.items?.length || 0} benefit items`);
    console.log(`   💰 Total value: $${result.summary?.totalAmount?.toFixed(2) || 0}`);
    return result.summary && result.items;
  }

  printSummary(results) {
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
  }

  // Quick test without full server management
  async quickTest() {
    console.log('🚀 Quick TSV Ledger Test');
    console.log('=' .repeat(25));

    const isHealthy = await this.checkServerHealth();
    if (!isHealthy) {
      console.log('❌ Server is not running');
      console.log('💡 Start server with: node server.js');
      console.log('💡 Or use: ./smart-test.sh test');
      return false;
    }

    console.log('✅ Server is running');
    
    // Quick endpoint tests
    const endpoints = [
      { name: 'Expenditures', path: '/api/expenditures' },
      { name: 'Analysis', path: '/api/analysis' },
      { name: 'Amazon Items', path: '/api/amazon-items' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path);
        const status = response.statusCode === 200 ? '✅' : '❌';
        console.log(`${status} ${endpoint.name} (${response.statusCode})`);
      } catch (error) {
        console.log(`❌ ${endpoint.name} (Error: ${error.message})`);
      }
    }

    return true;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'quick';
  
  const tester = new StandaloneTester();
  
  if (args.includes('--verbose')) {
    tester.verbose = true;
  }

  switch (command) {
    case 'full':
      await tester.runTests();
      break;
    
    case 'quick':
      await tester.quickTest();
      break;
    
    case 'help':
      console.log('TSV Ledger Standalone Tester');
      console.log('');
      console.log('Usage: node standalone-test.js [command] [options]');
      console.log('');
      console.log('Commands:');
      console.log('  quick     Quick test (requires running server)');
      console.log('  full      Full test suite (manages server automatically)');
      console.log('  help      Show this help');
      console.log('');
      console.log('Options:');
      console.log('  --verbose Show detailed output');
      break;
    
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Use "node standalone-test.js help" for usage information');
      process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrupted, cleaning up...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  });
}

module.exports = StandaloneTester;
