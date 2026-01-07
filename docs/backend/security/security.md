# Security Best Practices

## Input Validation

Implement comprehensive input validation to prevent common security vulnerabilities.

### Input Sanitization
- **Sanitize inputs**: Remove dangerous characters and scripts
- **Type checking**: Validate data types and ranges
- **SQL injection prevention**: Use parameterized queries or ORM methods
- **XSS prevention**: Escape output and validate inputs

### Validation Examples

```javascript
// src/middleware/security.js
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
```

## Authentication & Authorization

### Secure Session Management
```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### Rate Limiting
```javascript
// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter
};
```

## Data Protection

### Encryption
```javascript
// src/utils/encryption.js
const crypto = require('crypto');

class Encryption {
  constructor(algorithm = 'aes-256-gcm') {
    this.algorithm = algorithm;
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  decrypt(encrypted, iv) {
    const decipher = crypto.createDecipher(this.algorithm, this.key);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Secure File Upload
```javascript
// src/middleware/secureUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const secureFileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'), false);
  }

  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('File too large'), false);
  }

  // Check filename for malicious patterns
  const maliciousPatterns = /(\.\.|\/|\\|\||<|>|:|"|\||\?|\*)/;
  if (maliciousPatterns.test(file.originalname)) {
    return cb(new Error('Invalid filename'), false);
  }

  cb(null, true);
};

const secureStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'secure');

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedName = basename.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = crypto.randomBytes(8).toString('hex');

    cb(null, `${sanitizedName}_${uniqueId}${ext}`);
  }
});

const secureUpload = multer({
  storage: secureStorage,
  fileFilter: secureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});
```

## Security Headers

### Helmet Configuration
```javascript
// src/middleware/helmet.js
const helmet = require('helmet');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

module.exports = securityHeaders;
```

## Environment Security

### Environment Variables
```javascript
// .env.example
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
DATABASE_URL=mongodb://localhost:27017/tsv-ledger
SESSION_SECRET=your-session-secret-here

# Security settings
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Security Checklist

- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive operations
- [ ] Passwords hashed with strong algorithm
- [ ] Rate limiting implemented
- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Sensitive data encrypted
- [ ] File uploads validated and secured
- [ ] Error messages don't leak information
- [ ] Dependencies regularly updated
- [ ] Security audits performed regularly