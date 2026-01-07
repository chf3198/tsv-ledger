# Amazon Integration Testing

## Overview

Comprehensive testing strategy for Amazon integration components including unit tests, integration tests, end-to-end workflows, and performance validation.

## Component Structure

### Core Testing Components
- **[Unit Testing](testing/unit-testing.md)**: Component-level testing with mocked dependencies and edge case coverage
- **[Integration Testing](testing/integration-testing.md)**: API endpoint testing and data flow validation

### Testing Types
- **Unit Tests**: Individual component testing with isolated dependencies
- **Integration Tests**: Multi-component workflow testing
- **End-to-End Tests**: Complete user workflow validation
- **Performance Tests**: Load and stress testing scenarios

## End-to-End Testing

Full workflow testing from file upload through data processing to expense storage and retrieval.

### Complete Workflow Test

```javascript
// tests/e2e/amazon-integration-workflow.test.js
const request = require('supertest');
const app = require('../../server');
const Database = require('../../src/database');
const path = require('path');

describe('Amazon Integration E2E Workflow', () => {
  let db;
  let initialExpenseCount;

  beforeAll(async () => {
    db = new Database();
    const allExpenses = await db.getExpenses();
    initialExpenseCount = allExpenses.length;
  });

  test('complete Amazon data import workflow', async () => {
    // Step 1: Upload Amazon ZIP file
    const testZipPath = path.join(__dirname, '..', 'fixtures', 'amazon-complete-data.zip');

    const uploadResponse = await request(app)
      .post('/api/amazon/upload')
      .attach('amazonData', testZipPath)
      .expect(200);

    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.data.saved).toBeGreaterThan(0);

    const uploadId = uploadResponse.body.data.uploadId;

    // Step 2: Check processing status
    const statusResponse = await request(app)
      .get(`/api/amazon/status/${uploadId}`)
      .expect(200);

    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.data.status).toBe('completed');

    // Step 3: Verify expenses were saved
    const expensesResponse = await request(app)
      .get('/api/amazon/expenses')
      .expect(200);

    expect(expensesResponse.body.success).toBe(true);
    expect(expensesResponse.body.data.length).toBeGreaterThan(initialExpenseCount);

    // Step 4: Verify expense data integrity
    const amazonExpenses = expensesResponse.body.data.filter(
      expense => expense.source === 'amazon_integration'
    );

    amazonExpenses.forEach(expense => {
      expect(expense).toHaveProperty('id');
      expect(expense).toHaveProperty('date');
      expect(expense).toHaveProperty('amount');
      expect(expense).toHaveProperty('category');
      expect(expense).toHaveProperty('merchant', 'Amazon');
      expect(expense.metadata).toHaveProperty('orderId');
      expect(expense.metadata).toHaveProperty('asin');
    });

    // Step 5: Test expense deletion
    if (amazonExpenses.length > 0) {
      const expenseToDelete = amazonExpenses[0];

      await request(app)
        .delete(`/api/amazon/expenses/${expenseToDelete.id}`)
        .expect(200);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/amazon/expenses/${expenseToDelete.id}`)
        .expect(404);
    }
  });
});
```

## Test Data Management

### Test Fixtures
- **Sample ZIP files**: Realistic Amazon data archives for testing
- **Mock CSV data**: Controlled test data with known edge cases
- **Database fixtures**: Pre-populated test database states

### Test Isolation
- **Temporary databases**: Use separate test databases
- **File cleanup**: Remove test files after execution
- **State reset**: Ensure clean state between tests

## Performance Testing

### Load Testing
- **Large file processing**: Test with maximum file sizes
- **Concurrent uploads**: Multiple simultaneous file processing
- **Memory usage monitoring**: Track resource consumption

### Stress Testing
- **Invalid data handling**: Test with malformed input files
- **Error recovery**: Verify system stability under failure conditions
- **Database load**: Test with high-volume expense data

## Test Coverage Metrics

### Coverage Requirements
- **Unit tests**: 90%+ coverage for all Amazon integration modules
- **Integration tests**: Full API endpoint coverage
- **E2E tests**: Complete user workflow coverage
- **Error scenarios**: Test all error handling paths

### Coverage Areas
- **Happy path testing**: Normal operation scenarios
- **Edge case testing**: Boundary conditions and unusual inputs
- **Error path testing**: Failure mode handling
- **Performance testing**: Load and stress conditions

## Continuous Integration

### Automated Testing
- **Pre-commit hooks**: Run tests before code commits
- **CI pipeline**: Automated testing on code changes
- **Regression testing**: Prevent functionality breakage

### Test Reporting
- **Coverage reports**: Detailed test coverage metrics
- **Failure analysis**: Comprehensive error reporting
- **Performance metrics**: Test execution time tracking

## Related Documentation

- [Amazon Integration Overview](../overview.md)
- [Data Sources](../data-sources.md)
- [Data Parsing](../data-parsing.md)
- [Data Integration](../data-integration.md)
- [API Integration](../api-integration.md)
- [Error Handling](../error-handling.md)
- [Performance](../performance.md)