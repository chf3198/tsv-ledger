#!/usr/bin/env node
/**
 * Unit test for adjusted property logic including applyBulkAllocation
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

// Simulate applyBulkAllocation logic from app-allocation.js
const applyBulkAllocation = (expenses, sourceExpense, matchedExpenses) => {
  const targetPercent = Math.max(0, Math.min(100, Math.round(Number(sourceExpense.businessPercent ?? 100))));
  const matchIds = new Set(matchedExpenses.map(e => e.id));
  return expenses.map(expense =>
    matchIds.has(expense.id)
      ? { ...expense, businessPercent: targetPercent, adjusted: true }
      : expense
  );
};

const migrationTests = [
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
  }
];

const bulkApplyTests = [
  {
    name: 'apply to all: matched items get adjusted=true + same businessPercent',
    expenses: [
      { id: 'tp-1', description: 'Toilet Paper', businessPercent: 100, adjusted: false },
      { id: 'tp-2', description: 'Toilet Paper', businessPercent: 100, adjusted: false },
      { id: 'other', description: 'Coffee', businessPercent: 50, adjusted: false }
    ],
    sourceExpense: { id: 'tp-1', businessPercent: 0 },
    matched: [{ id: 'tp-2' }],  // Only tp-2 matches; tp-1 is the source
    expectMatched: [{ id: 'tp-2', businessPercent: 0, adjusted: true }],
    expectUnmatched: [
      { id: 'tp-1', businessPercent: 100, adjusted: false },  // Source not affected
      { id: 'other', businessPercent: 50, adjusted: false }
    ]
  },
  {
    name: 'apply to all: normalizes percent within 0-100 range',
    expenses: [
      { id: 'a', description: 'Item', businessPercent: 50, adjusted: false },
      { id: 'b', description: 'Item', businessPercent: 50, adjusted: false }
    ],
    sourceExpense: { id: 'a', businessPercent: -50 },  // Invalid: should normalize to 0
    matched: [{ id: 'b' }],
    expectMatched: [{ id: 'b', businessPercent: 0, adjusted: true }],
    expectUnmatched: [{ id: 'a', businessPercent: 50, adjusted: false }]
  }
];

console.log('🧪 Testing Adjusted Property: Migration + Bulk Apply\n');

let passed = 0;
let failed = 0;

// Test migration logic
console.log('📦 Migration Tests:');
migrationTests.forEach((tc) => {
  const result = migrateExpense(tc.input);
  const match =
    result.adjusted === tc.expect.adjusted &&
    result.businessPercent === tc.expect.businessPercent;

  if (match) {
    console.log(`  ✅ ${tc.name}`);
    passed++;
  } else {
    console.error(`  ❌ ${tc.name}`);
    console.error(`     Expected:`, tc.expect);
    console.error(`     Got:`, { adjusted: result.adjusted, businessPercent: result.businessPercent });
    failed++;
  }
});

// Test bulk apply logic
console.log('\n💥 Bulk Apply Tests:');
bulkApplyTests.forEach((tc) => {
  const result = applyBulkAllocation(tc.expenses, tc.sourceExpense, tc.matched);

  let testPassed = true;
  let issues = [];

  // Check matched items
  tc.expectMatched.forEach(exp => {
    const item = result.find(e => e.id === exp.id);
    if (!item || item.businessPercent !== exp.businessPercent || item.adjusted !== exp.adjusted) {
      testPassed = false;
      issues.push(`Matched ${exp.id}: expected {bp: ${exp.businessPercent}, adj: ${exp.adjusted}}, got {bp: ${item?.businessPercent}, adj: ${item?.adjusted}}`);
    }
  });

  // Check unmatched items
  tc.expectUnmatched.forEach(exp => {
    const item = result.find(e => e.id === exp.id);
    if (!item || item.businessPercent !== exp.businessPercent || item.adjusted !== exp.adjusted) {
      testPassed = false;
      issues.push(`Unmatched ${exp.id}: expected unchanged, got {bp: ${item?.businessPercent}, adj: ${item?.adjusted}}`);
    }
  });

  if (testPassed) {
    console.log(`  ✅ ${tc.name}`);
    passed++;
  } else {
    console.error(`  ❌ ${tc.name}`);
    issues.forEach(issue => console.error(`     ${issue}`));
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
