#!/usr/bin/env node

/**
 * Amazon Official Data Parser
 * Phase 1 of migration strategy - Test version
 */

const fs = require('fs');

console.log('🚀 Amazon Official Data Parser - Phase 1');
console.log('==========================================');

// Check if Amazon files exist
const files = {
    retail: 'Retail.OrderHistory.1/Retail.OrderHistory.1.csv',
    digital: 'Digital-Ordering.1/Digital Orders.csv',
    digitalItems: 'Digital-Ordering.1/Digital Items.csv'
};

Object.entries(files).forEach(([type, filepath]) => {
    if (fs.existsSync(filepath)) {
        console.log(`✅ Found ${type} file: ${filepath}`);
    } else {
        console.log(`❌ Missing ${type} file: ${filepath}`);
    }
});

console.log('\n📋 Next steps:');
console.log('1. Extract Amazon "Your Orders.zip" files to current directory');
console.log('2. Run full parser once files are available');
console.log('3. Complete Phase 1 migration');
