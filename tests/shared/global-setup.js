/**
 * Jest Global Setup
 *
 * @fileoverview Global setup executed once before all test suites
 */

const { DatabaseHelpers } = require('./test-helpers');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');

  // Setup test database
  await DatabaseHelpers.setupTestDatabase();

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001'; // Use different port for tests

  console.log('✅ Test environment setup complete');
};