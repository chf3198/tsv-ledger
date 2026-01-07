// Global teardown for automated testing - stops server after all tests
module.exports = async function globalTeardown() {
  console.log('🛑 Stopping TSV Ledger server...');

  if (global.__SERVER_PROCESS__) {
    // Send SIGTERM to gracefully shutdown
    global.__SERVER_PROCESS__.kill('SIGTERM');

    // Wait for process to exit
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        global.__SERVER_PROCESS__.kill('SIGKILL');
        resolve();
      }, 5000);

      global.__SERVER_PROCESS__.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    console.log('✅ Server stopped successfully');
  }
};
