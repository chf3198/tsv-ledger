const { getAllExpenditures } = require('./database');

console.log('🧪 Testing database and Amazon items processing...');

getAllExpenditures((err, expenditures) => {
  if (err) {
    console.error('❌ Database error:', err);
    return;
  }
  
  console.log(`✅ Database loaded: ${expenditures.length} expenditures`);
  
  // Count Amazon orders
  const amazonOrders = expenditures.filter(exp => 
    exp.description && exp.description.includes('Amazon Order')
  );
  console.log(`📦 Amazon orders found: ${amazonOrders.length}`);
  
  // Count business card transactions
  const businessCardTransactions = expenditures.filter(exp => 
    exp.description && 
    exp.description.includes('AMAZON') && 
    exp.description.includes('*5795')
  );
  console.log(`💳 Business card transactions: ${businessCardTransactions.length}`);
  
  if (amazonOrders.length > 0) {
    console.log('🔍 Sample Amazon order:', amazonOrders[0]);
  }
  
  if (businessCardTransactions.length > 0) {
    console.log('💳 Sample business card transaction:', businessCardTransactions[0]);
  }
  
  console.log('✅ Database test complete');
});
