# Amazon Data Sources

## Supported File Types

TSV Ledger supports multiple Amazon data export formats to provide comprehensive expense tracking:

### Order History Files
- **Retail.OrderHistory.1.csv**: Contains order headers with dates, totals, and shipping information
- **Retail.OrdersByOrderDate.1.csv**: Orders organized chronologically by purchase date
- **Digital_Orders.1.csv**: Digital purchases including e-books, music, and software

### Item Details Files
- **Retail.Item.1.csv**: Individual item information including prices, quantities, and categories
- **Retail.Returns.1.csv**: Return and refund transaction records

### Subscription Files
- **Subscriptions.1.csv**: Amazon subscription and recurring payment data

## ZIP File Structure

Amazon provides data in compressed ZIP archives with a standardized structure:

```
amazon-order-history.zip
├── Retail.OrderHistory.1.csv     # Order headers and summaries
├── Retail.OrdersByOrderDate.1.csv # Chronological order data
├── Retail.Item.1.csv             # Detailed item information
├── Retail.Returns.1.csv          # Return and refund records
├── Digital_Orders.1.csv          # Digital purchase history
└── Subscriptions.1.csv           # Subscription data
```

## Data Format Specifications

### CSV Structure
All Amazon CSV files follow consistent formatting:
- **Delimiter**: Comma (`,`)
- **Encoding**: UTF-8
- **Headers**: First row contains column names
- **Quoting**: Fields containing commas are double-quoted

### Common Fields
- **Order ID**: Unique identifier for each order
- **Order Date**: Purchase date and time
- **Item Total**: Individual item price
- **Shipping**: Shipping and handling costs
- **Tax**: Applicable taxes
- **Category**: Amazon product category
- **Title**: Product name and description

## Data Quality Considerations

### Completeness
- Not all orders may be included in exports
- Historical data may have gaps
- Digital orders may be in separate files

### Accuracy
- Prices may include promotions or discounts
- Shipping costs may be estimated
- Tax calculations may vary by region

### Timeliness
- Data exports may have processing delays
- Real-time order status not available
- Historical data may be updated retroactively