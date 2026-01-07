# Unit Testing Guidelines

## Overview

Unit testing focuses on individual functions, modules, and components in isolation. All unit tests must achieve 90%+ code coverage and follow established patterns for reliability and maintainability.

## Test Structure

### Test Organization
- **File Naming**: `*.test.js` or `*.spec.js`
- **Directory Structure**: `tests/unit/` mirroring `src/` structure
- **Test Grouping**: Related tests grouped in describe blocks

### Test Anatomy
```javascript
describe('ModuleName', () => {
  describe('FunctionName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test data';
      const expected = 'expected result';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      // Test edge cases
    });
  });
});
```

## Mocking Strategies

### External Dependencies
- **API Calls**: Mock with `jest.mock()` or `jest.spyOn()`
- **Database Operations**: Use test database isolation
- **File System**: Mock file operations with `fs` mocks

### Mock Examples
```javascript
// Mock external module
jest.mock('../external-service', () => ({
  fetchData: jest.fn()
}));

// Mock database operations
const mockDb = {
  find: jest.fn(),
  insert: jest.fn()
};
```

## Coverage Requirements

### Coverage Metrics
- **Statements**: 90%+ of all statements executed
- **Branches**: 90%+ of all branches covered
- **Functions**: 90%+ of all functions called
- **Lines**: 90%+ of all lines executed

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    }
  }
};
```

## Best Practices

### Test Design
- **Single Responsibility**: Each test validates one behavior
- **Descriptive Names**: Clear, descriptive test names
- **Independent Tests**: No test dependencies or side effects

### Test Data
- **Realistic Data**: Use production-like test data
- **Factory Functions**: Create reusable test data factories
- **Data Isolation**: Clean up after each test

### Performance
- **Fast Execution**: Tests should run quickly (< 100ms each)
- **Parallel Execution**: Tests can run in parallel
- **Resource Cleanup**: Proper cleanup of resources

## Common Patterns

### Testing Async Code
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```javascript
it('should throw error for invalid input', () => {
  expect(() => {
    functionName(invalidInput);
  }).toThrow('Expected error message');
});
```

### Testing Event Emitters
```javascript
it('should emit event on completion', () => {
  const mockCallback = jest.fn();
  emitter.on('complete', mockCallback);

  performOperation();

  expect(mockCallback).toHaveBeenCalledWith(expectedData);
});
```

## Test Utilities

### Custom Matchers
```javascript
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received);
    return {
      message: () => `expected ${received} to be a valid date`,
      pass
    };
  }
});
```

### Test Helpers
```javascript
// tests/helpers/test-helpers.js
export const createTestUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

export const setupTestDb = async () => {
  // Database setup logic
};
```

## Coverage Analysis

### Coverage Reports
- **HTML Reports**: Visual coverage reports in `coverage/lcov-report/`
- **JSON Reports**: Machine-readable coverage data
- **Threshold Enforcement**: Build fails if coverage below thresholds

### Improving Coverage
- **Identify Gaps**: Review coverage reports for uncovered code
- **Edge Cases**: Add tests for error conditions and edge cases
- **Integration Tests**: Use integration tests for complex interactions

## Continuous Integration

### CI Pipeline Integration
- **Automated Coverage**: Coverage collected on every build
- **Threshold Checks**: Coverage thresholds enforced in CI
- **Report Storage**: Coverage reports archived for trend analysis

### Coverage Trends
- **Historical Data**: Track coverage over time
- **Regression Detection**: Alert on coverage decreases
- **Improvement Goals**: Set targets for coverage improvement

This comprehensive unit testing approach ensures all code components are thoroughly validated and maintain high quality standards.