# Data Directory

This directory contains all data files for the TSV Ledger application.

## Data Files

### Primary Data Sources
- `amazon_order_history.csv` - Amazon purchase data (main dataset)
- `stmttab.dat` - Bank of America statement data
- `amazon-batch1.csv` - Additional Amazon data batch
- `amazon-official-data.csv` - Official Amazon dataset

### Data File Information

All CSV files should use UTF-8 encoding. The application will automatically 
read data from these files when needed.

## File Access

Files in this directory are accessed by:
- `server.js` - Main application server
- Various test scripts in `tests/` directory
- Analysis tools and parsers

## Security Note

These files may contain sensitive financial information. 
Ensure proper access controls are in place.
