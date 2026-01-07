// Global setup for automated testing - starts server before all tests
const { spawn } = require('child_process');
const path = require('path');

module.exports = async function globalSetup() {
  console.log('🚀 Starting TSV Ledger server for automated testing...');

  // Start the server in background
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  // Store the process globally so teardown can access it
  global.__SERVER_PROCESS__ = serverProcess;

  // Wait for server to be ready
  await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000); // 30 second timeout

    const checkReady = (data) => {
      output += data.toString();
      if (output.includes('TSV Ledger server running on http://localhost:3000')) {
        clearTimeout(timeout);
        console.log('✅ Server is ready for testing');
        resolve();
      }
    };

    serverProcess.stdout.on('data', checkReady);
    serverProcess.stderr.on('data', checkReady);

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  // Give server a moment to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
};
