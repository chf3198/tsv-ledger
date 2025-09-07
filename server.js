const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { getAllExpenditures, addExpenditure } = require('./database');

const app = express();
const port = 3000;

// Middleware for parsing JSON and URL-encoded data (with increased limits for CSV files)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// GET /api/expenditures - Retrieve all expenditures
app.get('/api/expenditures', (req, res) => {
  getAllExpenditures((err, expenditures) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch expenditures' });
    } else {
      res.json(expenditures);
    }
  });
});

// POST /api/expenditures - Add a new expenditure
app.post('/api/expenditures', (req, res) => {
  const { date, amount, category, description } = req.body;
  const expenditure = {
    date,
    amount: parseFloat(amount),
    category,
    description
  };

  addExpenditure(expenditure, (err, newExpenditure) => {
    if (err) {
      res.status(500).json({ error: 'Failed to add expenditure' });
    } else {
      res.status(201).json({ message: 'Expenditure added successfully', expenditure: newExpenditure });
    }
  });
});

// POST /api/import-csv - Import expenditures from CSV/TSV/DAT file
app.post('/api/import-csv', (req, res) => {
  console.log('=== IMPORT REQUEST RECEIVED ===');
  console.log('Request body size:', req.body ? JSON.stringify(req.body).length : 'N/A');

  const csvData = req.body.csvData;
  if (!csvData) {
    console.log('ERROR: No csvData in request body');
    return res.status(400).json({ error: 'No data file provided' });
  }

  console.log('CSV Data length:', csvData.length);
  console.log('First 200 chars of data:', csvData.substring(0, 200));
  console.log('Contains tabs?', csvData.includes('\t'));
  console.log('Contains commas?', csvData.includes(','));

  const results = [];
  const errors = [];
  const skippedRows = [];

  // Parse CSV/TSV data (handle both comma and tab delimiters)
  const csvStream = require('stream').Readable.from(csvData);
  let lineNumber = 0;
  const separator = csvData.includes('\t') ? '\t' : ',';

  console.log('Using separator:', separator === '\t' ? 'TAB' : 'COMMA');

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

      // Detect file format based on column headers
      const isAmazonFormat = data.hasOwnProperty('order id') || data.hasOwnProperty('Order ID') || data.hasOwnProperty('date');
      const isBankFormat = data.hasOwnProperty('Description') && data.hasOwnProperty('') && data.hasOwnProperty('Amount');

      console.log('Format detection - Amazon:', isAmazonFormat, 'Bank:', isBankFormat);

      let dateValue, amountValue, descValue, expenditure;

      if (isAmazonFormat) {
        // Amazon CSV format handling
        console.log('🛒 Processing Amazon order data');
        
        // Skip if no date or total
        dateValue = data.date || data.Date;
        const totalValue = data.total || data.Total;
        
        if (!dateValue || !totalValue || dateValue.trim() === '' || totalValue.trim() === '') {
          console.log(`❌ SKIPPING: Missing Amazon date or total`);
          skippedRows.push({ line: lineNumber, reason: 'missing Amazon date/total', data: data });
          return;
        }

        // Skip orders with pending dates or zero amounts
        if (dateValue.trim() === 'pending' || totalValue.trim() === '0' || totalValue.trim() === '') {
          console.log(`❌ SKIPPING: Pending or zero amount order`);
          skippedRows.push({ line: lineNumber, reason: 'pending or zero amount order', data: data });
          return;
        }

        // Convert Amazon date format (YYYY-MM-DD) to MM/DD/YYYY
        const amazonDate = dateValue.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(amazonDate)) {
          console.log(`❌ SKIPPING: Invalid Amazon date format: "${amazonDate}"`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon date format', data: data });
          return;
        }

        const [year, month, day] = amazonDate.split('-');
        const formattedDate = `${month}/${day}/${year}`;

        // Parse amount
        const cleanAmount = totalValue.toString().replace(/[^\d.-]/g, '').trim();
        const parsedAmount = parseFloat(cleanAmount);

        if (isNaN(parsedAmount) || parsedAmount === 0) {
          console.log(`❌ SKIPPING: Invalid Amazon amount: "${totalValue}" -> ${parsedAmount}`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon amount', data: data });
          return;
        }

        // Create description from items (truncate if too long)
        const items = data.items || data.Items || '';
        const truncatedItems = items.length > 100 ? items.substring(0, 97) + '...' : items;
        const orderId = data['order id'] || data['Order ID'] || '';
        
        expenditure = {
          date: formattedDate,
          amount: -Math.abs(parsedAmount), // Amazon purchases are negative expenditures
          category: 'supplies restocking',
          description: `Amazon Order ${orderId}: ${truncatedItems}`.trim()
        };

      } else {
        // Bank of America format handling (existing logic)
        console.log('🏦 Processing Bank data');
        
        // Skip the first 5 summary rows that have different column structure
        if (lineNumber <= 5) {
          console.log(`⏭️  SKIPPING SUMMARY ROW ${lineNumber}`);
          skippedRows.push({ line: lineNumber, reason: 'summary row', data: data });
          return;
        }

        // Check if this row has a valid date
        // For Bank of America format: Date is in 'Description' column, Description is in '' column
        dateValue = data.Date || data.date || data['Transaction Date'] || data['Description'];
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
        amountValue = data.Amount || data.amount || data['Transaction Amount'] || data['Summary Amt.'];
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
        descValue = data[''] || data.Description || data.description || data['Transaction Description'];
        console.log('Description value found:', descValue);

        // Create expenditure object
        expenditure = {
          date: dateValue.trim(),
          amount: parsedAmount,
          category: data.Category || data.category || 'supplies restocking',
          description: descValue ? descValue.toString().replace(/"/g, '').trim() : 'Imported from data file'
        };
      }

      console.log('✅ CREATED EXPENDITURE:', expenditure);
      results.push(expenditure);
    })
    .on('end', () => {
      console.log('\n=== PARSING COMPLETE ===');
      console.log('Total lines processed:', lineNumber);
      console.log('Valid expenditures found:', results.length);
      console.log('Rows skipped:', skippedRows.length);

      if (skippedRows.length > 0) {
        console.log('\nSkipped rows summary:');
        skippedRows.forEach(row => {
          console.log(`Line ${row.line}: ${row.reason}`);
        });
      }

      // Import all valid expenditures
      let importedCount = 0;
      let processedCount = 0;

      if (results.length === 0) {
        console.log('❌ NO VALID EXPENDITURES FOUND');
        return res.json({
          message: 'No valid expenditures found in data file',
          imported: 0,
          errors: errors,
          skipped: skippedRows.length,
          totalLines: lineNumber
        });
      }

      console.log('🚀 STARTING DATABASE IMPORT...');

      results.forEach((expenditure) => {
        addExpenditure(expenditure, (err) => {
          processedCount++;
          if (!err) {
            importedCount++;
            console.log(`✅ Imported: ${expenditure.description} - $${expenditure.amount}`);
          } else {
            const errorMsg = `Failed to import: ${expenditure.description} - ${err.message}`;
            errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
          }

          // Send response when all items are processed
          if (processedCount === results.length) {
            console.log('\n=== IMPORT COMPLETE ===');
            console.log(`Successfully imported: ${importedCount}/${results.length}`);
            console.log(`Errors: ${errors.length}`);

            res.json({
              message: `Imported ${importedCount} expenditures from data file`,
              imported: importedCount,
              totalProcessed: results.length,
              errors: errors,
              skipped: skippedRows.length,
              totalLines: lineNumber
            });
          }
        });
      });
    })
    .on('error', (error) => {
      console.error('❌ CSV PARSING ERROR:', error);
      res.status(500).json({
        error: 'Failed to parse data file',
        details: error.message,
        totalLines: lineNumber
      });
    });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`TSV Ledger server running at http://localhost:${port}`);
});
