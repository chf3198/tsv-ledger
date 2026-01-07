# Database Operations

## JSON File Storage

TSV Ledger uses JSON files for data persistence with test isolation and caching.

### Database Module Structure

```javascript
// src/database.js
const fs = require('fs').promises;
const path = require('path');

class Database {
  constructor(fileName = 'expenditures.json') {
    this.fileName = fileName;
    this.testDb = process.env.TEST_DB;
    this.filePath = this.testDb || path.join(__dirname, '..', 'data', fileName);
    this.data = null;
    this.cache = new Map();
  }

  async loadData() {
    if (this.data) return this.data;

    try {
      const fileContent = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.data = { expenses: [], categories: [] };
        await this.saveData();
      } else {
        throw error;
      }
    }
    return this.data;
  }

  async saveData() {
    if (!this.data) return;
    const dirPath = path.dirname(this.filePath);
    await fs.mkdir(dirPath, { recursive: true });
    const jsonData = JSON.stringify(this.data, null, 2);
    await fs.writeFile(this.filePath, jsonData, 'utf8');
  }

  async getExpenses(filters = {}) {
    const data = await this.loadData();
    let expenses = [...data.expenses];

    // Apply filters
    if (filters.category) {
      expenses = expenses.filter(e => e.category === filters.category);
    }
    if (filters.dateFrom) {
      expenses = expenses.filter(e => e.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      expenses = expenses.filter(e => e.date <= filters.dateTo);
    }

    return expenses;
  }

  async addExpense(expense) {
    const data = await this.loadData();
    const newExpense = {
      id: Date.now().toString(),
      ...expense,
      createdAt: new Date().toISOString()
    };
    data.expenses.push(newExpense);
    await this.saveData();
    return newExpense;
  }

  async updateExpense(id, updates) {
    const data = await this.loadData();
    const index = data.expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Expense not found');

    data.expenses[index] = {
      ...data.expenses[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveData();
    return data.expenses[index];
  }

  async deleteExpense(id) {
    const data = await this.loadData();
    const index = data.expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Expense not found');

    const deletedExpense = data.expenses.splice(index, 1)[0];
    await this.saveData();
    return deletedExpense;
  }
}

module.exports = Database;
```

### Test Isolation

- **TEST_DB environment variable**: Use separate test database files
- **Automatic cleanup**: Test data doesn't affect production data
- **Parallel testing**: Tests can run concurrently without conflicts

```javascript
// Test setup
process.env.TEST_DB = path.join(__dirname, 'test-data', 'test-expenditures.json');

// Test cleanup
afterAll(async () => {
  try {
    await fs.unlink(process.env.TEST_DB);
  } catch (error) {
    // File may not exist, ignore
  }
});
```

## CRUD Operations

### Create Operations
```javascript
const expenseService = require('../services/expenseService');

router.post('/api/expenses', async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

### Read Operations
```javascript
router.get('/api/expenses', async (req, res) => {
  try {
    const filters = req.query;
    const expenses = await expenseService.getExpenses(filters);
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Update Operations
```javascript
router.put('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    res.json({ success: true, data: expense });
  } catch (error) {
    if (error.message === 'Expense not found') {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});
```

### Delete Operations
```javascript
router.delete('/api/expenses/:id', async (req, res) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Expense not found') {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});
```

## Data Validation

### Schema Validation
```javascript
const validateExpense = (expense) => {
  const required = ['description', 'amount', 'category'];
  const missing = required.filter(field => !expense[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (typeof expense.amount !== 'number' || expense.amount <= 0) {
    throw new Error('Amount must be a positive number');
