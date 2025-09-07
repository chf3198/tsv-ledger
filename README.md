# TSV Ledger

A web application to track and analyze expenditures for Texas Sunset Venues (texassunsetvenues.com). This app automates data gathering where possible and provides a dashboard for manual entry, CSV import, reports, and export functionality.

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
├── server.js              # Main Express server file
├── database.js            # JSON file operations
├── expenditures.json      # Data storage (auto-created)
├── AMAZON_RESEARCH.md     # Amazon data format documentation
├── AI_CONTEXT.md          # AI assistant handoff documentation
├── amazonOrdrHist2025.dat # Amazon order history data file
├── amazon-test-parser.js  # Amazon data parsing tests
├── stmttab.dat            # Bank of America statement data
├── test-parser.js         # Bank data parsing tests
├── package.json           # Node.js dependencies and scripts
├── public/                # Static frontend files
│   ├── index.html         # Main dashboard page
│   ├── js/
│   │   └── app.js         # Client-side JavaScript
│   └── css/               # Custom styles (if needed)
└── README.md              # This file
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

## Development Notes

This project is optimized for future AI Coding Assistants with:
- Clear, descriptive comments in code
- Modular file structure
- Comprehensive documentation
- Consistent naming conventions

## License

Internal use only - no license required.
