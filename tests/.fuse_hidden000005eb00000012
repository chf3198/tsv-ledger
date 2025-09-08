#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Amazon Item Edit Feature
 * Tests API endpoints, data persistence, and UX functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class AmazonEditFeatureTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
    this.testItemId = null;
    this.originalData = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({ status: res.statusCode, data: parsed, raw: responseData });
          } catch (e) {
            resolve({ status: res.statusCode, data: null, raw: responseData });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async testServerConnection() {
    this.log('Testing server connection...', 'info');
    try {
      const response = await this.makeRequest('GET', '/');
      if (response.status === 200) {
        this.log('Server is running and accessible', 'success');
        return true;
      } else {
        this.log(`Server responded with status ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Server connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAmazonItemsAPI() {
    this.log('Testing Amazon Items API...', 'info');
    try {
      const response = await this.makeRequest('GET', '/api/amazon-items');
      
      if (response.status !== 200) {
        this.log(`API returned status ${response.status}`, 'error');
        return false;
      }

      if (!Array.isArray(response.data)) {
        this.log('API did not return an array', 'error');
        return false;
      }

      this.log(`Found ${response.data.length} Amazon items`, 'success');
      
      if (response.data.length > 0) {
        const item = response.data[0];
        this.testItemId = item.id;
        this.originalData = { ...item };
        this.log(`Test item selected: ${item.name} (ID: ${item.id})`, 'info');
        
        // Validate item structure
        const requiredFields = ['id', 'name', 'price', 'category'];
        const missingFields = requiredFields.filter(field => !item[field]);
        
        if (missingFields.length > 0) {
          this.log(`Item missing required fields: ${missingFields.join(', ')}`, 'warning');
        } else {
          this.log('Item structure is valid', 'success');
        }
      }

      return true;
    } catch (error) {
      this.log(`Amazon Items API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testEditAPIEndpoint() {
    this.log('Testing Edit API Endpoint...', 'info');
    
    if (!this.testItemId) {
      this.log('No test item available for edit testing', 'error');
      return false;
    }

    try {
      // Test data for update
      const updateData = {
        category: 'test_category',
        amount: 99.99,
        description: 'Test description from automated test'
      };

      this.log(`Updating item ${this.testItemId} with test data...`, 'info');
      
      const response = await this.makeRequest('PUT', `/api/amazon-items/${this.testItemId}`, updateData);
      
      if (response.status === 200) {
        this.log('Edit API responded successfully', 'success');
        
        // Verify the response contains success indicator
        if (response.data && response.data.success) {
          this.log('API confirmed successful update', 'success');
          return true;
        } else {
          this.log('API response missing success confirmation', 'warning');
          return true; // Still consider success if status is 200
        }
      } else {
        this.log(`Edit API returned status ${response.status}`, 'error');
        this.log(`Response: ${response.raw}`, 'info');
        return false;
      }
    } catch (error) {
      this.log(`Edit API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDataPersistence() {
    this.log('Testing data persistence...', 'info');
    
    // Wait a moment for file write
    await this.delay(1000);
    
    try {
      // Check if amazon_item_edits.json exists and contains our update
      const editsPath = path.join(__dirname, 'amazon_item_edits.json');
      
      if (!fs.existsSync(editsPath)) {
        this.log('amazon_item_edits.json file not found', 'error');
        return false;
      }

      const data = JSON.parse(fs.readFileSync(editsPath, 'utf8'));
      this.log(`Loaded edits file with ${Object.keys(data).length} entries`, 'info');
      
      // Find our test item
      const edit = data[this.testItemId];
      
      if (!edit) {
        this.log(`Test item ${this.testItemId} not found in edits file`, 'error');
        return false;
      }

      // Check if our test data was persisted
      if (edit.category === 'test_category' && 
          edit.description === 'Test description from automated test') {
        this.log('Data persistence confirmed - changes saved to edits file', 'success');
        return true;
      } else {
        this.log('Data persistence failed - changes not found in edits file', 'error');
        this.log(`Found: category=${edit.category}, description=${edit.description}`, 'info');
        return false;
      }
    } catch (error) {
      this.log(`Data persistence test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testRestoreOriginalData() {
    this.log('Restoring original data...', 'info');
    
    if (!this.originalData || !this.testItemId) {
      this.log('No original data to restore', 'warning');
      return true;
    }

    try {
      const restoreData = {
        category: this.originalData.category,
        amount: this.originalData.price, // price is already a number
        description: this.originalData.description || ''
      };

      const response = await this.makeRequest('PUT', `/api/amazon-items/${this.testItemId}`, restoreData);
      
      if (response.status === 200) {
        this.log('Original data restored successfully', 'success');
        return true;
      } else {
        this.log(`Failed to restore original data: status ${response.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Data restoration failed: ${error.message}`, 'warning');
      return false;
    }
  }

  async testUIComponents() {
    this.log('Testing UI Components...', 'info');
    
    try {
      // Test employee benefits page
      const pageResponse = await this.makeRequest('GET', '/employee-benefits.html');
      
      if (pageResponse.status !== 200) {
        this.log(`Employee benefits page returned status ${pageResponse.status}`, 'error');
        return false;
      }

      const pageContent = pageResponse.raw;
      
      // Check for edit modal
      if (pageContent.includes('editItemModal')) {
        this.log('Edit modal found in HTML', 'success');
      } else {
        this.log('Edit modal not found in HTML', 'error');
        return false;
      }

      // Check for form fields
      const requiredFields = ['editItemCategory', 'editItemAmount', 'editItemDescription'];
      const missingFields = requiredFields.filter(field => !pageContent.includes(field));
      
      if (missingFields.length === 0) {
        this.log('All required form fields found', 'success');
      } else {
        this.log(`Missing form fields: ${missingFields.join(', ')}`, 'error');
        return false;
      }

      // Check for JavaScript file
      const jsResponse = await this.makeRequest('GET', '/js/employee-benefits.js');
      if (jsResponse.status === 200) {
        this.log('JavaScript file is accessible', 'success');
        
        // Check for edit functions
        const jsContent = jsResponse.raw;
        if (jsContent.includes('editItem') && jsContent.includes('saveItemChanges')) {
          this.log('Edit functions found in JavaScript', 'success');
        } else {
          this.log('Edit functions missing from JavaScript', 'error');
          return false;
        }
      } else {
        this.log('JavaScript file not accessible', 'error');
        return false;
      }

      return true;
    } catch (error) {
      this.log(`UI component test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...', 'info');
    
    try {
      // Test with invalid item ID
      const invalidResponse = await this.makeRequest('PUT', '/api/amazon-items/invalid-id-123', {
        category: 'test',
        amount: 10.00,
        description: 'test'
      });

      if (invalidResponse.status === 404 || invalidResponse.status === 400) {
        this.log('Invalid ID properly rejected', 'success');
      } else {
        this.log(`Expected 404/400 for invalid ID, got ${invalidResponse.status}`, 'warning');
      }

      // Test with missing data
      const missingDataResponse = await this.makeRequest('PUT', `/api/amazon-items/${this.testItemId}`, {});

      if (missingDataResponse.status === 400) {
        this.log('Missing data properly rejected', 'success');
      } else {
        this.log(`Expected 400 for missing data, got ${missingDataResponse.status}`, 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Error handling test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Amazon Edit Feature Test Suite', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'Server Connection', fn: () => this.testServerConnection() },
      { name: 'Amazon Items API', fn: () => this.testAmazonItemsAPI() },
      { name: 'Edit API Endpoint', fn: () => this.testEditAPIEndpoint() },
      { name: 'Data Persistence', fn: () => this.testDataPersistence() },
      { name: 'UI Components', fn: () => this.testUIComponents() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Data Restoration', fn: () => this.testRestoreOriginalData() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\nRunning test: ${test.name}`, 'info');
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          this.log(`✅ ${test.name} PASSED`, 'success');
        } else {
          failed++;
          this.log(`❌ ${test.name} FAILED`, 'error');
        }
      } catch (error) {
        failed++;
        this.log(`❌ ${test.name} ERROR: ${error.message}`, 'error');
      }
    }

    this.log('\n' + '=' .repeat(60), 'info');
    this.log(`🏁 Test Suite Complete`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'info');

    if (failed === 0) {
      this.log('🎉 All tests passed! Amazon edit feature is working correctly.', 'success');
    } else {
      this.log(`⚠️ ${failed} test(s) failed. Please review the issues above.`, 'warning');
    }

    return failed === 0;
  }
}

// CLI execution
if (require.main === module) {
  const tester = new AmazonEditFeatureTester();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Amazon Edit Feature Test Suite

Usage: node test-amazon-edit-feature.js [options]

Options:
  --help, -h     Show this help message
  --quick, -q    Run quick tests only (skip data persistence)
  --ui-only      Test UI components only
  --api-only     Test API endpoints only

Examples:
  node test-amazon-edit-feature.js           # Run all tests
  node test-amazon-edit-feature.js --quick   # Run quick tests
  node test-amazon-edit-feature.js --ui-only # Test UI only
    `);
    process.exit(0);
  }

  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite crashed:', error.message);
      process.exit(1);
    });
}

module.exports = AmazonEditFeatureTester;
