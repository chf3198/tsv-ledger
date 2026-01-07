/**
 * ZIP Handler for Import
 *
 * Handles ZIP file imports for TSV Ledger, specifically Amazon data exports.
 * Orchestrates ZIP extraction, parsing, and data import.
 *
 * @module import/zip-handler
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Validates a ZIP file for Amazon data import
 * @param {string} zipFilePath - Path to the ZIP file
 * @returns {Promise<Object>} Validation result with isValid and fileList
 */
async function validateZipFile(zipFilePath) {
  try {
    const AmazonZipParser = require('../amazon-zip-parser');
    const parser = new AmazonZipParser();
    const validation = await parser.validateZipFile(zipFilePath);
    return validation;
  } catch (error) {
    throw new Error(`ZIP validation failed: ${error.message}`);
  }
}

/**
 * Imports data from Amazon ZIP file
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {Object} options - Import options
 * @param {Function} options.onProgress - Progress callback
 * @param {Function} options.onStatus - Status update callback
 * @returns {Promise<Object>} Import result with expenditures and metadata
 */
async function importFromZip(zipFilePath, options = {}) {
  const { onProgress, onStatus } = options;

  try {
    if (onStatus) {
      onStatus('Starting ZIP import...');
    }

    const AmazonZipParser = require('../amazon-zip-parser');
    const parser = new AmazonZipParser();

    if (onStatus) {
      onStatus('Extracting ZIP file...');
    }
    const extractResult = await parser.extractAndParse(zipFilePath, {
      onProgress: (step, progress) => {
        if (onProgress) {
          onProgress(progress);
        }
        if (onStatus) {
          onStatus(step);
        }
      }
    });

    if (onStatus) {
      onStatus('Processing extracted data...');
    }

    // Convert parsed data to expenditures
    const expenditures = convertParsedDataToExpenditures(extractResult);

    if (onStatus) {
      onStatus('Import completed successfully');
    }

    return {
      expenditures,
      metadata: {
        totalFiles: extractResult.totalFiles || 0,
        processedFiles: extractResult.processedFiles || 0,
        totalRecords: expenditures.length,
        source: 'amazon-zip'
      }
    };
  } catch (error) {
    throw new Error(`ZIP import failed: ${error.message}`);
  }
}

/**
 * Converts parsed Amazon data to expenditure objects
 * @param {Object} parsedData - Data from Amazon ZIP parser
 * @returns {Array} Array of expenditure objects
 */
function convertParsedDataToExpenditures(parsedData) {
  const expenditures = [];

  // Handle different data types from Amazon parser
  if (parsedData.orders && Array.isArray(parsedData.orders)) {
    parsedData.orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          expenditures.push({
            id: generateId(),
            date: order.orderDate || order.date,
            amount: item.price || item.amount || 0,
            description: item.title || item.description || 'Amazon Item',
            category: 'Amazon',
            source: 'amazon-zip',
            metadata: {
              orderId: order.orderId,
              asin: item.asin,
              quantity: item.quantity || 1
            }
          });
        });
      }
    });
  }

  // Handle cart data if available
  if (parsedData.cart && Array.isArray(parsedData.cart)) {
    parsedData.cart.forEach((item) => {
      expenditures.push({
        id: generateId(),
        date: new Date().toISOString().split('T')[0], // Current date for cart items
        amount: item.price || 0,
        description: item.title || 'Cart Item',
        category: 'Amazon Cart',
        source: 'amazon-zip-cart',
        metadata: {
          asin: item.asin
        }
      });
    });
  }

  return expenditures;
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Cleans up temporary files after import
 * @param {string} filePath - Path to file to clean up
 * @returns {void}
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
  }
}

module.exports = {
  validateZipFile,
  importFromZip,
  convertParsedDataToExpenditures,
  cleanupTempFile
};
