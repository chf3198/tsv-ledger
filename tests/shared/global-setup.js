// Global setup for automated testing - starts server before all tests
const { spawn } = require('child_process');
const path = require('path');

module.exports = async function globalSetup() {
  console.log('🚀 Starting TSV Ledger server for automated testing...');
  console.log('📂 Working directory:', path.resolve(__dirname, '../..'));

  // Start the server in background
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3000'
    }
  });

  // Store the process globally so teardown can access it
  global.__SERVER_PROCESS__ = serverProcess;

  console.log('🔧 Server process started with PID:', serverProcess.pid);

  // Wait for server to be ready
  await new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    const timeout = setTimeout(() => {
      console.error('❌ Server startup timeout after 30 seconds');
      console.error('📄 Server stdout:', output);
      console.error('📄 Server stderr:', errorOutput);
      reject(new Error('Server startup timeout'));
    }, 30000); // 30 second timeout

    const checkReady = (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('📄 Server output:', chunk.trim());
      if (output.includes('TSV Ledger server running on http://localhost:3000')) {
        clearTimeout(timeout);
        console.log('✅ Server is ready for testing');
        resolve();
      }
    };

    const checkError = (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.error('❌ Server error:', chunk.trim());
    };

    serverProcess.stdout.on('data', checkReady);
    serverProcess.stderr.on('data', checkError);

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.error('❌ Server process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        console.error(`❌ Server exited with code ${code}`);
        console.error('📄 Server stdout:', output);
        console.error('📄 Server stderr:', errorOutput);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  // Give server a moment to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
};
