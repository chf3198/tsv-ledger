/**
 * Server Manager for UX Tests
 *
 * Handles test server startup and shutdown
 */

const path = require('path');
const { spawn } = require('child_process');

/**
 * Manages test server lifecycle
 */
class ServerManager {
  constructor() {
    this.serverProcess = null;
  }

  /**
   * Logs messages with different levels
   * @param {string} message - Message to log
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: 'ℹ️',
        error: '❌',
        success: '✅',
        progress: '🔄'
      }[level] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Starts the test server
   * @returns {Promise<void>}
   */
  async startServer() {
    this.log('🚀 Starting test server...');
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '../../'),
        env: { ...process.env, NODE_ENV: 'test', TEST_DB: 'true' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          this.serverProcess.kill();
          reject(new Error('Server startup timeout'));
        }
      }, 10000);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (
          output.includes('TSV Ledger server running on http://localhost:3000')
        ) {
          serverReady = true;
          clearTimeout(timeout);
          this.log('✅ Test server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        this.log(`Server stderr: ${data}`, 'error');
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Stops the test server
   * @returns {Promise<void>}
   */
  async stopServer() {
    if (this.serverProcess) {
      this.log('🛑 Stopping test server...');
      this.serverProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise((resolve) => {
        this.serverProcess.on('exit', () => {
          this.log('✅ Test server stopped');
          resolve();
        });

        // Force kill after 5 seconds
        setTimeout(() => {
          if (!this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      });
    }
  }
}

module.exports = ServerManager;
