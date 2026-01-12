---
applyTo: "src/amazon-integration/**/*.js,src/routes/amazon.js,**/amazon*.js"
---

# Amazon Integration Instructions

## Architecture

```
src/amazon-integration/
├── amazon-zip-extractor.js   # ZIP file extraction
├── amazon-zip-processor.js   # Orchestrates parsing
└── parsers/
    ├── order-parser.js       # Order history parsing
    ├── cart-parser.js        # Cart/wishlist parsing
    ├── subscription-parser.js # Subscribe & Save
    └── returns-parser.js     # Returns/refunds
```

## API Endpoints

| Endpoint                     | Method | Purpose                |
| ---------------------------- | ------ | ---------------------- |
| `/api/amazon-zip-import`     | POST   | Upload ZIP file        |
| `/api/validate-amazon-zip`   | POST   | Validate before import |
| `/api/amazon-items`          | GET    | List imported items    |
| `/api/amazon-items/:id/edit` | POST   | Edit item details      |

## ZIP File Processing

```javascript
// The ZIP extractor uses system `unzip` command
// Extracts to: data/temp-extract-{timestamp}/

const extractor = require("./amazon-zip-extractor");
const result = await extractor.extract(zipFilePath);
// Returns: { files: [...], extractPath: '...' }
```

## Parser Pattern

```javascript
// Each parser follows same interface
class OrderParser {
  parse(csvContent) {
    // Returns array of parsed items
    return items;
  }

  validateRow(row) {
    // Returns boolean
  }

  transformRow(row) {
    // Returns normalized object
  }
}
```

## Data Flow

1. User uploads ZIP → `/api/amazon-zip-import`
2. `amazon-zip-extractor.js` extracts files
3. `amazon-zip-processor.js` identifies file types
4. Appropriate parser processes each file
5. Results saved via `database.js`
6. Temp files cleaned up

## ✅ DO:

- Validate ZIP contents before processing
- Clean up temp directories after extraction
- Handle malformed CSV gracefully
- Log parsing errors with file context
- Support multiple date formats

## ❌ DON'T:

- Leave temp directories after processing
- Assume CSV column order
- Skip validation of required fields
- Process files synchronously (use async)

## Common CSV Fields

### Orders:

- `Order ID` - Amazon order identifier
- `Order Date` - Purchase date
- `Total Charged` - Amount (with $ symbol)
- `Shipping Address` - Delivery location

### Items:

- `ASIN` - Amazon product ID
- `Title` - Product name
- `Unit Price` - Per-item cost
- `Quantity` - Number purchased
- `Category` - Amazon category

## Error Handling

```javascript
try {
  const items = parser.parse(csvContent);
} catch (error) {
  if (error.message.includes("Invalid CSV")) {
    // Handle malformed file
  } else if (error.message.includes("Missing column")) {
    // Handle schema mismatch
  }
  throw error; // Re-throw for caller
}
```

## Testing Amazon Integration

```bash
# Unit tests for parsers
npx jest tests/unit/amazon-integration/

# Integration test for upload
npx jest tests/integration/amazon.test.js

# Test with sample data
# Use: tests/fixtures/amazon-test-data.zip
```

## Related Instructions

| Topic            | File                                                     |
| ---------------- | -------------------------------------------------------- |
| Backend patterns | [src.instructions.md](src.instructions.md)               |
| Test patterns    | [tests.instructions.md](tests.instructions.md)           |
| Full guidelines  | [../copilot-instructions.md](../copilot-instructions.md) |
| Quick start      | [../../AGENTS.md](../../AGENTS.md)                       |
