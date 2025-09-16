/**
 * Amazon ZIP File Type Detection Utility
 * Automatically identifies and validates different Amazon export types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AmazonZipDetector {
    constructor() {
        // Define file patterns for different Amazon ZIP types
        this.zipTypes = {
            'orders': {
                name: 'Your Orders Export',
                description: 'Complete order history with digital orders, retail purchases, returns, and delivery photos',
                primaryFiles: [
                    'Retail.OrderHistory.1/Retail.OrderHistory.1.csv',
                    'Digital-Ordering.1/Digital Orders.csv',
                    'Digital-Ordering.1/Digital Items.csv'
                ],
                secondaryFiles: [
                    'Retail.CartItems.1/Retail.CartItems.1.csv',
                    'Retail.CustomerReturns.1/Retail.CustomerReturns.1.csv',
                    'YourOrders.PhotoOnDelivery/'
                ],
                expectedSize: '15-30MB',
                icon: 'fas fa-shopping-bag',
                color: 'primary'
            },
            'subscriptions': {
                name: 'Subscriptions Export', 
                description: 'All subscription data including Subscribe & Save, digital subscriptions, and billing information',
                primaryFiles: [
                    'SubscribeAndSave.Subscriptions.1/SubscribeAndSave.Subscriptions.1.json',
                    'Digital.Subscriptions.1/Subscriptions.csv',
                    'Digital.Subscriptions.1/Subscription Periods.csv'
                ],
                secondaryFiles: [
                    'Digital.Subscriptions.1/Billing Schedule Items.csv',
                    'Subscriptions.Digital-Billing-And-Refunds.1/Billing and Refunds Data.csv',
                    'CustomerCommunicationExperience.Preferences/'
                ],
                expectedSize: '100-500KB',
                icon: 'fas fa-sync-alt', 
                color: 'success'
            }
        };
    }

    /**
     * Analyze ZIP file and determine its type
     * @param {string} zipFilePath - Path to the ZIP file
     * @param {Object} options - Analysis options
     * @param {string} options.originalName - Original filename for extension validation
     * @returns {Object} - Detection results
     */
    async analyzeZipFile(zipFilePath, options = {}) {
        try {
            // Validate file exists and is a ZIP
            const validation = this.validateZipFile(zipFilePath, options.originalName);
            if (!validation.isValid) {
                return validation;
            }

            // Get ZIP contents listing
            const contents = await this.getZipContents(zipFilePath);
            
            // Detect ZIP type based on contents
            const detectedType = this.detectZipType(contents);
            
            // Get file statistics
            const stats = fs.statSync(zipFilePath);
            
            return {
                isValid: true,
                detected: true,
                type: detectedType.type,
                confidence: detectedType.confidence,
                zipInfo: this.zipTypes[detectedType.type],
                fileStats: {
                    fileName: options.originalName || path.basename(zipFilePath),
                    fileSize: this.formatFileSize(stats.size),
                    fileSizeBytes: stats.size,
                    lastModified: stats.mtime.toISOString()
                },
                contents: {
                    totalFiles: contents.length,
                    primaryFilesFound: detectedType.primaryFound,
                    secondaryFilesFound: detectedType.secondaryFound,
                    fileList: contents.slice(0, 10) // First 10 files for preview
                },
                recommendations: this.getProcessingRecommendations(detectedType.type, detectedType.confidence)
            };

        } catch (error) {
            return {
                isValid: false,
                detected: false,
                error: error.message,
                type: 'unknown'
            };
        }
    }

    /**
     * Validate that the file is a proper ZIP file
     * @param {string} zipFilePath - Path to the ZIP file
     * @param {string} originalName - Original filename for extension validation
     */
    validateZipFile(zipFilePath, originalName = null) {
        // Check file exists
        if (!fs.existsSync(zipFilePath)) {
            return {
                isValid: false,
                error: 'File not found',
                message: 'The selected file does not exist'
            };
        }

        // Check file extension using original name if provided, otherwise use path
        const filenameToCheck = originalName || zipFilePath;
        const ext = path.extname(filenameToCheck).toLowerCase();
        if (ext !== '.zip') {
            return {
                isValid: false,
                error: 'Invalid file type',
                message: 'Please select a ZIP file (.zip extension required)'
            };
        }

        // Check file size (Amazon ZIPs are typically > 1KB)
        const stats = fs.statSync(zipFilePath);
        if (stats.size < 1024) {
            return {
                isValid: false,
                error: 'File too small',
                message: 'ZIP file appears to be corrupted or empty'
            };
        }

        // Try to read ZIP header (basic validation)
        try {
            const buffer = fs.readFileSync(zipFilePath, { start: 0, end: 4 });
            const signature = buffer.toString('hex');
            
            // ZIP file signatures: PK (504B)
            if (!signature.startsWith('504b')) {
                return {
                    isValid: false,
                    error: 'Invalid ZIP format',
                    message: 'File does not appear to be a valid ZIP archive'
                };
            }
        } catch (error) {
            return {
                isValid: false,
                error: 'Cannot read file',
                message: 'Unable to read the ZIP file. It may be corrupted.'
            };
        }

        return { isValid: true };
    }

    /**
     * Get ZIP file contents using system unzip command
     */
    async getZipContents(zipFilePath) {
        try {
            // Use unzip -Z to get a more parseable format
            const output = execSync(`unzip -Z -1 "${zipFilePath}"`, { 
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 // 1MB buffer
            });

            // Parse the simple file listing (one file per line)
            const files = output.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.includes('total'))
                .filter(line => line.length > 0);

            console.log(`📁 Found ${files.length} files in ZIP`);
            return files;
        } catch (error) {
            // Fallback to regular unzip -l if -Z option fails
            try {
                const output = execSync(`unzip -l "${zipFilePath}"`, { 
                    encoding: 'utf8',
                    maxBuffer: 1024 * 1024 // 1MB buffer
                });

                // Parse unzip output to extract file names
                const lines = output.split('\n');
                const files = [];
                
                let inFileSection = false;
                let currentFilename = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    // Start of file listing
                    if (line.includes('Length') && line.includes('Name')) {
                        inFileSection = true;
                        continue;
                    }
                    
                    // End of file listing
                    if (line.includes('---------') && inFileSection) {
                        break;
                    }
                    
                    if (inFileSection && line.trim()) {
                        // Check if this line starts with file info (length, date, time)
                        const trimmedLine = line.trim();
                        const match = trimmedLine.match(/^\s*(\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)$/);
                        
                        if (match) {
                            // This is a complete file entry
                            const filename = match[4].trim();
                            if (filename && !filename.includes('files')) {
                                files.push(filename);
                            }
                        } else if (trimmedLine && !trimmedLine.match(/^\d/)) {
                            // This might be a continuation of a long filename
                            // Look at the previous line to see if it was incomplete
                            if (i > 0) {
                                const prevLine = lines[i - 1].trim();
                                const prevMatch = prevLine.match(/^\s*(\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.*)$/);
                                if (prevMatch && !files.includes(prevMatch[4] + trimmedLine)) {
                                    // Combine the lines
                                    const combinedName = prevMatch[4] + trimmedLine;
                                    // Remove the previous incomplete entry if it exists
                                    const lastFile = files[files.length - 1];
                                    if (lastFile === prevMatch[4]) {
                                        files[files.length - 1] = combinedName;
                                    } else {
                                        files.push(combinedName);
                                    }
                                }
                            }
                        }
                    }
                }

                console.log(`📁 Found ${files.length} files in ZIP (fallback parsing)`);
                return files;
            } catch (fallbackError) {
                throw new Error(`Cannot read ZIP contents: ${error.message} (fallback also failed: ${fallbackError.message})`);
            }
        }
    }

    /**
     * Detect ZIP type based on file contents
     */
    detectZipType(contents) {
        const results = {
            orders: { score: 0, primaryFound: [], secondaryFound: [] },
            subscriptions: { score: 0, primaryFound: [], secondaryFound: [] }
        };

        // Check for each ZIP type
        for (const [typeName, typeInfo] of Object.entries(this.zipTypes)) {
            // Check primary files (high weight)
            for (const primaryFile of typeInfo.primaryFiles) {
                if (contents.some(file => file.includes(primaryFile) || primaryFile.includes(file))) {
                    results[typeName].score += 10;
                    results[typeName].primaryFound.push(primaryFile);
                }
            }

            // Check secondary files (lower weight)
            for (const secondaryFile of typeInfo.secondaryFiles) {
                if (contents.some(file => file.includes(secondaryFile) || secondaryFile.includes(file))) {
                    results[typeName].score += 3;
                    results[typeName].secondaryFound.push(secondaryFile);
                }
            }
        }

        // Determine best match
        const ordersScore = results.orders.score;
        const subscriptionsScore = results.subscriptions.score;

        let detectedType, confidence;
        
        if (ordersScore > subscriptionsScore && ordersScore > 5) {
            detectedType = 'orders';
            confidence = Math.min(95, ordersScore * 3);
        } else if (subscriptionsScore > ordersScore && subscriptionsScore > 5) {
            detectedType = 'subscriptions';
            confidence = Math.min(95, subscriptionsScore * 3);
        } else {
            detectedType = 'unknown';
            confidence = 0;
        }

        return {
            type: detectedType,
            confidence: confidence,
            primaryFound: results[detectedType]?.primaryFound || [],
            secondaryFound: results[detectedType]?.secondaryFound || [],
            scores: results
        };
    }

    /**
     * Generate processing recommendations
     */
    getProcessingRecommendations(type, confidence) {
        const recommendations = [];

        if (confidence < 50) {
            recommendations.push({
                type: 'warning',
                title: 'Low Confidence Detection',
                message: 'File structure does not clearly match known Amazon export formats. Proceed with caution.'
            });
        }

        if (type === 'orders') {
            recommendations.push({
                type: 'info',
                title: 'Orders Export Detected',
                message: 'This file contains comprehensive order history. Processing will extract purchases, returns, and delivery information.'
            });
            
            if (confidence > 80) {
                recommendations.push({
                    type: 'success',
                    title: 'High Quality Data Expected',
                    message: 'File structure indicates complete order data with full transaction details.'
                });
            }
        }

        if (type === 'subscriptions') {
            recommendations.push({
                type: 'info',
                title: 'Subscriptions Export Detected',
                message: 'This file contains subscription data. Processing will extract recurring orders and billing information.'
            });
        }

        if (type === 'unknown') {
            recommendations.push({
                type: 'error',
                title: 'Unknown Amazon Export Type',
                message: 'This ZIP file does not match known Amazon data export formats. It may be corrupted or from a different source.'
            });
        }

        return recommendations;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get supported ZIP types information
     */
    getSupportedTypes() {
        return this.zipTypes;
    }
}

module.exports = AmazonZipDetector;
