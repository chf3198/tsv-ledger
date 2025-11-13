// Playwright configuration for robust E2E UX testing
/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests/visual',
  timeout: 60000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Allow local overrides via environment for watch/debugging
    headless: process.env.PW_HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // slowMo can be set with PW_SLOWMO env var for visible demonstrations
    launchOptions: { slowMo: Number(process.env.PW_SLOWMO || 0) }
  },
  webServer: process.env.CI ? {
    command: 'node server.js',
    env: { NODE_ENV: 'test', TEST_DB: 'true' },
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI
  } : undefined,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};
