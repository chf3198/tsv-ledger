#!/usr/bin/env node

/**
 * Continuous Development Testing System
 *
 * This script provides automated testing during development that:
 * 1. Starts the server
 * 2. Watches for file changes
 * 3. Runs relevant tests automatically
 * 4. Provides real-time feedback
 *
 * Usage:
 * - npm run dev:test (starts development with continuous testing)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ContinuousTester {
  constructor() {
    this.serverProcess = null;
    this.testProcess = null;
    this.watcher = null;
    this.serverReady = false;
    this.lastTestRun = 0;
    this.testCooldown = 2000; // 2 seconds between test runs
  }

  async startServer() {
    console.log('🚀 Starting TSV Ledger server for continuous testing...');

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout after 30 seconds'));
      }, 30000);

      const checkReady = (data) => {
        output += data.toString();
        if (output.includes('TSV Ledger server running on http://localhost:3000')) {
          clearTimeout(timeout);
          this.serverReady = true;
          console.log('✅ Server is ready for continuous testing');
          resolve();
        }
      };

      this.serverProcess.stdout.on('data', checkReady);
      this.serverProcess.stderr.on('data', checkReady);

      this.serverProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async runTests(filePath) {
    const now = Date.now();
    if (now - this.lastTestRun < this.testCooldown) {
      return; // Skip if too soon since last test
    }
    this.lastTestRun = now;

    console.log(`\n🔄 File changed: ${path.relative(process.cwd(), filePath)}`);
    console.log('🧪 Running automated tests...');

    // Determine which tests to run based on file type
    let testCommand;
    let testArgs;

    if (filePath.includes('/src/') || filePath.includes('/tests/unit/')) {
      // Backend or unit test changes - run unit tests
      testCommand = 'npx';
      testArgs = ['jest', 'tests/unit', '--watchAll=false', '--verbose'];
    } else if (filePath.includes('/public/') || filePath.includes('/tests/integration/')) {
      // Frontend or integration test changes - run integration tests
      testCommand = 'npx';
      testArgs = ['jest', 'tests/integration', '--watchAll=false', '--verbose'];
    } else if (filePath.includes('/tests/e2e/')) {
      // E2E test changes - run e2e tests
      testCommand = 'npx';
      testArgs = ['playwright', 'test', 'tests/e2e', '--headed=false'];
    } else {
      // Other changes - run quick unit tests
      testCommand = 'npx';
      testArgs = ['jest', 'tests/unit', '--watchAll=false'];
    }

    return new Promise((resolve) => {
      if (this.testProcess) {
        this.testProcess.kill();
      }

      this.testProcess = spawn(testCommand, testArgs, {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit'
      });

      this.testProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Tests passed');
        } else {
          console.log('❌ Tests failed');
        }
        resolve();
      });

      this.testProcess.on('error', (err) => {
        console.error('Test error:', err);
        resolve();
      });
    });
  }

  startFileWatcher() {
    console.log('👀 Starting file watcher for continuous testing...');

    const watchPaths = [
      'src/',
      'public/js/',
      'public/components/',
      'tests/unit/',
      'tests/integration/',
      'tests/e2e/',
      'server.js'
    ];

    this.watcher = fs.watch('.', { recursive: true }, (eventType, filename) => {
      if (!filename) {
        return;
      }

      const filePath = path.resolve(filename);

      // Check if file is in watched directories
      const shouldWatch = watchPaths.some(watchPath => {
        return filePath.includes(`/${watchPath}`) ||
               filePath.endsWith('.js') ||
               filePath.endsWith('.json');
      });

      if (shouldWatch && (eventType === 'change' || eventType === 'rename')) {
        this.runTests(filePath);
      }
    });

    console.log('✅ File watcher active - tests will run automatically on changes');
  }

  async stopServer() {
    console.log('\n🛑 Stopping continuous testing...');

    if (this.watcher) {
      this.watcher.close();
    }

    if (this.testProcess) {
      this.testProcess.kill();
    }

    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');

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
    }

    console.log('✅ Continuous testing stopped');
  }

  async run() {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.stopServer();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.stopServer();
      process.exit(0);
    });

    try {
      // Start server
      await this.startServer();

      // Wait for server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Start file watcher
      this.startFileWatcher();

      // Run initial tests
      console.log('🎯 Running initial test suite...');
      await this.runTests('initial-run');

      console.log('\n🎉 Continuous testing is now active!');
      console.log('💡 Modify any source files and tests will run automatically');
      console.log('💡 Press Ctrl+C to stop');

      // Keep the process running
      await new Promise(() => {}); // Never resolves

    } catch (error) {
      console.error('💥 Continuous testing failed to start:', error.message);
      await this.stopServer();
      process.exit(1);
    }
  }
}

// Start continuous testing
const tester = new ContinuousTester();
tester.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
