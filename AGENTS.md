# AGENTS.md - TSV Ledger AI Development Guide

## Project Overview

**TSV Ledger** is an advanced expense tracking and business intelligence platform for Texas Sunset Venues. It features comprehensive Amazon integration, AI-powered analysis, and a professional codebase organization.

**Version:** 2.2.3
**Main Entry:** `server.js`
**Tech Stack:** Node.js, Express.js, Bootstrap 5, JSON file storage

## Architecture Overview

### Core Modules
- `server.js` - Main Express server with REST API endpoints
- `src/database.js` - JSON file database operations
- `src/tsv-categorizer.js` - Business intelligence categorization engine
- `src/ai-analysis-engine.js` - AI-powered analysis and insights
- `public/index.html` - Main frontend application
- `public/js/app.js` - Client-side JavaScript for import handling

### Key Features
- Amazon order import and CRUD operations
- AI-powered expense categorization
- Employee benefits filtering
- Subscribe & Save detection
- Comprehensive testing framework
- Real-time data analysis

## Build & Test

### Development Setup
```bash
npm install
npm run dev  # Start with nodemon auto-reload
```

### Testing Commands
```bash
npm test                    # Run all tests (unit, integration, e2e)
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # End-to-end tests (Playwright)
npm run test-quick         # Quick test runner
npm run test-backend       # Backend tests via smart-test.sh
```

### Server Management
```bash
npm run server-start       # Start server via smart-test.sh
npm run server-stop        # Stop server
npm run server-status      # Check server status
```

## Project Structure

```
tsv-ledger/
├── server.js                    # Main Express server (165 lines - MODULAR)
├── package.json                 # Dependencies and scripts
├── AGENTS.md                    # AI development guide
├── src/                         # Core business logic
│   ├── database.js             # JSON database operations
│   ├── tsv-categorizer.js      # Business intelligence engine
│   ├── ai-analysis-engine.js   # AI analysis engine
│   └── routes/                 # API route modules (NEW)
│       ├── import.js           # Import operations (CSV, ZIP)
│       ├── data.js             # Basic CRUD operations
│       ├── analytics.js        # Premium analytics & AI analysis
│       ├── amazon.js           # Amazon-specific operations
│       ├── employee-benefits.js # Benefits filtering & analysis
│       ├── subscription.js     # Subscription tracking
│       └── geographic.js       # Geographic analysis
├── tests/                       # Comprehensive test suite (20+ files)
├── docs/                        # Documentation hub (17 files)
├── data/                        # Data storage and samples
├── utils/                       # Utility scripts (11 tools)
├── demos/                       # Feature demonstrations
├── scripts/                     # Automation tools
├── public/                      # Frontend assets
│   ├── index.html              # Main application UI
│   ├── js/app.js               # Client-side import logic
│   └── js/bootstrap-navigation.js # Navigation system
└── BestPractices/               # Knowledge transfer framework
    ├── Generic/                 # Universal patterns
    └── ProjectSpecific/         # Domain-specific knowledge
```

## Code Style & Conventions

### JavaScript Standards
- **File Size Limit:** Keep files under 250 lines for optimal AI consumption
- **Comments:** JSDoc format for functions, comprehensive file headers
- **Naming:** camelCase for variables/functions, PascalCase for classes
- **Error Handling:** Try-catch blocks with meaningful error messages
- **Async/Await:** Preferred over promises for readability

### API Design
- **RESTful Endpoints:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **Response Format:** JSON with consistent error/success structure
- **Status Codes:** Proper HTTP status codes (200, 400, 404, 500)
- **Validation:** Input validation on all endpoints

### Database Operations
- **File-based JSON:** `expenditures.json` for data persistence
- **Atomic Operations:** Read-modify-write pattern for data integrity
- **Backup Strategy:** Automatic file backups before modifications

## Development Workflow

### Git Workflow
- **Branching:** Feature branches from main
- **Commits:** Conventional commit format (`feat:`, `fix:`, `docs:`, `test:`)
- **PR Process:** Code review required, tests must pass
- **Versioning:** Semantic versioning (major.minor.patch)

### Testing Strategy
- **Unit Tests:** Individual function testing with Jest
- **Integration Tests:** Module interaction testing
- **E2E Tests:** Full user workflow testing with Playwright
- **Coverage:** Minimum 80% code coverage required

### File Organization
- **Modular Design:** Single responsibility per file
- **Import/Export:** ES6 modules with clear dependency chains
- **Configuration:** Centralized config in main files
- **Utilities:** Shared functions in dedicated utility files

## Security Considerations

### Data Protection
- **Input Sanitization:** All user inputs validated and sanitized
- **File Upload Security:** Multer configuration with file type restrictions
- **API Security:** No authentication required (internal use only)
- **Data Privacy:** Sensitive data handling per business requirements

### Code Security
- **Dependency Management:** Regular security audits of npm packages
- **Error Handling:** No sensitive information in error messages
- **File System Access:** Restricted to designated data directories

## Common Patterns

### Import Processing
```javascript
// CSV Import Pattern
app.post('/api/import-csv', upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process results
      res.json({ success: true, count: results.length });
    });
});
```

### Database Operations
```javascript
// JSON Database Pattern
function addExpenditure(expenditure, callback) {
  fs.readFile('expenditures.json', 'utf8', (err, data) => {
    if (err) return callback(err);
    const expenditures = JSON.parse(data || '[]');
    expenditures.push(expenditure);
    fs.writeFile('expenditures.json', JSON.stringify(expenditures, null, 2), callback);
  });
}
```

### Error Handling
```javascript
// Consistent Error Response Pattern
try {
  // Operation logic
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({ success: false, error: error.message });
}
```

## Performance Guidelines

### Optimization Targets
- **Response Time:** API endpoints should respond within 2 seconds
- **Memory Usage:** Monitor heap usage in production
- **File I/O:** Minimize synchronous file operations
- **Data Processing:** Stream processing for large files

### Monitoring
- **Logs:** Comprehensive logging for debugging
- **Metrics:** Track import success rates and processing times
- **Health Checks:** Built-in health check endpoints

## Deployment & Environment

### Environment Setup
- **Node Version:** 14+ (check package.json engines if specified)
- **Dependencies:** npm install (no global dependencies required)
- **Data Directory:** Ensure write permissions for data/ directory
- **Port:** Default 3000, configurable via environment

### Production Considerations
- **Process Management:** Use PM2 or similar for production
- **Backup Strategy:** Regular data backups
- **Monitoring:** Log aggregation and error tracking
- **Scaling:** Single instance deployment (internal use)

## Troubleshooting

### Common Issues
- **Port Conflicts:** Check if port 3000 is available
- **File Permissions:** Ensure write access to data directory
- **Memory Issues:** Monitor for large file processing
- **Import Failures:** Check CSV format and encoding

### Debug Mode
```bash
DEBUG=* npm run dev  # Enable debug logging
```

## Testing Best Practices

### Test File Organization
- **Unit Tests:** `tests/unit/` directory
- **Integration Tests:** `tests/integration/` directory
- **E2E Tests:** `tests/e2e/` directory with Playwright
- **Test Data:** Use fixtures in `tests/fixtures/`

### Test Coverage
- **Minimum Coverage:** 80% overall
- **Critical Paths:** 100% coverage for import/export functions
- **Edge Cases:** Test error conditions and boundary values

## Documentation Standards

### Code Documentation
- **JSDoc Comments:** All public functions and classes
- **README Files:** Each major directory has documentation
- **API Docs:** REST endpoint documentation in `docs/API_DOCUMENTATION.md`
- **Change Logs:** Version history in `docs/CHANGELOG.md`

### Knowledge Transfer
- **BestPractices Framework:** Comprehensive knowledge base
- **Handoff Guides:** Detailed transition documentation
- **Code Comments:** Inline explanations for complex logic

## AI Development Guidelines

### Context Management
- **File Size Limit:** Keep files under 250 lines for optimal AI processing
- **Clear Naming:** Descriptive variable and function names
- **Logical Flow:** Linear code execution where possible
- **Error Messages:** Meaningful error descriptions for debugging

### Code Generation
- **Consistent Style:** Follow existing code patterns
- **Modular Design:** Single responsibility principle
- **Test Coverage:** Include tests for new functionality
- **Documentation:** Update relevant documentation files

### Review Process
- **Automated Tests:** All changes must pass existing tests
- **Code Style:** Consistent with project conventions
- **Documentation:** Update AGENTS.md for significant changes
- **Peer Review:** Code review for complex changes

---

*This AGENTS.md file serves as the primary reference for AI coding agents working on the TSV Ledger project. Keep it updated with any significant changes to project structure, conventions, or development practices.*