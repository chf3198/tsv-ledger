# Amazon Integration Overview

## Overview

TSV Ledger integrates with Amazon order data to provide comprehensive expense tracking and analysis. The system processes Amazon ZIP files containing order history, item details, and transaction data, automatically extracting and categorizing Amazon purchases.

## Amazon Data Sources

### Supported File Types
- **Order History**: CSV files containing order details, dates, totals, and shipping
- **Item Details**: CSV files with individual item information, prices, and categories
- **Returns**: CSV files tracking returned items and refund information
- **Digital Orders**: Digital purchase history and subscription data

### ZIP File Structure
Amazon provides data in compressed ZIP archives containing multiple CSV files:

```
amazon-order-history.zip
├── Retail.OrderHistory.1.csv     # Order headers
├── Retail.OrdersByOrderDate.1.csv # Orders by date
├── Retail.Item.1.csv             # Item details
├── Retail.Returns.1.csv          # Return information
├── Digital_Orders.1.csv          # Digital purchases
└── Subscriptions.1.csv           # Subscription data
```

## Component Structure

This documentation is organized into the following components:

- **[Data Sources](data-sources.md)**: Detailed information about Amazon data formats and file structures
- **[ZIP Processing](zip-processing.md)**: ZIP file extraction and validation systems
- **[Data Parsing](data-parsing.md)**: CSV parsing and data transformation logic
- **[Data Integration](data-integration.md)**: Database integration and data merging
- **[API Integration](api-integration.md)**: REST API endpoints for Amazon data
- **[Error Handling](error-handling.md)**: Validation and error management
- **[Testing](testing.md)**: Testing strategies and test cases
- **[Performance](performance.md)**: Monitoring and optimization guidelines