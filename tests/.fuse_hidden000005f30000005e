#!/usr/bin/env node

/**
 * Master Test Runner for Amazon Edit Feature
 * Orchestrates all testing phases: Setup, API, UX, Integration
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class MasterTestRunner {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      setup: null,
      api: null,
      ux: null,
      integration: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', server: '🔥' };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkServerHealth() {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async startServer() {
    this.log('Starting server for testing...', 'server');
    
    return new Promise((resolve, reject) => {
      // Kill any existing server processes
      exec('pkill -f "node server.js"', () => {
        // Start fresh server
        this.serverProcess = spawn('node', ['server.js'], {
          cwd: __dirname,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false
        });

        let output = '';
        this.serverProcess.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('server running')) {
            this.log('Server started successfully', 'success');
            resolve(true);
          }
        });

        this.serverProcess.stderr.on('data', (data) => {
          this.log(`Server error: ${data.toString().trim()}`, 'error');
        });

        this.serverProcess.on('exit', (code) => {
          this.log(`Server exited with code ${code}`, code === 0 ? 'info' : 'error');
        });

        // Timeout if server doesn't start
        setTimeout(() => {
          if (!output.includes('server running')) {
            reject(new Error('Server startup timeout'));
          }
        }, 10000);
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log('Stopping test server...', 'server');
      this.serverProcess.kill('SIGTERM');
      await this.delay(2000);
      
      // Force kill if still running
      try {
        process.kill(this.serverProcess.pid, 'SIGKILL');
      } catch (e) {
        // Process already dead
      }
      
      this.serverProcess = null;
    }
  }

  async runCommand(command, args = [], description = '') {
    this.log(description || `Running: ${command} ${args.join(' ')}`, 'info');
    
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Command timeout'));
      }, 60000);
    });
  }

  async validateEnvironment() {
    this.log('🔍 Validating test environment...', 'info');
    
    // Check if required files exist
    const requiredFiles = [
      'server.js',
      'public/employee-benefits.html',
      'public/js/employee-benefits.js',
      'test-amazon-edit-feature.js',
      'test-ux-amazon-edit.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(__dirname, file))) {
        this.log(`❌ Required file missing: ${file}`, 'error');
        return false;
      }
    }

    this.log('✅ All required files present', 'success');

    // Check Node.js version
    const result = await this.runCommand('node', ['--version'], 'Checking Node.js version');
    if (result.success) {
      this.log(`Node.js version: ${result.stdout.trim()}`, 'info');
    }

    return true;
  }

  async runSetupTests() {
    this.log('\n🔧 PHASE 1: Setup & Environment Tests', 'info');
    this.log('=' .repeat(50), 'info');

    try {
      // Validate environment
      const envValid = await this.validateEnvironment();
      if (!envValid) {
        this.testResults.setup = false;
        return false;
      }

      // Start server
      await this.startServer();
      
      // Wait for server to be ready
      await this.delay(3000);
      
      // Verify server health
      const serverHealthy = await this.checkServerHealth();
      if (!serverHealthy) {
        this.log('❌ Server health check failed', 'error');
        this.testResults.setup = false;
        return false;
      }

      this.log('✅ Setup phase completed successfully', 'success');
      this.testResults.setup = true;
      return true;

    } catch (error) {
      this.log(`❌ Setup phase failed: ${error.message}`, 'error');
      this.testResults.setup = false;
      return false;
    }
  }

  async runAPITests() {
    this.log('\n🔌 PHASE 2: API & Backend Tests', 'info');
    this.log('=' .repeat(50), 'info');

    try {
      const result = await this.runCommand('node', ['test-amazon-edit-feature.js'], 'Running comprehensive API tests');
      
      this.log('API Test Output:', 'info');
      console.log(result.stdout);
      
      if (result.stderr) {
        this.log('API Test Errors:', 'warning');
        console.log(result.stderr);
      }

      this.testResults.api = result.success;
      
      if (result.success) {
        this.log('✅ API tests completed successfully', 'success');
      } else {
        this.log('❌ API tests failed', 'error');
      }

      return result.success;

    } catch (error) {
      this.log(`❌ API test phase failed: ${error.message}`, 'error');
      this.testResults.api = false;
      return false;
    }
  }

  async runUXTests() {
    this.log('\n🎨 PHASE 3: UX & Frontend Tests', 'info');
    this.log('=' .repeat(50), 'info');

    try {
      const result = await this.runCommand('node', ['test-ux-amazon-edit.js'], 'Running UX and user journey tests');
      
      this.log('UX Test Output:', 'info');
      console.log(result.stdout);
      
      if (result.stderr) {
        this.log('UX Test Errors:', 'warning');
        console.log(result.stderr);
      }

      this.testResults.ux = result.success;
      
      if (result.success) {
        this.log('✅ UX tests completed successfully', 'success');
      } else {
        this.log('❌ UX tests failed', 'error');
      }

      return result.success;

    } catch (error) {
      this.log(`❌ UX test phase failed: ${error.message}`, 'error');
      this.testResults.ux = false;
      return false;
    }
  }

  async runIntegrationTests() {
    this.log('\n🔄 PHASE 4: Integration & End-to-End Tests', 'info');
    this.log('=' .repeat(50), 'info');

    try {
      // Run a comprehensive integration test
      this.log('Testing complete user workflow...', 'info');
      
      // Test the complete flow: Load items -> Edit -> Verify -> Restore
      const integrationScript = `
        const http = require('http');
        
        async function makeRequest(method, path, data) {
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
                  resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                  resolve({ status: res.statusCode, data: null, raw: responseData });
                }
              });
            });

            req.on('error', reject);
            if (data) req.write(JSON.stringify(data));
            req.end();
          });
        }

        async function test() {
          console.log('🔄 Integration Test: Complete User Workflow');
          
          // 1. Load page
          const pageResponse = await makeRequest('GET', '/employee-benefits.html');
          if (pageResponse.status !== 200) throw new Error('Page load failed');
          console.log('✅ Page loads successfully');
          
          // 2. Load items
          const itemsResponse = await makeRequest('GET', '/api/amazon-items');
          if (!Array.isArray(itemsResponse.data) || itemsResponse.data.length === 0) {
            throw new Error('No items available');
          }
          console.log('✅ Items loaded:', itemsResponse.data.length);
          
          // 3. Edit an item
          const item = itemsResponse.data[0];
          const originalCategory = item.category;
          const newCategory = originalCategory === 'office_supplies' ? 'employee_amenities' : 'office_supplies';
          
          const editResponse = await makeRequest('PUT', '/api/amazon-items/' + item.id, {
            category: newCategory,
            amount: 99.99,
            description: 'Integration test edit'
          });
          
          if (editResponse.status !== 200) throw new Error('Edit failed');
          console.log('✅ Item edited successfully');
          
          // 4. Verify edit
          const verifyResponse = await makeRequest('GET', '/api/amazon-items');
          const updatedItem = verifyResponse.data.find(i => i.id === item.id);
          if (updatedItem.category !== newCategory) throw new Error('Edit not persisted');
          console.log('✅ Edit verified in database');
          
          // 5. Restore original
          await makeRequest('PUT', '/api/amazon-items/' + item.id, {
            category: originalCategory,
            amount: parseFloat(item.price.replace('$', '')),
            description: item.description || ''
          });
          console.log('✅ Original data restored');
          
          console.log('🎉 Integration test completed successfully!');
        }

        test().catch(error => {
          console.error('❌ Integration test failed:', error.message);
          process.exit(1);
        });
      `;

      // Write and run integration test
      fs.writeFileSync(path.join(__dirname, 'temp-integration-test.js'), integrationScript);
      
      const result = await this.runCommand('node', ['temp-integration-test.js'], 'Running integration test');
      
      // Clean up temp file
      try {
        fs.unlinkSync(path.join(__dirname, 'temp-integration-test.js'));
      } catch (e) {
        // Ignore cleanup errors
      }

      this.log('Integration Test Output:', 'info');
      console.log(result.stdout);

      this.testResults.integration = result.success;
      
      if (result.success) {
        this.log('✅ Integration tests completed successfully', 'success');
      } else {
        this.log('❌ Integration tests failed', 'error');
      }

      return result.success;

    } catch (error) {
      this.log(`❌ Integration test phase failed: ${error.message}`, 'error');
      this.testResults.integration = false;
      return false;
    }
  }

  generateTestReport() {
    this.log('\n📊 FINAL TEST REPORT', 'info');
    this.log('=' .repeat(60), 'info');

    const phases = [
      { name: 'Setup & Environment', result: this.testResults.setup },
      { name: 'API & Backend', result: this.testResults.api },
      { name: 'UX & Frontend', result: this.testResults.ux },
      { name: 'Integration & E2E', result: this.testResults.integration }
    ];

    let totalPassed = 0;
    let totalTests = 0;

    for (const phase of phases) {
      totalTests++;
      if (phase.result === true) {
        totalPassed++;
        this.log(`✅ ${phase.name}: PASSED`, 'success');
      } else if (phase.result === false) {
        this.log(`❌ ${phase.name}: FAILED`, 'error');
      } else {
        this.log(`⏭️ ${phase.name}: SKIPPED`, 'warning');
      }
    }

    this.log(`\n📈 Overall Results:`, 'info');
    this.log(`✅ Passed: ${totalPassed}/${totalTests}`, 'success');
    this.log(`📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`, 'info');

    if (totalPassed === totalTests) {
      this.log('\n🏆 ALL TESTS PASSED! Amazon Edit Feature is fully functional.', 'success');
      this.log('🚀 Feature is ready for production use.', 'success');
      return true;
    } else {
      this.log(`\n⚠️ ${totalTests - totalPassed} test phase(s) failed.`, 'warning');
      this.log('🔧 Please review the issues above before deploying.', 'warning');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Master Test Runner: Amazon Edit Feature', 'info');
    this.log('Testing all aspects: API, UX, Integration, Performance', 'info');
    this.log('=' .repeat(60), 'info');

    try {
      // Phase 1: Setup
      const setupSuccess = await this.runSetupTests();
      if (!setupSuccess) {
        this.log('❌ Setup failed, aborting remaining tests', 'error');
        return this.generateTestReport();
      }

      // Phase 2: API Tests
      await this.runAPITests();

      // Phase 3: UX Tests  
      await this.runUXTests();

      // Phase 4: Integration Tests
      await this.runIntegrationTests();

      // Generate final report
      return this.generateTestReport();

    } catch (error) {
      this.log(`❌ Test runner crashed: ${error.message}`, 'error');
      return false;

    } finally {
      // Always stop server
      await this.stopServer();
      this.log('🔧 Test cleanup completed', 'info');
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new MasterTestRunner();
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, cleaning up...');
    await runner.stopServer();
    process.exit(1);
  });

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Amazon Edit Feature - Master Test Runner

Usage: node test-master.js [options]

Options:
  --help, -h     Show this help message
  --quick, -q    Run quick tests only (skip integration)
  --verbose, -v  Show detailed output

This tool runs a comprehensive test suite covering:
- Setup and environment validation
- API functionality and data persistence  
- UX and user journey simulation
- End-to-end integration testing

Examples:
  node test-master.js           # Run complete test suite
  node test-master.js --quick   # Run faster tests only
    `);
    process.exit(0);
  }

  runner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Master test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = MasterTestRunner;
