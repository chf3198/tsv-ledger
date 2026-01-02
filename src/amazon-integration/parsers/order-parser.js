/**
 * Amazon Order History Parser
 * Handles parsing of Amazon order history CSV files
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse price string to number
 * @param {string|number} price - Price value
 * @returns {number} - Parsed price
 */
function parsePrice(price) {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    return parseFloat(price.toString().replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Parse date string
 * @param {string} dateStr - Date string
 * @returns {string|null} - ISO date string
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toISOString();
    } catch {
        return null;
    }
}

/**
 * Simple CSV line parser that handles quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} - Parsed values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && nextChar === '"') {
            // Handle escaped quotes
            current += '"';
            i++; // Skip next quote
        } else if (char === '"') {
            // Toggle quote state
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    values.push(current.trim());

    return values;
}

/**
 * Determine TSV category based on product data
 * @param {Object} record - Record
 * @returns {string} - Category
 */
function determineTSVCategory(record) {
    const title = (record['Title'] || record.title || '').toLowerCase();
    const category = (record['Category'] || record.category || '').toLowerCase();

    return determineTSVCategoryFromTitle(title) ||
           categorizeFromAmazonCategory(category) ||
           'Miscellaneous';
}

/**
 * Categorize products for TSV Ledger based on title
 * @param {string} title - Product title
 * @returns {string} - Category
 */
function determineTSVCategoryFromTitle(title) {
    if (!title) return 'Miscellaneous';

    const titleLower = title.toLowerCase();

    // Property maintenance categories
    if (titleLower.includes('clean') || titleLower.includes('soap') ||
        titleLower.includes('detergent') || titleLower.includes('sanitizer')) {
        return 'Property Cleaning & Maintenance';
    }

    if (titleLower.includes('trash') || titleLower.includes('garbage') ||
        titleLower.includes('bag') || titleLower.includes('disposal')) {
        return 'Property Supplies';
    }

    if (titleLower.includes('toilet') || titleLower.includes('paper towel') ||
        titleLower.includes('tissue') || titleLower.includes('napkin')) {
        return 'Guest Amenities';
    }

    // Guest amenities
    if (titleLower.includes('coffee') || titleLower.includes('tea') ||
        titleLower.includes('sweetener') || titleLower.includes('cream')) {
        return 'Guest Beverages';
    }

    if (titleLower.includes('shampoo') || titleLower.includes('conditioner') ||
        titleLower.includes('body wash') || titleLower.includes('lotion')) {
        return 'Guest Toiletries';
    }

    // Utilities and maintenance
    if (titleLower.includes('filter') || titleLower.includes('hvac') ||
        titleLower.includes('air') || titleLower.includes('water')) {
        return 'Utilities & Systems';
    }

    // Office and admin
    if (titleLower.includes('ibuprofen') || titleLower.includes('medication') ||
        titleLower.includes('first aid') || titleLower.includes('bandage')) {
        return 'Guest Safety & Health';
    }

    return 'Miscellaneous';
}

/**
 * Map Amazon categories to TSV categories
 * @param {string} amazonCategory - Amazon category
 * @returns {string} - TSV category
 */
function categorizeFromAmazonCategory(amazonCategory) {
    const categoryMappings = {
        'health_personal_care': 'Guest Toiletries',
        'grocery_gourmet_food': 'Guest Beverages',
        'home_kitchen': 'Property Supplies',
        'tools_home_improvement': 'Property Cleaning & Maintenance',
        'office_products': 'Office & Administrative',
        'pet_supplies': 'Property Exterior & Grounds'
    };

    return categoryMappings[amazonCategory] || 'Miscellaneous';
}

/**
 * Process Amazon order history CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Object[]} - Processed orders
 */
async function processOrderHistoryCSV(filePath) {
    const orders = [];
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');

    if (lines.length < 2) {
        console.log(`⚠️  Empty or invalid CSV file: ${path.basename(filePath)}`);
        return orders;
    }

    // Parse header row
    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const values = parseCSVLine(line);
            if (values.length !== headers.length) continue;

            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });

            const order = transformOrderRecord(record);
            if (order) {
                orders.push(order);
            }
        } catch (error) {
            console.warn(`⚠️  Skipping malformed line ${i} in ${path.basename(filePath)}`);
        }
    }

    console.log(`✅ Processed ${orders.length} orders from ${path.basename(filePath)}`);
    return orders;
}

/**
 * Transform raw order record to standardized format
 * @param {Object} record - Raw record
 * @returns {Object|null} - Transformed order
 */
function transformOrderRecord(record) {
    try {
        // Fallbacks for description, amount, and date
        const title = record['Title'] || record.title || record['Item Name'] || record['Product Name'] || 'Unknown Item';
        const purchasePrice = parsePrice(record['Purchase Price USD'] || record.purchasePrice || record['Item Total'] || record['Total Charged'] || 0);
        const orderDate = parseDate(record['Order Date'] || record.orderDate || record['Date']);

        return {
            orderId: record['Order ID'] || record.orderId,
            orderDate: orderDate,
            title: title,
            category: record['Category'] || record.category,
            asin: record['ASIN'] || record.asin,
            unspscCode: record['UNSPSC Code'] || record.unspscCode,
            website: record['Website'] || record.website || 'Amazon.com',
            releaseDate: parseDate(record['Release Date'] || record.releaseDate),
            condition: record['Condition'] || record.condition,
            seller: record['Seller'] || record.seller,
            sellerCredentials: record['Seller Credentials'] || record.sellerCredentials,
            listPrice: parsePrice(record['List Price USD'] || record.listPrice),
            purchasePrice: purchasePrice,
            quantity: parseInt(record['Quantity'] || record.quantity) || 1,
            paymentInstrument: record['Payment Instrument Type'] || record.paymentInstrument,
            orderStatus: record['Order Status'] || record.orderStatus,
            shipmentStatus: record['Shipment Status'] || record.shipmentStatus,
            shipDate: parseDate(record['Ship Date'] || record.shipDate),
            shippingAddress: {
                name: record['Shipping Address Name'] || record.shippingAddressName,
                street1: record['Shipping Address Street 1'] || record.shippingAddressStreet1,
                street2: record['Shipping Address Street 2'] || record.shippingAddressStreet2,
                city: record['Shipping Address City'] || record.shippingAddressCity,
                state: record['Shipping Address State'] || record.shippingAddressState,
                zipCode: record['Shipping Address Zip'] || record.shippingAddressZip
            },
            billingAddress: {
                name: record['Billing Address Name'] || record.billingAddressName,
                street1: record['Billing Address Street 1'] || record.billingAddressStreet1,
                street2: record['Billing Address Street 2'] || record.billingAddressStreet2,
                city: record['Billing Address City'] || record.billingAddressCity,
                state: record['Billing Address State'] || record.billingAddressState,
                zipCode: record['Billing Address Zip'] || record.billingAddressZip
            },
            carrier: record['Carrier Name & Tracking Number'] || record.carrier,
            productCondition: record['Product Condition'] || record.productCondition,
            currency: record['Currency'] || 'USD',
            poBoxApo: record['PO Box or APO'] || record.poBoxApo,
            orderingCustomer: record['Ordering Customer'] || record.orderingCustomer,
            // Enhanced fields for TSV Ledger integration
            tsvCategory: determineTSVCategory(record),
            isSubscription: false,
            dataSource: 'amazon-zip-orders',
            processedDate: new Date().toISOString(),
            // For frontend sample display
            description: `Amazon Order ${record['Order ID'] || record.orderId || ''}: ${title}`,
            amount: purchasePrice,
            date: orderDate,
        };
    } catch (error) {
        console.error('Error transforming order record:', error);
        return null;
    }
}

module.exports = {
    processOrderHistoryCSV,
    transformOrderRecord,
    parseCSVLine,
    parsePrice,
    parseDate,
    determineTSVCategory
};