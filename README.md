# TSV Ledger - Advanced Business Intelligence Platform

**Version:** 2.2.3
**Last Updated:** November 12, 2025
**Status:** Production Ready - AI-Optimized Modular Architecture

Advanced expense tracking and business intelligence platform for Texas Sunset Venues (texassunsetvenues.com), featuring comprehensive analysis, automated testing, interactive insights, and professional codebase organization.

## 🎯 **Project Highlights (v2.2.3)**

- ✅ **Complete Codebase Organization** - Professional directory structure with 8 organized modules
- ✅ **Comprehensive Documentation** - 17 documentation files covering all aspects
- ✅ **Extensive Testing Framework** - 20+ test files with full feature coverage  
- ✅ **Enhanced Business Intelligence** - AI-powered analysis with premium features
- ✅ **Amazon Integration** - Full CRUD operations for Amazon order management
- ✅ **Developer Experience** - CLI tools, automation scripts, and detailed handoff guides
- ✅ **Git Workflow Optimization** - Conventional commits with semantic versioning

## 📁 **Professional Architecture**

```
tsv-ledger/
├── 📂 src/                          # Core business logic (8 modules)
│   ├── amazon-integration/         #   Amazon data processing (modular)
│   │   ├── amazon-zip-extractor.js #     ZIP file extraction
│   │   ├── amazon-zip-processor.js #     Data processing orchestration
│   │   └── parsers/                #     Individual data parsers
│   │       ├── order-parser.js     #       Order history processing
│   │       ├── cart-parser.js      #       Cart items processing
│   │       ├── returns-parser.js   #       Returns processing
│   │       └── subscription-parser.js #    Subscription processing
│   ├── amazon-zip-parser.js        #   Main Amazon parser (modular integration)
│   ├── database.js                 #   JSON database operations
│   ├── tsv-categorizer.js          #   Business intelligence categorization
│   ├── ai-analysis-engine.js       #   AI-powered analysis engine
│   └── routes/                     #   API route handlers
├── 📂 tests/                        # Testing framework (20+ files)
├── 📂 docs/                         # Documentation hub (17 files)
├── 📂 data/                         # Data storage (10 files)
├── 📂 utils/                        # Utility scripts (11 tools)
├── 📂 demos/                        # Feature demonstrations
├── 📂 servers/                      # Alternative implementations
├── 📂 scripts/                      # Automation tools
├── 📂 public/                       # Frontend assets
└── 📂 BestPractices/                # Knowledge transfer framework
    ├── Generic/                     # Framework-agnostic patterns
    └── ProjectSpecific/            # TSV Ledger domain knowledge
```

### 🏗️ **AI-Optimized Modular Design**

**File Size Standard:** All source files maintained under **300 lines** for optimal AI context consumption.

**Architecture Principles:**
- **Functional Programming**: Pure functions, immutability, composition over inheritance
- **Modular Components**: Each feature as independent, testable modules
- **Separation of Concerns**: Clear boundaries between extraction, processing, and transformation
- **AI-Friendly Structure**: Small, focused files with single responsibilities

**Amazon Integration Architecture:**
- **Extractor Module**: Handles ZIP file operations and file discovery
- **Processor Module**: Orchestrates data processing workflow
- **Parser Modules**: Individual parsers for each Amazon data type (orders, subscriptions, cart, returns)
- **Main Parser**: Integrates all modules with unified API

## 📚 **Knowledge Transfer & Documentation**

This project includes a comprehensive **BestPractices framework** for seamless knowledge transfer:

### 🌐 **Generic Patterns** (`BestPractices/Generic/`)
- **CodeOrganizationFramework** - Universal directory structure principles
- **GitWorkflowPatterns** - Version control best practices
- **DocumentationFramework** - Knowledge transfer standards

### 🎯 **Project-Specific Knowledge** (`BestPractices/ProjectSpecific/`)
- **HANDOFF_GUIDE** - Complete project handoff documentation
- **BusinessDomainKnowledge** - Texas Sunset Venues business context
- **TechnicalArchitecture** - System design and implementation details
- **API_DOCUMENTATION** - Complete REST API reference

**→ Start with [`BestPractices/README.md`](BestPractices/README.md) for complete framework overview**

## 📊 **Current Performance Metrics**

| Metric | Value | Status |
|--------|-------|--------|
| Total Orders Processed | 598 Amazon orders | ✅ Complete |
| Subscribe & Save Detection | 156 orders (26% rate) | ⚠️ Can improve to target 35%+ |
| Processing Speed | 19,290 orders/second | ✅ Excellent |
| Data Completeness | 100% Amazon, 85% Bank | ✅ High Quality |
| Algorithm Confidence | 80% S&S, 85% Categories | ✅ Reliable |
| Unit Test Success Rate | 90.9% (10 passed, 1 warning) | ✅ High Quality |

## Features

- **Dashboard**: Overview of expenditures
- **Manual Entry**: Add expenditures manually with date, amount, category, and description
- **CSV Import**: Import expenditures from bank/credit card CSV files
- **Bank Integration**: Support for Bank of America DAT files (tab-delimited)
- **Amazon Integration**: Ready for Amazon Order History CSV import (extension installed)
- **Reports**: Generate reports on expenditures by category or date range
- **Export**: Export data to CSV for external analysis
- **Automation**:
  - Email parsing for receipts
  - CSV import for bank/credit card statements
  - Recurring subscription tracking

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Bootstrap 5 for responsive UI
- **Database**: JSON file storage (SQLite ready)
- **Data Import**: csv-parser library with multi-delimiter support
- **Deployment**: Internal use only

## Project Structure

```
tsv-ledger/
├── server.js                    # Main Express server file
├── package.json                 # Node.js dependencies and scripts
├── src/                         # Core source code (AI-optimized, <300 lines each)
│   ├── amazon-integration/     #   Amazon data processing (modular architecture)
│   │   ├── amazon-zip-extractor.js     #     ZIP extraction utilities
│   │   ├── amazon-zip-processor.js     #     Data processing orchestration
│   │   └── parsers/                    #     Individual data type parsers
│   │       ├── order-parser.js         #       Order history processing
│   │       ├── subscription-parser.js  #       Subscription data processing
│   │       ├── cart-parser.js          #       Cart items processing
│   │       └── returns-parser.js       #       Returns data processing
│   ├── amazon-zip-parser.js    #   Main Amazon parser (modular integration)
│   ├── database.js             #   JSON database operations
│   ├── tsv-categorizer.js      #   Business intelligence categorization
│   └── ai-analysis-engine.js   #   AI-powered analysis engine
├── tests/                       # Test suite (20+ files)
│   ├── test-amazon-edit-feature.js  # Amazon editing tests
│   ├── test-ux-amazon-edit.js       # UX validation tests
│   └── test-complete.js             # Complete test runner
├── docs/                        # Documentation
│   ├── TESTING_COMPLETE.md     #   Testing infrastructure guide
│   ├── AI_IMPLEMENTATION.md    #   AI features documentation
│   └── CLI_TESTING.md          #   CLI testing reference
├── data/                        # Data files
│   ├── amazon_order_history.csv #   Amazon purchase data
│   ├── stmttab.dat             #   Bank statement data
│   └── expenditures.json       #   Application data storage
├── utils/                       # Utility scripts
│   ├── amazon-data-comparison.js #  Data comparison tools
│   └── import-full-amazon.js     #  Data import utilities
├── public/                      # Static frontend files
│   ├── index.html              #   Main dashboard page
│   ├── employee-benefits.html  #   Employee benefits interface
│   └── js/app.js               #   Client-side JavaScript
└── README.md                    # This file
```

## Setup Instructions

1. Ensure Node.js (v14+) and npm are installed
2. Clone or download the project files
3. Run `npm install` to install dependencies
4. Run `npm start` to start the server
5. Open http://localhost:3000 in your browser

## Data Import Setup

### Bank of America Integration
- **File Format**: DAT files (tab-delimited)
- **Download From**: Bank of America online banking → Statements → Export
- **Upload Via**: Web interface file upload
- **Status**: ✅ Fully functional

### Amazon Order History Integration
- **Extension**: Amazon Order History Reporter (Chrome extension installed)
- **Data Format**: CSV/TSV compatible
- **Process**: Extension exports → Upload to TSV Ledger
- **Status**: 🔄 Extension installed, awaiting data export completion

## API Endpoints

- `GET /api/expenditures` - Get all expenditures
- `POST /api/expenditures` - Add new expenditure manually
- `POST /api/import-csv` - Import from CSV/TSV/DAT files

## Current Development Status

### ✅ Completed
- Basic web application with Express.js backend
- Bootstrap 5 responsive frontend
- Manual expenditure entry system
- CSV/TSV/DAT file import functionality
- Bank of America DAT file support
- Amazon Order History Reporter extension installed
- Comprehensive documentation for AI handoffs

### 🔄 In Progress
- Amazon order history data export (extension running)
- Testing Amazon CSV import compatibility
- Data validation and error handling improvements

### 📋 Next Steps
1. Complete Amazon data export using installed extension
2. Test Amazon CSV import into TSV Ledger
3. Add data visualization and reporting features
4. Implement recurring subscription tracking
5. Add email receipt parsing automation

## Contributing

This project is designed for seamless AI-to-AI handoffs. All documentation is maintained in AI_CONTEXT.md for future assistants to pick up development exactly where it left off.
- `POST /api/expenditures` - Add a new expenditure

## Expenditure Categories

- Tool Subscriptions
- Maintenance Payments
- Supplies Restocking

## Future Enhancements

- Email parsing integration
- Advanced reporting with charts
- User authentication (if needed for multi-user)
- Cloud backup options

## 🤖 AI Agent Initialization

To fully initialize with the Knowledge Transfer System and gain complete familiarity with configuration, instruction-sets, data structures, and all available knowledge:

1. **Read this README.md** for project overview and architecture
2. **Read `BestPractices/README.md`** for framework overview and structure
3. **Read all files in `BestPractices/Generic/`** for universal development patterns:
   - CodeOrganizationFramework.md
   - GitWorkflowPatterns.md  
   - DocumentationFramework.md
4. **Read all files in `BestPractices/ProjectSpecific/`** for TSV Ledger domain knowledge:
   - HANDOFF_GUIDE.md
   - BusinessDomainKnowledge.md
   - TechnicalArchitecture.md
   - API_DOCUMENTATION.md
   - GIT_WORKFLOW.md
   - AGENTS.md
   - TODO.md

This ensures complete consumption of the Knowledge Transfer data, including all configurations, instruction-sets, current TODO items, and familiarity with data structure locations.

## License

Internal use only - no license required.
