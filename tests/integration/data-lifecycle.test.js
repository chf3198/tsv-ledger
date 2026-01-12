/**
 * Data Lifecycle Integration Tests
 *
 * Tests the full data lifecycle via API:
 * 1. Import bank and Amazon data
 * 2. Verify data via API endpoints
 * 3. Clear data via admin API
 * 4. Verify empty state via API
 *
 * @module tests/integration/data-lifecycle.test.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const DATA_DIR = path.join(__dirname, '../../data');

describe('Data Lifecycle Integration Tests', () => {

  test('should complete full data lifecycle', async () => {
    // Phase 1: Initial State Check
    console.log('=== Phase 1: Initial State Check ===');

    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.version).toBeDefined();

    const initialStatusResponse = await fetch(`${BASE_URL}/api/admin/status`);
    const initialStatusData = await initialStatusResponse.json();
    expect(initialStatusData.success).toBe(true);
    console.log('Initial state:', {
      expenditures: initialStatusData.data.expenditures.count,
      importHistory: initialStatusData.data.importHistory.count
    });

    // Phase 2: Data Import via API
    console.log('=== Phase 2: Data Import via API ===');

    // Import BOA bank data
    const boaFilePath = path.join(DATA_DIR, 'stmttab.dat');
    const boaData = fs.readFileSync(boaFilePath, 'utf8');

    const boaResponse = await fetch(`${BASE_URL}/api/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: boaData, fileName: 'stmttab.dat' })
    });
    const boaResult = await boaResponse.json();
    expect(boaResult.success).toBe(true);
    expect(boaResult.data.imported).toBe(278);
    console.log('BOA import result:', boaResult.data);

    // Import Amazon data
    const amazonFilePath = path.join(DATA_DIR, 'amazon-official-data.csv');
    const amazonData = fs.readFileSync(amazonFilePath, 'utf8');

    const amazonResponse = await fetch(`${BASE_URL}/api/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: amazonData, fileName: 'amazon-official-data.csv' })
    });
    const amazonResult = await amazonResponse.json();
    expect(amazonResult.success).toBe(true);
    expect(amazonResult.data.imported).toBe(2784);
    console.log('Amazon import result:', amazonResult.data);

    // Verify data count increased
    const afterImportStatusResponse = await fetch(`${BASE_URL}/api/admin/status`);
    const afterImportStatusData = await afterImportStatusResponse.json();
    expect(afterImportStatusData.data.expenditures.count).toBeGreaterThan(0);
    console.log('After import state:', {
      expenditures: afterImportStatusData.data.expenditures.count,
      importHistory: afterImportStatusData.data.importHistory.count
    });

    // Phase 3: Verify Data via API Endpoints
    console.log('=== Phase 3: Verify Data via API Endpoints ===');

    // Test expenditures API
    const expendituresResponse = await fetch(`${BASE_URL}/api/expenditures`);
    const expendituresData = await expendituresResponse.json();
    const expendituresCount = Array.isArray(expendituresData) ? expendituresData.length : (expendituresData.data?.length || 0);
    expect(expendituresCount).toBeGreaterThan(0);
    console.log('Expenditures API count:', expendituresCount);

    // Test analytics API
    const analyticsResponse = await fetch(`${BASE_URL}/api/analytics`);
    expect(analyticsResponse.ok).toBeTruthy();
    const analyticsData = await analyticsResponse.json();
    console.log('Analytics data preview:', JSON.stringify(analyticsData).substring(0, 200));

    // Test category breakdown
    const categoriesResponse = await fetch(`${BASE_URL}/api/analytics/categories`);
    expect(categoriesResponse.ok).toBeTruthy();

    // Test subscription analysis
    const subscriptionsResponse = await fetch(`${BASE_URL}/api/subscriptions`);
    expect(subscriptionsResponse.ok).toBeTruthy();

    // Test geographic data
    const geographicResponse = await fetch(`${BASE_URL}/api/analytics/geographic`);
    expect(geographicResponse.ok).toBeTruthy();

    // Phase 4: Clear All Data via Admin API
    console.log('=== Phase 4: Clear All Data via Admin API ===');

    const clearResponse = await fetch(`${BASE_URL}/api/admin/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE_ALL_DATA' })
    });
    const clearResult = await clearResponse.json();
    expect(clearResult.success).toBe(true);
    console.log('Clear result:', clearResult);

    // Verify backup was created
    const backupStatusResponse = await fetch(`${BASE_URL}/api/admin/backups`);
    const backupStatusData = await backupStatusResponse.json();
    expect(backupStatusData.success).toBe(true);
    expect(backupStatusData.data.length).toBeGreaterThan(0);
    console.log('Backups after clear:', backupStatusData.data.length);

    // Phase 5: Verify Empty State via API
    console.log('=== Phase 5: Verify Empty State via API ===');

    // Test zero expenditures
    const emptyExpendituresResponse = await fetch(`${BASE_URL}/api/expenditures`);
    const emptyExpendituresData = await emptyExpendituresResponse.json();
    const emptyExpendituresCount = Array.isArray(emptyExpendituresData) ? emptyExpendituresData.length : (emptyExpendituresData.data?.length || 0);
    expect(emptyExpendituresCount).toBe(0);
    console.log('Expenditures after clear:', emptyExpendituresCount);

    // Test zero in admin status
    const emptyStatusResponse = await fetch(`${BASE_URL}/api/admin/status`);
    const emptyStatusData = await emptyStatusResponse.json();
    expect(emptyStatusData.data.expenditures.count).toBe(0);
    expect(emptyStatusData.data.importHistory.count).toBe(0);
    console.log('Admin status after clear:', emptyStatusData.data);

    // Test empty analytics
    const emptyAnalyticsResponse = await fetch(`${BASE_URL}/api/analytics`);
    if (emptyAnalyticsResponse.ok) {
      const emptyAnalyticsData = await emptyAnalyticsResponse.json();
      console.log('Analytics after clear:', JSON.stringify(emptyAnalyticsData).substring(0, 200));
    }

    // Test empty subscriptions
    const emptySubscriptionsResponse = await fetch(`${BASE_URL}/api/subscriptions`);
    if (emptySubscriptionsResponse.ok) {
      const emptySubscriptionsData = await emptySubscriptionsResponse.json();
      console.log('Subscriptions after clear - response ok');
    }

  }, 120000); // 2 minute timeout
});
