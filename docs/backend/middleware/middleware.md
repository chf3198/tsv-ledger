# Middleware Implementation

## Custom Middleware

Implement cross-cutting concerns as Express middleware to handle common functionality across routes.

### Validation Middleware

```javascript
// src/middleware/validation.js
const validateExpense = (req, res, next) => {
  const { description, amount, category } = req.body;
  const errors = [];

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    errors.push('Amount is required and must be a positive number');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
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

const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Valid ID parameter is required'
    });
  }

  next();
};

module.exports = {
  validateExpense,
  validateId
};
```

### Error Handling Middleware

```javascript
// src/middleware/errorHandler.js
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid resource ID'
    });
  }

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value for field: ${field}`
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

module.exports = errorHandler;
```

### Navigation Injection Middleware

```javascript
// src/middleware/navigation.js
const fs = require('fs');
const path = require('path');

const injectNavigation = (req, res, next) => {
  // Store original render function
  const originalRender = res.render;

  // Override render to inject navigation
  res.render = function(view, options = {}) {
    try {
      // Read navigation component
      const navigationPath = path.join(__dirname, '..', '..', 'public', 'components', 'navigation', 'navigation.html');
      const navigation = fs.readFileSync(navigationPath, 'utf8');

      // Add navigation to options
      options.navigation = navigation;

      // Call original render
      return originalRender.call(this, view, options);
    } catch (error) {
      console.error('Navigation injection failed:', error);
      // Fallback to original render
      return originalRender.call(this, view, options);
    }
  };

  next();
};

module.exports = injectNavigation;
```

## File Upload Handling

### Multer Configuration

Handle file uploads with proper validation and security.

```javascript
// src/middleware/upload.js
const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'data', 'temp-uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow CSV and ZIP files
  const allowedTypes = ['text/csv', 'application/zip', 'application/x-zip-compressed'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and ZIP files are allowed.'), false);
  }
};

// Upload limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 1
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Export middleware
module.exports = {
  single: (fieldName) => upload.single(fieldName),
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields)
};
```

### Middleware Best Practices

- **Order Matters**: Apply middleware in the correct order (security, logging, parsing, validation, business logic)
- **Error Handling**: Always include error handling middleware at the end
- **Performance**: Keep middleware lightweight and efficient
- **Security**: Validate input, sanitize data, implement rate limiting
- **Testing**: Unit test middleware functions independently
- **Documentation**: Document middleware purpose and usage

### Common Middleware Patterns

#### Authentication Middleware
```javascript
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
```

#### Logging Middleware
```javascript
const logger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
```

#### CORS Middleware
```javascript
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};
```