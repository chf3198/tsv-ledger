#!/usr/bin/env node

/**
 * UX Testing Script for Amazon Edit Feature
 * Simulates user interactions and validates the user experience
 */

const http = require('http');
const fs = require('fs');

class UXTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.scenarios = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', user: '👤' };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: { 'Content-Type': 'application/json' }
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
      
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async simulateUserJourney() {
    this.log('🎭 Simulating User Journey: Editing Amazon Purchase', 'user');
    
    // Step 1: User navigates to Employee Benefits page
    this.log('User opens Employee Benefits page...', 'user');
    const pageResponse = await this.makeRequest('GET', '/employee-benefits.html');
    
    if (pageResponse.status !== 200) {
      this.log('❌ User cannot access Employee Benefits page', 'error');
      return false;
    }
    this.log('✅ Employee Benefits page loads successfully', 'success');

    // Step 2: User loads Amazon items
    this.log('Page loads Amazon items...', 'user');
    const itemsResponse = await this.makeRequest('GET', '/api/amazon-items');
    
    if (itemsResponse.status !== 200 || !Array.isArray(itemsResponse.data)) {
      this.log('❌ Amazon items failed to load', 'error');
      return false;
    }
    
    const items = itemsResponse.data;
    this.log(`✅ ${items.length} Amazon items loaded`, 'success');

    if (items.length === 0) {
      this.log('❌ No items available for testing', 'error');
      return false;
    }

    // Step 3: User selects an item to edit
    const testItem = items[0];
    this.log(`User clicks edit button on: "${testItem.name}"`, 'user');
    
    // Simulate checking if edit button exists in UI
    const htmlContent = pageResponse.raw;
    if (!htmlContent.includes('editItem')) {
      this.log('❌ Edit button functionality not found in UI', 'error');
      return false;
    }
    this.log('✅ Edit button functionality detected', 'success');

    // Step 4: User modifies item details
    this.log('User opens edit modal and changes category...', 'user');
    const originalCategory = testItem.category;
    const newCategory = originalCategory === 'office_supplies' ? 'employee_amenities' : 'office_supplies';
    const newAmount = 25.99;
    const newDescription = 'Updated via UX test';

    this.log(`Changing category from "${originalCategory}" to "${newCategory}"`, 'user');
    this.log(`Setting amount to $${newAmount}`, 'user');
    this.log(`Adding description: "${newDescription}"`, 'user');

    // Step 5: User saves changes
    this.log('User clicks Save button...', 'user');
    const updateResponse = await this.makeRequest('PUT', `/api/amazon-items/${testItem.id}`, {
      category: newCategory,
      amount: newAmount,
      description: newDescription
    });

    if (updateResponse.status !== 200) {
      this.log(`❌ Save failed with status ${updateResponse.status}`, 'error');
      return false;
    }
    this.log('✅ Changes saved successfully', 'success');

    // Step 6: Verify changes persist
    this.log('Verifying changes were saved...', 'info');
    const verifyResponse = await this.makeRequest('GET', '/api/amazon-items');
    const updatedItem = verifyResponse.data.find(item => item.id === testItem.id);

    if (!updatedItem) {
      this.log('❌ Updated item not found', 'error');
      return false;
    }

    if (updatedItem.category !== newCategory) {
      this.log(`❌ Category not updated. Expected: ${newCategory}, Got: ${updatedItem.category}`, 'error');
      return false;
    }

    this.log('✅ Changes verified in data', 'success');

      // Step 7: Restore original data for next test
      this.log('Restoring original data...', 'info');
      await this.makeRequest('PUT', `/api/amazon-items/${testItem.id}`, {
        category: originalCategory,
        amount: testItem.price, // price is already a number
        description: testItem.description || ''
      });    this.log('🎉 User journey completed successfully!', 'success');
    return true;
  }

  async testResponsiveness() {
    this.log('📱 Testing UI Responsiveness...', 'info');
    
    const pageResponse = await this.makeRequest('GET', '/employee-benefits.html');
    const htmlContent = pageResponse.raw;

    // Check for Bootstrap responsive classes
    const responsiveChecks = [
      { name: 'Bootstrap Grid', check: htmlContent.includes('col-') },
      { name: 'Mobile Modal', check: htmlContent.includes('modal') },
      { name: 'Button Groups', check: htmlContent.includes('btn-group') },
      { name: 'Responsive Tables', check: htmlContent.includes('table-responsive') || htmlContent.includes('list-group') }
    ];

    let responsiveScore = 0;
    for (const check of responsiveChecks) {
      if (check.check) {
        this.log(`✅ ${check.name} detected`, 'success');
        responsiveScore++;
      } else {
        this.log(`❌ ${check.name} not found`, 'warning');
      }
    }

    this.log(`📊 Responsive Design Score: ${responsiveScore}/${responsiveChecks.length}`, 'info');
    return responsiveScore >= Math.ceil(responsiveChecks.length * 0.75);
  }

  async testAccessibility() {
    this.log('♿ Testing Accessibility Features...', 'info');
    
    const pageResponse = await this.makeRequest('GET', '/employee-benefits.html');
    const htmlContent = pageResponse.raw;

    const accessibilityChecks = [
      { name: 'Form Labels', check: htmlContent.includes('label') },
      { name: 'Button Text', check: htmlContent.includes('Edit') && htmlContent.includes('Save') },
      { name: 'ARIA Labels', check: htmlContent.includes('aria-') || htmlContent.includes('title=') },
      { name: 'Semantic HTML', check: htmlContent.includes('<form>') && htmlContent.includes('<button>') }
    ];

    let accessibilityScore = 0;
    for (const check of accessibilityChecks) {
      if (check.check) {
        this.log(`✅ ${check.name} found`, 'success');
        accessibilityScore++;
      } else {
        this.log(`❌ ${check.name} missing`, 'warning');
      }
    }

    this.log(`📊 Accessibility Score: ${accessibilityScore}/${accessibilityChecks.length}`, 'info');
    return accessibilityScore >= Math.ceil(accessibilityChecks.length * 0.75);
  }

  async testErrorScenarios() {
    this.log('🔍 Testing Error Scenarios...', 'info');
    
    // Get a test item
    const itemsResponse = await this.makeRequest('GET', '/api/amazon-items');
    if (!itemsResponse.data || itemsResponse.data.length === 0) {
      this.log('No items available for error testing', 'warning');
      return true;
    }

    const testItem = itemsResponse.data[0];
    
    // Test 1: Invalid amount
    this.log('Testing invalid amount handling...', 'user');
    const invalidAmountResponse = await this.makeRequest('PUT', `/api/amazon-items/${testItem.id}`, {
      category: 'office_supplies',
      amount: 'not-a-number',
      description: 'test'
    });

    if (invalidAmountResponse.status >= 400) {
      this.log('✅ Invalid amount properly rejected', 'success');
    } else {
      this.log('❌ Invalid amount was accepted', 'error');
      return false;
    }

    // Test 2: Missing required fields
    this.log('Testing missing fields handling...', 'user');
    const missingFieldsResponse = await this.makeRequest('PUT', `/api/amazon-items/${testItem.id}`, {});

    if (missingFieldsResponse.status >= 400) {
      this.log('✅ Missing fields properly rejected', 'success');
    } else {
      this.log('❌ Missing fields were accepted', 'error');
      return false;
    }

    // Test 3: Non-existent item
    this.log('Testing non-existent item handling...', 'user');
    const nonExistentResponse = await this.makeRequest('PUT', '/api/amazon-items/fake-id-123', {
      category: 'office_supplies',
      amount: 10.00,
      description: 'test'
    });

    if (nonExistentResponse.status >= 400) {
      this.log('✅ Non-existent item properly rejected', 'success');
    } else {
      this.log('❌ Non-existent item was accepted', 'warning');
    }

    return true;
  }

  async testPerformance() {
    this.log('⚡ Testing Performance...', 'info');
    
    const startTime = Date.now();
    
    // Test API response time
    const apiStart = Date.now();
    await this.makeRequest('GET', '/api/amazon-items');
    const apiTime = Date.now() - apiStart;
    
    // Test page load time
    const pageStart = Date.now();
    await this.makeRequest('GET', '/employee-benefits.html');
    const pageTime = Date.now() - pageStart;

    // Test edit operation time
    const itemsResponse = await this.makeRequest('GET', '/api/amazon-items');
    if (itemsResponse.data && itemsResponse.data.length > 0) {
      const testItem = itemsResponse.data[0];
      const editStart = Date.now();
      await this.makeRequest('PUT', `/api/amazon-items/${testItem.id}`, {
        category: testItem.category,
        amount: testItem.price, // price is already a number
        description: 'performance test'
      });
      const editTime = Date.now() - editStart;
      
      this.log(`⚡ Edit operation: ${editTime}ms`, editTime < 1000 ? 'success' : 'warning');
    }

    this.log(`⚡ API response: ${apiTime}ms`, apiTime < 500 ? 'success' : 'warning');
    this.log(`⚡ Page load: ${pageTime}ms`, pageTime < 1000 ? 'success' : 'warning');

    const totalTime = Date.now() - startTime;
    this.log(`⚡ Total test time: ${totalTime}ms`, 'info');

    return apiTime < 1000 && pageTime < 2000;
  }

  async runUXTests() {
    this.log('🎨 Starting UX Test Suite for Amazon Edit Feature', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'User Journey Simulation', fn: () => this.simulateUserJourney() },
      { name: 'UI Responsiveness', fn: () => this.testResponsiveness() },
      { name: 'Accessibility Features', fn: () => this.testAccessibility() },
      { name: 'Error Scenarios', fn: () => this.testErrorScenarios() },
      { name: 'Performance Metrics', fn: () => this.testPerformance() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\n🧪 Running UX test: ${test.name}`, 'info');
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
    this.log(`🎭 UX Test Suite Complete`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    
    if (failed === 0) {
      this.log('🏆 Excellent UX! All user experience tests passed.', 'success');
    } else {
      this.log(`🔧 UX improvements needed in ${failed} area(s).`, 'warning');
    }

    return failed === 0;
  }
}

// CLI execution
if (require.main === module) {
  const tester = new UXTester();
  
  tester.runUXTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ UX test suite crashed:', error.message);
      process.exit(1);
    });
}

module.exports = UXTester;
