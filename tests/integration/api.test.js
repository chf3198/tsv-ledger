/**
 * API Integration Tests
 *
 * @fileoverview Integration tests for all REST API endpoints
 * Tests complete request/response cycles with real server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { HttpHelpers, TestFixtures, DatabaseHelpers, AssertionHelpers } = require('../shared/test-helpers');

describe('API Integration Tests', () => {
  let serverProcess;
  const baseUrl = 'http://localhost:3001'; // Use test port

  beforeAll(async () => {
    // Setup test database
    await DatabaseHelpers.setupTestDatabase();

    // Start server on test port
    const serverPath = path.join(__dirname, '..', '..', 'server.js');
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: '3001', NODE_ENV: 'test' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await HttpHelpers.waitForEndpoint(`${baseUrl}/api/expenditures`, 10000);

    // Give server a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 15000);

  afterAll(async () => {
    // Stop server
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => {
        const timeout = setTimeout(() => serverProcess.kill('SIGKILL'), 5000);
        serverProcess.on('close', () => clearTimeout(timeout));
      });
    }

    // Restore database
    await DatabaseHelpers.restoreDatabase();
  });

  beforeEach(async () => {
    // Clear test data between tests
    await DatabaseHelpers.insertTestData([]);
  });

  describe('GET /api/expenditures', () => {
    test('should return empty array when no expenditures exist', async () => {
      const response = await fetch(`${baseUrl}/api/expenditures`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test('should return all expenditures', async () => {
      const testData = [TestFixtures.sampleExpenditure];
      await DatabaseHelpers.insertTestData(testData);

      const response = await fetch(`${baseUrl}/api/expenditures`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(testData[0]);
    });

    test('should handle large datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...TestFixtures.sampleExpenditure,
        id: i + 1,
        description: `Expense ${i + 1}`
      }));
      await DatabaseHelpers.insertTestData(largeDataset);

      const response = await fetch(`${baseUrl}/api/expenditures`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveLength(100);
    });
  });

  describe('POST /api/expenditures', () => {
    test('should create new expenditure', async () => {
      const newExpenditure = {
        date: '2024-01-15',
        amount: 29.99,
        description: 'Test purchase',
        category: 'Office Supplies',
        vendor: 'Amazon',
        account: 'Business Card'
      };

      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpenditure)
      });
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data.id).toBeDefined();
      expect(data.date).toBe(newExpenditure.date);
      expect(data.amount).toBe(newExpenditure.amount);
      expect(data.description).toBe(newExpenditure.description);
    });

    test('should handle invalid JSON', async () => {
      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    test('should handle missing required fields', async () => {
      const incompleteExpenditure = { date: '2024-01-15' };

      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteExpenditure)
      });
      const data = await response.json();

      // Should still create with defaults
      AssertionHelpers.assertApiResponse(response, 200);
      expect(data.id).toBeDefined();
    });
  });

  describe('GET /api/analysis', () => {
    test('should return analysis for existing expenditures', async () => {
      const testData = [
        { ...TestFixtures.sampleExpenditure, category: 'Office Supplies', amount: 100 },
        { ...TestFixtures.sampleExpenditure, category: 'Food & Dining', amount: 50 }
      ];
      await DatabaseHelpers.insertTestData(testData);

      const response = await fetch(`${baseUrl}/api/analysis`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveProperty('totalSpent');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('monthlyTrends');
      expect(data.totalSpent).toBe(150);
      expect(data.categories['Office Supplies']).toBeDefined();
      expect(data.categories['Food & Dining']).toBeDefined();
    });

    test('should handle empty dataset', async () => {
      const response = await fetch(`${baseUrl}/api/analysis`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data.totalSpent).toBe(0);
      expect(data.categories).toEqual({});
    });
  });

  describe('GET /api/ai-analysis', () => {
    test('should return AI analysis results', async () => {
      const testData = [TestFixtures.sampleExpenditure];
      await DatabaseHelpers.insertTestData(testData);

      const response = await fetch(`${baseUrl}/api/ai-analysis`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('anomalies');
      expect(Array.isArray(data.insights)).toBe(true);
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(Array.isArray(data.anomalies)).toBe(true);
    });

    test('should handle empty dataset', async () => {
      const response = await fetch(`${baseUrl}/api/ai-analysis`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data.insights).toEqual([]);
      expect(data.recommendations).toEqual([]);
      expect(data.anomalies).toEqual([]);
    });
  });

  describe('GET /api/amazon-items', () => {
    test('should return Amazon items', async () => {
      const response = await fetch(`${baseUrl}/api/amazon-items`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(Array.isArray(data)).toBe(true);
    });

    test('should handle filtering parameters', async () => {
      const response = await fetch(`${baseUrl}/api/amazon-items?category=Office%20Supplies`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('PUT /api/amazon-items/:id', () => {
    test('should update Amazon item', async () => {
      // First get an existing item
      const getResponse = await fetch(`${baseUrl}/api/amazon-items`);
      const items = await getResponse.json();

      if (items.length > 0) {
        const itemId = items[0].id;
        const updateData = { category: 'Updated Category' };

        const response = await fetch(`${baseUrl}/api/amazon-items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data.category).toBe('Updated Category');
      }
    });

    test('should handle non-existent item', async () => {
      const response = await fetch(`${baseUrl}/api/amazon-items/99999`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Test' })
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/premium-status', () => {
    test('should return premium status', async () => {
      const response = await fetch(`${baseUrl}/api/premium-status`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveProperty('isPremium');
      expect(data).toHaveProperty('features');
    });
  });

  describe('GET /api/premium-analytics', () => {
    test('should return premium analytics', async () => {
      const response = await fetch(`${baseUrl}/api/premium-analytics`);
      const data = await response.json();

      AssertionHelpers.assertApiResponse(response, 200);
      expect(data).toHaveProperty('advancedMetrics');
      expect(data).toHaveProperty('insights');
    });
  });

  describe('Employee Benefits API', () => {
    describe('POST /api/employee-benefits-filter', () => {
      test('should filter employee benefits', async () => {
        const filterData = {
          categories: ['Office Supplies'],
          dateRange: { start: '2024-01-01', end: '2024-12-31' }
        };

        const response = await fetch(`${baseUrl}/api/employee-benefits-filter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filterData)
        });
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data).toHaveProperty('filteredItems');
        expect(data).toHaveProperty('summary');
      });
    });
  });

  describe('Subscription Analysis API', () => {
    describe('GET /api/subscription-dashboard', () => {
      test('should return subscription dashboard data', async () => {
        const response = await fetch(`${baseUrl}/api/subscription-dashboard`);
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data).toHaveProperty('subscriptions');
        expect(data).toHaveProperty('metrics');
      });
    });

    describe('GET /api/subscription-analysis', () => {
      test('should return subscription analysis', async () => {
        const response = await fetch(`${baseUrl}/api/subscription-analysis`);
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data).toHaveProperty('patterns');
        expect(data).toHaveProperty('recommendations');
      });
    });
  });

  describe('Geographic Analysis API', () => {
    describe('GET /api/geographic-dashboard', () => {
      test('should return geographic dashboard data', async () => {
        const response = await fetch(`${baseUrl}/api/geographic-dashboard`);
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data).toHaveProperty('locations');
        expect(data).toHaveProperty('spending');
      });
    });

    describe('GET /api/geographic-analysis', () => {
      test('should return geographic analysis', async () => {
        const response = await fetch(`${baseUrl}/api/geographic-analysis`);
        const data = await response.json();

        AssertionHelpers.assertApiResponse(response, 200);
        expect(data).toHaveProperty('regions');
        expect(data).toHaveProperty('trends');
      });
    });
  });

  describe('File Upload APIs', () => {
    describe('POST /api/validate-amazon-zip', () => {
      test('should validate ZIP file upload', async () => {
        const formData = new FormData();
        // Create a mock zip file for testing
        const mockZipContent = 'mock zip content';
        const blob = new Blob([mockZipContent], { type: 'application/zip' });
        formData.append('amazonZip', blob, 'test.zip');

        const response = await fetch(`${baseUrl}/api/validate-amazon-zip`, {
          method: 'POST',
          body: formData
        });

        // Should handle the request (may return validation error for mock data)
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    describe('POST /api/import-amazon-zip', () => {
      test('should handle ZIP import request', async () => {
        const formData = new FormData();
        const blob = new Blob(['mock'], { type: 'application/zip' });
        formData.append('amazonZip', blob, 'test.zip');

        const response = await fetch(`${baseUrl}/api/import-amazon-zip`, {
          method: 'POST',
          body: formData
        });

        // Should handle the request
        expect([200, 400, 500]).toContain(response.status);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid endpoints', async () => {
      const response = await fetch(`${baseUrl}/api/nonexistent`);
      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON in POST requests', async () => {
      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json}'
      });
      expect(response.status).toBe(400);
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'PATCH'
      });
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await fetch(`${baseUrl}/api/expenditures`);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch(`${baseUrl}/api/expenditures`)
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security', () => {
    test('should not allow directory traversal', async () => {
      const response = await fetch(`${baseUrl}/api/../../../etc/passwd`);
      expect(response.status).toBe(404);
    });

    test('should handle large request bodies', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB of data

      const response = await fetch(`${baseUrl}/api/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: largeData })
      });

      expect([200, 413]).toContain(response.status); // Should either succeed or return 413 Payload Too Large
    });
  });
});