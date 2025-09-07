#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Read the full Amazon CSV file
const csvFilePath = path.join(__dirname, 'amazon_order_history.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');

console.log('Starting full Amazon order history import...');
console.log(`Total CSV file size: ${csvData.length} characters`);
console.log(`Total lines: ${csvData.split('\n').length}`);

// Send to the API
const postData = JSON.stringify({
  csvData: csvData
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/import-csv',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`\nAPI Response Status: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n🎉 Import Response:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(`✅ Successfully imported: ${parsed.imported} expenditures`);
      console.log(`📊 Total processed: ${parsed.totalProcessed}`);
      console.log(`⏭️  Rows skipped: ${parsed.skipped}`);
      console.log(`❌ Errors: ${parsed.errors.length}`);
      
      if (parsed.errors.length > 0) {
        console.log('\nError details:');
        parsed.errors.forEach(error => console.log(`  - ${error}`));
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

console.log('📤 Sending import request...');
req.write(postData);
req.end();
