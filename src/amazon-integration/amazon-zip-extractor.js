/**
 * Amazon ZIP File Extractor
 * Handles extraction and file matching for Amazon data exports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Supported Amazon data file patterns
 */
const SUPPORTED_FILES = {
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

/**
 * Extract zip file to temporary directory
 * @param {string} zipFilePath - Path to the zip file
 * @param {string} extractDir - Directory to extract to
 * @returns {string[]} - List of extracted file paths
 */
function extractZipFile(zipFilePath, extractDir) {
    if (!fs.existsSync(zipFilePath)) {
        throw new Error(`Zip file not found: ${zipFilePath}`);
    }

    // Create extraction directory
    if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
    }

    try {
        // List contents
        const listCmd = `unzip -l "${zipFilePath}"`;
        const listOutput = execSync(listCmd, { encoding: 'utf8' });

        // Parse and match files
        const filesInZip = parseZipContents(listOutput);
        const filesToExtract = matchSupportedFiles(filesInZip);

        if (filesToExtract.length === 0) {
            throw new Error('No supported data files found in ZIP archive');
        }

        console.log(`📋 Found ${filesToExtract.length} supported files to extract:`, filesToExtract.map(f => path.basename(f)));

        // Extract supported files
        for (const filePath of filesToExtract) {
            const extractCmd = `unzip -o "${zipFilePath}" "${filePath}" -d "${extractDir}"`;
            execSync(extractCmd, { stdio: 'pipe', encoding: 'utf8' });
        }

        console.log(`✅ Extracted ${filesToExtract.length} files to: ${extractDir}`);
        return filesToExtract;
    } catch (error) {
        throw new Error(`Failed to extract zip file: ${error.message}`);
    }
}

/**
 * Parse unzip -l output to get list of files in ZIP
 * @param {string} listOutput - Output from unzip -l
 * @returns {string[]} - List of file paths in zip
 */
function parseZipContents(listOutput) {
    const lines = listOutput.split('\n');
    const files = [];

    for (const line of lines) {
        if (line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
                const filePath = parts.slice(3).join(' ');
                if (filePath && !filePath.endsWith('/')) {
                    files.push(filePath);
                }
            }
        }
    }

    return files;
}

/**
 * Match files in ZIP to supported patterns
 * @param {string[]} filesInZip - Files in the zip
 * @returns {string[]} - Matched file paths
 */
function matchSupportedFiles(filesInZip) {
    const matchedFiles = [];
    const allSupportedPatterns = [
        ...SUPPORTED_FILES.orderHistory,
        ...SUPPORTED_FILES.subscriptions,
        ...SUPPORTED_FILES.cartHistory,
        ...SUPPORTED_FILES.returns
    ];

    for (const filePath of filesInZip) {
        const fileName = path.basename(filePath);
        for (const pattern of allSupportedPatterns) {
            if (fileName === pattern) {
                matchedFiles.push(filePath);
                break;
            }
        }
    }

    return matchedFiles;
}

module.exports = {
    extractZipFile,
    parseZipContents,
    matchSupportedFiles,
    SUPPORTED_FILES
};