# Project Overview

## TSV Ledger - Advanced Expense Tracking Platform

TSV Ledger is a comprehensive expense tracking and analysis platform built with modern web technologies, featuring Amazon integration, AI-powered insights, and a componentized frontend architecture.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: JSON file storage with test isolation
- **Key Dependencies**:
  - `express` - Web framework
  - `multer` - File upload handling
  - `csv-parser` - CSV data processing
  - `cheerio` - HTML parsing and manipulation

### Frontend
- **Framework**: Bootstrap 5
- **Architecture**: Componentized HTML with modular JavaScript
- **Pattern**: Server-side navigation injection via middleware

### Testing & Quality
- **Unit Testing**: Jest with 90%+ coverage requirement
- **Integration Testing**: Supertest + Jest
- **E2E Testing**: Playwright for user workflow validation
- **Performance**: Artillery for load testing
- **Accessibility**: axe-playwright for compliance
- **Visual Regression**: Playwright screenshots + Chromatic

### Development Tools
- **Linting**: ESLint for code quality
- **Formatting**: Prettier for consistent style
- **CI/CD**: GitHub Actions for automated pipelines

## Core Architecture

### Data Flow
```
Import → Database → Analysis → API → Frontend
  ↓       ↓         ↓       ↓      ↓
CSV/ZIP → JSON    AI/ML   REST   Components
Files    Files   Engine  Endpoints (HTML/JS)
```

### Directory Structure
```
├── src/                    # Backend source code
│   ├── routes/            # API endpoints (/api/*)
│   ├── amazon-integration/# Amazon data processing
│   ├── ai-analysis-engine.js
│   └── database.js        # JSON operations
├── public/                 # Frontend assets
│   ├── components/        # HTML components (< 300 lines)
│   └── js/modules/        # JavaScript modules (< 300 lines)
├── tests/                  # Test suites
├── docs/                   # Documentation
└── data/                   # JSON data storage
```

## Key Components

### Backend Components

#### Server (`server.js`)
- Express application with middleware
- Navigation sidebar injection
- Static file serving
- API routing

#### Database (`src/database.js`)
- JSON file operations
- Test isolation via `TEST_DB` environment variable
- CRUD operations with error handling
- Data validation and sanitization

#### Routes (`src/routes/`)
- Modular API endpoints
- RESTful design patterns
- Input validation and error handling
- Integration with database layer

#### AI Analysis Engine (`src/ai-analysis-engine.js`)
- Pattern recognition and anomaly detection
- Integration with categorization system
- Performance insights generation
- Automated recommendations

#### Amazon Integration (`src/amazon-integration/`)
- ZIP file extraction and processing
- Order, cart, and returns data parsing
- Data transformation and validation
- Error handling for malformed files

### Frontend Components

#### Component Architecture
- HTML files broken into reusable components
- Each component under 300 lines
- Server-side composition via middleware
- Bootstrap 5 for responsive design

#### JavaScript Modules
- Modular frontend JavaScript
- ES6 imports/exports
- Focused functionality per module
- Event handling and DOM manipulation

## Development Workflow

### File Size Standards
**MANDATORY**: All files must be under 300 lines
- Backend JS: < 300 lines each
- Frontend JS: < 300 lines each
- HTML Components: < 300 lines each
- Test Files: < 300 lines each
- Documentation: < 300 lines each

### Componentization Requirements
Files exceeding 500 lines MUST be componentized:
- Break into `public/components/[feature]/[component].html`
- Each component has single responsibility
- Use server-side includes for composition

### Testing Requirements
- **100% Error-Free Development**: Zero bugs, regressions, or console errors
- **Comprehensive Coverage**: Unit, integration, E2E, performance, accessibility
- **Pre-Commit Validation**: All tests must pass before commits
- **External Browser Testing**: Chrome, Firefox, Safari, Edge validation

## Quality Assurance

### Code Standards
- Functional programming patterns
- JSDoc documentation for all public APIs
- ESLint compliance
- Prettier formatting

### Version Control
- Conventional commits: `<type>[scope]: <description>`
- Feature branches with PR reviews
- Atomic commits addressing single changes
- No direct pushes to main branch

### Performance Standards
- Fast loading and response times
- Accessibility compliance (WCAG standards)
- Mobile-responsive design
- Cross-browser compatibility

## Integration Points

### Amazon Data Processing
- ZIP file uploads via `/api/amazon/upload`
- Automatic extraction and parsing
- Data validation and transformation
- Integration with expense categorization

### AI Analysis Pipeline
- Automated expense categorization
- Anomaly detection and alerts
- Trend analysis and insights
- Performance optimization recommendations

### User Interface
- Component-based architecture
- Server-injected navigation
- Responsive Bootstrap design
- Progressive enhancement patterns

## Deployment and Operations

### Environment Setup
- Node.js runtime environment
- NPM dependency management
- Environment-specific configuration
- Database file initialization

### Monitoring and Maintenance
- Automated testing pipelines
- Performance monitoring
- Error tracking and alerting
- Regular dependency updates

## Success Metrics

### Quality Metrics
- 100% test pass rate
- Zero console errors in production
- 90%+ code coverage
- Full accessibility compliance

### Performance Metrics
- Fast page load times (< 3 seconds)
- Responsive user interactions
- Efficient data processing
- Scalable architecture

### User Experience
- Intuitive navigation and workflows
- Comprehensive feature coverage
- Reliable data processing
- Professional UI/UX design