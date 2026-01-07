#!/usr/bin/env node

/**
 * Automated Testing System for TSV Ledger
 *
 * This script provides comprehensive automated testing that:
 * 1. Starts the server automatically
 * 2. Runs all test suites (unit, integration, e2e)
 * 3. Stops the server when done
 * 4. Provides detailed reporting
 *
 * Usage:
 * - npm run test:auto (runs all tests)
 * - npm run test:auto:unit (runs only unit tests)
 * - npm run test:auto:integration (runs only integration tests)
 * - npm run test:auto:e2e (runs only e2e tests)
 */

const { spawn } = require('child_process');
const path = require('path');

class AutomatedTester {
  constructor() {
    this.serverProcess = null;
    this.testProcess = null;
    this.serverReady = false;
  }

  async startServer() {
    console.log('🚀 Starting TSV Ledger server for automated testing...');
    console.log('📂 Working directory:', path.resolve(__dirname, '..'));
    // Kill any existing server processes on port 3000
    console.log('🧹 Cleaning up any existing server processes...');
    try {
      const { spawn } = require('child_process');
      const cleanup = spawn('pkill', ['-f', 'node server.js'], {
        cwd: path.resolve(__dirname),
        stdio: 'inherit'
      });
      await new Promise(resolve => {
        cleanup.on('exit', () => resolve());
        cleanup.on('error', () => resolve()); // Ignore errors if no process found
        setTimeout(resolve, 2000); // Timeout after 2 seconds
      });
    } catch (error) {
      // Ignore cleanup errors
    }
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        cwd: path.resolve(__dirname),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: '3000'
        }
      });

      let output = '';
      let errorOutput = '';
      const timeout = setTimeout(() => {
        console.error('❌ Server startup timeout after 30 seconds');
        console.error('📄 Server stdout:', output);
        console.error('📄 Server stderr:', errorOutput);
        reject(new Error('Server startup timeout after 30 seconds'));
      }, 30000);

      const checkReady = (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('📄 Server output:', chunk.trim());
        if (output.includes('TSV Ledger server running on http://localhost:3000')) {
          clearTimeout(timeout);
          this.serverReady = true;
          console.log('✅ Server is ready for testing');
          resolve();
        }
      };

      const checkError = (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.error('❌ Server error:', chunk.trim());
      };

      this.serverProcess.stdout.on('data', checkReady);
      this.serverProcess.stderr.on('data', checkError);

      this.serverProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.serverProcess.on('exit', (code) => {
        if (!this.serverReady) {
          clearTimeout(timeout);
          console.error(`❌ Server exited with code ${code}`);
          console.error('📄 Server stdout:', output);
          console.error('📄 Server stderr:', errorOutput);
          reject(new Error(`Server exited with code ${code} before becoming ready`));
        }
      });
    });
  }

  async waitForServer() {
    // Give server a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async runTests(testType = 'all') {
    console.log(`🧪 Running ${testType} tests...`);

    let testCommand;
    let testArgs;

    switch (testType) {
      case 'unit':
        testCommand = 'npx';
        testArgs = ['jest', 'tests/unit', '--coverage', '--coverageDirectory=coverage/unit'];
        break;
      case 'integration':
        testCommand = 'npx';
        testArgs = ['jest', 'tests/integration', '--coverage', '--coverageDirectory=coverage/integration'];
        break;
      case 'e2e':
        testCommand = 'npx';
        testArgs = ['playwright', 'test', 'tests/e2e'];
        break;
      case 'all':
      default:
        testCommand = 'npm';
        testArgs = ['run', 'test:all'];
        break;
    }

    // Set environment variable to disable Jest global setup since we manage the server
    const env = {
      ...process.env,
      DISABLE_JEST_GLOBAL_SETUP: 'true',
      NODE_ENV: 'test'
    };

    return new Promise((resolve, reject) => {
      this.testProcess = spawn(testCommand, testArgs, {
        cwd: path.resolve(__dirname),
        stdio: 'inherit',
        env: env
      });

      this.testProcess.on('exit', (code) => {
        if (code === 0) {
          console.log(`✅ ${testType} tests passed`);
          resolve();
        } else {
          console.log(`❌ ${testType} tests failed with exit code ${code}`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      this.testProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  async stopServer() {
    console.log('🛑 Stopping TSV Ledger server...');

    if (this.serverProcess) {
      // Send SIGTERM first for graceful shutdown
      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown or force kill
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.serverProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      console.log('✅ Server stopped successfully');
    }
  }

  async run(testType = 'all') {
    try {
      // Start server
      await this.startServer();
      await this.waitForServer();

      // Run tests
      await this.runTests(testType);

      console.log('🎉 All automated tests completed successfully!');

    } catch (error) {
      console.error('💥 Automated testing failed:', error.message);
      process.exit(1);
    } finally {
      // Always stop server
      await this.stopServer();
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const testType = args[0] || 'all';

const tester = new AutomatedTester();
tester.run(testType).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});