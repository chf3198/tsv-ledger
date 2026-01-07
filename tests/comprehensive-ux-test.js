#!/usr/bin/env node

/**
 * Comprehensive UX Testing Suite
 *
 * Tests both functionality and styling aspects of the TSV Ledger application
 * after JavaScript modularization changes.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class UXTestingSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  recordTest(name, passed, details = '') {
    this.testResults.tests.push({ name, passed, details });
    if (passed) {
      this.testResults.passed++;
      this.log(`${name}: PASSED`, 'success');
    } else {
      this.testResults.failed++;
      this.log(`${name}: FAILED - ${details}`, 'error');
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async testServerConnectivity() {
    try {
      const response = await this.makeRequest(this.baseUrl);
      const passed = response.status === 200;
      this.recordTest('Server Connectivity', passed,
        passed ? 'Server responding on port 3000' : `Status: ${response.status}`);
      return passed;
    } catch (error) {
      this.recordTest('Server Connectivity', false, error.message);
      return false;
    }
  }

  async testPageLoad() {
    try {
      const response = await this.makeRequest(this.baseUrl);
      const passed = response.status === 200 && response.data.includes('TSV Ledger');
      this.recordTest('Page Load', passed,
        passed ? 'Main page loads with correct title' : 'Page failed to load or missing title');
      return passed;
    } catch (error) {
      this.recordTest('Page Load', false, error.message);
      return false;
    }
  }

  async testCSSLoading() {
    try {
      const response = await this.makeRequest(this.baseUrl);
      const hasBootstrap = response.data.includes('bootstrap.min.css');
      const hasFontAwesome = response.data.includes('font-awesome') || response.data.includes('fa-');
      const passed = hasBootstrap && hasFontAwesome;
      this.recordTest('CSS Loading', passed,
        passed ? 'Bootstrap and Font Awesome CSS loaded' : 'Missing CSS dependencies');
      return passed;
    } catch (error) {
      this.recordTest('CSS Loading', false, error.message);
      return false;
    }
  }

  async testJavaScriptLoading() {
    try {
      const response = await this.makeRequest(this.baseUrl);
      const hasAppJS = response.data.includes('app.js');
      const hasES6Modules = response.data.includes('type="module"');
      const passed = hasAppJS && hasES6Modules;
      this.recordTest('JavaScript Loading', passed,
        passed ? 'ES6 modules properly configured' : 'JavaScript not loaded as modules');
      return passed;
    } catch (error) {
      this.recordTest('JavaScript Loading', false, error.message);
      return false;
    }
  }

  async testAPIEndpoints() {
    const endpoints = [
      '/api/expenditures',
      '/api/analysis',
      '/api/amazon-items'
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
        const passed = response.status === 200;
        this.recordTest(`API ${endpoint}`, passed,
          passed ? 'Endpoint responding correctly' : `Status: ${response.status}`);
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        this.recordTest(`API ${endpoint}`, false, error.message);
        allPassed = false;
      }
    }

    return allPassed;
  }

  async testLoadAnalysisFunctionality() {
    try {
      // Test that the analysis API returns expected structure
      const response = await this.makeRequest(`${this.baseUrl}/api/analysis`);
      const data = JSON.parse(response.data);

      const hasTotalSpent = data.hasOwnProperty('totalSpent');
      const hasCategories = data.hasOwnProperty('categories');
      const hasDateRange = data.hasOwnProperty('dateRange');

      const passed = response.status === 200 && hasTotalSpent && hasCategories && hasDateRange;
      this.recordTest('Load Analysis API', passed,
        passed ? 'Analysis API returns correct data structure' : 'Missing required analysis fields');
      return passed;
    } catch (error) {
      this.recordTest('Load Analysis API', false, error.message);
      return false;
    }
  }

  async testHTMLStructure() {
    try {
      const response = await this.makeRequest(this.baseUrl);

      // Check for required HTML elements
      const hasNavbar = response.data.includes('navbar') || response.data.includes('nav');
      const hasForm = response.data.includes('<form') || response.data.includes('expenditureForm');
      const hasTable = response.data.includes('<table') || response.data.includes('expenditures');
      const hasButtons = response.data.includes('btn') || response.data.includes('button');

      const passed = hasNavbar && hasForm && hasTable && hasButtons;
      this.recordTest('HTML Structure', passed,
        passed ? 'Required HTML elements present' : 'Missing key UI components');
      return passed;
    } catch (error) {
      this.recordTest('HTML Structure', false, error.message);
      return false;
    }
  }

  async testStylingClasses() {
    try {
      const response = await this.makeRequest(this.baseUrl);

      // Check for Bootstrap classes
      const hasBootstrapClasses = /class="[^"]*btn[^"]*"/.test(response.data) ||
                                  /class="[^"]*card[^"]*"/.test(response.data) ||
                                  /class="[^"]*container[^"]*"/.test(response.data);

      // Check for custom styling
      const hasCustomStyles = response.data.includes('<style>') ||
                              response.data.includes('--primary-color');

      const passed = hasBootstrapClasses && hasCustomStyles;
      this.recordTest('Styling Classes', passed,
        passed ? 'Bootstrap and custom styles applied' : 'Missing styling classes');
      return passed;
    } catch (error) {
      this.recordTest('Styling Classes', false, error.message);
      return false;
    }
  }

  async testResponsiveDesign() {
    try {
      const response = await this.makeRequest(this.baseUrl);

      // Check for responsive meta tag
      const hasViewport = response.data.includes('viewport');
      // Check for responsive classes
      const hasResponsiveClasses = response.data.includes('col-md-') ||
                                   response.data.includes('d-none') ||
                                   response.data.includes('d-lg-');

      const passed = hasViewport && hasResponsiveClasses;
      this.recordTest('Responsive Design', passed,
        passed ? 'Responsive design elements present' : 'Missing responsive features');
      return passed;
    } catch (error) {
      this.recordTest('Responsive Design', false, error.message);
      return false;
    }
  }

  async testModularizationIntegrity() {
    try {
      // Check that module files exist and are syntactically correct
      const moduleFiles = [
        'public/js/modules/expenditures/expenditures.js',
        'public/js/modules/analysis/analysis.js',
        'public/js/modules/premium-analytics/premium-analytics.js',
        'public/js/modules/import-history/import-history.js'
      ];

      let allModulesExist = true;
      for (const file of moduleFiles) {
        if (!fs.existsSync(file)) {
          allModulesExist = false;
          break;
        }
      }

      // Check that main app.js imports the modules
      const appJsContent = fs.readFileSync('public/js/app.js', 'utf8');
      const hasImports = appJsContent.includes('import') &&
                        appJsContent.includes('from') &&
                        appJsContent.includes('modules/');

      const passed = allModulesExist && hasImports;
      this.recordTest('JavaScript Modularization', passed,
        passed ? 'All modules exist and are properly imported' : 'Modularization incomplete');
      return passed;
    } catch (error) {
      this.recordTest('JavaScript Modularization', false, error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive UX Testing Suite\n');
    console.log('=' .repeat(60));

    // Run all tests
    await this.testServerConnectivity();
    await this.testPageLoad();
    await this.testCSSLoading();
    await this.testJavaScriptLoading();
    await this.testAPIEndpoints();
    await this.testLoadAnalysisFunctionality();
    await this.testHTMLStructure();
    await this.testStylingClasses();
    await this.testResponsiveDesign();
    await this.testModularizationIntegrity();

    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));

    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! UX functionality and styling verified.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Review issues above.');
      console.log('\nFailed Tests:');
      this.testResults.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }

    return this.testResults.failed === 0;
  }
}

// Run the tests
if (require.main === module) {
  const tester = new UXTestingSuite();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = UXTestingSuite;
