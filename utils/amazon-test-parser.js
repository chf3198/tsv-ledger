const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Test script for parsing Amazon Order History CSV file
console.log('=== TSV LEDGER - AMAZON ORDER HISTORY TEST ===\n');

// Test with sample data first, then replace with actual file
const sampleAmazonData = `Order Date,Order ID,Title,Category,ASIN/ISBN,UNSPSC Code,Website,Purchase Order Number,Ordering Customer Email,Shipment Date,Shipping Address Name,Shipping Address Street 1,Shipping Address Street 2,Shipping Address City,Shipping Address State,Shipping Address Zip,Order Status,Carrier Name & Tracking Number,Item Subtotal,Item Subtotal Tax,Item Total,Tax Exemption Applied,Tax Exemption Type,Exemption Opt-Out,Buyer Name,Currency,Group Name
09/15/2024,123-4567890-1234567,Adobe Creative Cloud Subscription,Software,B012345678,43211503,Amazon.com,,user@texassunsetvenues.com,09/16/2024,Texas Sunset Venues,123 Main St,,Austin,TX,78701,Shipped,USPS: 12345678901234567890,$49.99,$4.50,$54.49,No,,No,Texas Sunset Venues,USD,Business
09/10/2024,123-4567890-1234568,Office Chair,Office Supplies,B098765432,56101500,Amazon.com,,user@texassunsetvenues.com,09/11/2024,Texas Sunset Venues,123 Main St,,Austin,TX,78701,Delivered,UPS: 1Z999AA1234567890,$199.99,$18.00,$217.99,No,,No,Texas Sunset Venues,USD,Business
09/05/2024,123-4567890-1234569,Printer Ink Cartridges,Office Supplies,B054321098,44103100,Amazon.com,,user@texassunsetvenues.com,09/06/2024,Texas Sunset Venues,123 Main St,,Austin,TX,78701,Shipped,FedEx: 7777 7777 7777,$29.99,$2.70,$32.69,No,,No,Texas Sunset Venues,USD,Business`;

console.log('📁 Using sample Amazon Order History data...');
console.log('📊 Data Analysis:');
console.log('- Total characters:', sampleAmazonData.length);
console.log('- Contains commas:', sampleAmazonData.includes(','));
console.log('- Total lines:', sampleAmazonData.split('\n').length);

console.log('\n🔍 First 5 lines preview:');
sampleAmazonData.split('\n').slice(0, 5).forEach((line, i) => {
  console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
});

console.log('\n🚀 Starting Amazon CSV Parse Test...\n');

const results = [];
const errors = [];
const skippedRows = [];

// Parse Amazon CSV data
const csvStream = require('stream').Readable.from(sampleAmazonData);
let lineNumber = 0;

csvStream
  .pipe(csv({
    skipEmptyLines: true
  }))
  .on('data', (data) => {
    lineNumber++;
    console.log(`\n=== LINE ${lineNumber} ===`);
    console.log('Raw data keys:', Object.keys(data));

    // Skip header row
    if (lineNumber === 1) {
      console.log(`⏭️  SKIPPING HEADER ROW`);
      return;
    }

    // Extract order date
    const orderDate = data['Order Date'];
    console.log('Order Date found:', orderDate);

    if (!orderDate || orderDate.trim() === '') {
      console.log(`❌ SKIPPING: No order date`);
      skippedRows.push({ line: lineNumber, reason: 'no order date', data: data });
      return;
    }

    // Validate date format (MM/DD/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(orderDate.trim())) {
      console.log(`❌ SKIPPING: Invalid date format: "${orderDate}"`);
      skippedRows.push({ line: lineNumber, reason: 'invalid date format', data: data });
      return;
    }

    // Extract item total (includes tax)
    const itemTotal = data['Item Total'];
    console.log('Item Total found:', itemTotal);

    const cleanTotal = itemTotal ? itemTotal.toString().replace(/[$,]/g, '').trim() : '0';
    const parsedTotal = parseFloat(cleanTotal);

    console.log('Clean total:', cleanTotal);
    console.log('Parsed total:', parsedTotal);

    if (isNaN(parsedTotal) || parsedTotal === 0) {
      console.log(`❌ SKIPPING: Invalid total: "${itemTotal}" -> ${parsedTotal}`);
      skippedRows.push({ line: lineNumber, reason: 'invalid amount', data: data });
      return;
    }

    // Extract product title
    const title = data['Title'];
    console.log('Title found:', title);

    // Map Amazon categories to our expenditure categories
    const amazonCategory = data['Category'] || '';
    let expenditureCategory = 'supplies restocking'; // default

    if (amazonCategory.toLowerCase().includes('software') || amazonCategory.toLowerCase().includes('subscription')) {
      expenditureCategory = 'tool subscriptions';
    } else if (amazonCategory.toLowerCase().includes('office') || amazonCategory.toLowerCase().includes('supplies')) {
      expenditureCategory = 'supplies restocking';
    } else if (amazonCategory.toLowerCase().includes('maintenance') || amazonCategory.toLowerCase().includes('repair')) {
      expenditureCategory = 'maintenance payments';
    }

    // Create expenditure object
    const expenditure = {
      date: orderDate.trim(),
      amount: parsedTotal,
      category: expenditureCategory,
      description: title ? `${title} (Order: ${data['Order ID']})` : `Amazon Order: ${data['Order ID']}`
    };

    console.log('✅ CREATED EXPENDITURE:', expenditure);
    results.push(expenditure);
  })
  .on('end', () => {
    console.log('\n=== AMAZON PARSING COMPLETE ===');
    console.log('Total lines processed:', lineNumber);
    console.log('Valid expenditures found:', results.length);
    console.log('Rows skipped:', skippedRows.length);

    if (skippedRows.length > 0) {
      console.log('\n📋 Skipped rows summary:');
      skippedRows.forEach(row => {
        console.log(`Line ${row.line}: ${row.reason}`);
      });
    }

    if (results.length > 0) {
      console.log('\n💰 Sample of parsed expenditures:');
      results.slice(0, 5).forEach((exp, i) => {
        console.log(`${i + 1}. ${exp.date} - $${exp.amount.toFixed(2)} - ${exp.category} - ${exp.description.substring(0, 50)}${exp.description.length > 50 ? '...' : ''}`);
      });

      if (results.length > 5) {
        console.log(`... and ${results.length - 5} more`);
      }

      // Calculate summary statistics
      const totalSpent = results.reduce((sum, exp) => sum + exp.amount, 0);
      const avgOrder = totalSpent / results.length;
      const categories = [...new Set(results.map(exp => exp.category))];

      console.log('\n📈 AMAZON ANALYSIS SUMMARY:');
      console.log(`- Total orders: ${results.length}`);
      console.log(`- Total spent: $${totalSpent.toFixed(2)}`);
      console.log(`- Average order: $${avgOrder.toFixed(2)}`);
      console.log(`- Categories found: ${categories.join(', ')}`);
      console.log(`- Date range: ${results[results.length - 1].date} to ${results[0].date}`);
    }

    console.log('\n📈 FINAL STATISTICS:');
    console.log(`- Total lines: ${lineNumber}`);
    console.log(`- Header rows skipped: 1`);
    console.log(`- Invalid rows skipped: ${skippedRows.length}`);
    console.log(`- Valid transactions: ${results.length}`);
    console.log(`- Success rate: ${((results.length / (lineNumber - 1)) * 100).toFixed(1)}%`);

    if (results.length === 0) {
      console.log('\n❌ NO VALID EXPENDITURES FOUND - INVESTIGATION NEEDED');
      console.log('Possible issues:');
      console.log('- Column names don\'t match expected format');
      console.log('- Date format not recognized');
      console.log('- Amount parsing failed');
      console.log('- Data structure unexpected');
    } else {
      console.log('\n✅ AMAZON PARSING SUCCESSFUL!');
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. Download your actual Amazon Order History CSV');
      console.log('2. Replace sample data with real file path');
      console.log('3. Run: node amazon-test-parser.js');
      console.log('4. Integrate into server.js for web import');
    }
  })
  .on('error', (error) => {
    console.error('❌ AMAZON CSV PARSING ERROR:', error);
    console.error('Error details:', error.message);
  });
