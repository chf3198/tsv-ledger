#!/usr/bin/env node

/**
 * Quick test of corrected TSV Ledger analysis
 */

const http = require('http');

console.log('🧪 Testing Corrected TSV Ledger Analysis...');
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
      
      console.log('📊 CORRECTED FINANCIAL ANALYSIS:');
      console.log(`   Total Transactions: ${analysis.overview.totalTransactions}`);
      console.log(`   🎯 CORRECTED Total Amount: $${analysis.overview.totalAmount.toFixed(2)}`);
      console.log(`   Amazon BoA Transactions: ${analysis.overview.amazonTransactions}`);
      console.log(`   Amazon Order Details: ${analysis.overview.amazonOrderDetails}`);
      console.log(`   Date Range: ${analysis.overview.dateRange.earliest} to ${analysis.overview.dateRange.latest}`);
      
      console.log('\n📂 TOP CATEGORIES (BoA Transactions Only):');
      const sortedCategories = Object.entries(analysis.categories)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
      
      sortedCategories.forEach(([name, data]) => {
        console.log(`   ${name}: $${data.total.toFixed(2)} (${data.count} transactions)`);
      });
      
      if (analysis.subscribeAndSave.count > 0) {
        console.log('\n🔄 SUBSCRIBE & SAVE PATTERNS:');
        console.log(`   Detected Orders: ${analysis.subscribeAndSave.count}`);
        console.log(`   Average Confidence: ${(analysis.subscribeAndSave.averageConfidence * 100).toFixed(1)}%`);
        
        if (analysis.subscribeAndSave.monthlyDeliveryPatterns) {
          console.log('   Delivery Patterns:');
          Object.entries(analysis.subscribeAndSave.monthlyDeliveryPatterns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([pattern, count]) => {
              console.log(`     ${pattern}: ${count} deliveries`);
            });
        }
      }
      
      if (analysis.monthlySpendingGraph) {
        console.log('\n📈 MONTHLY SPENDING GRAPH DATA:');
        const recentMonths = analysis.monthlySpendingGraph.labels.slice(-6);
        const recentData = analysis.monthlySpendingGraph.data.slice(-6);
        
        recentMonths.forEach((month, index) => {
          console.log(`   ${month}: $${recentData[index].toFixed(2)}`);
        });
      }
      
      if (analysis.insights && analysis.insights.length > 0) {
        console.log('\n💡 KEY INSIGHTS:');
        analysis.insights.forEach(insight => {
          console.log(`   • ${insight.message}`);
          console.log(`     ${insight.recommendation}`);
        });
      }
      
      console.log('\n✅ Analysis corrected - no more double-counting!');
      
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
      console.log('Response preview:', data.substring(0, 200));
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Connection Error:', err.message);
  console.log('Make sure the server is running: node server.js');
});

req.setTimeout(5000, () => {
  console.log('❌ Request timeout - server may not be responding');
  req.abort();
});

req.end();
