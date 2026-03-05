---
name: 'Playwright E2E Testing Patterns'
description: 'Patterns for tests/ - E2E test structure, helpers, fixtures, visual regression'
applyTo: 'tests/**'
---

# Playwright E2E Testing Patterns

## Test-First Workflow (MANDATORY)

**Before writing ANY code**:
1. Write failing E2E test in `tests/{feature}.spec.js`
2. Run `npm test` and confirm it fails with expected error
3. Write minimum code to make test pass
4. Run `npm test && npm run lint` - STOP if fails

**Why**: TDD prevents overengineering; tests document expected behavior; prevents regressions.

## Test File Naming Convention

**Pattern**: `{feature}-{scenario}.spec.js`

**Examples**:
- ✅ `auth-visibility.spec.js` - Auth button visibility rules
- ✅ `auth-contrast.spec.js` - Auth button contrast requirements
- ✅ `auth-responsive.spec.js` - Auth button mobile layout
- ✅ `onboarding.spec.js` - Onboarding wizard flow
- ✅ `storage-mode.spec.js` - Local vs. cloud storage selection
- ❌ `test.spec.js` - Too vague
- ❌ `auth.spec.js` - Multiple scenarios, violates ≤100 line constraint

**Why**: Specific names enable parallel test execution without conflicts; easier to map test failures to features.

## Playwright Configuration (playwright.config.js)

```javascript
{
  testDir: './tests',
  timeout: 30000, // 30s per test
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm start',
    port: 8080,
    reuseExistingServer: !process.env.CI
  }
}
```

**Target**: Dev server on `:8080` (NOT production URL during dev)
**Timeout**: 30s per test (network-dependent imports may take 10-15s)
**Reporters**: Default console + HTML report in `playwright-report/`

## Test Structure Template

```javascript
const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine, clearAuthState } = require('./helpers/auth-helpers');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAlpine(page); // CRITICAL: Wait for Alpine initialization
  });

  test('should do X when Y', async ({ page }) => {
    // Arrange: Set up test state via localStorage or UI
    await page.evaluate(() => {
      localStorage.setItem('tsv-expenses', JSON.stringify([...]));
    });
    await page.reload();

    // Act: Perform user action
    await page.click('[data-testid="import-btn"]');

    // Assert: Verify outcome
    await expect(page.locator('[data-testid="total"]')).toContainText('$1,234.56');
  });
});
```

## Test Helpers (tests/helpers/auth-helpers.js)

**Import pattern**: Destructure specific helpers:
```javascript
const { waitForAlpine, clearAuthState, assertAuthButtonVisible } = require('./helpers/auth-helpers');
```

**Available helpers**:
- `waitForAlpine(page)` - Waits for Alpine initialization (checks `body._x_dataStack`)
- `clearAuthState(page)` - Clears auth tokens from localStorage
- `getAuthButtonStyles(page)` - Returns computed CSS styles for auth button
- `assertAuthButtonVisible(page, expectedText)` - Verifies button is visible + has correct text

**Why these exist**: Alpine race conditions caused 40% of test flakiness before helpers; `waitForAlpine()` reduced failures by 95%.

## localStorage Testing Pattern

**Setup**: Clear + reload + verify initialization:
```javascript
await page.evaluate(() => localStorage.clear());
await page.reload();
await waitForAlpine(page);
// Now safe to interact with UI
```

**Seed data**: Set via `page.evaluate()`:
```javascript
await page.evaluate(() => {
  localStorage.setItem('tsv-expenses', JSON.stringify([
    { id: 'test-1', date: '2026-03-01', description: 'Test', amount: 50, businessPercent: 100 }
  ]));
  localStorage.setItem('tsv-onboarding-complete', 'true');
});
await page.reload();
```

**Verify data**: Read via `page.evaluate()`:
```javascript
const expenses = await page.evaluate(() => {
  return JSON.parse(localStorage.getItem('tsv-expenses') || '[]');
});
expect(expenses).toHaveLength(1);
```

## Auth Testing (Mock JWT Tokens)

**✅ DO**: Mock localStorage auth state (never hit real OAuth):
```javascript
await page.evaluate(() => {
  localStorage.setItem('tsv-auth', JSON.stringify({
    token: 'mock-jwt-token',
    user: { id: '123', name: 'Test User', avatar: 'https://...' },
    exp: Date.now() + 86400000 // 24h from now
  }));
});
await page.reload();
```

**❌ DON'T**: Test OAuth flow in E2E (requires real Google/GitHub credentials; use manual UAT for OAuth)

**Why**: OAuth testing requires production secrets; mock tokens verify frontend auth UI logic without external dependencies.

## Visual Regression Testing (ADR-020)

### Playwright Built-in Snapshots (tests/visual.spec.js)

```javascript
await expect(page).toHaveScreenshot('dashboard-empty.png', {
  maxDiffPixelRatio: 0.05 // Allow 5% difference for font rendering
});
```

**Commands**:
- `npx playwright test tests/visual.spec.js --update-snapshots` - Create/update baselines
- `npx playwright test tests/visual.spec.js` - Compare against baselines
- Baselines stored: `tests/visual.spec.js-snapshots/`

### Custom Visual Testing (Agent Self-Verification)

**Purpose**: Before asking user for UAT, capture screenshots for AI analysis

```bash
npm run test:visual                 # Capture all UI states
npm run test:visual:analyze         # Generate analysis report with base64 screenshots
```

**Output**: `scripts/visual-test/screenshots/visual-report.json` with base64 images

**AI Review Checklist** (scripts/visual-test/analyze.js):
- Modal positioning and visibility
- Button styling and contrast (WCAG AA)
- Layout issues (overlapping elements)
- Mobile responsiveness (viewport width 375px, 768px, 1440px)

**Why**: AI agent can detect visual regressions (modal misalignment, text overflow) before user UAT, reducing back-and-forth.

## Common Test Error Patterns

### 1. Alpine Handler Not Bound
**Symptom**: `page.click('[data-testid="btn"]')` doesn't trigger Alpine method
**Cause**: Click fired before Alpine's `_x_dataStack` initialized
**Solution**: Always call `waitForAlpine(page)` in `beforeEach`
**See**: tests/helpers/auth-helpers.js:35

### 2. Stale localStorage State
**Symptom**: Test passes in isolation, fails in suite
**Cause**: Previous test left data in localStorage
**Solution**: Clear + reload pattern in `beforeEach` or test-specific setup
**See**: tests/auth-visibility.spec.js:10

### 3. Network Timeout on Import
**Symptom**: Import test fails with `Test timeout of 30000ms exceeded`
**Cause**: Large CSV/ZIP parsing takes >30s
**Solution**: Increase timeout for specific test: `test.setTimeout(60000);`
**See**: tests/import.spec.js:50

### 4. Playwright Can't Find Selector
**Symptom**: `Error: locator.click: Timeout 30000ms exceeded`
**Cause**: Element hidden by CSS (`display: none`) or not yet rendered
**Solution**: Use `page.waitForSelector('[data-testid="..."]', { state: 'visible' })` before interaction
**See**: tests/onboarding.spec.js:25

## Test Execution Commands

```bash
npm test              # Run all tests headless
npm run test:headed   # Run with browser visible (debugging)
npm run test:ui       # Open Playwright test explorer (interactive)
npm run test:visual   # Capture screenshots for visual analysis
npx playwright test tests/auth-visibility.spec.js  # Run single file
npx playwright test --debug  # Step-through debugging with Playwright Inspector
```

## Test Coverage Guidelines

**Required coverage** (must have E2E tests):
- All user-facing features (import, allocation, export)
- Auth flows (sign in, sign out, session expiry)
- Onboarding wizard steps
- Error states (network failure, invalid data)
- Responsive layouts (mobile, tablet, desktop)

**Not required** (manual UAT acceptable):
- OAuth provider redirects (requires production secrets)
- Payment method purge (edge case, tested manually)
- Visual polish (spacing tweaks, color adjustments)

**Why**: E2E tests verify critical paths; manual UAT covers edge cases and subjective UX.
