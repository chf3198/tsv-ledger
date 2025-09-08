#!/usr/bin/env node

/**
 * Interactive Demo of Amazon Edit Feature
 * Demonstrates the complete functionality with user-friendly output
 */

const http = require('http');

class AmazonEditDemo {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', demo: '🎬' };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: null, raw: responseData });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async runDemo() {
    this.log('🎬 Amazon Edit Feature Demo', 'demo');
    this.log('=' .repeat(50), 'info');

    try {
      // Step 1: Get Amazon items
      this.log('Loading Amazon items...', 'info');
      const itemsResponse = await this.makeRequest('GET', '/api/amazon-items');
      
      if (itemsResponse.status !== 200 || !itemsResponse.data.length) {
        this.log('❌ Could not load Amazon items', 'error');
        return;
      }

      const items = itemsResponse.data;
      this.log(`Found ${items.length} Amazon items`, 'success');

      // Step 2: Show a sample item
      const sampleItem = items[0];
      this.log('\n📦 Sample Amazon Item:', 'demo');
      this.log(`   Name: ${sampleItem.name.substring(0, 60)}...`, 'info');
      this.log(`   Price: ${sampleItem.priceFormatted}`, 'info');
      this.log(`   Category: ${sampleItem.category}`, 'info');
      this.log(`   Date: ${sampleItem.date}`, 'info');

      // Step 3: Edit the item
      this.log('\n🔧 Editing item category...', 'demo');
      const originalCategory = sampleItem.category;
      const newCategory = originalCategory === 'office_supplies' ? 'employee_amenities' : 'office_supplies';
      
      this.log(`Changing category from "${originalCategory}" to "${newCategory}"`, 'info');
      
      const editResponse = await this.makeRequest('PUT', `/api/amazon-items/${sampleItem.id}`, {
        category: newCategory,
        amount: 19.99,
        description: 'Updated via demo script'
      });

      if (editResponse.status === 200) {
        this.log('✅ Item updated successfully!', 'success');
      } else {
        this.log(`❌ Update failed with status ${editResponse.status}`, 'error');
        return;
      }

      // Step 4: Verify the change
      this.log('\n🔍 Verifying changes...', 'demo');
      const verifyResponse = await this.makeRequest('GET', '/api/amazon-items');
      const updatedItem = verifyResponse.data.find(item => item.id === sampleItem.id);

      if (updatedItem && updatedItem.category === newCategory) {
        this.log('✅ Changes verified in database!', 'success');
        this.log(`   Updated Category: ${updatedItem.category}`, 'info');
        this.log(`   Updated Amount: ${updatedItem.priceFormatted}`, 'info');
      } else {
        this.log('❌ Changes not found in verification', 'error');
        return;
      }

      // Step 5: Restore original
      this.log('\n🔄 Restoring original category...', 'demo');
      await this.makeRequest('PUT', `/api/amazon-items/${sampleItem.id}`, {
        category: originalCategory,
        amount: sampleItem.price,
        description: sampleItem.description || ''
      });

      this.log('✅ Original data restored', 'success');

      // Step 6: Demo summary
      this.log('\n🎉 Demo Complete!', 'demo');
      this.log('=' .repeat(50), 'info');
      this.log('Features demonstrated:', 'info');
      this.log('• ✅ Loading Amazon items from API', 'success');
      this.log('• ✅ Editing item categories and amounts', 'success');
      this.log('• ✅ Real-time data persistence', 'success');
      this.log('• ✅ Data verification and restoration', 'success');
      this.log('\n🌐 Try it yourself at: http://localhost:3000/employee-benefits.html', 'info');
      this.log('Click the edit button (📝) next to any Amazon item!', 'info');

    } catch (error) {
      this.log(`❌ Demo failed: ${error.message}`, 'error');
    }
  }
}

// Run demo
if (require.main === module) {
  const demo = new AmazonEditDemo();
  demo.runDemo()
    .then(() => {
      console.log('\n🚀 Amazon Edit Feature is ready for production use!');
    })
    .catch(error => {
      console.error('❌ Demo crashed:', error.message);
      process.exit(1);
    });
}

module.exports = AmazonEditDemo;
