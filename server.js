const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { getAllExpenditures, addExpenditure } = require('./database');

const app = express();
const port = 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// POST /api/import-csv - Import expenditures from CSV file
app.post('/api/import-csv', (req, res) => {
  const csvData = req.body.csvData;
  if (!csvData) {
    return res.status(400).json({ error: 'No CSV data provided' });
  }

  const results = [];
  const errors = [];

  // Parse CSV data
  const csvStream = require('stream').Readable.from(csvData);
  csvStream
    .pipe(csv())
    .on('data', (data) => {
      // Try to map CSV columns to our expenditure format
      // This is a basic implementation - we'll make it smarter based on your CSV format
      const expenditure = {
        date: data.Date || data.date || data['Transaction Date'] || new Date().toISOString().split('T')[0],
        amount: parseFloat(data.Amount || data.amount || data['Transaction Amount'] || 0),
        category: data.Category || data.category || 'supplies restocking', // Default category
        description: data.Description || data.description || data['Transaction Description'] || 'Imported from CSV'
      };

      if (expenditure.amount !== 0) {
        results.push(expenditure);
      }
    })
    .on('end', () => {
      // Import all valid expenditures
      let importedCount = 0;
      let processedCount = 0;

      if (results.length === 0) {
        return res.json({ message: 'No valid expenditures found in CSV', imported: 0, errors });
      }

      results.forEach((expenditure) => {
        addExpenditure(expenditure, (err) => {
          processedCount++;
          if (!err) {
            importedCount++;
          } else {
            errors.push(`Failed to import: ${expenditure.description}`);
          }

          // Send response when all items are processed
          if (processedCount === results.length) {
            res.json({
              message: `Imported ${importedCount} expenditures from CSV`,
              imported: importedCount,
              errors: errors
            });
          }
        });
      });
    })
    .on('error', (error) => {
      res.status(500).json({ error: 'Failed to parse CSV', details: error.message });
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
