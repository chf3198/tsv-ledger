# API Design Patterns

## RESTful API Design

Follow REST principles with consistent resource naming and HTTP methods.

### Resource Naming Conventions

- **Plural nouns**: `/api/expenses`, `/api/users`
- **Hierarchical relationships**: `/api/users/:userId/expenses`
- **Actions**: `/api/expenses/:id/categorize`
- **Query parameters**: `/api/expenses?category=food&date=2024-01`

### HTTP Methods and Status Codes

```javascript
// GET - Retrieve resources (200 OK, 404 Not Found)
app.get('/api/expenses', getExpenses);
app.get('/api/expenses/:id', getExpenseById);

// POST - Create resources (201 Created, 400 Bad Request)
app.post('/api/expenses', createExpense);

// PUT - Update entire resource (200 OK, 404 Not Found)
app.put('/api/expenses/:id', updateExpense);

// PATCH - Partial updates (200 OK, 404 Not Found)
app.patch('/api/expenses/:id', partialUpdateExpense);

// DELETE - Remove resources (204 No Content, 404 Not Found)
app.delete('/api/expenses/:id', deleteExpense);
```

## Route Organization

Routes are organized in modular files under `src/routes/` for maintainability and scalability.

### Directory Structure

```
src/routes/
├── index.js          # Main routes file with middleware
├── expenses.js       # Expense CRUD operations
├── analytics.js      # AI analysis endpoints
├── amazon.js         # Amazon integration routes
├── reconciliation.js # Bank reconciliation routes
└── categories.js     # Category management routes
```

### Route Module Pattern

```javascript
// src/routes/expenses.js
const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');
const { validateExpense } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/expenses - List expenses with filtering
router.get('/', asyncHandler(async (req, res) => {
  const filters = req.query;
  const expenses = await expenseService.getExpenses(filters);

  res.json({
    success: true,
    data: expenses,
    count: expenses.length,
    filters: filters
  });
}));

// GET /api/expenses/:id - Get single expense
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await expenseService.getExpenseById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  res.json({
    success: true,
    data: expense
  });
}));

// POST /api/expenses - Create new expense
router.post('/', validateExpense, asyncHandler(async (req, res) => {
  const expenseData = req.body;
  const newExpense = await expenseService.createExpense(expenseData);

  res.status(201).json({
    success: true,
    data: newExpense,
    message: 'Expense created successfully'
  });
}));

// PUT /api/expenses/:id - Update entire expense
router.put('/:id', validateExpense, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const updatedExpense = await expenseService.updateExpense(id, updateData);

  res.json({
    success: true,
    data: updatedExpense,
    message: 'Expense updated successfully'
  });
}));

// PATCH /api/expenses/:id - Partial expense update
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partialData = req.body;
  const updatedExpense = await expenseService.patchExpense(id, partialData);

  res.json({
    success: true,
    data: updatedExpense,
    message: 'Expense updated successfully'
  });
}));

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await expenseService.deleteExpense(id);

  res.status(204).send();
}));

module.exports = router;
```

## Response Format Standards

### Success Response Structure

```json
{
  "success": true,
  "data": {
    // Response data - object, array, or primitive
  },
  "message": "Optional success message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Input Validation

### Request Validation Middleware

```javascript
// middleware/validation.js
const validateExpense = (req, res, next) => {
  const { description, amount, date, category } = req.body;
  const errors = [];

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount is required and must be a positive number');
  }

  if (!date || !isValidDate(date)) {
    errors.push('Valid date is required');
  }

  if (category && typeof category !== 'string') {
    errors.push('Category must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = { validateExpense };
```

## API Versioning

### URL Path Versioning

```
/api/v1/expenses
/api/v1/analytics
/api/v2/expenses  // Future version
```

### Header Versioning

```
Accept: application/vnd.tsv-ledger.v1+json
```

## Rate Limiting

### Basic Rate Limiting

```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = apiLimiter;
```

### Endpoint-Specific Limits

```javascript
// Different limits for different endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter limit for expensive operations
  message: 'Rate limit exceeded'
});

const lenientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // more lenient for read operations
  message: 'Rate limit exceeded'
});
```

This API design ensures consistency, maintainability, and scalability across the entire backend system.