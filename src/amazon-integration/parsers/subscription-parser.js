/**
 * Amazon Subscriptions Parser
 * Handles parsing of Amazon subscription JSON files
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
 * Process Amazon subscriptions JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object[]} - Processed subscriptions
 */
async function processSubscriptionsJSON(filePath) {
    try {
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const subscriptions = JSON.parse(jsonContent);

        const processedSubscriptions = subscriptions.map(sub => transformSubscriptionRecord(sub));

        console.log(`✅ Processed ${processedSubscriptions.length} subscriptions from ${path.basename(filePath)}`);
        return processedSubscriptions;

    } catch (error) {
        throw new Error(`Failed to process subscriptions JSON: ${error.message}`);
    }
}

/**
 * Transform raw subscription record to standardized format
 * @param {Object} subscription - Raw subscription
 * @returns {Object} - Transformed subscription
 */
function transformSubscriptionRecord(subscription) {
    return {
        subscriptionId: `sns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productTitle: subscription.productTitle,
        statusChangeDate: parseDate(subscription.statusChangeDate),
        website: subscription.website || 'Amazon.com',
        quantity: parseInt(subscription.quantity) || 1,
        marketplace: subscription.marketplace || 'US',
        subscriptionState: subscription.subscriptionState,
        merchant: subscription.merchant,
        eventDate: parseDate(subscription.eventDate),
        frequency: subscription.frequency,
        backupProductTitle: subscription.backupProductTitle,
        backupMerchant: subscription.backupMerchant,
        // Enhanced fields for TSV Ledger integration
        tsvCategory: determineTSVCategoryFromTitle(subscription.productTitle),
        isSubscription: true,
        subscriptionActive: subscription.subscriptionState === 'ACTIVE',
        dataSource: 'amazon-zip-subscriptions',
        processedDate: new Date().toISOString()
    };
}

module.exports = {
    processSubscriptionsJSON,
    transformSubscriptionRecord,
    parseDate,
    parsePrice,
    determineTSVCategoryFromTitle
};