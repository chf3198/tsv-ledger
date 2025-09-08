const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Test script for parsing Bank of America stmttab.dat file
console.log('=== TSV LEDGER - BANK OF AMERICA DATA TEST ===\n');

// Read the data file
const dataFile = path.join(__dirname, 'stmttab.dat');

if (!fs.existsSync(dataFile)) {
  console.error('❌ stmttab.dat file not found!');
  process.exit(1);
}

console.log('📁 Reading stmttab.dat file...');
const csvData = fs.readFileSync(dataFile, 'utf8');

console.log('📊 Data Analysis:');
console.log('- Total characters:', csvData.length);
console.log('- Contains tabs:', csvData.includes('\t'));
console.log('- Contains commas:', csvData.includes(','));
console.log('- Total lines:', csvData.split('\n').length);

console.log('\n🔍 First 10 lines preview:');
csvData.split('\n').slice(0, 10).forEach((line, i) => {
  console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
});

console.log('\n🚀 Starting Parse Test...\n');

const results = [];
const errors = [];
const skippedRows = [];

// Parse CSV/TSV data (handle both comma and tab delimiters)
const csvStream = require('stream').Readable.from(csvData);
let lineNumber = 0;
const separator = csvData.includes('\t') ? '\t' : ',';

console.log(`Using separator: ${separator === '\t' ? 'TAB' : 'COMMA'}\n`);

csvStream
  .pipe(csv({
    separator: separator,
    skipEmptyLines: true
  }))
  .on('data', (data) => {
    lineNumber++;
    console.log(`\n=== LINE ${lineNumber} ===`);
    console.log('Raw data keys:', Object.keys(data));
    console.log('Raw data values:', Object.values(data));

    // Skip the first 5 summary rows that have different column structure
    if (lineNumber <= 5) {
      console.log(`⏭️  SKIPPING SUMMARY ROW ${lineNumber}`);
      skippedRows.push({ line: lineNumber, reason: 'summary row', data: data });
      return;
    }

    // Check if this row has a valid date
    // For Bank of America format: Date is in 'Description' column, Description is in '' column
    const dateValue = data.Date || data.date || data['Transaction Date'] || data['Description'];
    console.log('Date value found:', dateValue);

    if (!dateValue || dateValue.trim() === '') {
      console.log(`❌ SKIPPING: No date field`);
      skippedRows.push({ line: lineNumber, reason: 'no date field', data: data });
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue.trim())) {
      console.log(`❌ SKIPPING: Invalid date format: "${dateValue}"`);
      skippedRows.push({ line: lineNumber, reason: 'invalid date format', data: data });
      return;
    }

    // Try to extract amount
    const amountValue = data.Amount || data.amount || data['Transaction Amount'] || data['Summary Amt.'];
    console.log('Amount value found:', amountValue);

    const cleanAmount = amountValue ? amountValue.toString().replace(/"/g, '').trim() : '0';
    const parsedAmount = parseFloat(cleanAmount);

    console.log('Clean amount:', cleanAmount);
    console.log('Parsed amount:', parsedAmount);

    if (isNaN(parsedAmount) || parsedAmount === 0) {
      console.log(`❌ SKIPPING: Invalid amount: "${amountValue}" -> ${parsedAmount}`);
      skippedRows.push({ line: lineNumber, reason: 'invalid amount', data: data });
      return;
    }

    // Try to extract description
    // For Bank of America format: Description is in the empty column ''
    const descValue = data[''] || data.Description || data.description || data['Transaction Description'];
    console.log('Description value found:', descValue);

    // Create expenditure object
    const expenditure = {
      date: dateValue.trim(),
      amount: parsedAmount,
      category: data.Category || data.category || 'supplies restocking',
      description: descValue ? descValue.toString().replace(/"/g, '').trim() : 'Imported from data file'
    };

    console.log('✅ CREATED EXPENDITURE:', expenditure);
    results.push(expenditure);
  })
  .on('end', () => {
    console.log('\n=== PARSING COMPLETE ===');
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
        console.log(`${i + 1}. ${exp.date} - $${exp.amount} - ${exp.description.substring(0, 50)}${exp.description.length > 50 ? '...' : ''}`);
      });

      if (results.length > 5) {
        console.log(`... and ${results.length - 5} more`);
      }
    }

    console.log('\n📈 FINAL STATISTICS:');
    console.log(`- Total lines: ${lineNumber}`);
    console.log(`- Summary rows skipped: ${skippedRows.filter(r => r.reason === 'summary row').length}`);
    console.log(`- Invalid rows skipped: ${skippedRows.filter(r => r.reason !== 'summary row').length}`);
    console.log(`- Valid transactions: ${results.length}`);
    console.log(`- Success rate: ${((results.length / (lineNumber - 5)) * 100).toFixed(1)}%`);

    if (results.length === 0) {
      console.log('\n❌ NO VALID EXPENDITURES FOUND - INVESTIGATION NEEDED');
      console.log('Possible issues:');
      console.log('- Column mapping incorrect');
      console.log('- Date format not recognized');
      console.log('- Amount parsing failed');
      console.log('- Data structure unexpected');
    } else {
      console.log('\n✅ PARSING SUCCESSFUL!');
    }
  })
  .on('error', (error) => {
    console.error('❌ CSV PARSING ERROR:', error);
    console.error('Error details:', error.message);
  });
