# Order Data Parser

Processes Amazon order history CSV files with robust error handling and data validation.

## Implementation

```javascript
// src/amazon-integration/parsers/orderParser.js
const csv = require('csv-parser');
const fs = require('fs');

class AmazonOrderParser {
  constructor() {
    this.requiredFields = [
      'Order ID', 'Order Date', 'Order Status', 'Payment Instrument Type',
      'Total Charged', 'Total Owed', 'Shipment Item Subtotal',
      'Shipment Item Subtotal Tax', 'Shipping Charge', 'Tax Charged'
    ];
  }

  async parseOrderFile(filePath) {
    return new Promise((resolve, reject) => {
      const orders = [];
      const errors = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const order = this.parseOrderRow(row);
            if (order) {
              orders.push(order);
            }
          } catch (error) {
            errors.push({
              row: orders.length + errors.length + 1,
              error: error.message,
              data: row
            });
          }
        })
        .on('end', () => {
          resolve({
            orders,
            errors,
            summary: {
              totalOrders: orders.length,
              errorCount: errors.length,
              successRate: orders.length / (orders.length + errors.length)
            }
          });
        })
        .on('error', reject);
    });
  }
}
```

## Order Row Parsing

```javascript
parseOrderRow(row) {
  // Validate required fields
  this.validateRequiredFields(row);

  // Parse and transform order data
  const order = {
    orderId: row['Order ID'],
    date: this.parseOrderDate(row['Order Date']),
    status: this.normalizeOrderStatus(row['Order Status']),
    paymentMethod: row['Payment Instrument Type'] || 'Unknown',
    totals: this.parseOrderTotals(row),
    shipping: this.parseShippingInfo(row),
    tax: this.parseTaxInfo(row),
    items: [], // Will be populated from item file
    metadata: {
      source: 'amazon_order_history',
      parsedAt: new Date().toISOString(),
      rawData: row
    }
  };

  // Validate parsed data
  this.validateParsedOrder(order);

  return order;
}
```

## Data Validation

```javascript
validateRequiredFields(row) {
  const missingFields = this.requiredFields.filter(field => !row[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

parseOrderDate(dateString) {
  // Amazon dates can be in various formats
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date.toISOString();
}

normalizeOrderStatus(status) {
  const statusMap = {
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Returned': 'returned',
    'Refunded': 'refunded',
    'Pending': 'pending'
  };

  return statusMap[status] || status.toLowerCase();
}
```

## Financial Data Parsing

```javascript
parseOrderTotals(row) {
  return {
    charged: this.parseCurrency(row['Total Charged']),
    owed: this.parseCurrency(row['Total Owed']),
    subtotal: this.parseCurrency(row['Shipment Item Subtotal']),
    subtotalTax: this.parseCurrency(row['Shipment Item Subtotal Tax'])
  };
}

parseShippingInfo(row) {
  return {
    charge: this.parseCurrency(row['Shipping Charge']),
    carrier: row['Carrier Name'] || null,
    tracking: row['Tracking Number'] || null,
    deliveryDate: row['Delivery Date'] ? this.parseOrderDate(row['Delivery Date']) : null
  };
}

parseTaxInfo(row) {
  return {
    charged: this.parseCurrency(row['Tax Charged']),
    collected: this.parseCurrency(row['Tax Collected'] || '0'),
    rate: this.calculateTaxRate(
      this.parseCurrency(row['Shipment Item Subtotal']),
      this.parseCurrency(row['Tax Charged'])
    )
  };
}

parseCurrency(value) {
  if (!value || value === '') return 0;

  // Remove currency symbols and convert to number
  const cleanValue = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanValue);

  if (isNaN(parsed)) {
    throw new Error(`Invalid currency value: ${value}`);
  }

  return Math.round(parsed * 100) / 100; // Round to 2 decimal places
}

calculateTaxRate(subtotal, taxCharged) {
  if (subtotal === 0) return 0;
  return Math.round((taxCharged / subtotal) * 10000) / 100; // Percentage with 2 decimals
}

validateParsedOrder(order) {
  if (order.totals.charged < 0) {
    throw new Error('Order total cannot be negative');
  }

  if (order.date > new Date().toISOString()) {
    throw new Error('Order date cannot be in the future');
  }

  const validStatuses = ['shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'pending'];
  if (!validStatuses.includes(order.status)) {
    throw new Error(`Invalid order status: ${order.status}`);
  }
}
```