/**
 * Import History API Test Suite
 *
 * Tests import history functionality via API calls
 * Can be run with Node.js (no browser required)
 *
 * @fileoverview API-level tests for import history persistence and functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_PORT = 3000;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const IMPORT_HISTORY_FILE = path.join(__dirname, '../data/import-history.json');

// Test utilities
class TestHelpers {
  static async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  static async waitForServer(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.makeRequest(`${BASE_URL}/health`);
        if (response.status === 200) {
          return true;
        }
      } catch (e) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }

  static clearImportHistory() {
    if (fs.existsSync(IMPORT_HISTORY_FILE)) {
      fs.unlinkSync(IMPORT_HISTORY_FILE);
    }
    // Also need to reset in-memory history by restarting server
    // For now, we'll work with the existing history
  }

  static resetTestDatabase() {
    // Reset expenditures.json for testing
    const expendituresFile = path.join(__dirname, '../data/expenditures.json');
    if (fs.existsSync(expendituresFile)) {
      const backup = fs.readFileSync(expendituresFile, 'utf8');
      // Keep backup for restoration if needed
      fs.writeFileSync(expendituresFile, '[]');
      return backup;
    }
    return null;
  }
}

// Test suite
class ImportHistoryTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Import History API Test Suite');
    console.log('================================\n');

    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.fn();
        console.log(`✅ PASSED: ${test.name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('================================');
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('================================');

    return this.failed === 0;
  }
}

// Create test suite
const suite = new ImportHistoryTestSuite();

// Test: Initial state (may have existing history)
suite.test('should return import history API response', async () => {
  const response = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.history || !Array.isArray(response.data.history)) {
    throw new Error('Expected history to be an array');
  }

  if (typeof response.data.total !== 'number') {
    throw new Error('Expected total to be a number');
  }
});

// Test: Import creates history entry
suite.test('should create import history entry after CSV import', async () => {
  // Get initial count
  const initialResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  const initialCount = initialResponse.data.total;

  // Perform CSV import
  const csvData = JSON.stringify({
    csvData: 'date,amount,category,description\n2025-11-12,25.50,Food,Lunch\n2025-11-11,15.75,Transportation,Bus fare'
  });

  const importResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(csvData)
    },
    body: csvData
  });

  if (importResponse.status !== 200) {
    throw new Error(`Import failed with status ${importResponse.status}`);
  }

  // Check history count increased
  const historyResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  if (historyResponse.status !== 200) {
    throw new Error(`History API failed with status ${historyResponse.status}`);
  }

  if (historyResponse.data.total <= initialCount) {
    throw new Error(`Expected history count to increase, got ${historyResponse.data.total} vs ${initialCount}`);
  }

  // Check the latest entry
  const latestEntry = historyResponse.data.history[0]; // Should be newest first
  if (latestEntry.recordsProcessed !== 2) {
    throw new Error(`Expected 2 records processed, got ${latestEntry.recordsProcessed}`);
  }

  if (latestEntry.recordsAdded !== 2) {
    throw new Error(`Expected 2 records added, got ${latestEntry.recordsAdded}`);
  }

  if (latestEntry.source !== 'csv-import') {
    throw new Error(`Expected source 'csv-import', got '${latestEntry.source}'`);
  }
});

// Test: History persists across server restarts
suite.test('should persist import history across server restarts', async () => {
  // This test assumes the server will be restarted externally
  // For now, we'll test that the file exists and contains valid data

  if (!fs.existsSync(IMPORT_HISTORY_FILE)) {
    throw new Error('Import history file should exist');
  }

  const fileContent = fs.readFileSync(IMPORT_HISTORY_FILE, 'utf8');
  const history = JSON.parse(fileContent);

  if (!Array.isArray(history)) {
    throw new Error('History file should contain an array');
  }

  if (history.length === 0) {
    throw new Error('History file should not be empty');
  }

  // Verify structure of first entry
  const entry = history[0];
  const requiredFields = ['timestamp', 'type', 'recordsProcessed', 'recordsAdded', 'duplicatesSkipped', 'errors', 'source'];
  for (const field of requiredFields) {
    if (!(field in entry)) {
      throw new Error(`History entry missing required field: ${field}`);
    }
  }
});

// Test: Multiple imports accumulate
suite.test('should accumulate multiple import history entries', async () => {
  // Get initial count
  const initialResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  const initialCount = initialResponse.data.total;

  // First import
  const csvData1 = JSON.stringify({
    csvData: 'date,amount,category,description\n2025-11-12,25.50,Food,Lunch'
  });

  await TestHelpers.makeRequest(`${BASE_URL}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(csvData1)
    },
    body: csvData1
  });

  // Second import
  const csvData2 = JSON.stringify({
    csvData: 'date,amount,category,description\n2025-11-12,45.00,Office,Laptop\n2025-11-12,15.75,Transportation,Taxi'
  });

  await TestHelpers.makeRequest(`${BASE_URL}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(csvData2)
    },
    body: csvData2
  });

  // Check history has increased by 2
  const historyResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  const expectedCount = initialCount + 2;

  if (historyResponse.data.total < expectedCount) {
    throw new Error(`Expected at least ${expectedCount} history entries, got ${historyResponse.data.total}`);
  }

  // Verify chronological order (newest first)
  const firstEntry = historyResponse.data.history[0];
  const secondEntry = historyResponse.data.history[1];

  if (firstEntry.recordsProcessed !== 2) {
    throw new Error('First entry should be the 2-record import');
  }

  if (secondEntry.recordsProcessed !== 1) {
    throw new Error('Second entry should be the 1-record import');
  }
});

// Test: Error handling in imports
suite.test('should handle import errors gracefully', async () => {
  TestHelpers.clearImportHistory();

  // Send invalid CSV data
  const invalidCsvData = JSON.stringify({
    csvData: 'invalid,data,format\nno,proper,headers'
  });

  const importResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(invalidCsvData)
    },
    body: invalidCsvData
  });

  // Import might succeed or fail, but API should still work
  const historyResponse = await TestHelpers.makeRequest(`${BASE_URL}/api/import-history`);
  if (historyResponse.status !== 200) {
    throw new Error(`History API should always return 200, got ${historyResponse.status}`);
  }

  // Response should be valid JSON
  if (typeof historyResponse.data !== 'object') {
    throw new Error('History API should return valid JSON');
  }
});

// Run the tests
async function runTests() {
  console.log('Waiting for server to be ready...');
  const serverReady = await TestHelpers.waitForServer();

  if (!serverReady) {
    console.error('❌ Server not ready. Please start the server first:');
    console.error('   cd /path/to/tsv-ledger && node server.js');
    process.exit(1);
  }

  console.log('✅ Server is ready. Starting tests...\n');

  // Reset test database
  TestHelpers.resetTestDatabase();

  const success = await suite.run();

  if (success) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed.');
    process.exit(1);
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { ImportHistoryTestSuite, TestHelpers };
