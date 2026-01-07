# Coverage Analysis

## Overview

Code coverage analysis ensures comprehensive testing of all code paths. TSV Ledger requires 90%+ coverage across all metrics with detailed reporting and continuous monitoring.

## Coverage Metrics

### Statement Coverage
- **Definition**: Percentage of executable statements executed during tests
- **Target**: 90% minimum
- **Importance**: Ensures all code lines are tested

### Branch Coverage
- **Definition**: Percentage of decision points (if/else, switch) tested
- **Target**: 90% minimum
- **Importance**: Validates conditional logic paths

### Function Coverage
- **Definition**: Percentage of functions called during testing
- **Target**: 90% minimum
- **Importance**: Ensures all functions are exercised

### Line Coverage
- **Definition**: Percentage of code lines executed
- **Target**: 90% minimum
- **Importance**: Comprehensive code execution validation

## Jest Coverage Configuration

### Basic Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/**/index.js',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ]
};
```

### Coverage Thresholds
```javascript
coverageThreshold: {
  global: {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90
  },
  // File-specific thresholds
  'src/critical-module.js': {
    statements: 95,
    branches: 95
  }
}
```

## Coverage Reports

### HTML Reports
- **Location**: `coverage/lcov-report/index.html`
- **Features**: Interactive coverage visualization
- **Usage**: Open in browser for detailed analysis

### Text Reports
- **Output**: Console output during test runs
- **Format**: Summary table with percentages
- **Usage**: Quick coverage overview in CI/CD

### JSON Reports
- **Location**: `coverage/coverage-final.json`
- **Usage**: Machine-readable for automated processing
- **Integration**: CI/CD pipelines and reporting tools

## Coverage Analysis Workflow

### 1. Run Coverage Tests
```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage reports
npm run test:coverage:report
```

### 2. Analyze Results
- **Review HTML Report**: Identify uncovered code sections
- **Check Thresholds**: Ensure minimum coverage requirements met
- **Identify Gaps**: Find areas needing additional tests

### 3. Improve Coverage
- **Add Missing Tests**: Write tests for uncovered code
- **Test Edge Cases**: Cover conditional branches and error paths
- **Refactor Code**: Simplify complex functions for better testability

## Common Coverage Gaps

### Error Handling
```javascript
// Uncovered error path
function processData(data) {
  if (!data) {
    throw new Error('Data required'); // This line uncovered
  }
  return data.processed;
}

// Add test for error case
it('should throw error for missing data', () => {
  expect(() => processData(null)).toThrow('Data required');
});
```

### Conditional Branches
```javascript
// Partial branch coverage
function getStatus(code) {
  if (code === 200) {
    return 'success'; // Covered
  } else if (code === 404) {
    return 'not found'; // Uncovered
  } else {
    return 'unknown'; // Covered
  }
}

// Add test for 404 case
it('should return not found for 404', () => {
  expect(getStatus(404)).toBe('not found');
});
```

### Default Parameters
```javascript
// Default parameter coverage
function createUser(name, role = 'user') {
  return { name, role };
}

// Test default parameter
it('should use default role', () => {
  const user = createUser('John');
  expect(user.role).toBe('user');
});
```

## Advanced Coverage Techniques

### Istanbul Configuration
```javascript
// Detailed coverage configuration
module.exports = {
  coverageProvider: 'v8', // or 'babel'
  coverageReporters: [
    'text-summary',
    'html',
    'lcovonly',
    'json-summary'
  ],
  // Exclude files from coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ]
};
```

### Coverage Badges
```javascript
// Generate coverage badges
// Use tools like istanbul-badges-readme
// or shields.io endpoints
```

### Coverage Trends
```javascript
// Track coverage over time
// Use tools like codecov or coveralls
// Set up trend monitoring and alerts
```

## Coverage Best Practices

### Writing Testable Code
- **Single Responsibility**: Functions with clear, single purposes
- **Dependency Injection**: Injectable dependencies for mocking
- **Pure Functions**: Predictable functions without side effects

### Test Organization
- **Comprehensive Suites**: Tests covering all code paths
- **Edge Case Coverage**: Boundary conditions and error scenarios
- **Integration Coverage**: Component interaction validation

### Continuous Monitoring
- **CI Integration**: Automated coverage checks in pipelines
- **Threshold Enforcement**: Build failures for insufficient coverage
- **Regular Reviews**: Periodic coverage report analysis

## Coverage Tools Integration

### Codecov
```yaml
# .github/workflows/ci.yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Coveralls
```yaml
# .github/workflows/ci.yml
- name: Coveralls
  uses: coverallsapp/github-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    file: coverage/lcov.info
```

### Local Coverage Tools
```bash
# Generate coverage reports
npx jest --coverage

# Watch mode with coverage
npx jest --coverage --watch

# Specific file coverage
npx jest --coverage --testPathPattern=module.test.js
```

## Troubleshooting Coverage Issues

### Common Problems
- **Mock Coverage**: Mocks not counted in coverage
- **Generated Code**: Build outputs included in coverage
- **Test Files**: Test files included in coverage calculations

### Solutions
```javascript
// Exclude mocks from coverage
coveragePathIgnorePatterns: [
  '/__mocks__/',
  '/mocks/'
]

// Exclude generated files
coveragePathIgnorePatterns: [
  '/dist/',
  '/build/',
  '*.generated.js'
]
```

### Debugging Coverage
- **Verbose Output**: Use `--verbose` flag for detailed reporting
- **Source Maps**: Ensure source maps for accurate mapping
- **Cache Issues**: Clear Jest cache with `--no-cache`

This comprehensive coverage analysis ensures all TSV Ledger code maintains high testing standards and reliability.