#!/usr/bin/env node
/**
 * Unit test for adjusted property logic
 * Tests without requiring Playwright browser launch
 */

const assert = require('assert');

// Simulate the migration logic from storage.js
const migrateExpense = (e) => ({
  ...e,
  businessPercent: e.businessPercent !== undefined ? e.businessPercent :
    (e.category === 'Business Supplies' ? 100 :
     e.category === 'Board Member Benefits' ? 0 : 100),
  adjusted: e.adjusted !== undefined ? e.adjusted : (e.reviewed || false)
});

const testCases = [
  {
    name: 'new expense defaults to adjusted:false',
    input: { id: '1', date: '2025-01-01', description: 'Test', amount: 10, businessPercent: 100 },
    expect: { adjusted: false, businessPercent: 100 }
  },
  {
    name: 'legacy reviewed:true migrates to adjusted:true',
    input: { id: '2', date: '2025-01-01', description: 'Test', amount: 10, businessPercent: 50, reviewed: true },
    expect: { adjusted: true, businessPercent: 50 }
  },
  {
    name: 'explicit adjusted:true is preserved',
    input: { id: '3', date: '2025-01-01', description: 'Test', amount: 10, businessPercent: 75, adjusted: true },
    expect: { adjusted: true, businessPercent: 75 }
  },
  {
    name: 'legacy category:Business Supplies → businessPercent:100',
    input: { id: '4', date: '2025-01-01', description: 'Test', amount: 10, category: 'Business Supplies' },
    expect: { adjusted: false, businessPercent: 100 }
  },
  {
    name: 'legacy category:Board Member Benefits → businessPercent:0',
    input: { id: '5', date: '2025-01-01', description: 'Test', amount: 10, category: 'Board Member Benefits' },
    expect: { adjusted: false, businessPercent: 0 }
  }
];

console.log('🧪 Testing Adjusted Property Migration Logic\n');

let passed = 0;
let failed = 0;

testCases.forEach((tc) => {
  const result = migrateExpense(tc.input);
  const match =
    result.adjusted === tc.expect.adjusted &&
    result.businessPercent === tc.expect.businessPercent;

  if (match) {
    console.log(`✅ ${tc.name}`);
    passed++;
  } else {
    console.error(`❌ ${tc.name}`);
    console.error(`   Expected:`, tc.expect);
    console.error(`   Got:`, { adjusted: result.adjusted, businessPercent: result.businessPercent });
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
