#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Benefits Zero Allocation CLI Test');

try {
  // Run the Playwright test
  const testPath = path.join(__dirname, '../pw/benefits-zero-allocation.spec.js');
  const command = `npx playwright test ${testPath} --reporter=line`;

  console.log('Executing:', command);
  execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });

  console.log('✅ CLI Test Passed: No items with 0% allocation in wrong columns');
} catch (error) {
  console.error('❌ CLI Test Failed:', error.message);
  process.exit(1);
}
