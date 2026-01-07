# Integration Testing

End-to-end testing of Amazon integration workflows with real file processing and database interactions.

## API Endpoint Testing

```javascript
// tests/integration/amazon-integration.test.js
const request = require('supertest');
const app = require('../../server');
const fs = require('fs');
const path = require('path');

describe('Amazon Integration API', () => {
  describe('POST /api/amazon/upload', () => {
    test('should process valid Amazon ZIP file', async () => {
      const testZipPath = path.join(__dirname, '..', 'fixtures', 'amazon-test-data.zip');

      const response = await request(app)
        .post('/api/amazon/upload')
        .attach('amazonData', testZipPath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('processed');
      expect(response.body.data).toHaveProperty('saved');
      expect(response.body.data.saved).toBeGreaterThan(0);
    });

    test('should reject non-ZIP files', async () => {
      const response = await request(app)
        .post('/api/amazon/upload')
        .attach('amazonData', Buffer.from('not a zip file'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/ZIP files are allowed/);
    });

    test('should handle empty ZIP files', async () => {
      const emptyZipPath = path.join(__dirname, '..', 'fixtures', 'empty.zip');

      const response = await request(app)
        .post('/api/amazon/upload')
        .attach('amazonData', emptyZipPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/contains no files/);
    });
  });
});
```

## Data Retrieval Testing

```javascript
describe('GET /api/amazon/expenses', () => {
  test('should return Amazon expenses', async () => {
    const response = await request(app)
      .get('/api/amazon/expenses')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    // Check that returned expenses have Amazon-specific fields
    if (response.body.data.length > 0) {
      const expense = response.body.data[0];
      expect(expense.source).toBe('amazon_integration');
      expect(expense.merchant).toBe('Amazon');
      expect(expense.metadata).toHaveProperty('orderId');
    }
  });

  test('should filter by date range', async () => {
    const response = await request(app)
      .get('/api/amazon/expenses?dateFrom=2024-01-01&dateTo=2024-12-31')
      .expect(200);

    expect(response.body.success).toBe(true);
    // All returned expenses should be within date range
    response.body.data.forEach(expense => {
      expect(expense.date).toMatch(/^2024-/);
    });
  });
});
```