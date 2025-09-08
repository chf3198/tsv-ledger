#!/usr/bin/env node

/**
 * Complete Testing Suite for Amazon Edit Feature
 * One-command testing for all functionality
 */

const { spawn } = require('child_process');
const path = require('path');

class CompleteTester {
  constructor() {
    this.tests = [
      { name: 'API Tests', script: 'tests/test-amazon-edit-feature.js', timeout: 10000 },
      { name: 'UX Tests', script: 'tests/test-ux-amazon-edit.js', timeout: 15000 },
      { name: 'Feature Demo', script: 'demo-amazon-edit.js', timeout: 8000 }
    ];
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', test: '🧪' };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async runTest(test) {
    return new Promise((resolve) => {
      this.log(`Running ${test.name}...`, 'test');
      
      const child = spawn('node', [test.script], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let completed = false;

      // Set timeout
      const timer = setTimeout(() => {
        if (!completed) {
          child.kill();
          resolve({
            name: test.name,
            success: false,
            error: `Test timed out after ${test.timeout}ms`,
            output: stdout
          });
        }
      }, test.timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        completed = true;
        clearTimeout(timer);
        
        const success = code === 0 && !stderr.includes('Error') && !stdout.includes('❌');
        
        resolve({
          name: test.name,
          success: success,
          code: code,
          output: stdout,
          error: stderr || (code !== 0 ? `Exit code: ${code}` : null)
        });
      });

      child.on('error', (err) => {
        completed = true;
        clearTimeout(timer);
        resolve({
          name: test.name,
          success: false,
          error: err.message,
          output: stdout
        });
      });
    });
  }

  async runAllTests() {
    this.log('🧪 Complete Amazon Edit Feature Test Suite', 'test');
    this.log('=' .repeat(60), 'info');

    const startTime = Date.now();

    for (const test of this.tests) {
      const result = await this.runTest(test);
      this.results.push(result);

      if (result.success) {
        this.log(`✅ ${test.name} - PASSED`, 'success');
      } else {
        this.log(`❌ ${test.name} - FAILED`, 'error');
        if (result.error) {
          this.log(`   Error: ${result.error}`, 'error');
        }
      }
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    this.printSummary(duration);
  }

  printSummary(duration) {
    this.log('', 'info');
    this.log('=' .repeat(60), 'info');
    this.log('🏁 TEST SUMMARY', 'test');
    this.log('=' .repeat(60), 'info');

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const passRate = Math.round((passed / total) * 100);

    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} ${result.name}`, result.success ? 'success' : 'error');
    });

    this.log('', 'info');
    this.log(`Results: ${passed}/${total} tests passed (${passRate}%)`, 
             passRate === 100 ? 'success' : 'error');
    this.log(`Duration: ${duration} seconds`, 'info');

    if (passRate === 100) {
      this.log('', 'info');
      this.log('🎉 ALL TESTS PASSED!', 'success');
      this.log('✅ Amazon Edit Feature is fully functional', 'success');
      this.log('🌐 Ready for production use at: http://localhost:3000/employee-benefits.html', 'info');
    } else {
      this.log('', 'info');
      this.log('⚠️  Some tests failed - review output above', 'error');
    }

    this.log('=' .repeat(60), 'info');
  }
}

// Run complete test suite
if (require.main === module) {
  const tester = new CompleteTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🚀 Testing complete. Amazon Edit Feature status verified!');
    })
    .catch(error => {
      console.error('❌ Test suite crashed:', error.message);
      process.exit(1);
    });
}

module.exports = CompleteTester;
