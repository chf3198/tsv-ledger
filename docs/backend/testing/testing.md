# Testing Backend Components

## Unit Testing Services

Test individual service methods in isolation to ensure business logic correctness.

```javascript
// tests/unit/services/expenseService.test.js
const ExpenseService = require('../../../src/services/expenseService');

describe('ExpenseService', () => {
  let service;

  beforeEach(() => {
    service = new ExpenseService();
  });

  describe('createExpense', () => {
    test('should create valid expense', async () => {
      const expenseData = {
        description: 'Test expense',
        amount: 25.50,
        category: 'Food'
      };

      const result = await service.createExpense(expenseData);

      expect(result).toHaveProperty('id');
      expect(result.description).toBe('Test expense');
      expect(result.amount).toBe(25.50);
      expect(result.category).toBe('Food & Dining'); // Standardized
    });

    test('should reject invalid expense data', async () => {
      const invalidData = {
        description: '',
        amount: -10,
        category: 'Food'
      };

      await expect(service.createExpense(invalidData)).rejects.toThrow('Description is required');
    });
  });

  describe('standardizeCategory', () => {
    test('should standardize food categories', () => {
      expect(service.standardizeCategory('food')).toBe('Food & Dining');
      expect(service.standardizeCategory('groceries')).toBe('Food & Dining');
      expect(service.standardizeCategory('restaurant')).toBe('Food & Dining');
    });

    test('should return original category if not mapped', () => {
      expect(service.standardizeCategory('Electronics')).toBe('Electronics');
    });
  });
});
```

## Integration Testing Routes

Test complete request/response cycles including middleware and database interactions.

```javascript
// tests/integration/routes/expenses.test.js
const request = require('supertest');
const app = require('../../../server');

describe('Expense Routes', () => {
  describe('GET /api/expenses', () => {
    test('should return expenses array', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/expenses?category=Food')
        .expect(200);

      const foodExpenses = response.body.data.filter(e => e.category === 'Food');
      expect(response.body.data.length).toBe(foodExpenses.length);
    });
  });

  describe('POST /api/expenses', () => {
    test('should create new expense', async () => {
      const expenseData = {
        description: 'Integration test expense',
        amount: 15.75,
        category: 'Test'
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.description).toBe(expenseData.description);
    });

    test('should reject invalid data', async () => {
      const invalidData = {
        description: '',
        amount: 'invalid',
        category: ''
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
```

## Middleware Testing

Test custom middleware functions independently.

```javascript
// tests/unit/middleware/validation.test.js
const { validateExpense, validateId } = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('validateExpense', () => {
    test('should call next for valid expense data', () => {
      mockReq.body = {
        description: 'Valid expense',
        amount: 25.50,
        category: 'Food'
      };

      validateExpense(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should return 400 for missing description', () => {
      mockReq.body = {
        amount: 25.50,
        category: 'Food'
      };

      validateExpense(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateId', () => {
    test('should call next for valid ID', () => {
      mockReq.params = { id: '123' };

      validateId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 400 for invalid ID', () => {
      mockReq.params = { id: 'abc' };

      validateId(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid ID parameter is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
```

## Database Testing

Test database operations with test isolation.

```javascript
// tests/unit/database.test.js
const Database = require('../../src/database');

describe('Database', () => {
  let db;

  beforeEach(() => {
    // Use test database
    process.env.TEST_DB = 'true';
    db = new Database();
  });

  afterEach(async () => {
    // Clean up test data
    await db.clearAll();
  });

  describe('addExpense', () => {
    test('should add expense and return with ID', async () => {
      const expense = {
        description: 'Test expense',
        amount: 10.00,
        category: 'Test'
      };

      const result = await db.addExpense(expense);

      expect(result).toHaveProperty('id');
      expect(result.description).toBe(expense.description);
      expect(result.amount).toBe(expense.amount);
    });
  });

  describe('getExpenses', () => {
    test('should return all expenses', async () => {
      const expense1 = { description: 'Expense 1', amount: 10, category: 'A' };
      const expense2 = { description: 'Expense 2', amount: 20, category: 'B' };

      await db.addExpense(expense1);
      await db.addExpense(expense2);

      const expenses = await db.getExpenses();

      expect(expenses).toHaveLength(2);
      expect(expenses[0].description).toBe('Expense 1');
      expect(expenses[1].description).toBe('Expense 2');
    });

    test('should filter by category', async () => {
      const expense1 = { description: 'Food expense', amount: 10, category: 'Food' };
      const expense2 = { description: 'Gas expense', amount: 20, category: 'Transportation' };

      await db.addExpense(expense1);
      await db.addExpense(expense2);

      const foodExpenses = await db.getExpenses({ category: 'Food' });

      expect(foodExpenses).toHaveLength(1);
      expect(foodExpenses[0].category).toBe('Food');
    });
  });
});
```

## Test Coverage

### Coverage Goals
- **Unit Tests**: 80%+ coverage for service and utility functions
- **Integration Tests**: Cover all API endpoints and middleware
- **Error Scenarios**: Test error conditions and edge cases

### Coverage Configuration
```javascript
