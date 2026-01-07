const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  fullyParallel: false, // Run tests sequentially for better error tracking
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for consistent error reporting
  timeout: 60000, // 60 second timeout for complex E2E tests
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: '../e2e-results.json' }],
    ['junit', { outputFile: '../e2e-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    headless: !process.env.DEBUG // Allow headed mode with DEBUG=1
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: 'NODE_ENV=test TEST_DB=true node server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    cwd: '../..'
  },

  // Global setup and teardown
  globalSetup: require.resolve('../shared/e2e-setup.js'),
  globalTeardown: require.resolve('../shared/e2e-teardown.js')
});
