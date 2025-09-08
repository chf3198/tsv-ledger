#!/usr/bin/env node

const TSVCategorizer = require('./tsv-categorizer');

// Sample Amazon orders for testing
const sampleOrders = [
  {
    orderId: '112-7761305-5931405',
    date: '2025-09-06',
    amount: -16.28,
    items: 'Tide Free & Gentle Liquid Laundry Detergent, 100 Loads, 132 fl oz, Tide Laundry Detergent, Clean Laundry Detergent (Packaging May Vary)',
    payments: 'Mastercard ending in 5795: 2025-09-06: $16.28',
    shipping: '0'
  },
  {
    orderId: '112-7509746-7391437',
    date: '2025-09-05',
    amount: -34.67,
    items: 'Custom 7x7ft Custom Backdrop Personalized Photo Backdrop with Picture Banner for Photography, Gift for Christmas, Birthday, Wedding, Graduation, Valentine\'s Day (84x84in)',
    payments: 'Mastercard ending in 5795: 2025-09-05: $34.67',
    shipping: '9.99'
  },
  {
    orderId: '114-0240365-4705864',
    date: '2025-09-05',
    amount: -36.33,
    items: 'Kaytee Wild Bird Ultimate No Mess Wild Bird Food Seed For Cardinals, Finches, Chickadees, Nuthatches, Woodpeckers, Grosbeaks, Juncos and Other Colorful Songbirds, 9.75 Pound',
    payments: 'Mastercard ending in 5795: 2025-09-05: $36.33',
    shipping: '0'
  },
  {
    orderId: '114-9610229-0400227',
    date: '2025-09-05',
    amount: -25.90,
    items: 'Ortho Orthene Fire Ant Killer1, Kills the Queen and Destroys Mounds, Begins Working in 60 minutes, 12 oz., 2-Pack',
    payments: 'Mastercard ending in 5795: 2025-09-05: $25.90',
    shipping: '0'
  },
  {
    orderId: '111-4345368-6928225',
    date: '2025-09-05',
    amount: -16.87,
    items: 'Honest Kids Organic Juice Drink, Berry Berry Good Lemonade, 6.75 Fl Oz Pouches (Pack of 32)',
    payments: 'Mastercard ending in 5795: 2025-09-05: $16.87',
    shipping: '0'
  }
];

console.log('🔍 TSV Categorizer Analysis Demo\n');
console.log('=' * 60);

const categorizer = new TSVCategorizer();

// Analyze each sample order
sampleOrders.forEach((order, index) => {
  console.log(`\n📦 Order ${index + 1}: ${order.orderId}`);
  console.log(`💰 Amount: $${Math.abs(order.amount)}`);
  console.log(`📝 Items: ${order.items.substring(0, 80)}...`);
  
  const analysis = categorizer.analyzeAmazonOrder(order);
  
  console.log(`\n🏷️  Analysis Results:`);
  console.log(`   Category: ${analysis.category}`);
  if (analysis.subcategory) {
    console.log(`   Subcategory: ${analysis.subcategory}`);
  }
  console.log(`   Location: ${analysis.location}`);
  console.log(`   Subscribe & Save: ${analysis.isSubscribeAndSave ? 'Yes' : 'No'}`);
  console.log(`   Employee Benefit: ${analysis.isEmployeeBenefit ? 'Yes' : 'No'}`);
  console.log(`   Business Purpose: ${analysis.businessPurpose}`);
  console.log(`   Season: ${analysis.seasonality.season}`);
  
  if (analysis.insights.length > 0) {
    console.log(`\n💡 Insights:`);
    analysis.insights.forEach(insight => {
      console.log(`   • ${insight}`);
    });
  }
  
  console.log('\n' + '-'.repeat(60));
});

// Generate spending report
console.log('\n📊 SPENDING REPORT');
console.log('=' * 60);

const report = categorizer.generateSpendingReport(sampleOrders);

console.log(`\n📈 Overview:`);
console.log(`   Total Orders: ${report.totalOrders}`);
console.log(`   Total Spent: $${report.totalSpent.toFixed(2)}`);
console.log(`   Subscribe & Save: $${report.subscribeAndSaveTotal.toFixed(2)} (${((report.subscribeAndSaveTotal/report.totalSpent)*100).toFixed(1)}%)`);
console.log(`   Employee Benefits: $${report.employeeBenefitsTotal.toFixed(2)} (${((report.employeeBenefitsTotal/report.totalSpent)*100).toFixed(1)}%)`);

console.log(`\n🏷️  Category Breakdown:`);
Object.entries(report.categoryBreakdown).forEach(([category, amount]) => {
  const percentage = ((amount / report.totalSpent) * 100).toFixed(1);
  console.log(`   ${category}: $${amount.toFixed(2)} (${percentage}%)`);
});

console.log(`\n🏠 Location Breakdown:`);
Object.entries(report.locationBreakdown).forEach(([location, amount]) => {
  if (amount > 0) {
    const percentage = ((amount / report.totalSpent) * 100).toFixed(1);
    console.log(`   ${location}: $${amount.toFixed(2)} (${percentage}%)`);
  }
});

console.log(`\n🌟 Key Insights:`);
report.insights.forEach(insight => {
  console.log(`   • ${insight}`);
});

console.log('\n✅ Analysis Complete!');
