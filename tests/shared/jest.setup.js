/**
 * Jest Setup File
 *
 * @fileoverview Global setup for Jest tests including mocks and test environment
 */

const { DatabaseHelpers, FileHelpers } = require('./test-helpers');

// Setup global test environment
beforeAll(async () => {
  // Create test directories
  const fs = require('fs');
  const path = require('path');

  const dirs = [
    'tests/temp',
    'tests/coverage',
    'tests/reports',
    'tests/screenshots'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Setup test database
  await DatabaseHelpers.setupTestDatabase();
});

// Cleanup after each test
afterEach(async () => {
  // Clean up temp files
  FileHelpers.cleanupTempFiles();

  // Reset mocks
  jest.clearAllMocks();
});

// Global teardown
afterAll(async () => {
  // Restore database
  await DatabaseHelpers.restoreDatabase();

  // Clean up temp files
  FileHelpers.cleanupTempFiles();
});

// Global test utilities
global.testHelpers = require('./test-helpers');

// Mock console methods to reduce noise during testing
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received);
    return {
      message: () => `expected ${received} to be a valid Date`,
      pass
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    };
  }
});
