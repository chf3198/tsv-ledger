/**
 * TSV Categorizer Unit Tests
 *
 * @fileoverview Unit tests for TSVCategorizer class covering categorization,
 * analysis, and business intelligence features
 */

const TSVCategorizer = require('../../src/tsv-categorizer');
const { TestFixtures } = require('../shared/test-helpers');

describe('TSVCategorizer', () => {
  let categorizer;

  beforeEach(() => {
    categorizer = new TSVCategorizer();
  });

  describe('Categorization', () => {
    test('should categorize food-related expenses correctly', () => {
      const testCases = [
        { description: 'Restaurant dinner', expected: 'Food & Dining' },
        { description: 'Grocery shopping at Whole Foods', expected: 'Food & Dining' },
        { description: 'Uber eats delivery', expected: 'Food & Dining' },
        { description: 'Coffee shop purchase', expected: 'Food & Dining' }
      ];

      testCases.forEach(({ description, expected }) => {
        const result = categorizer.categorize({ description });
        expect(result).toBe(expected);
      });
    });

    test('should categorize transportation expenses correctly', () => {
      const testCases = [
        { description: 'Gas station fill-up', expected: 'Transportation' },
        { description: 'Uber ride to airport', expected: 'Transportation' },
        { description: 'Bus ticket purchase', expected: 'Transportation' },
        { description: 'Parking fee downtown', expected: 'Transportation' }
      ];

      testCases.forEach(({ description, expected }) => {
        const result = categorizer.categorize({ description });
        expect(result).toBe(expected);
      });
    });

    test('should categorize shopping expenses correctly', () => {
      const testCases = [
        { description: 'Amazon order for office supplies', expected: 'Shopping' },
        { description: 'Retail store purchase', expected: 'Shopping' },
        { description: 'Online shopping at Target', expected: 'Shopping' }
      ];

      testCases.forEach(({ description, expected }) => {
        const result = categorizer.categorize({ description });
        expect(result).toBe(expected);
      });
    });

    test('should categorize utilities correctly', () => {
      const testCases = [
        { description: 'Electric bill payment', expected: 'Utilities' },
        { description: 'Internet service fee', expected: 'Utilities' },
        { description: 'Phone bill', expected: 'Utilities' }
      ];

      testCases.forEach(({ description, expected }) => {
        const result = categorizer.categorize({ description });
        expect(result).toBe(expected);
      });
    });

    test('should return Other for uncategorized expenses', () => {
      const testCases = [
        'Miscellaneous expense',
        'Unknown transaction',
        'Random purchase',
        ''
      ];

      testCases.forEach(description => {
        const result = categorizer.categorize({ description });
        expect(result).toBe('Other');
      });
    });

    test('should handle case-insensitive matching', () => {
      const result1 = categorizer.categorize({ description: 'RESTAURANT DINNER' });
      const result2 = categorizer.categorize({ description: 'amazon purchase' });
      const result3 = categorizer.categorize({ description: 'Gas Station' });

      expect(result1).toBe('Food & Dining');
      expect(result2).toBe('Shopping');
      expect(result3).toBe('Transportation');
    });

    test('should handle null/undefined inputs gracefully', () => {
      expect(categorizer.categorize(null)).toBe('Other');
      expect(categorizer.categorize({})).toBe('Other');
      expect(categorizer.categorize({ description: null })).toBe('Other');
      expect(categorizer.categorize({ description: undefined })).toBe('Other');
    });
  });

  describe('Analysis', () => {
    test('should analyze empty expense array', () => {
      const result = categorizer.analyze([]);

      expect(result).toEqual({
        error: 'Invalid expenses data'
      });
    });

    test('should analyze null/undefined expenses', () => {
      expect(categorizer.analyze(null)).toEqual({ error: 'Invalid expenses data' });
      expect(categorizer.analyze(undefined)).toEqual({ error: 'Invalid expenses data' });
      expect(categorizer.analyze('not an array')).toEqual({ error: 'Invalid expenses data' });
    });

    test('should analyze single expense correctly', () => {
      const expenses = [TestFixtures.sampleExpenditure];
      const result = categorizer.analyze(expenses);

      expect(result.totalExpenses).toBe(1);
      expect(result.totalAmount).toBe(29.99);
      expect(result.categories).toHaveProperty('Office Supplies');
      expect(result.categories['Office Supplies'].count).toBe(1);
      expect(result.categories['Office Supplies'].total).toBe(29.99);
    });

    test('should analyze multiple expenses with different categories', () => {
      const expenses = [
        { ...TestFixtures.sampleExpenditure, description: 'Restaurant dinner', amount: 50.00 },
        { ...TestFixtures.sampleExpenditure, description: 'Gas station', amount: 40.00 },
        { ...TestFixtures.sampleExpenditure, description: 'Amazon purchase', amount: 30.00 },
        { ...TestFixtures.sampleExpenditure, description: 'Office supplies', amount: 20.00 }
      ];

      const result = categorizer.analyze(expenses);

      expect(result.totalExpenses).toBe(4);
      expect(result.totalAmount).toBe(140.00);
      expect(Object.keys(result.categories)).toHaveLength(3);
      expect(result.categories['Food & Dining'].count).toBe(1);
      expect(result.categories['Transportation'].count).toBe(1);
      expect(result.categories['Shopping'].count).toBe(2);
    });

    test('should handle expenses with invalid amounts', () => {
      const expenses = [
        { ...TestFixtures.sampleExpenditure, amount: 'invalid' },
        { ...TestFixtures.sampleExpenditure, amount: null },
        { ...TestFixtures.sampleExpenditure, amount: undefined },
        { ...TestFixtures.sampleExpenditure, amount: 25.50 }
      ];

      const result = categorizer.analyze(expenses);

      expect(result.totalExpenses).toBe(4);
      expect(result.totalAmount).toBe(25.50); // Only valid amount
    });

    test('should handle large datasets efficiently', () => {
      const expenses = Array.from({ length: 1000 }, (_, i) => ({
        ...TestFixtures.sampleExpenditure,
        amount: Math.random() * 100,
        description: `Expense ${i + 1}`
      }));

      const startTime = Date.now();
      const result = categorizer.analyze(expenses);
      const endTime = Date.now();

      expect(result.totalExpenses).toBe(1000);
      expect(typeof result.totalAmount).toBe('number');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Bank of America Transaction Categorization', () => {
    test('should categorize BoA transactions with subcategories', () => {
      const transactions = [
        { description: 'STARBUCKS COFFEE', expectedCategory: 'Food & Dining', expectedSubcategory: null },
        { description: 'SHELL GAS STATION', expectedCategory: 'Transportation', expectedSubcategory: 'Fuel' },
        { description: 'UBER TRIP', expectedCategory: 'Transportation', expectedSubcategory: 'Ride Share' },
        { description: 'AMAZON.COM', expectedCategory: 'Shopping', expectedSubcategory: 'Amazon' }
      ];

      transactions.forEach(({ description, expectedCategory, expectedSubcategory }) => {
        const result = categorizer.categorizeBoATransaction({ description });

        expect(result.category).toBe(expectedCategory);
        expect(result.subcategory).toBe(expectedSubcategory);
        expect(result.confidence).toBe(0.8);
      });
    });
  });

  describe('Amazon Order Analysis', () => {
    test('should analyze Amazon orders correctly', () => {
      const order = {
        ...TestFixtures.sampleAmazonOrder,
        productName: 'Coffee subscription'
      };

      const result = categorizer.analyzeAmazonOrder(order);

      expect(result.category).toBeDefined();
      expect(result.subscribeAndSave).toHaveProperty('isSubscribeAndSave');
      expect(result.subscribeAndSave).toHaveProperty('confidence');
      expect(result.subscribeAndSave).toHaveProperty('indicators');
      expect(result.dataQuality).toHaveProperty('completeness');
      expect(typeof result.dataQuality.completeness).toBe('number');
    });

    test('should detect Subscribe & Save orders', () => {
      const subscribeOrder = {
        items: 'Coffee Subscribe & Save Monthly Delivery'
      };

      const regularOrder = {
        items: 'Regular one-time purchase'
      };

      const result1 = categorizer.analyzeAmazonOrder(subscribeOrder);
      const result2 = categorizer.analyzeAmazonOrder(regularOrder);

      expect(result1.subscribeAndSave.isSubscribeAndSave).toBe(true);
      expect(result2.subscribeAndSave.isSubscribeAndSave).toBe(false);
    });

    test('should calculate data completeness accurately', () => {
      const completeOrder = TestFixtures.sampleAmazonOrder;
      const incompleteOrder = { orderId: '123' };
      const emptyOrder = {};

      const result1 = categorizer.analyzeAmazonOrder(completeOrder);
      const result2 = categorizer.analyzeAmazonOrder(incompleteOrder);
      const result3 = categorizer.analyzeAmazonOrder(emptyOrder);

      expect(result1.dataQuality.completeness).toBeGreaterThan(0.5);
      expect(result2.dataQuality.completeness).toBeLessThan(0.5);
      expect(result3.dataQuality.completeness).toBe(0);
    });
  });

  describe('Subcategory Logic', () => {
    test('should assign correct subcategories for Food & Dining', () => {
      const testCases = [
        { description: 'Italian Restaurant', expected: 'Restaurant' },
        { description: 'Whole Foods Grocery', expected: 'Grocery' },
        { description: 'Generic food purchase', expected: null }
      ];

      testCases.forEach(({ description, expected }) => {
        const subcategory = categorizer.getSubcategory({ description }, 'Food & Dining');
        expect(subcategory).toBe(expected);
      });
    });

    test('should assign correct subcategories for Transportation', () => {
      const testCases = [
        { description: 'Chevron Gas Station', expected: 'Fuel' },
        { description: 'Uber to downtown', expected: 'Ride Share' },
        { description: 'Bus fare', expected: null }
      ];

      testCases.forEach(({ description, expected }) => {
        const subcategory = categorizer.getSubcategory({ description }, 'Transportation');
        expect(subcategory).toBe(expected);
      });
    });

    test('should handle null inputs for subcategories', () => {
      expect(categorizer.getSubcategory(null, 'Food & Dining')).toBeNull();
      expect(categorizer.getSubcategory({}, 'Food & Dining')).toBeNull();
      expect(categorizer.getSubcategory({ description: null }, 'Food & Dining')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(10000) + ' restaurant ' + 'B'.repeat(10000);
      const result = categorizer.categorize({ description: longDescription });
      expect(result).toBe('Food & Dining');
    });

    test('should handle special characters in descriptions', () => {
      const descriptions = [
        'Restaurant @ Downtown',
        'Amazon.com/purchase',
        'Gas & Oil Station',
        'Food & Dining Co.'
      ];

      descriptions.forEach(description => {
        expect(() => categorizer.categorize({ description })).not.toThrow();
        const result = categorizer.categorize({ description });
        expect(typeof result).toBe('string');
      });
    });

    test('should handle numeric descriptions', () => {
      const result = categorizer.categorize({ description: '12345' });
      expect(result).toBe('Other');
    });

    test('should handle emoji in descriptions', () => {
      const result = categorizer.categorize({ description: 'Restaurant 🍕' });
      expect(result).toBe('Food & Dining');
    });
  });

  describe('Performance', () => {
    test('should categorize quickly', () => {
      const expense = { description: 'Restaurant dinner' };
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        categorizer.categorize(expense);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete 1000 categorizations in less than 100ms
      expect(totalTime).toBeLessThan(100);
    });

    test('should handle memory efficiently', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 10000; i++) {
        categorizer.categorize({ description: `Expense ${i}` });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});