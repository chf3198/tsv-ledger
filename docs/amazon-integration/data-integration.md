# Data Integration System

## Order-Item Matching

Combines order headers with item details to create complete transaction records for expense tracking.

### Implementation

```javascript
// src/amazon-integration/processor.js
const AmazonOrderParser = require('./parsers/orderParser');
const AmazonItemParser = require('./parsers/itemParser');

class AmazonDataProcessor {
  constructor() {
    this.orderParser = new AmazonOrderParser();
    this.itemParser = new AmazonItemParser();
  }

  async processAmazonData(extractedFiles) {
    try {
      // Parse all data files
      const parsedData = await this.parseAllFiles(extractedFiles);

      // Match orders with items
      const matchedOrders = this.matchOrdersWithItems(parsedData.orders, parsedData.items);

      // Process returns and refunds
      const processedOrders = this.processReturnsAndRefunds(matchedOrders, parsedData.returns);

      // Generate expense records
      const expenses = this.generateExpenseRecords(processedOrders);

      // Calculate processing statistics
      const statistics = this.calculateProcessingStatistics(parsedData, expenses);

      return {
        success: true,
        expenses,
        statistics,
        metadata: {
          processedAt: new Date().toISOString(),
          fileCount: extractedFiles.length,
          orderCount: processedOrders.length,
          expenseCount: expenses.length
        }
      };

    } catch (error) {
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }
}
```

### File Parsing Pipeline

```javascript
async parseAllFiles(extractedFiles) {
  const parsedData = {
    orders: [],
    items: [],
    returns: [],
    digitalOrders: [],
    subscriptions: []
  };

  for (const file of extractedFiles) {
    switch (file.type) {
      case 'order_history':
        const orderResult = await this.orderParser.parseOrderFile(file.path);
        parsedData.orders.push(...orderResult.orders);
        break;

      case 'item_details':
        const itemResult = await this.itemParser.parseItemFile(file.path);
        parsedData.items.push(...itemResult.items);
        break;

      case 'returns':
        // Parse returns file (implementation needed)
        break;

      case 'digital_orders':
        // Parse digital orders (implementation needed)
        break;

      case 'subscriptions':
        // Parse subscriptions (implementation needed)
        break;
    }
  }

  return parsedData;
}
```

### Order-Item Relationship Management

```javascript
matchOrdersWithItems(orders, items) {
  const itemMap = new Map();

  // Group items by order ID
  items.forEach(item => {
    if (!itemMap.has(item.orderId)) {
      itemMap.set(item.orderId, []);
    }
    itemMap.get(item.orderId).push(item);
  });

  // Match items to orders
  return orders.map(order => ({
    ...order,
    items: itemMap.get(order.orderId) || []
  }));
}
```

### Returns and Refunds Processing

```javascript
processReturnsAndRefunds(orders, returns) {
  // Implementation for processing returns and adjusting order totals
  // This would modify order statuses and create refund transactions
  return orders; // Placeholder
}
```

## Expense Record Generation

### Transaction Creation Logic

```javascript
generateExpenseRecords(orders) {
  const expenses = [];

  orders.forEach(order => {
    if (order.status === 'delivered' || order.status === 'shipped') {
      // Create expense record for each item
      order.items.forEach(item => {
        expenses.push({
          id: `${order.orderId}-${item.asin}`,
          date: order.date,
          description: item.title,
          amount: item.pricing.purchasePrice * item.quantity,
          category: item.category,
          merchant: 'Amazon',
          source: 'amazon_integration',
          metadata: {
            orderId: order.orderId,
            asin: item.asin,
            quantity: item.quantity,
            unitPrice: item.pricing.purchasePrice,
            shipping: order.shipping.charge / order.items.length, // Prorate shipping
            tax: (order.tax.charged / order.items.length) // Prorate tax
          }
        });
      });
    }
  });

  return expenses;
}
```

### Expense Record Structure

Each generated expense record contains:

- **Unique ID**: Combination of order ID and item ASIN
- **Transaction Date**: Order date from Amazon data
- **Description**: Item title and product name
- **Amount**: Calculated total (unit price × quantity)
- **Category**: Mapped from Amazon product categories
- **Merchant**: Standardized as "Amazon"
- **Source**: Identifies data origin for tracking
- **Metadata**: Detailed transaction information for auditing

## Processing Statistics

### Statistical Analysis

```javascript
calculateProcessingStatistics(parsedData, expenses) {
  return {
    inputFiles: {
      orders: parsedData.orders.length,
      items: parsedData.items.length,
      returns: parsedData.returns.length
    },
    outputRecords: {
      expenses: expenses.length,
      totalValue: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    },
    processingMetrics: {
      successRate: expenses.length > 0 ? 1.0 : 0, // Simplified
      averageOrderValue: expenses.length > 0 ?
        expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0,
      categoryDistribution: this.calculateCategoryDistribution(expenses)
    }
  };
}
```

### Category Distribution Analysis

```javascript
calculateCategoryDistribution(expenses) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  return Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / totalAmount) * 100
  })).sort((a, b) => b.amount - a.amount);
}
```

## Data Quality Assurance

### Validation Checks
- **Order completeness**: Ensure all orders have associated items
- **Amount accuracy**: Verify calculated totals match Amazon data
- **Date consistency**: Validate transaction dates are reasonable
- **Category mapping**: Confirm all items have valid categories

### Error Handling
- **Missing data**: Handle incomplete order or item records
- **Data inconsistencies**: Flag orders where totals don't match item sums
- **Duplicate processing**: Prevent duplicate expense record creation
- **Invalid categories**: Apply default categories for unmapped items

## Database Integration

### Storage Strategy
- **Batch processing**: Insert expense records in optimized batches
- **Duplicate prevention**: Use unique IDs to prevent duplicate entries
- **Transaction safety**: Wrap operations in database transactions
- **Indexing**: Ensure proper database indexes for query performance

### Data Relationships
- **Order hierarchy**: Maintain parent-child relationships between orders and items
- **Category aggregation**: Support spending analysis by category
- **Merchant tracking**: Enable filtering and analysis by merchant
- **Time-based queries**: Optimize for date-range expense queries