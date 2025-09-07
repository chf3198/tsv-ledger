#!/usr/bin/env node

/**
 * Quick Console Testing Script for TSV Ledger Analysis
 * 
 * This provides quick, focused testing for specific analysis components.
 * Usage: node quick-test.js [test-name]
 * 
 * Available tests:
 * - ss (Subscribe & Save detection)
 * - categories (Category classification)
 * - locations (Property allocation)
 * - all (Run all tests)
 */

const TSVCategorizer = require('./tsv-categorizer');
const fs = require('fs');
const csv = require('csv-parser');

class QuickTester {
  constructor() {
    this.categorizer = new TSVCategorizer();
  }

  // Load sample data quickly
  async loadSampleData(limit = 100) {
    return new Promise((resolve) => {
      const orders = [];
      fs.createReadStream('./amazon_order_history.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (orders.length < limit) {
            const order = {
              date: row['date'] || row['Order Date'],
              amount: parseFloat(row['total'] || row['Item Total'] || row.amount || 0),
              items: row['items'] || row['Title'] || '',
              payments: row['payments'] || row['Payment Method'] || '',
              shipping: row['shipping'] || row['Item Subtotal Tax'] || '0'
            };
            if (order.date && order.amount && order.items) orders.push(order);
          }
        })
        .on('end', () => resolve(orders));
    });
  }

  // Quick Subscribe & Save test
  async testSubscribeAndSave() {
    console.log('🔍 Quick Subscribe & Save Test\n');
    
    const orders = await this.loadSampleData(200);
    const ssResults = [];
    
    orders.forEach((order, index) => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      if (analysis.subscribeAndSave.isSubscribeAndSave) {
        ssResults.push({
          index,
          items: order.items.substring(0, 60),
          confidence: analysis.subscribeAndSave.confidence,
          indicators: analysis.subscribeAndSave.indicators
        });
      }
    });
    
    console.log(`📊 Results: Found ${ssResults.length} S&S orders out of ${orders.length} tested`);
    console.log(`📈 Detection Rate: ${(ssResults.length / orders.length * 100).toFixed(1)}%\n`);
    
    console.log('🔍 Top 10 Detections:');
    ssResults.slice(0, 10).forEach((result, i) => {
      console.log(`${i + 1}. ${result.items}...`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Indicators: ${Object.entries(result.indicators).filter(([k,v]) => v).map(([k]) => k).join(', ')}\n`);
    });
    
    return ssResults;
  }

  // Quick category test
  async testCategories() {
    console.log('🏷️ Quick Category Test\n');
    
    const orders = await this.loadSampleData(100);
    const categories = {};
    
    orders.forEach(order => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      if (!categories[analysis.category]) {
        categories[analysis.category] = { count: 0, total: 0, examples: [] };
      }
      categories[analysis.category].count++;
      categories[analysis.category].total += Math.abs(order.amount);
      if (categories[analysis.category].examples.length < 3) {
        categories[analysis.category].examples.push(order.items.substring(0, 40));
      }
    });
    
    console.log('📊 Category Distribution:');
    Object.entries(categories)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([cat, data]) => {
        console.log(`\n${cat}: ${data.count} orders ($${data.total.toLocaleString()})`);
        console.log(`Examples: ${data.examples.join(' | ')}`);
      });
    
    return categories;
  }

  // Quick location test
  async testLocations() {
    console.log('🏠 Quick Location Test\n');
    
    const orders = await this.loadSampleData(100);
    const locations = { Freeport: [], Smithville: [], 'Both Properties': [] };
    
    orders.forEach(order => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      locations[analysis.location].push({
        items: order.items.substring(0, 50),
        amount: order.amount
      });
    });
    
    console.log('📊 Location Distribution:');
    Object.entries(locations).forEach(([loc, orders]) => {
      const total = orders.reduce((sum, o) => sum + Math.abs(o.amount), 0);
      console.log(`\n${loc}: ${orders.length} orders ($${total.toLocaleString()})`);
      if (orders.length > 0) {
        console.log(`Examples: ${orders.slice(0, 3).map(o => o.items).join(' | ')}`);
      }
    });
    
    return locations;
  }

  // Interactive testing mode
  async interactive() {
    console.log('🎮 Interactive Testing Mode');
    console.log('Enter a product description to test analysis:\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const testProduct = (items) => {
      const testOrder = {
        date: '2025-01-01',
        amount: 25.99,
        items: items,
        payments: 'Credit Card',
        shipping: '0'
      };
      
      const analysis = this.categorizer.analyzeAmazonOrder(testOrder);
      
      console.log('\n📊 Analysis Results:');
      console.log(`Category: ${analysis.category}`);
      console.log(`Location: ${analysis.location}`);
      console.log(`Subscribe & Save: ${analysis.subscribeAndSave.isSubscribeAndSave ? 'YES' : 'NO'} (${(analysis.subscribeAndSave.confidence * 100).toFixed(1)}%)`);
      console.log(`Employee Benefit: ${analysis.isEmployeeBenefit ? 'YES' : 'NO'}`);
      console.log(`Season: ${analysis.seasonality.season}\n`);
    };
    
    rl.on('line', (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      testProduct(input);
    });
    
    console.log('Type "exit" to quit');
  }
}

// Command line interface
async function main() {
  const testName = process.argv[2] || 'all';
  const tester = new QuickTester();
  
  try {
    switch (testName) {
      case 'ss':
        await tester.testSubscribeAndSave();
        break;
      case 'categories':
        await tester.testCategories();
        break;
      case 'locations':
        await tester.testLocations();
        break;
      case 'interactive':
        await tester.interactive();
        break;
      case 'all':
        await tester.testSubscribeAndSave();
        console.log('\n' + '='.repeat(50) + '\n');
        await tester.testCategories();
        console.log('\n' + '='.repeat(50) + '\n');
        await tester.testLocations();
        break;
      default:
        console.log('Available tests: ss, categories, locations, interactive, all');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = QuickTester;
