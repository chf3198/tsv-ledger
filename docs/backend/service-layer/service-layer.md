# Service Layer Architecture

## Business Logic Separation

Services contain business logic separate from route handlers, promoting clean architecture and testability.

### Service Layer Structure

```
src/services/
├── expenseService.js     # Expense business logic
├── analyticsService.js   # Analytics calculations
├── amazonService.js      # Amazon data processing
└── userService.js        # User management logic
```

### Service Example

```javascript
// src/services/expenseService.js
const Database = require('../database');

class ExpenseService {
  constructor() {
    this.db = new Database();
  }

  async getExpenses(filters = {}) {
    return this.db.getExpenses(filters);
  }

  async createExpense(expenseData) {
    // Business logic validation
    this.validateExpenseData(expenseData);

    // Category standardization
    expenseData.category = this.standardizeCategory(expenseData.category);

    // Amount formatting
    expenseData.amount = this.formatAmount(expenseData.amount);

    // Create expense
    return this.db.addExpense(expenseData);
  }

  async updateExpense(id, updateData) {
    // Validate update data
    this.validateUpdateData(updateData);

    // Apply business rules
    if (updateData.category) {
      updateData.category = this.standardizeCategory(updateData.category);
    }

    if (updateData.amount) {
      updateData.amount = this.formatAmount(updateData.amount);
    }

    return this.db.updateExpense(id, updateData);
  }

  async deleteExpense(id) {
    return this.db.deleteExpense(id);
  }

  validateExpenseData(data) {
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!data.category) {
      throw new Error('Category is required');
    }
  }

  validateUpdateData(data) {
    const allowedFields = ['description', 'amount', 'category', 'date'];
    const updateFields = Object.keys(data);

    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`);
    }
  }

  standardizeCategory(category) {
    // Standardize category names
    const categoryMap = {
      'food': 'Food & Dining',
      'groceries': 'Food & Dining',
      'restaurant': 'Food & Dining',
      'gas': 'Transportation',
      'fuel': 'Transportation',
      'utilities': 'Bills & Utilities',
      'electric': 'Bills & Utilities'
    };

    return categoryMap[category.toLowerCase()] || category;
  }

  formatAmount(amount) {
    // Ensure amount is a number with 2 decimal places
    return Math.round(parseFloat(amount) * 100) / 100;
  }
}

module.exports = ExpenseService;
```

### Service Layer Benefits

- **Separation of Concerns**: Business logic isolated from HTTP handling
- **Testability**: Services can be unit tested independently
- **Reusability**: Services can be used by multiple routes or external consumers
- **Maintainability**: Changes to business logic don't affect routing layer
- **Validation**: Centralized business rule validation
- **Data Transformation**: Consistent data formatting and standardization

### Service Patterns

#### Repository Pattern
Services often use repository pattern for data access abstraction.

#### Factory Pattern
Use factories for complex service instantiation with dependencies.

#### Strategy Pattern
Implement different algorithms for the same operation based on context.

### Error Handling in Services

Services should throw specific, meaningful errors that can be caught and handled appropriately by the calling layer.

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
```