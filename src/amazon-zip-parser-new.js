/**
 * Amazon ZIP File Parser for TSV Ledger
 * Automatically extracts and processes Amazon's official data exports
 * Handles both "Your Orders.zip" and "Subscriptions.zip" files
 *
 * This is the main entry point that integrates modular components:
 * - amazon-zip-extractor.js: Handles ZIP extraction
 * - amazon-zip-processor.js: Orchestrates file processing
 * - amazon-zip-parsers.js: Individual data parsers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import modular components
const { extractZipFile } = require('./amazon-integration/amazon-zip-extractor');
const { processExtractedFiles } = require('./amazon-integration/amazon-zip-processor');

class AmazonZipParser {
    constructor() {
        this.supportedFiles = {
            orderHistory: [
                'Retail.OrderHistory.1.csv',
                'Retail.OrderHistory.2.csv',
                'Digital.OrderHistory.1.csv'
            ],
            subscriptions: [
                'SubscribeAndSave.Subscriptions.1.json'
            ],
            cartHistory: [
                'Retail.CartItems.1.csv'
            ],
            returns: [
                'CustomerReturns.1.csv'
            ]
        };

        this.processingStats = {
            totalFiles: 0,
            processedFiles: 0,
            orders: 0,
            subscriptions: 0,
            cartItems: 0,
            returns: 0,
            errors: []
        };
    }

    /**
     * Main entry point - processes Amazon zip files
     * @param {string} zipFilePath - Path to the Amazon zip file
     * @param {Object} options - Processing options
     * @returns {Object} - Parsed data and statistics
     */
    async processZipFile(zipFilePath, options = {}) {
        console.log(`🔍 Processing Amazon zip file: ${path.basename(zipFilePath)}`);

        const extractDir = options.extractDir ||
            path.join(path.dirname(zipFilePath), 'temp-amazon-extract');

        try {
            // Extract zip file using modular extractor
            await extractZipFile(zipFilePath, extractDir);

            // Process extracted files using modular processor
            const result = await processExtractedFiles(extractDir, options, this.supportedFiles);

            // Update stats
            this.processingStats = {
                ...this.processingStats,
                ...result.stats
            };

            // Cleanup temporary files unless specified otherwise
            if (!options.keepExtracted) {
                await this.cleanupTempFiles(extractDir);
            }

            return {
                success: true,
                data: result.processedData,
                stats: this.processingStats,
                source: path.basename(zipFilePath)
            };

        } catch (error) {
            console.error('❌ Error processing zip file:', error.message);
            this.processingStats.errors.push(error.message);

            return {
                success: false,
                error: error.message,
                stats: this.processingStats
            };
        }
    }

    /**
     * Cleanup temporary extraction directory
     * @param {string} extractDir - Directory to remove
     */
    async cleanupTempFiles(extractDir) {
        try {
            if (fs.existsSync(extractDir)) {
                // Use system rm command for recursive deletion
                execSync(`rm -rf "${extractDir}"`);
                console.log(`🧹 Cleaned up temporary directory: ${extractDir}`);
            }
        } catch (error) {
            console.warn(`⚠️  Failed to cleanup ${extractDir}:`, error.message);
        }
    }

    /**
     * Get supported file patterns
     * @returns {Object} - Supported file patterns
     */
    getSupportedFiles() {
        return this.supportedFiles;
    }

    /**
     * Reset processing statistics
     */
    resetStats() {
        this.processingStats = {
            totalFiles: 0,
            processedFiles: 0,
            orders: 0,
            subscriptions: 0,
            cartItems: 0,
            returns: 0,
            errors: []
        };
    }
}

module.exports = AmazonZipParser;