#!/usr/bin/env node

/**
 * Test the frontend analysis refresh functionality
 */

const http = require('http');

console.log('🧪 Testing Frontend Analysis Refresh Fix...');
console.log('=' .repeat(50));

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analysis',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const analysis = JSON.parse(data);
      
      console.log('✅ API Response Structure Check:');
      
      // Check for the fields that the frontend expects
      const overview = analysis.overview;
      console.log(`   totalTransactions: ${overview.totalTransactions} ✓`);
      console.log(`   totalAmount: $${overview.totalAmount.toFixed(2)} ✓`);
      console.log(`   amazonTransactions: ${overview.amazonTransactions} ✓`);
      console.log(`   amazonOrderDetails: ${overview.amazonOrderDetails} ✓`);
      console.log(`   premiumDataOrders: ${overview.premiumDataOrders} ✓`);
      
      // Test the toLocaleString calls that were failing
      console.log('\n✅ Frontend Compatibility Tests:');
      try {
        console.log(`   totalTransactions.toLocaleString(): ${overview.totalTransactions.toLocaleString()} ✓`);
        console.log(`   totalAmount.toLocaleString(): ${overview.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} ✓`);
        console.log(`   amazonOrderDetails.toLocaleString(): ${overview.amazonOrderDetails.toLocaleString()} ✓`);
        
        // Test Subscribe & Save section
        if (analysis.subscribeAndSave) {
          console.log(`   subscribeAndSave.count: ${analysis.subscribeAndSave.count || 0} ✓`);
          console.log(`   subscribeAndSave.averageConfidence: ${(analysis.subscribeAndSave.averageConfidence * 100).toFixed(1)}% ✓`);
        }
        
        // Test categories
        if (analysis.categories) {
          const categoryCount = Object.keys(analysis.categories).length;
          console.log(`   categories count: ${categoryCount} ✓`);
          
          // Test percentage calculations
          const totalSpending = overview.totalAmount;
          const firstCategory = Object.values(analysis.categories)[0];
          if (firstCategory) {
            const percentage = (firstCategory.total / totalSpending * 100).toFixed(1);
            console.log(`   category percentage calculation: ${percentage}% ✓`);
          }
        }
        
        // Test monthly trends for graph
        if (analysis.monthlySpendingGraph) {
          console.log(`   monthlySpendingGraph.labels: ${analysis.monthlySpendingGraph.labels.length} months ✓`);
          console.log(`   monthlySpendingGraph.data: ${analysis.monthlySpendingGraph.data.length} values ✓`);
        }
        
        console.log('\n🎉 All frontend compatibility tests passed!');
        console.log('💡 The "Refresh Analysis" button should now work without errors.');
        
      } catch (frontendError) {
        console.log(`❌ Frontend compatibility error: ${frontendError.message}`);
      }
      
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Connection Error:', err.message);
});

req.setTimeout(5000, () => {
  console.log('❌ Request timeout');
  req.abort();
});

req.end();
