/**
 * Data Loader Module
 * Loads and normalizes test data for iterative analysis
 * @module tests/iterative/data-loader
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DataLoader {
  constructor() {
    this.testData = [];
  }

  /**
   * Load and validate test data
   * @returns {Promise<Array>} Array of normalized order data
   */
  async loadTestData() {
    console.log('\n📂 Loading test data...');

    const dataFile = path.join(__dirname, '../../data/amazon-test-sample.csv');
    if (!fs.existsSync(dataFile)) {
      throw new Error('❌ Amazon data file not found: amazon-test-sample.csv');
    }

    return new Promise((resolve, reject) => {
      const orders = [];
      fs.createReadStream(dataFile)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize data structure
          const order = {
            date: row['Order Date'] || row.date || row.Date,
            amount: parseFloat(
              row['Item Total'] || row.total || row.amount || 0
            ),
            items: row['Title'] || row.items || row.title || '',
            payments: row['Payment Method'] || row.payments || '',
            shipping: row['Item Subtotal Tax'] || row.shipping || '0',
            orderId:
              row['Order ID'] ||
              row['order id'] ||
              `test-${Date.now()}-${Math.random()}`,
            quantity: parseInt(row['Quantity'] || row.quantity || 1),
            category: row['Category'] || row.category || '',
            shippingAddress: row['Shipping Address'] || row.address || '',
            orderStatus: row['Order Status'] || row.status || 'Shipped'
          };

          if (order.date && order.amount && order.items) {
            orders.push(order);
          }
        })
        .on('end', () => {
          this.testData = orders;
          console.log(`✅ Loaded ${orders.length} orders for testing`);
          resolve(orders);
        })
        .on('error', reject);
    });
  }

  /**
   * Generate mock test data for testing
   * @param {number} count - Number of mock orders to generate
   * @returns {Array} Array of mock order data
   */
  generateMockData(count = 100) {
    const mockData = [];
    const categories = [
      'Food & Groceries',
      'Household & Personal Care',
      'Electronics',
      'Books',
      'Clothing'
    ];
    const items = {
      'Food & Groceries': ['Milk', 'Bread', 'Apples', 'Chicken', 'Rice'],
      'Household & Personal Care': [
        'Paper Towels',
        'Laundry Detergent',
        'Dish Soap',
        'Trash Bags'
      ],
      Electronics: ['USB Cable', 'Headphones', 'Mouse', 'Keyboard'],
      Books: ['Novel', 'Textbook', 'Cookbook', 'Biography'],
      Clothing: ['T-Shirt', 'Pants', 'Shoes', 'Jacket']
    };

    for (let i = 0; i < count; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const item =
        items[category][Math.floor(Math.random() * items[category].length)];

      mockData.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: -(Math.random() * 50 + 5).toFixed(2),
        items: `${item} and accessories`,
        payments: 'Credit Card',
        shipping: '0.00',
        orderId: `MOCK-${String(i + 1).padStart(4, '0')}`,
        quantity: 1,
        category,
        shippingAddress: '123 Test St, Test City, TS 12345',
        orderStatus: 'Shipped'
      });
    }

    this.testData = mockData;
    return mockData;
  }

  /**
   * Get loaded test data
   * @returns {Array} Test data array
   */
  getTestData() {
    return this.testData;
  }

  /**
   * Set test data
   * @param {Array} data - Test data to set
   */
  setTestData(data) {
    this.testData = data;
  }
}

module.exports = DataLoader;
