/**
 * Demo: Amazon ZIP File Import System
 * Demonstrates automated processing of Amazon's official zip exports
 */

const path = require('path');
const AmazonZipParser = require('../src/amazon-zip-parser');

async function demonstrateZipImport() {
    console.log('🚀 Amazon ZIP Import System Demo');
    console.log('=====================================\n');

    const parser = new AmazonZipParser();
    
    // Paths to Amazon zip files
    const dataDir = path.join(__dirname, '..', 'data');
    const yourOrdersZip = path.join(dataDir, 'Your Orders.zip');
    const subscriptionsZip = path.join(dataDir, 'Subscriptions.zip');

    try {
        // Process "Your Orders.zip"
        console.log('📦 Processing Your Orders.zip...\n');
        const ordersResult = await parser.processZipFile(yourOrdersZip, {
            extractDir: path.join(dataDir, 'temp-orders-extract'),
            keepExtracted: false
        });

        if (ordersResult.success) {
            console.log('✅ Orders processing completed successfully!');
            console.log(`📈 Found ${ordersResult.data.orders.length} orders`);
            console.log(`📄 Processed ${ordersResult.stats.processedFiles} files\n`);
            
            // Show sample order data
            if (ordersResult.data.orders.length > 0) {
                console.log('📋 Sample Order Data:');
                const sampleOrder = ordersResult.data.orders[0];
                console.log(`  Order ID: ${sampleOrder.orderId}`);
                console.log(`  Date: ${sampleOrder.orderDate}`);
                console.log(`  Title: ${sampleOrder.title}`);
                console.log(`  Price: $${sampleOrder.purchasePrice}`);
                console.log(`  TSV Category: ${sampleOrder.tsvCategory}\n`);
            }
        } else {
            console.error('❌ Orders processing failed:', ordersResult.error);
        }

        // Reset stats for subscriptions processing
        parser.processingStats = {
            totalFiles: 0,
            processedFiles: 0,
            orders: 0,
            subscriptions: 0,
            errors: []
        };

        // Process "Subscriptions.zip"
        console.log('📦 Processing Subscriptions.zip...\n');
        const subscriptionsResult = await parser.processZipFile(subscriptionsZip, {
            extractDir: path.join(dataDir, 'temp-subscriptions-extract'),
            keepExtracted: false
        });

        if (subscriptionsResult.success) {
            console.log('✅ Subscriptions processing completed successfully!');
            console.log(`📈 Found ${subscriptionsResult.data.subscriptions.length} subscriptions`);
            console.log(`📄 Processed ${subscriptionsResult.stats.processedFiles} files\n`);
            
            // Show subscription analysis
            if (subscriptionsResult.data.subscriptions.length > 0) {
                console.log('📋 Subscription Analysis:');
                const activeSubscriptions = subscriptionsResult.data.subscriptions.filter(
                    sub => sub.subscriptionActive
                );
                console.log(`  Active Subscriptions: ${activeSubscriptions.length}`);
                console.log(`  Total Subscriptions: ${subscriptionsResult.data.subscriptions.length}`);
                
                // Category breakdown
                const categoryBreakdown = {};
                subscriptionsResult.data.subscriptions.forEach(sub => {
                    categoryBreakdown[sub.tsvCategory] = 
                        (categoryBreakdown[sub.tsvCategory] || 0) + 1;
                });
                
                console.log('\n📊 Subscription Categories:');
                Object.entries(categoryBreakdown).forEach(([category, count]) => {
                    console.log(`  ${category}: ${count} items`);
                });
                
                // Sample subscription
                console.log('\n📋 Sample Subscription:');
                const sampleSub = subscriptionsResult.data.subscriptions[0];
                console.log(`  Product: ${sampleSub.productTitle}`);
                console.log(`  Frequency: ${sampleSub.frequency}`);
                console.log(`  Status: ${sampleSub.subscriptionState}`);
                console.log(`  TSV Category: ${sampleSub.tsvCategory}\n`);
            }
        } else {
            console.error('❌ Subscriptions processing failed:', subscriptionsResult.error);
        }

        // Generate combined report
        console.log('📊 Final Processing Report:');
        parser.generateReport();

        // Demonstrate integration with existing TSV Ledger
        console.log('\n🔗 Integration Demonstration:');
        console.log('=====================================');
        console.log('The processed data can now be integrated with TSV Ledger:');
        console.log('1. Orders data → Expenditures tracking');
        console.log('2. Subscriptions → Recurring expense analysis');
        console.log('3. Categories → Business intelligence reporting');
        console.log('4. Subscribe & Save → Cost optimization insights\n');

        // Show potential savings analysis
        if (subscriptionsResult.success) {
            demonstrateSavingsAnalysis(subscriptionsResult.data.subscriptions);
        }

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

function demonstrateSavingsAnalysis(subscriptions) {
    console.log('💰 Subscribe & Save Analysis:');
    console.log('=====================================');
    
    const activeSubscriptions = subscriptions.filter(sub => sub.subscriptionActive);
    const propertySupplies = activeSubscriptions.filter(sub => 
        sub.tsvCategory.includes('Property') || 
        sub.tsvCategory.includes('Guest') ||
        sub.tsvCategory.includes('Cleaning')
    );
    
    console.log(`Total Active Subscriptions: ${activeSubscriptions.length}`);
    console.log(`Property-Related Subscriptions: ${propertySupplies.length}`);
    console.log(`Estimated Monthly Deliveries: ${activeSubscriptions.length}`);
    
    // Frequency analysis
    const frequencyBreakdown = {};
    activeSubscriptions.forEach(sub => {
        frequencyBreakdown[sub.frequency] = (frequencyBreakdown[sub.frequency] || 0) + 1;
    });
    
    console.log('\n📅 Delivery Frequency Breakdown:');
    Object.entries(frequencyBreakdown).forEach(([freq, count]) => {
        console.log(`  ${freq}: ${count} items`);
    });
    
    console.log('\n💡 Optimization Opportunities:');
    console.log('- Consolidate delivery frequencies to reduce shipping costs');
    console.log('- Review canceled subscriptions for potential re-activation');
    console.log('- Identify bulk purchasing opportunities for property supplies');
    console.log('- Track seasonal demand patterns for guest amenities\n');
}

// Run the demo
if (require.main === module) {
    demonstrateZipImport().catch(console.error);
}

module.exports = { demonstrateZipImport };
