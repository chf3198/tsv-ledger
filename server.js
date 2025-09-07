const express = require('express');
const path = require('path');
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

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`TSV Ledger server running at http://localhost:${port}`);
});
