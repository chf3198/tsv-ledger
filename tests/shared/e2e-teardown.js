/**
 * E2E Global Teardown
 *
 * @fileoverview Global teardown for E2E tests including cleanup
 */

const { DatabaseHelpers } = require('./test-helpers');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up E2E test environment...');

  // Restore database (clears test environment variables and resets test DB)
  await DatabaseHelpers.restoreDatabase();

  // Clean up test Amazon data from test directory
  const amazonDataPath = path.join(__dirname, '..', '..', 'tests', 'data', 'amazon-test-data.json');
  if (fs.existsSync(amazonDataPath)) {
    fs.unlinkSync(amazonDataPath);
  }

  // Clean up test database file
  const testDbPath = path.join(__dirname, '..', '..', 'tests', 'data', 'test-expenditures.json');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Clean up any test screenshots/videos
  const cleanupDirs = ['test-results', 'playwright-report'];
  cleanupDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', '..', '..', dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });

  console.log('✅ E2E test environment cleanup complete');
};
