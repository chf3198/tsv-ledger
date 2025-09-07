# TSV Ledger

A web application to track and analyze expenditures for Texas Sunset Venues (texassunsetvenues.com). This app automates data gathering where possible and provides a dashboard for manual entry, CSV import, reports, and export functionality.

## Features

- **Dashboard**: Overview of expenditures
- **Manual Entry**: Add expenditures manually with date, amount, category, and description
- **CSV Import**: Import expenditures from bank/credit card CSV files
- **Reports**: Generate reports on expenditures by category or date range
- **Export**: Export data to CSV for external analysis
- **Automation**:
  - Email parsing for receipts
  - CSV import for bank/credit card statements
  - Recurring subscription tracking

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Bootstrap 5 for responsive UI
- **Database**: SQLite for local data storage
- **Deployment**: Internal use only

## Project Structure

```
tsv-ledger/
├── server.js          # Main Express server file
├── database.js        # SQLite database setup and functions
├── package.json       # Node.js dependencies and scripts
├── public/            # Static frontend files
│   ├── index.html     # Main dashboard page
│   ├── js/
│   │   └── app.js     # Client-side JavaScript
│   └── css/           # Custom styles (if needed)
├── tsv_ledger.db      # SQLite database file (created on first run)
└── README.md          # This file
```

## Setup Instructions

1. Ensure Node.js (v14+) and npm are installed
2. Clone or download the project files
3. Run `npm install` to install dependencies
4. Run `npm start` to start the server
5. Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/expenditures` - Get all expenditures
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
