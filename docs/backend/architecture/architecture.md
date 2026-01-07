# Express.js Architecture

## Server Setup

TSV Ledger uses Express.js with middleware-based architecture for handling requests, responses, and cross-cutting concerns.

### Basic Server Structure

```javascript
// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route setup
app.use('/api', require('./src/routes'));

// Navigation injection middleware
app.use(injectNavigation);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Middleware Architecture

- **Request processing**: Parse JSON, handle file uploads, validate inputs
- **Response handling**: Format responses, set headers, handle CORS
- **Cross-cutting concerns**: Logging, authentication, error handling
- **Business logic**: Route handlers, data processing, API responses

## Route Organization

Routes are organized in modular files under `src/routes/`.

```
src/routes/
├── index.js          # Main routes file
├── expenses.js       # Expense-related routes
├── analytics.js      # Analytics routes
├── amazon.js         # Amazon integration routes
└── users.js          # User management routes
```

### Route Module Structure

```javascript
// src/routes/expenses.js
const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');
const { validateExpense } = require('../middleware/validation');

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const filters = req.query;
    const expenses = await expenseService.getExpenses(filters);
    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses
router.post('/', validateExpense, async (req, res, next) => {
  try {
    const expenseData = req.body;
    const newExpense = await expenseService.createExpense(expenseData);
    res.status(201).json({
      success: true,
      data: newExpense
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id
router.put('/:id', validateExpense, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedExpense = await expenseService.updateExpense(id, updateData);
    res.json({
      success: true,
      data: updatedExpense
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await expenseService.deleteExpense(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## Error Handling

### Centralized Error Handling

```javascript
// middleware/errorHandler.js
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.errors
    });
  }

  // Duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
```

### Async Error Handling

```javascript
// middleware/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// Usage in routes
router.get('/', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json({ success: true, data });
}));
```

## Configuration Management

### Environment-Based Configuration

```javascript
// config/index.js
const config = {
  development: {
    port: 3000,
    database: './data/expenditures.json',
    logLevel: 'debug'
  },
  production: {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_PATH || './data/expenditures.json',
    logLevel: 'info'
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
```

### Environment Variables

```javascript
// .env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/expenditures.json
LOG_LEVEL=debug
```

This architecture provides a solid foundation for scalable Express.js applications with proper separation of concerns, error handling, and configuration management.