# Source Code Directory

This directory contains the core source code for the TSV Ledger application.

## Core Modules

### Business Logic
- `database.js` - JSON database operations and data management
- `tsv-categorizer.js` - Business intelligence categorization engine
- `ai-analysis-engine.js` - AI-powered analysis and insights

## Module Dependencies

These modules are imported by the main `server.js` file:

```javascript
const { getAllExpenditures, addExpenditure } = require('./src/database');
const TSVCategorizer = require('./src/tsv-categorizer');
const AIAnalysisEngine = require('./src/ai-analysis-engine');
```

## Architecture

The source code follows a modular architecture:
- **Database Layer**: Handles data persistence and retrieval
- **Business Logic Layer**: Implements categorization and analysis
- **AI Engine**: Provides intelligent insights and recommendations
