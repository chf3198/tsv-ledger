/**
 * Amazon ZIP File Processor
 * Processes extracted Amazon data files into structured data
 */

const fs = require('fs');
const path = require('path');

// Import parser functions from individual modules
const { processOrderHistoryCSV } = require('./parsers/order-parser');
const { processSubscriptionsJSON } = require('./parsers/subscription-parser');
const { processCartHistoryCSV } = require('./parsers/cart-parser');
const { processReturnsCSV } = require('./parsers/returns-parser');

/**
 * Process all extracted files and return structured data
 * @param {string} extractDir - Directory with extracted files
 * @param {Object} options - Processing options
 * @param {Object} supportedFiles - Supported file patterns
 * @returns {Object} - Processed data
 */
async function processExtractedFiles(extractDir, options = {}, supportedFiles) {
  const processedData = {
    orders: [],
    subscriptions: [],
    cartItems: [],
    returns: [],
    metadata: {
      processingDate: new Date().toISOString(),
      fileCount: 0
    }
  };

  const stats = {
    totalFiles: 0,
    processedFiles: 0,
    orders: 0,
    subscriptions: 0,
    errors: []
  };

  const files = getAllFiles(extractDir);
  stats.totalFiles = files.length;

  for (let idx = 0; idx < files.length; idx++) {
    const filePath = files[idx];
    const fileName = path.basename(filePath);

    if (options.onFileProcess) {
      options.onFileProcess(fileName, idx + 1, files.length);
    }

    console.log(`📄 Processing: ${fileName}`);

    try {
      if (supportedFiles.orderHistory.includes(fileName)) {
        const orders = await processOrderHistoryCSV(filePath);
        processedData.orders.push(...orders);
        stats.orders += orders.length;

      } else if (supportedFiles.subscriptions.includes(fileName)) {
        const subscriptions = await processSubscriptionsJSON(filePath);
        processedData.subscriptions.push(...subscriptions);
        stats.subscriptions += subscriptions.length;

      } else if (supportedFiles.cartHistory.includes(fileName)) {
        const cartItems = await processCartHistoryCSV(filePath);
        processedData.cartItems.push(...cartItems);

      } else if (supportedFiles.returns.includes(fileName)) {
        const returns = await processReturnsCSV(filePath);
        processedData.returns.push(...returns);

      } else if (options.processAllFiles) {
        console.log(`ℹ️  Unrecognized file: ${fileName}`);
      }

      stats.processedFiles++;

    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
      stats.errors.push(`${fileName}: ${error.message}`);
    }
  }

  processedData.metadata.fileCount = stats.processedFiles;
  return { processedData, stats };
}

/**
 * Get all files in directory recursively
 * @param {string} dir - Directory path
 * @returns {string[]} - File paths
 */
function getAllFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

module.exports = {
  processExtractedFiles,
  getAllFiles
};
