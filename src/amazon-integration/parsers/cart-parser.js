/**
 * Amazon Cart History Parser
 * Handles parsing of Amazon cart items CSV files
 */

const fs = require('fs');
const path = require('path');

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
 * Process Amazon cart history CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Object[]} - Processed cart items
 */
async function processCartHistoryCSV(filePath) {
    const cartItems = [];
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');

    if (lines.length < 2) {
        console.log(`⚠️  Empty or invalid CSV file: ${path.basename(filePath)}`);
        return cartItems;
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

            const cartItem = transformCartRecord(record);
            if (cartItem) {
                cartItems.push(cartItem);
            }
        } catch (error) {
            console.warn(`⚠️  Skipping malformed line ${i} in ${path.basename(filePath)}`);
        }
    }

    console.log(`✅ Processed ${cartItems.length} cart items from ${path.basename(filePath)}`);
    return cartItems;
}

/**
 * Transform raw cart record to standardized format
 * @param {Object} record - Raw cart record
 * @returns {Object|null} - Transformed cart item
 */
function transformCartRecord(record) {
    try {
        const productName = record['ProductName'] || record.productName || 'Unknown Item';
        const dateAdded = parseDate(record['DateAddedToCart'] || record.dateAddedToCart);

        return {
            cartId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dateAdded: dateAdded,
            productName: productName,
            asin: record['ASIN'] || record.asin,
            source: record['Source'] || record.source || 'Retail',
            cartDomain: record['CartDomain'] || record.cartDomain,
            cartList: record['CartList'] || record.cartList,
            quantity: parseInt(record['Quantity'] || record.quantity) || 1,
            oneClickBuyable: record['OneClickBuyable'] === 'Yes',
            toBeGiftWrapped: record['ToBeGiftWrapped'] === 'Yes',
            primeSubscription: record['PrimeSubscription'] === 'Yes',
            pantry: record['Pantry'] === 'Yes',
            addOn: record['AddOn'] === 'Yes',
            // Enhanced fields for TSV Ledger integration
            tsvCategory: determineTSVCategoryFromTitle(productName),
            isCartItem: true,
            dataSource: 'amazon-zip-cart',
            processedDate: new Date().toISOString(),
            // For frontend sample display
            description: `Cart Item: ${productName}`,
            amount: 0, // Cart items don't have purchase price yet
            date: dateAdded,
        };
    } catch (error) {
        console.error('Error transforming cart record:', error);
        return null;
    }
}

module.exports = {
    processCartHistoryCSV,
    transformCartRecord,
    parseCSVLine,
    parseDate,
    determineTSVCategoryFromTitle
};