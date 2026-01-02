# TSV Ledger Codebase Architecture Map

## Overview
This document provides a hierarchical mapping of the TSV Ledger codebase structure, optimized for AI-assisted development. It follows "Documentation as Code" principles, stored in version control for easy updates. The structure is organized from high-level services/features down to functions, ensuring clarity for Copilot and human developers.

**Last Updated:** November 17, 2025  
**Purpose:** Track structure for reorganization into modular, functional feature apps. Keep files small (<500 lines) for optimal AI context.

## Hierarchical Structure

### 1. Root Level: Services/Features (High-Level Apps)
These are the primary "sub-apps" or independent features. Each should be semi-independent with its own logic, tests, and interfaces.

- **Dashboard**  
  - Purpose: Overview of expenditures  
  - Status: Core feature  
  - Dependencies: Database, Reports  

- **Manual Entry**  
  - Purpose: Add expenditures manually  
  - Status: Core feature  
  - Dependencies: Database  

- **CSV Import**  
  - Purpose: Import from bank/credit card CSV files  
  - Status: Core feature  
  - Dependencies: csv-parser, Database  

- **Bank Integration**  
  - Purpose: Support for Bank of America DAT files  
  - Status: Core feature  
  - Dependencies: csv-parser, Database  

- **Amazon Integration**  
  - Purpose: CRUD for Amazon order management  
  - Status: Enhanced feature  
  - Dependencies: csv-parser, Database, AI Analysis  

- **Reports**  
  - Purpose: Generate reports by category/date  
  - Status: Core feature  
  - Dependencies: Database  

- **Export**  
  - Purpose: Export data to CSV  
  - Status: Core feature  
  - Dependencies: Database  

- **Automation**  
  - Purpose: Email parsing, recurring subscriptions  
  - Status: Future enhancement  
  - Dependencies: External APIs  

### 2. Folder Level: Directory Structure
Mapped to features where possible. Post-reorganization, each feature will have its own folder under `src/`.

```
tsv-ledger/
├── src/                          # Core business logic (to be subdivided by feature)
│   ├── routes/                   # API endpoints (feature-specific)
│   ├── database.js               # Shared database ops
│   ├── tsv-categorizer.js        # AI categorization (Amazon feature)
│   └── ai-analysis-engine.js     # AI analysis (shared)
├── tests/                        # Testing framework (20+ files)
│   ├── unit/                     # Unit tests per feature
│   ├── integration/              # Feature integration tests
│   ├── e2e/                      # End-to-end tests
│   └── ... (accessibility, visual, etc.)
├── docs/                         # Documentation hub (17 files)
│   ├── API_DOCUMENTATION.md      # API refs
│   ├── TESTING_COMPLETE.md       # Testing guide
│   └── ... (CHANGELOG, etc.)
├── data/                         # Data storage (10 files)
│   ├── amazon_order_history.csv  # Amazon data
│   ├── stmttab.dat               # Bank data
│   └── expenditures.json         # App data
├── utils/                        # Utility scripts (11 tools)
│   ├── amazon-data-comparison.js # Amazon utils
│   └── import-full-amazon.js     # Import utils
├── demos/                        # Feature demonstrations
├── servers/                      # Alternative implementations
├── scripts/                      # Automation tools
├── public/                       # Frontend assets
│   ├── index.html                # Main dashboard
│   ├── employee-benefits.html    # Benefits UI
│   └── js/app.js                 # Client JS
├── BestPractices/                # Knowledge transfer
│   ├── Generic/                  # Universal patterns
│   └── ProjectSpecific/          # TSV-specific docs
└── README.md                     # Project overview
```

### 3. File Level: Key Files per Feature
Examples of current files; to be reorganized into feature folders.

- **Dashboard Feature**
  - `public/index.html` (UI)
  - `src/routes/` (API endpoints for dashboard data)
  - `src/database.js` (data retrieval)

- **Amazon Integration Feature**
  - `src/amazon-integration/amazon-zip-extractor.js` (extraction logic)
  - `src/amazon-integration/amazon-zip-processor.js` (processing logic)
  - `src/tsv-categorizer.js` (categorization logic)
  - `src/ai-analysis-engine.js` (analysis)
  - `utils/amazon-data-comparison.js` (comparison tool)
  - `tests/test-amazon-edit-feature.js` (tests)

- **CSV Import Feature**
  - `src/routes/` (import endpoints)
  - `utils/import-full-amazon.js` (import logic)

### 4. Function Level: Key Functions (Examples)
Detailed per file; use JSDoc for automation.

- **database.js**
  - `loadExpenditures()`: Load data from JSON
  - `saveExpenditures()`: Save data
  - `addExpenditure()`: Add new entry

- **tsv-categorizer.js**
  - `categorizeTransaction()`: AI-based categorization
  - `detectSubscribeAndSave()`: S&S detection

- **ai-analysis-engine.js**
  - `analyzeExpenditures()`: Generate insights
  - `predictTrends()`: Trend prediction

## Maintenance Guidelines
- **Update Process:** Edit this file in PRs alongside code changes. Use "Diagrams as Code" (Mermaid) for visuals if needed.
- **Automation:** Integrate with CI to generate from JSDoc comments.
- **AI Optimization:** Ensure files <500 lines; document functions clearly for Copilot context.
- **Versioning:** Track changes in CHANGELOG.md.

## Diagrams (Future)
Use Mermaid for C4 model diagrams here.

## ADRs (Architecture Decisions)
- ADR-001: Modular Feature Structure (Nov 17, 2025) - Decision to subdivide into features for AI efficiency.</content>
<parameter name="filePath">/mnt/chromeos/removable/Drive/repos/tsv-ledger/docs/CODEBASE_ARCHITECTURE.md