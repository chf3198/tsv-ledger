const fs = require('fs');
const csv = require('csv-parser');

let productFrequency = {};

fs.createReadStream('amazon_order_history.csv')
  .pipe(csv())
  .on('data', (row) => {
    const items = row.items || '';
    // Extract main product name (first part before comma or semicolon)
    const mainProduct = items.split(/[,;]/)[0].trim();
    if (mainProduct.length > 10) {
      if (!productFrequency[mainProduct]) {
        productFrequency[mainProduct] = [];
      }
      productFrequency[mainProduct].push({
        date: row.date,
        shipping: row.shipping,
        orderId: row['order id']
      });
    }
  })
  .on('end', () => {
    // Find products ordered multiple times
    const recurring = Object.entries(productFrequency)
      .filter(([product, orders]) => orders.length >= 3)
      .map(([product, orders]) => ({
        product,
        count: orders.length,
        orders: orders.sort((a, b) => new Date(a.date) - new Date(b.date)),
        freeShippingCount: orders.filter(o => parseFloat(o.shipping || 0) === 0).length
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('Most frequently ordered products (3+ orders):');
    recurring.slice(0, 10).forEach(item => {
      console.log('\n' + item.product);
      console.log('  Ordered ' + item.count + ' times, ' + item.freeShippingCount + ' with free shipping (' + Math.round(item.freeShippingCount/item.count*100) + '%)');
      console.log('  Dates: ' + item.orders.map(o => o.date).join(', '));
    });
    
    // Look for subscription indicators
    console.log('\n\nPotential Subscribe & Save products (high frequency + high free shipping rate):');
    const subscriptionCandidates = recurring.filter(item => 
      item.freeShippingCount / item.count >= 0.8 && item.count >= 4
    );
    
    subscriptionCandidates.forEach(item => {
      console.log('• ' + item.product + ' (' + item.count + ' orders, ' + Math.round(item.freeShippingCount/item.count*100) + '% free shipping)');
    });
  });
