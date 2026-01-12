---
applyTo: "src/**/*.js"
---

# Backend Development Instructions

## File Location Rules

| Type           | Location                          | Example                  |
| -------------- | --------------------------------- | ------------------------ |
| Route handlers | `src/routes/`                     | `src/routes/amazon.js`   |
| Business logic | `src/`                            | `src/tsv-categorizer.js` |
| Database ops   | `src/database.js`                 | All CRUD here            |
| Parsers        | `src/amazon-integration/parsers/` | `order-parser.js`        |

## Code Patterns

### ✅ DO:

```javascript
// Use async/await
async function getData() {
  const result = await database.getExpenses();
  return result;
}

// Export functions properly
module.exports = { getData, saveData };

// Use descriptive error handling
try {
  await operation();
} catch (error) {
  console.error("Operation failed:", error.message);
  throw error;
}
```

### ❌ DON'T:

```javascript
// Don't use callbacks
getData(function (err, data) {}); // BAD

// Don't mix module systems
import x from "x"; // BAD - use require()

// Don't catch and swallow errors
try {
} catch (e) {} // BAD - always handle
```

## Database Operations

**ALL database operations go through `src/database.js`**

```javascript
const db = require("./database");

// Read
const expenses = await db.getExpenses();

// Write
await db.addExpense(newExpense);

// Update
await db.updateExpense(id, updates);

// Delete
await db.deleteExpense(id);
```

## Route Handler Pattern

```javascript
// src/routes/example.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// GET /api/example
router.get("/", async (req, res) => {
  try {
    const data = await db.getData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

## File Size Limit

**Maximum 300 lines per file**

If approaching limit:

1. Extract helper functions to separate module
2. Split route handlers into feature-specific files
3. Move constants to config file

## Testing Requirements

Every `src/*.js` file must have corresponding test:

- `src/database.js` → `tests/unit/database.test.js`
- `src/routes/amazon.js` → `tests/integration/amazon.test.js`

## Common Errors

| Error                | Cause          | Fix                                   |
| -------------------- | -------------- | ------------------------------------- |
| `Cannot find module` | Wrong path     | Check relative path from current file |
| `is not a function`  | Missing export | Add to `module.exports`               |
| `ENOENT`             | File not found | Verify `data/` directory exists       |

## Related Instructions

| Topic              | File                                                     |
| ------------------ | -------------------------------------------------------- |
| Testing patterns   | [tests.instructions.md](tests.instructions.md)           |
| Amazon integration | [amazon.instructions.md](amazon.instructions.md)         |
| Full guidelines    | [../copilot-instructions.md](../copilot-instructions.md) |
| Quick start        | [../../AGENTS.md](../../AGENTS.md)                       |
