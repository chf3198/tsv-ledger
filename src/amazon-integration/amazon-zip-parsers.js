/**
 * Amazon ZIP File Parsers
 * Main parser module that imports individual parsers
 */

// Import individual parsers
const { processOrderHistoryCSV } = require('./parsers/order-parser');
const { processSubscriptionsJSON } = require('./parsers/subscription-parser');
const { processCartHistoryCSV } = require('./parsers/cart-parser');
const { processReturnsCSV } = require('./parsers/returns-parser');

module.exports = {
    processOrderHistoryCSV,
    processSubscriptionsJSON,
    processCartHistoryCSV,
    processReturnsCSV
};