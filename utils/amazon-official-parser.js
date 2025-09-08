#!/usr/bin/env node

/**
 * Amazon Official Data Parser
 * Parses Amazon's official export data from "Your Orders.zip"
 * Phase 1 of migration strategy
 */

const fs = require('fs');
const path = require('path');

class AmazonOfficialParser {
    constructor() {
        this.parsedData = {
            retail: [],
            digital: [],
            digitalItems: [],
            cartItems: [],
            returns: [],
            unified: []
        };
        
        this.asinMapping = new Map(); // ASIN to category mapping
        this.benefitCategories = {
            'Board Amenities': [],
            'Venue Maintenance': [],
            'Event Supplies': [],
            'Board Technology': [],
            'Wellness & Health': [],
            'Professional Services': [],
            'Business Operations': []
        };
    }

    /**
     * Simple CSV parser using built-in Node.js modules
     */
    parseCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = this.parseCSVLine(lines[0]);
        const records = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] || '';
                });
                records.push(record);
            }
        }
        
        return records;
    }
    
    /**
     * Parse a single CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }
    parseRetailOrders(filePath) {
        console.log('📦 Parsing Retail Orders...');
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const records = this.parseCSV(content);

            console.log(`✅ Found ${records.length} retail orders`);

            records.forEach(record => {
                const order = this.normalizeRetailOrder(record);
                this.parsedData.retail.push(order);
                
                // Add to unified data
                this.parsedData.unified.push({
                    ...order,
                    source: 'retail'
                });
            });

            return records.length;
        } catch (error) {
            console.error('❌ Error parsing retail orders:', error.message);
            return 0;
        }
    }

    /**
     * Parse digital orders file
     */
    parseDigitalOrders(filePath) {
        console.log('💻 Parsing Digital Orders...');
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const records = this.parseCSV(content);

            console.log(`✅ Found ${records.length} digital orders`);

            records.forEach(record => {
                const order = this.normalizeDigitalOrder(record);
                this.parsedData.digital.push(order);
                
                // Add to unified data
                this.parsedData.unified.push({
                    ...order,
                    source: 'digital'
                });
            });

            return records.length;
        } catch (error) {
            console.error('❌ Error parsing digital orders:', error.message);
            return 0;
        }
    }

    /**
     * Parse digital items file
     */
    parseDigitalItems(filePath) {
        console.log('🎬 Parsing Digital Items...');
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const records = this.parseCSV(content);

            console.log(`✅ Found ${records.length} digital items`);

            records.forEach(record => {
                const item = this.normalizeDigitalItem(record);
                this.parsedData.digitalItems.push(item);
            });

            return records.length;
        } catch (error) {
            console.error('❌ Error parsing digital items:', error.message);
            return 0;
        }
    }

    /**
     * Normalize retail order to unified format
     */
    normalizeRetailOrder(record) {
        return {
            id: record['Order ID']?.replace(/"/g, ''),
            date: this.parseDate(record['Order Date']),
            website: record['Website']?.replace(/"/g, ''),
            currency: record['Currency']?.replace(/"/g, ''),
            unitPrice: this.parseAmount(record['Unit Price']),
            unitPriceTax: this.parseAmount(record['Unit Price Tax']),
            shippingCharge: this.parseAmount(record['Shipping Charge']),
            totalDiscounts: this.parseAmount(record['Total Discounts']),
            totalOwed: this.parseAmount(record['Total Owed']),
            asin: record['ASIN']?.replace(/"/g, ''),
            productCondition: record['Product Condition']?.replace(/"/g, ''),
            quantity: parseInt(record['Quantity']) || 1,
            paymentType: record['Payment Instrument Type']?.replace(/"/g, ''),
            orderStatus: record['Order Status']?.replace(/"/g, ''),
            shipmentStatus: record['Shipment Status']?.replace(/"/g, ''),
            shipDate: this.parseDate(record['Ship Date']),
            shippingOption: record['Shipping Option']?.replace(/"/g, ''),
            shippingAddress: record['Shipping Address']?.replace(/"/g, ''),
            billingAddress: record['Billing Address']?.replace(/"/g, ''),
            carrierTracking: record['Carrier Name & Tracking Number']?.replace(/"/g, ''),
            productName: record['Product Name']?.replace(/"/g, ''),
            category: null, // Will be set by categorization
            type: 'retail'
        };
    }

    /**
     * Normalize digital order to unified format
     */
    normalizeDigitalOrder(record) {
        return {
            id: record['OrderId']?.replace(/"/g, ''),
            date: this.parseDate(record['OrderDate']),
            billingAddress: record['BillingAddress']?.replace(/"/g, ''),
            shippingAddress: record['ShippingAddress']?.replace(/"/g, ''),
            orderStatus: record['OrderStatus']?.replace(/"/g, ''),
            marketplace: record['Marketplace']?.replace(/"/g, ''),
            countryCode: record['CountryCode']?.replace(/"/g, ''),
            deliveryStatus: record['DeliveryStatus']?.replace(/"/g, ''),
            deliveryDate: this.parseDate(record['DeliveryDate']),
            sessionId: record['SessionId']?.replace(/"/g, ''),
            type: 'digital'
        };
    }

    /**
     * Normalize digital item to unified format
     */
    normalizeDigitalItem(record) {
        return {
            asin: record['ASIN']?.replace(/"/g, ''),
            productName: record['ProductName']?.replace(/"/g, ''),
            orderId: record['OrderId']?.replace(/"/g, ''),
            orderDate: this.parseDate(record['OrderDate']),
            quantity: parseInt(record['OriginalQuantity']) || 1,
            price: this.parseAmount(record['OurPrice']),
            currency: record['OurPriceCurrencyCode']?.replace(/"/g, ''),
            tax: this.parseAmount(record['OurPriceTax']),
            listPrice: this.parseAmount(record['ListPriceAmount']),
            marketplace: record['Marketplace']?.replace(/"/g, ''),
            fulfilled: record['IsFulfilled'] === 'Yes',
            fulfilledDate: this.parseDate(record['FulfilledDate']),
            type: 'digital_item'
        };
    }

    /**
     * Parse date string to Date object
     */
    parseDate(dateString) {
        if (!dateString) return null;
        const cleaned = dateString.replace(/"/g, '');
        return cleaned ? new Date(cleaned) : null;
    }

    /**
     * Parse amount string to number
     */
    parseAmount(amountString) {
        if (!amountString) return 0;
        const cleaned = amountString.replace(/[",]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Categorize orders using ASIN-based logic
     */
    categorizeOrders() {
        console.log('🏷️ Categorizing orders using ASIN logic...');
        
        let categorized = 0;
        
        this.parsedData.unified.forEach(order => {
            if (order.asin || order.productName) {
                const category = this.determineCategory(order);
                order.category = category;
                
                if (category && category !== 'Business Operations') {
                    this.benefitCategories[category].push(order);
                    categorized++;
                }
                
                // Update ASIN mapping
                if (order.asin && category) {
                    this.asinMapping.set(order.asin, category);
                }
            }
        });

        console.log(`✅ Categorized ${categorized} orders for benefits tracking`);
    }

    /**
     * Determine category based on product name and ASIN
     */
    determineCategory(order) {
        const product = (order.productName || '').toLowerCase();
        
        // Board Amenities - food, drinks, comfort items
        if (this.matchesKeywords(product, [
            'water', 'food', 'coffee', 'snack', 'organic', 'honey', 'juice', 
            'drink', 'beverage', 'meal', 'lunch', 'dinner', 'breakfast'
        ])) {
            return 'Board Amenities';
        }
        
        // Venue Maintenance - cleaning, repairs, maintenance
        if (this.matchesKeywords(product, [
            'clean', 'detergent', 'soap', 'maintenance', 'repair', 'fix',
            'oxiclean', 'tide', 'downy', 'septic', 'ant killer', 'pest'
        ])) {
            return 'Venue Maintenance';
        }
        
        // Event Supplies - decorations, photography, events
        if (this.matchesKeywords(product, [
            'backdrop', 'decoration', 'photo', 'photography', 'event',
            'banner', 'custom', 'personalized', 'wedding', 'graduation'
        ])) {
            return 'Event Supplies';
        }
        
        // Board Technology - electronics, cameras, tech
        if (this.matchesKeywords(product, [
            'ring light', 'tripod', 'camera', 'electronic', 'tech', 'digital',
            'computer', 'tablet', 'phone', 'charger', 'cable'
        ])) {
            return 'Board Technology';
        }
        
        // Wellness & Health - health, organic, wellness
        if (this.matchesKeywords(product, [
            'organic', 'health', 'wellness', 'vitamin', 'supplement',
            'natural', 'pure', 'raw', 'unfiltered'
        ])) {
            return 'Wellness & Health';
        }
        
        // Professional Services - business-related services
        if (this.matchesKeywords(product, [
            'service', 'professional', 'business', 'consulting',
            'software', 'subscription', 'membership'
        ])) {
            return 'Professional Services';
        }
        
        // Default to Business Operations
        return 'Business Operations';
    }

    /**
     * Check if product matches any keywords
     */
    matchesKeywords(product, keywords) {
        return keywords.some(keyword => product.includes(keyword));
    }

    /**
     * Generate unified data format compatible with existing system
     */
    generateUnifiedOutput() {
        const unifiedOutput = this.parsedData.unified.map(order => ({
            id: order.id,
            date: order.date ? order.date.toISOString().split('T')[0] : '',
            amount: order.totalOwed || order.price || 0,
            description: order.productName || 'Digital Order',
            category: order.category || 'Business Operations',
            asin: order.asin || '',
            source: order.source,
            metadata: {
                unitPrice: order.unitPrice,
                tax: order.unitPriceTax || order.tax,
                shipping: order.shippingCharge,
                discounts: order.totalDiscounts,
                carrier: order.carrierTracking,
                paymentType: order.paymentType,
                orderStatus: order.orderStatus,
                quantity: order.quantity
            }
        }));

        return unifiedOutput;
    }

    /**
     * Parse all Amazon files from extracted directory
     */
    parseAllFiles() {
        console.log('🚀 Starting Amazon Official Data Migration');
        console.log('===========================================\n');

        const files = {
            retail: 'Retail.OrderHistory.1/Retail.OrderHistory.1.csv',
            digital: 'Digital-Ordering.1/Digital Orders.csv',
            digitalItems: 'Digital-Ordering.1/Digital Items.csv'
        };

        let totalOrders = 0;

        // Parse retail orders
        if (fs.existsSync(files.retail)) {
            totalOrders += this.parseRetailOrders(files.retail);
        }

        // Parse digital orders  
        if (fs.existsSync(files.digital)) {
            totalOrders += this.parseDigitalOrders(files.digital);
        }

        // Parse digital items
        if (fs.existsSync(files.digitalItems)) {
            this.parseDigitalItems(files.digitalItems);
        }

        // Categorize all orders
        this.categorizeOrders();

        console.log(`\n📊 PARSING COMPLETE`);
        console.log(`   Total Orders: ${totalOrders}`);
        console.log(`   Retail Orders: ${this.parsedData.retail.length}`);
        console.log(`   Digital Orders: ${this.parsedData.digital.length}`);
        console.log(`   Digital Items: ${this.parsedData.digitalItems.length}`);
        console.log(`   Unified Records: ${this.parsedData.unified.length}`);

        // Show category breakdown
        console.log(`\n🏷️ BENEFITS CATEGORIZATION:`);
        Object.keys(this.benefitCategories).forEach(category => {
            const count = this.benefitCategories[category].length;
            if (count > 0) {
                console.log(`   ${category}: ${count} items`);
            }
        });

        return this.generateUnifiedOutput();
    }

    /**
     * Save ASIN mapping database
     */
    saveASINMapping(filename = 'asin-category-mapping.json') {
        const mappingData = {
            mapping: Object.fromEntries(this.asinMapping),
            categories: this.benefitCategories,
            lastUpdated: new Date().toISOString(),
            totalASINs: this.asinMapping.size
        };

        fs.writeFileSync(filename, JSON.stringify(mappingData, null, 2));
        console.log(`💾 ASIN mapping saved to ${filename}`);
        
        return mappingData;
    }

    /**
     * Export to format compatible with existing system
     */
    exportToCSV(filename = 'amazon-official-data.csv') {
        const unifiedData = this.generateUnifiedOutput();
        
        const csvHeader = 'id,date,amount,description,category,asin,source,unitPrice,tax,shipping,discounts,carrier,paymentType,orderStatus,quantity\n';
        
        const csvRows = unifiedData.map(order => {
            const meta = order.metadata;
            return [
                order.id,
                order.date,
                order.amount,
                `"${order.description.replace(/"/g, '""')}"`,
                order.category,
                order.asin,
                order.source,
                meta.unitPrice || '',
                meta.tax || '',
                meta.shipping || '',
                meta.discounts || '',
                `"${(meta.carrier || '').replace(/"/g, '""')}"`,
                meta.paymentType || '',
                meta.orderStatus || '',
                meta.quantity || ''
            ].join(',');
        });

        const csvContent = csvHeader + csvRows.join('\n');
        fs.writeFileSync(filename, csvContent);
        
        console.log(`📄 Unified data exported to ${filename}`);
        console.log(`   Records: ${unifiedData.length}`);
        
        return filename;
    }
}

// Main execution
async function main() {
    const parser = new AmazonOfficialParser();
    
    try {
        // Parse all Amazon files
        const unifiedData = parser.parseAllFiles();
        
        // Save outputs
        const csvFile = parser.exportToCSV();
        const mappingFile = parser.saveASINMapping();
        
        console.log('\n🎉 MIGRATION PHASE 1 COMPLETE');
        console.log('==============================');
        console.log(`✅ Unified data: ${csvFile}`);
        console.log(`✅ ASIN mapping: asin-category-mapping.json`);
        console.log(`✅ Ready for Benefits system integration`);
        
        return {
            unifiedData,
            csvFile,
            mappingFile,
            parser
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { AmazonOfficialParser };

// Run if called directly
if (require.main === module) {
    main();
}
