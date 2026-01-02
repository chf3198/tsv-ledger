/**
 * Amazon Returns Parser
 * Handles parsing of Amazon returns CSV files
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
 * Process Amazon returns CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Object[]} - Processed returns
 */
async function processReturnsCSV(filePath) {
    const returns = [];
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');

    if (lines.length < 2) {
        console.log(`⚠️  Empty or invalid CSV file: ${path.basename(filePath)}`);
        return returns;
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

            const returnRecord = transformReturnRecord(record);
            if (returnRecord) {
                returns.push(returnRecord);
            }
        } catch (error) {
            console.warn(`⚠️  Skipping malformed line ${i} in ${path.basename(filePath)}`);
        }
    }

    console.log(`✅ Processed ${returns.length} returns from ${path.basename(filePath)}`);
    return returns;
}

/**
 * Transform raw return record to standardized format
 * @param {Object} record - Raw return record
 * @returns {Object|null} - Transformed return
 */
function transformReturnRecord(record) {
    try {
        const title = record['Title'] || record.title || record['Item Name'] || record['Product Name'] || 'Unknown Item';
        const returnDate = parseDate(record['Return Date'] || record.returnDate || record['Date']);
        const refundAmount = parsePrice(record['Refund Amount'] || record.refundAmount || record['Amount'] || 0);

        return {
            returnId: record['Return ID'] || record.returnId || `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: record['Order ID'] || record.orderId,
            returnDate: returnDate,
            title: title,
            asin: record['ASIN'] || record.asin,
            reason: record['Return Reason'] || record.returnReason,
            condition: record['Item Condition'] || record.itemCondition,
            refundAmount: refundAmount,
            currency: record['Currency'] || 'USD',
            quantity: parseInt(record['Quantity'] || record.quantity) || 1,
            // Enhanced fields for TSV Ledger integration
            tsvCategory: determineTSVCategoryFromTitle(title),
            isReturn: true,
            dataSource: 'amazon-zip-returns',
            processedDate: new Date().toISOString(),
            // For frontend sample display
            description: `Return: ${title}`,
            amount: -Math.abs(refundAmount), // Negative for returns/refunds
            date: returnDate,
        };
    } catch (error) {
        console.error('Error transforming return record:', error);
        return null;
    }
}

module.exports = {
    processReturnsCSV,
    transformReturnRecord,
    parseCSVLine,
    parseDate,
    parsePrice,
    determineTSVCategoryFromTitle
};