# Unit Testing Components

Comprehensive unit tests for individual Amazon integration components with mocked dependencies and edge case coverage.

## Extractor Testing

```javascript
// tests/unit/amazon-integration/extractor.test.js
const AmazonZipExtractor = require('../../../src/amazon-integration/extractor');
const fs = require('fs').promises;
const path = require('path');

describe('AmazonZipExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new AmazonZipExtractor();
  });

  afterEach(async () => {
    await extractor.cleanup();
  });

  describe('extract', () => {
    test('should extract valid ZIP file', async () => {
      const testZipPath = path.join(__dirname, '..', 'fixtures', 'amazon-test-data.zip');

      const result = await extractor.extract(testZipPath);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.summary.totalFiles).toBe(result.files.length);
    });

    test('should reject invalid file', async () => {
      const invalidFilePath = path.join(__dirname, '..', 'fixtures', 'invalid-file.txt');

      await expect(extractor.extract(invalidFilePath))
        .rejects.toThrow('Invalid ZIP file format');
    });

    test('should reject oversized file', async () => {
      // Create a mock oversized file
      const oversizedPath = path.join(__dirname, '..', 'fixtures', 'oversized.zip');

      await expect(extractor.extract(oversizedPath))
        .rejects.toThrow('ZIP file too large');
    });
  });
});
```

## Parser Testing

```javascript
// tests/unit/amazon-integration/parsers/orderParser.test.js
const AmazonOrderParser = require('../../../../src/amazon-integration/parsers/orderParser');

describe('AmazonOrderParser', () => {
  let parser;

  beforeEach(() => {
    parser = new AmazonOrderParser();
  });

  describe('parseOrderRow', () => {
    test('should parse valid order row', () => {
      const mockRow = {
        'Order ID': '123-4567890-1234567',
        'Order Date': '2024-01-15T10:30:00-08:00',
        'Order Status': 'Shipped',
        'Payment Instrument Type': 'Credit Card',
        'Total Charged': '$29.99',
        'Total Owed': '$0.00',
        'Shipment Item Subtotal': '$25.99',
        'Shipment Item Subtotal Tax': '$2.00',
        'Shipping Charge': '$2.00',
        'Tax Charged': '$2.00'
      };

      const order = parser.parseOrderRow(mockRow);

      expect(order).toHaveProperty('orderId', '123-4567890-1234567');
      expect(order).toHaveProperty('status', 'shipped');
      expect(order.totals).toHaveProperty('charged', 29.99);
      expect(order.totals).toHaveProperty('subtotal', 25.99);
      expect(order.shipping).toHaveProperty('charge', 2.00);
      expect(order.tax).toHaveProperty('charged', 2.00);
    });

    test('should reject row with missing required fields', () => {
      const invalidRow = {
        'Order Date': '2024-01-15T10:30:00-08:00',
        // Missing Order ID
        'Order Status': 'Shipped'
      };

      expect(() => parser.parseOrderRow(invalidRow))
        .toThrow('Missing required fields');
    });

    test('should handle invalid currency values', () => {
      const invalidRow = {
        'Order ID': '123-4567890-1234567',
        'Order Date': '2024-01-15T10:30:00-08:00',
        'Order Status': 'Shipped',
        'Total Charged': 'invalid-currency',
        'Total Owed': '$0.00',
        'Shipment Item Subtotal': '$25.99',
        'Shipment Item Subtotal Tax': '$2.00',
        'Shipping Charge': '$2.00',
        'Tax Charged': '$2.00'
      };

      expect(() => parser.parseOrderRow(invalidRow))
        .toThrow('Invalid currency value');
    });
  });
});
```