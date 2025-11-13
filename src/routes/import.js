/**
 * Import Routes Module
 *
 * Handles all data import related API endpoints for TSV Ledger.
 * Supports CSV, TSV, DAT files and Amazon ZIP archives.
 *
 * @module routes/import
 * @version 1.0.0
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { getAllExpenditures, addExpenditure } = require('../database');

// Import status tracking
let importStatus = {
  isImporting: false,
  currentStep: '',
  progress: 0,
  totalRecords: 0,
  processedRecords: 0,
  errors: []
};

// Import history tracking
let importHistory = [];

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../data', 'temp-uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for zip files
  },
  fileFilter: (req, file, cb) => {
    // Accept zip files and CSV files
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.zip') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP and CSV files are allowed'));
    }
  }
});

const router = express.Router();

/**
 * GET /api/import-status
 * Get current import status
 */
router.get('/import-status', (req, res) => {
  res.json(importStatus);
});

/**
 * GET /api/import-history
 * Get import history
 */
router.get('/import-history', (req, res) => {
  try {
    res.json({
      history: importHistory,
      total: importHistory.length
    });
  } catch (error) {
    console.error('Failed to retrieve import history:', error);
    res.status(500).json({ error: 'Failed to retrieve import history' });
  }
});

/**
 * POST /api/import-csv
 * Import expenditures from CSV/TSV/DAT file
 */
router.post('/import-csv', (req, res) => {
  try {
    console.log('=== IMPORT REQUEST RECEIVED ===');
    console.log('Request body size:', req.body ? JSON.stringify(req.body).length : 'N/A');

    const csvData = req.body.csvData;
    if (!csvData) {
      console.log('ERROR: No csvData in request body');
      return res.status(400).json({
        error: 'No data file provided',
        message: 'csvData field is required'
      });
    }

    if (typeof csvData !== 'string') {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'csvData must be a string'
      });
    }

    console.log('CSV Data length:', csvData.length);
    console.log('First 200 chars of data:', csvData.substring(0, 200));
    console.log('Contains tabs?', csvData.includes('\t'));
    console.log('Contains commas?', csvData.includes(','));

    const results = [];
    const errors = [];
    const skippedRows = [];

    // Parse CSV/TSV data (handle both comma and tab delimiters)
    const csvStream = require('stream').Readable.from(csvData);
    let lineNumber = 0;
    const separator = csvData.includes('\t') ? '\t' : ',';

    console.log('Using separator:', separator === '\t' ? 'TAB' : 'COMMA');

    csvStream
      .pipe(csv({
        separator: separator,
        skipEmptyLines: true
      }))
      .on('data', (data) => {
        lineNumber++;
        console.log(`\n=== LINE ${lineNumber} ===`);
        console.log('Raw data keys:', Object.keys(data));
        console.log('Raw data values:', Object.values(data));

        // Detect file format based on column headers
        const isAmazonFormat = data.hasOwnProperty('order id') || data.hasOwnProperty('Order ID') || data.hasOwnProperty('date');
        const isAmazonOfficialFormat = data.hasOwnProperty('id') && data.hasOwnProperty('asin') && data.hasOwnProperty('source');
        const isBankFormat = data.hasOwnProperty('Description') && data.hasOwnProperty('') && data.hasOwnProperty('Amount');

        console.log('Format detection - Amazon Chrome:', isAmazonFormat, 'Amazon Official:', isAmazonOfficialFormat, 'Bank:', isBankFormat);

        let dateValue, amountValue, descValue, expenditure;

        if (isAmazonOfficialFormat) {
          // Amazon Official Data format handling (Rich Amazon Export)
          console.log('🏆 Processing Amazon OFFICIAL data with rich metadata');

          // Skip if no date or amount
          dateValue = data.date || data.Date;
          amountValue = data.amount || data.Amount;

          if (!dateValue || !amountValue) {
            console.log('Skipping row - missing date or amount');
            skippedRows.push({ line: lineNumber, reason: 'Missing date or amount' });
            return;
          }

          descValue = data.title || data.Title || data.description || data.Description || 'Amazon Purchase';

          // Parse amount (remove $ and handle negative values)
          const parsedAmount = parseFloat(String(amountValue).replace(/[$,]/g, ''));
          if (isNaN(parsedAmount)) {
            console.log('Skipping row - invalid amount:', amountValue);
            skippedRows.push({ line: lineNumber, reason: 'Invalid amount format' });
            return;
          }

          expenditure = {
            date: dateValue,
            amount: Math.abs(parsedAmount), // Store as positive for expenses
            description: descValue,
            category: 'Amazon',
            source: 'amazon-official',
            orderId: data.id || data.orderId,
            asin: data.asin,
            metadata: {
              quantity: data.quantity || 1,
              condition: data.condition || 'new',
              seller: data.seller || 'Amazon',
              tax: data.tax || 0,
              shipping: data.shipping || 0
            }
          };

        } else if (isAmazonFormat) {
          // Amazon Chrome Extension format
          console.log('📦 Processing Amazon CHROME data');

          dateValue = data.date || data.Date;
          amountValue = data.amount || data.Amount || data.total || data.Total;

          if (!dateValue || !amountValue) {
            console.log('Skipping row - missing date or amount');
            skippedRows.push({ line: lineNumber, reason: 'Missing date or amount' });
            return;
          }

          descValue = data.title || data.Title || data.description || data.Description || 'Amazon Purchase';

          // Parse amount
          const parsedAmount = parseFloat(String(amountValue).replace(/[$,]/g, ''));
          if (isNaN(parsedAmount)) {
            console.log('Skipping row - invalid amount:', amountValue);
            skippedRows.push({ line: lineNumber, reason: 'Invalid amount format' });
            return;
          }

          expenditure = {
            date: dateValue,
            amount: Math.abs(parsedAmount),
            description: descValue,
            category: 'Amazon',
            source: 'amazon-chrome',
            orderId: data['order id'] || data.orderId,
            metadata: {
              tax: data.tax || 0,
              shipping: data.shipping || 0
            }
          };

        } else if (isBankFormat) {
          // Bank of America DAT format
          console.log('🏦 Processing BANK data');

          dateValue = data.Date || data.date;
          amountValue = data.Amount || data.amount;
          descValue = data.Description || data.description || 'Bank Transaction';

          if (!dateValue || !amountValue) {
            console.log('Skipping row - missing date or amount');
            skippedRows.push({ line: lineNumber, reason: 'Missing date or amount' });
            return;
          }

          // Parse amount (handle negative values for credits)
          const parsedAmount = parseFloat(String(amountValue).replace(/[$,]/g, ''));
          if (isNaN(parsedAmount)) {
            console.log('Skipping row - invalid amount:', amountValue);
            skippedRows.push({ line: lineNumber, reason: 'Invalid amount format' });
            return;
          }

          expenditure = {
            date: dateValue,
            amount: Math.abs(parsedAmount),
            description: descValue,
            category: 'Bank',
            source: 'bank-statement',
            metadata: {}
          };

        } else {
          // Generic CSV format
          console.log('📄 Processing GENERIC CSV data');

          // Try common column names
          dateValue = data.date || data.Date || data['Date'] || data['date/time'] || data['Date/Time'];
          amountValue = data.amount || data.Amount || data.total || data.Total || data.price || data.Price;
          descValue = data.description || data.Description || data.title || data.Title || data.item || data.Item || 'Transaction';

          if (!dateValue || !amountValue) {
            console.log('Skipping row - missing date or amount');
            skippedRows.push({ line: lineNumber, reason: 'Missing date or amount' });
            return;
          }

          const parsedAmount = parseFloat(String(amountValue).replace(/[$,]/g, ''));
          if (isNaN(parsedAmount)) {
            console.log('Skipping row - invalid amount:', amountValue);
            skippedRows.push({ line: lineNumber, reason: 'Invalid amount format' });
            return;
          }

          expenditure = {
            date: dateValue,
            amount: Math.abs(parsedAmount),
            description: descValue,
            category: 'Other',
            source: 'csv-import',
            metadata: {}
          };
        }

        console.log('Final expenditure object:', expenditure);
        results.push(expenditure);

      })
      .on('end', () => {
        console.log(`\n=== IMPORT COMPLETE ===`);
        console.log('Total rows processed:', lineNumber);
        console.log('Valid expenditures:', results.length);
        console.log('Errors:', errors.length);
        console.log('Skipped rows:', skippedRows.length);

        // Add all valid expenditures to database
        let addedCount = 0;
        let duplicateCount = 0;

        results.forEach(expenditure => {
          addExpenditure(expenditure, (err) => {
            if (err) {
              console.error('Failed to add expenditure:', err);
              errors.push({ expenditure, error: err.message });
            } else {
              addedCount++;
            }
          });
        });

        // Record import in history
        const importRecord = {
          timestamp: new Date().toISOString(),
          type: 'csv',
          recordsProcessed: results.length,
          recordsAdded: addedCount,
          duplicatesSkipped: duplicateCount,
          errors: errors.length,
          source: 'csv-import'
        };
        importHistory.unshift(importRecord);

        // Keep only last 50 imports
        if (importHistory.length > 50) {
          importHistory = importHistory.slice(0, 50);
        }

        res.json({
          success: true,
          message: `Import completed successfully`,
          stats: {
            totalRows: lineNumber,
            validRecords: results.length,
            addedToDatabase: addedCount,
            duplicatesSkipped: duplicateCount,
            errors: errors.length,
            skippedRows: skippedRows.length
          },
          errors: errors.slice(0, 10), // Return first 10 errors
          skippedRows: skippedRows.slice(0, 10) // Return first 10 skipped
        });

      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({
          error: 'Failed to parse CSV data',
          message: error.message
        });
      });

  } catch (error) {
    console.error('Import processing error:', error);
    res.status(500).json({
      error: 'Import processing failed',
      message: error.message
    });
  }
});

/**
 * POST /api/validate-amazon-zip
 * Validate Amazon ZIP file before import
 */
router.post('/validate-amazon-zip', upload.single('amazonZip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const amazonZipParser = require('../amazon-zip-parser');
    const validation = await amazonZipParser.validateZipFile(req.file.path);

    res.json(validation);
  } catch (error) {
    console.error('ZIP validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/import-amazon-zip
 * Import data from Amazon ZIP file
 */
router.post('/import-amazon-zip', upload.single('amazonZip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    importStatus = {
      isImporting: true,
      currentStep: 'Starting import...',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    const amazonZipParser = require('../amazon-zip-parser');
    const results = await amazonZipParser.processZipFile(req.file.path, (status) => {
      importStatus = { ...importStatus, ...status };
    });

    // Record import in history
    const importRecord = {
      timestamp: new Date().toISOString(),
      type: 'amazon-zip',
      recordsProcessed: results.totalRecords,
      recordsAdded: results.addedCount,
      duplicatesSkipped: results.duplicateCount,
      errors: results.errors.length,
      source: 'amazon-zip'
    };
    importHistory.unshift(importRecord);

    // Keep only last 50 imports
    if (importHistory.length > 50) {
      importHistory = importHistory.slice(0, 50);
    }

    importStatus = {
      isImporting: false,
      currentStep: 'Import completed',
      progress: 100,
      totalRecords: results.totalRecords,
      processedRecords: results.addedCount,
      errors: results.errors
    };

    res.json({
      success: true,
      message: 'Amazon ZIP import completed',
      stats: results
    });

  } catch (error) {
    console.error('Amazon ZIP import error:', error);
    importStatus = {
      isImporting: false,
      currentStep: 'Import failed',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      errors: [error.message]
    };

    res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
});

module.exports = router;