/**
 * E2E Global Setup
 *
 * @fileoverview Global setup for E2E tests including database seeding
 */

const { DatabaseHelpers } = require('../shared/test-helpers');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up E2E test environment...');

  // Setup test database with sample data
  await DatabaseHelpers.setupTestDatabase();

  // Seed with test data for E2E tests
  const sampleData = [
    {
      id: 1,
      date: '2024-01-15',
      amount: 29.99,
      description: 'Office Supplies - Pens and Paper',
      category: 'Office Supplies',
      vendor: 'Amazon',
      account: 'Business Card',
      taxCategory: 'Business',
      notes: 'Monthly office supplies'
    },
    {
      id: 2,
      date: '2024-01-20',
      amount: 75.50,
      description: 'Restaurant Dinner - Client Meeting',
      category: 'Food & Dining',
      vendor: 'Local Restaurant',
      account: 'Business Card',
      taxCategory: 'Business',
      notes: 'Business expense'
    },
    {
      id: 3,
      date: '2024-01-25',
      amount: 45.00,
      description: 'Gas Station Fill-up',
      category: 'Transportation',
      vendor: 'Shell',
      account: 'Personal Card',
      taxCategory: 'Personal',
      notes: 'Weekly commute'
    },
    {
      id: 4,
      date: '2024-01-30',
      amount: 125.00,
      description: 'Software License - Annual',
      category: 'Technology',
      vendor: 'Adobe',
      account: 'Business Card',
      taxCategory: 'Business',
      notes: 'Creative Suite subscription'
    },
    {
      id: 5,
      date: '2024-02-01',
      amount: 89.99,
      description: 'Wireless Headphones',
      category: 'Technology',
      vendor: 'Best Buy',
      account: 'Personal Card',
      taxCategory: 'Personal',
      notes: 'Personal electronics'
    }
  ];

  await DatabaseHelpers.insertTestData(sampleData);

  // Create test Amazon data file in test directory
  const amazonDataPath = path.join(__dirname, '..', '..', 'tests', 'data', 'amazon-test-data.json');
  const amazonSampleData = [
    {
      id: 'amazon-001',
      orderId: '123-4567890-1234567',
      orderDate: '2024-01-15',
      productName: 'Premium Office Chair',
      price: 299.99,
      category: 'Office Supplies',
      businessCard: true
    },
    {
      id: 'amazon-002',
      orderId: '123-4567890-1234568',
      orderDate: '2024-01-20',
      productName: 'Coffee Subscription',
      price: 29.99,
      category: 'Food & Dining',
      businessCard: true
    },
    {
      id: 'amazon-003',
      orderId: '123-4567890-1234569',
      orderDate: '2024-01-25',
      productName: 'Wireless Keyboard',
      price: 79.99,
      category: 'Technology',
      businessCard: true
    }
  ];

  // Ensure test data directory exists
  const testDataDir = path.dirname(amazonDataPath);
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  fs.writeFileSync(amazonDataPath, JSON.stringify(amazonSampleData, null, 2));

  console.log('✅ E2E test environment setup complete');
  console.log('📁 Test database:', path.join(__dirname, '..', '..', 'tests', 'data', 'test-expenditures.json'));
};