# API Integration

## Amazon Data Endpoints

RESTful API endpoints for Amazon data import, processing, and management operations.

### File Upload Configuration

```javascript
// src/routes/amazon.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'data', 'amazon-uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'amazon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});
```

## Upload Endpoint

### POST /api/amazon/upload

Handles Amazon ZIP file uploads and processes the data into expense records.

```javascript
// POST /api/amazon/upload
router.post('/upload', upload.single('amazonData'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Extract ZIP file
    const extractor = new AmazonZipExtractor();
    const extractionResult = await extractor.extract(req.file.path);

    if (!extractionResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract ZIP file'
      });
    }

    // Process Amazon data
    const processor = new AmazonDataProcessor();
    const processingResult = await processor.processAmazonData(extractionResult.files);

    // Save expenses to database
    const db = new Database();
    let savedCount = 0;
    let errorCount = 0;

    for (const expense of processingResult.expenses) {
      try {
        await db.addExpense(expense);
        savedCount++;
      } catch (error) {
        console.error('Failed to save expense:', error);
        errorCount++;
      }
    }

    // Cleanup temporary files
    await extractor.cleanup();
    // Remove uploaded file
    const fs = require('fs').promises;
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        processed: processingResult.statistics,
        saved: savedCount,
        errors: errorCount,
        uploadId: req.file.filename
      }
    });

  } catch (error) {
    next(error);
  }
});
```

### Processing Flow

1. **File Validation**: Verify ZIP file format and size limits
2. **Secure Extraction**: Extract files to temporary directory with security checks
3. **Data Parsing**: Parse CSV files and validate data integrity
4. **Expense Generation**: Create standardized expense records
5. **Database Storage**: Save records with error handling
6. **Cleanup**: Remove temporary files and uploaded archives

## Status Endpoint

### GET /api/amazon/status/:uploadId

Retrieves processing status for uploaded Amazon data files.

```javascript
// GET /api/amazon/status/:uploadId
router.get('/status/:uploadId', async (req, res, next) => {
  try {
    const { uploadId } = req.params;

    // In a real implementation, you might store processing status
    // For now, return a generic status
    res.json({
      success: true,
      data: {
        uploadId,
        status: 'completed',
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});
```

## Data Retrieval Endpoints

### GET /api/amazon/expenses

Retrieves Amazon-sourced expense records with optional filtering.

```javascript
// GET /api/amazon/expenses
router.get('/expenses', async (req, res, next) => {
  try {
    const db = new Database();
    const filters = {
      ...req.query,
      source: 'amazon_integration'
    };

    const expenses = await db.getExpenses(filters);

    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });

  } catch (error) {
    next(error);
  }
});
```

### Query Parameters

- `startDate`: Filter expenses from this date (ISO format)
- `endDate`: Filter expenses until this date (ISO format)
- `category`: Filter by expense category
- `minAmount`: Minimum expense amount
- `maxAmount`: Maximum expense amount
- `limit`: Maximum number of results (default: 100)
- `offset`: Pagination offset (default: 0)

## Data Management Endpoints

### DELETE /api/amazon/expenses/:id

Removes specific Amazon expense records from the database.

```javascript
// DELETE /api/amazon/expenses/:id
router.delete('/expenses/:id', async (req, res, next) => {
  try {
    const db = new Database();
    const deletedExpense = await db.deleteExpense(req.params.id);

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        error: 'Amazon expense not found'
      });
    }

    res.json({
      success: true,
      data: deletedExpense
    });

  } catch (error) {
    next(error);
  }
});
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful operation
- **400 Bad Request**: Invalid request data or file format
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side processing error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description",
  "details": {
    "field": "specific field with error",
    "value": "problematic value"
  }
}
```

## Security Considerations

### File Upload Security
- **Type validation**: Only ZIP files accepted
- **Size limits**: 50MB maximum file size
- **Path sanitization**: Secure file naming and storage
- **Temporary cleanup**: Automatic removal of processing files

### Data Access Control
- **Authentication**: Require user authentication for all endpoints
- **Authorization**: Verify user permissions for data operations
- **Input validation**: Sanitize all query parameters and request data
- **Rate limiting**: Prevent abuse with request rate limits

## Performance Optimization

### Batch Processing
- **Database batching**: Group expense insertions for efficiency
- **Memory management**: Stream processing for large files
- **Concurrent limits**: Control simultaneous processing operations

### Caching Strategy
- **Status caching**: Cache processing status for quick retrieval
- **Result caching**: Cache frequently accessed expense data
- **Invalidation**: Proper cache invalidation on data changes

## Monitoring and Logging

### Request Logging
- **Access logs**: Record all API endpoint access
- **Error logs**: Detailed error information for debugging
- **Performance metrics**: Response times and throughput tracking

### Health Checks
- **Endpoint availability**: Monitor API endpoint responsiveness
- **Database connectivity**: Verify database connection health
- **File system access**: Check upload directory permissions