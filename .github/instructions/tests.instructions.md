---
applyTo: "tests/**/*.js,tests/**/*.spec.js,tests/**/*.test.js"
---

# Testing Instructions

## Test File Locations

| Test Type | Location | Pattern |
|-----------|----------|---------|
| Unit tests | `tests/unit/` | `*.test.js` |
| Integration | `tests/integration/` | `*.test.js` |
| E2E (Playwright) | `tests/e2e/` | `*.spec.js` or `*.test.js` |
| Playwright specific | `tests/pw/` | `*.test.js` |

## Running Tests

```bash
# All tests
npm test

# Unit only
npm run test:unit

# E2E only (requires server running!)
npm run test:e2e

# Single file
npx jest tests/unit/database.test.js
```

## ⚠️ CRITICAL: Server Must Be Running for E2E

```bash
# Terminal 1: Start server (background)
npm run dev  # Use isBackground: true

# Terminal 2: Run E2E tests
npm run test:e2e
```

## Test Patterns

### Unit Test Template
```javascript
const { functionName } = require('../../src/module');

describe('ModuleName', () => {
  describe('functionName', () => {
    test('should do expected behavior', () => {
      const result = functionName(input);
      expect(result).toBe(expected);
    });

    test('should handle edge case', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

### Integration Test Template
```javascript
const request = require('supertest');
const app = require('../../server');

describe('GET /api/endpoint', () => {
  test('returns success response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### E2E Test Template (Playwright)
```javascript
const { test, expect } = require('@playwright/test');

test('user can complete workflow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button#submit');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Test Database Isolation

**Set `TEST_DB=true` for isolated testing:**

```javascript
// In test setup
process.env.TEST_DB = 'true';

// This uses tests/data/test-expenditures.json
// NOT the production data/expenditures.json
```

## ✅ DO:
- Test both success and error cases
- Use descriptive test names
- Clean up test data after tests
- Mock external dependencies
- Keep tests under 300 lines

## ❌ DON'T:
- Skip error case testing
- Use production data in tests
- Leave test data files modified
- Write tests that depend on order
- Create tests over 300 lines

## Common Test Assertions

```javascript
// Equality
expect(value).toBe(expected);
expect(obj).toEqual({ key: 'value' });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('specific message');

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow();
```

## Debugging Failed Tests

1. Run single test: `npx jest path/to/test.js`
2. Add `--verbose` for details
3. Use `console.log` temporarily
4. Check test database state
5. Verify server is running (for E2E)
