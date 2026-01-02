/**
 * Jest Configuration for Unit and Integration Tests
 *
 * @fileoverview Jest configuration optimized for Node.js backend testing
 * with comprehensive coverage and reporting
 */

module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.js",
    "<rootDir>/tests/unit/**/*.spec.js",
    "<rootDir>/tests/integration/**/*.test.js",
    "<rootDir>/tests/integration/**/*.spec.js",
  ],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/shared/jest.setup.js"],

  // Module name mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/tests/shared/$1",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.js",
    "public/js/**/*.js",
    "!src/expenditures.json",
    "!**/node_modules/**",
    "!**/coverage/**",
  ],

  coverageDirectory: "tests/coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Verbose output
  verbose: true,

  // Error handling
  bail: false,
  detectOpenHandles: true,

  // Reporters
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "tests/reports",
        outputName: "junit.xml",
      },
    ],
  ],

  // Transform configuration (for any future needs)
  transform: {},

  // Global setup/teardown
  globalSetup: "<rootDir>/tests/shared/global-setup.js",
  globalTeardown: "<rootDir>/tests/shared/global-teardown.js",
};
