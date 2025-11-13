/**
 * Jest Global Teardown
 *
 * @fileoverview Global teardown executed once after all test suites
 */

const { DatabaseHelpers, FileHelpers } = require('./test-helpers');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');

  // Restore database
  await DatabaseHelpers.restoreDatabase();

  // Clean up temp files
  FileHelpers.cleanupTempFiles();

  console.log('✅ Test environment cleanup complete');
};