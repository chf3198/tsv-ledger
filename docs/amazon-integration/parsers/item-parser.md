# Item Data Parser

Processes detailed item information with category mapping and pricing validation.

## Implementation

```javascript
// src/amazon-integration/parsers/itemParser.js
const csv = require('csv-parser');
const fs = require('fs');

class AmazonItemParser {
  constructor() {
    this.categoryMappings = this.loadCategoryMappings();
  }

  async parseItemFile(filePath) {
    return new Promise((resolve, reject) => {
      const items = [];
      const errors = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const item = this.parseItemRow(row);
            if (item) {
              items.push(item);
            }
          } catch (error) {
            errors.push({
              row: items.length + errors.length + 1,
              error: error.message,
              data: row
            });
          }
        })
        .on('end', () => {
          resolve({
            items,
            errors,
            summary: {
              totalItems: items.length,
              errorCount: errors.length,
              categories: this.summarizeCategories(items)
            }
          });
        })
        .on('error', reject);
    });
  }
}
```

## Item Row Processing

```javascript
parseItemRow(row) {
  const item = {
    orderId: row['Order ID'],
    asin: row['ASIN/ISBN'],
    title: row['Title'],
    quantity: this.parseQuantity(row['Quantity']),
    pricing: this.parseItemPricing(row),
    category: this.categorizeItem(row),
    seller: row['Seller'] || 'Amazon',
    condition: row['Item Condition'] || 'New',
    metadata: {
      source: 'amazon_item_details',
      parsedAt: new Date().toISOString(),
      rawData: row
    }
  };

  this.validateParsedItem(item);
  return item;
}
```

## Pricing and Quantity Parsing

```javascript
parseQuantity(quantityString) {
  const quantity = parseInt(quantityString);
  if (isNaN(quantity) || quantity < 1) {
    throw new Error(`Invalid quantity: ${quantityString}`);
  }
  return quantity;
}

parseItemPricing(row) {
  return {
    listPrice: this.parseCurrency(row['List Price Per Unit'] || '0'),
    purchasePrice: this.parseCurrency(row['Purchase Price Per Unit']),
    itemSubtotal: this.parseCurrency(row['Item Subtotal']),
    itemSubtotalTax: this.parseCurrency(row['Item Subtotal Tax'] || '0'),
    shippingPrice: this.parseCurrency(row['Shipping Price'] || '0'),
    shippingTax: this.parseCurrency(row['Shipping Tax'] || '0')
  };
}

parseCurrency(value) {
  if (!value || value.trim() === '') return 0;

  // Handle various currency formats
  const cleanValue = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanValue);

  if (isNaN(parsed)) {
    throw new Error(`Invalid currency format: ${value}`);
  }

  return Math.round(parsed * 100) / 100;
}
```

## Category Mapping System

```javascript
categorizeItem(row) {
  const amazonCategory = row['Category'] || row['Product Category'] || '';
  const title = row['Title'] || '';

  // First try direct category mapping
  if (this.categoryMappings[amazonCategory]) {
    return this.categoryMappings[amazonCategory];
  }

  // Try keyword-based categorization from title
  for (const [category, keywords] of Object.entries(this.categoryMappings)) {
    if (typeof keywords === 'object' && keywords.keywords) {
      if (keywords.keywords.some(keyword =>
        title.toLowerCase().includes(keyword.toLowerCase())
      )) {
        return category;
      }
    }
  }

  // Default category
  return 'Shopping';
}

loadCategoryMappings() {
  return {
    'Books': 'Entertainment',
    'Digital Music': 'Entertainment',
    'Movies & TV': 'Entertainment',
    'Video Games': 'Entertainment',
    'Electronics': {
      category: 'Electronics',
      keywords: ['laptop', 'phone', 'tablet', 'charger', 'cable', 'headphones']
    },
    'Home & Garden': {
      category: 'Home & Garden',
      keywords: ['kitchen', 'bathroom', 'garden', 'tools', 'furniture']
    },
    'Clothing & Accessories': 'Shopping',
    'Grocery & Gourmet Food': 'Food & Dining',
    'Health & Personal Care': 'Health & Personal Care',
    'Sports & Outdoors': 'Sports & Outdoors',
    'Automotive': 'Transportation',
    'Industrial & Scientific': 'Business',
    'Tools & Home Improvement': 'Home Improvement'
  };
}
```

## Validation and Summary

```javascript
validateParsedItem(item) {
  if (!item.orderId) {
    throw new Error('Order ID is required');
  }

  if (!item.title) {
    throw new Error('Item title is required');
  }

  if (item.pricing.purchasePrice < 0) {
    throw new Error('Purchase price cannot be negative');
  }

  if (item.quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
}

summarizeCategories(items) {
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Top 10 categories
}
```