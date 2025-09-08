#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the Amazon test sample CSV file
const csvFilePath = path.join(__dirname, 'amazon-test-sample.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Use the entire test sample (it's only 4 lines total)
const testData = csvData;

console.log('Testing Amazon CSV import...');
console.log('First few lines:');
console.log(testData);

// Send to the API
const postData = JSON.stringify({
  csvData: testData
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

const http = require('http');

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
