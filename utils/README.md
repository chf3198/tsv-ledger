# Utilities Directory

This directory contains utility scripts and helper tools for the TSV Ledger application.

## Utility Scripts

### Data Processing
- `amazon-data-comparison.js` - Compares different Amazon data sources
- `amazon-official-parser.js` - Parses official Amazon data formats
- `import-full-amazon.js` - Imports Amazon order history data
- `benefits-asin-analysis.js` - Analyzes ASIN data for benefits tracking

## Usage

These utilities are typically run from the project root:

```bash
# Import Amazon data
node utils/import-full-amazon.js

# Compare data sources
node utils/amazon-data-comparison.js

# Analyze benefits data
node utils/benefits-asin-analysis.js
```

## Dependencies

Most utilities require:
- Node.js filesystem access
- CSV parsing capabilities
- Data files in the `data/` directory
