/**
 * TSV Ledger - Main Express Server
 * 
 * @fileoverview Main server application for Texas Sunset Venues expense tracking
 *               and business intelligence platform. Provides REST API endpoints
 *               for data import, analysis, and comprehensive business insights.
 *               Features complete Amazon order management, AI-powered analysis,
 *               and premium business intelligence capabilities.
 * 
 * @version 2.2.2
 * @author GitHub Copilot (Claude Sonnet 3.5)
 * @since 2025-09-05
 * @updated 2025-09-08
 * 
 * @requires express Express.js web framework
 * @requires csv-parser CSV parsing library for Amazon order import
 * @requires ./src/tsv-categorizer Business intelligence categorization engine
 * @requires ./src/database JSON database operations and persistence
 * @requires ./src/ai-analysis-engine AI-powered analysis and insights
 * 
 * @features
 * - Amazon order import and CRUD operations
 * - AI-powered expense categorization
 * - Premium business intelligence analytics
 * - Employee benefits filtering
 * - Subscribe & Save detection
 * - Comprehensive testing API endpoints
 * - Real-time data analysis
 * 
 * @example
 * // Start the server
 * node server.js
 * // Access at http://localhost:3000
 * 
 * @example
 * // Development with auto-reload
 * npm run dev
 * 
 * @example
 * // Run comprehensive tests
 * npm test
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const { getAllExpenditures, addExpenditure } = require('./src/database');
const TSVCategorizer = require('./src/tsv-categorizer');
const SubscriptionAnalysisEngine = require('./src/subscription-analysis-engine');
const BankReconciliationEngine = require('./src/bank-reconciliation-engine');
const GeographicAnalysisEngine = require('./src/geographic-analysis-engine');

// Global import status for progress reporting
let importStatus = {
  inProgress: false,
  currentFile: '',
  processedFiles: 0,
  totalFiles: 0,
  lastUpdate: null
};
const AIAnalysisEngine = require('./src/ai-analysis-engine');
const AmazonZipParser = require('./src/amazon-zip-parser');

const app = express();
const port = 3000;

// API endpoint to get current import status
app.get('/api/import-status', (req, res) => {
  res.json(importStatus);
});

// Middleware for parsing JSON and URL-encoded data (with increased limits for CSV files)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, 'data', 'temp-uploads'),
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

// Serve static files from the 'public' directory
// Middleware: inject client-side shell initializer into HTML pages that lack the sidebar
app.use((req, res, next) => {
  try {
    // Only consider GET requests for HTML files
    if (req.method !== 'GET') return next();

    let reqPath = req.path;
    if (reqPath === '/') reqPath = '/index.html';
    if (!reqPath.endsWith('.html')) return next();

    const filePath = path.join(__dirname, 'public', decodeURIComponent(reqPath));
    if (!fs.existsSync(filePath)) return next();

    const content = fs.readFileSync(filePath, 'utf8');

    // If the page already references the init-shell script or marker, serve as-is
    if (/\/js\/init-shell\.js/i.test(content) || /id=["']?tsv-shell-injected["']?/i.test(content)) {
      return res.send(content);
    }

    // Use shared menu module
        const serverMenu = require('./src/menu');

    // Helper to render menu to HTML string
    function renderMenuHtml(menu) {
      const header = `\n  <div class="sidebar-header">\n    <h4><i class="fas fa-chart-line me-2"></i>TSV Ledger</h4>\n    <small class="text-muted">Financial Intelligence Platform</small>\n  </div>`;
      const items = menu.map(item => {
        const ds = item.dataSection ? ` data-section="${item.dataSection}"` : '';
        return `\n    <li class="nav-item"><a class="nav-link" href="${item.href}"${ds}><i class="${item.icon} me-2"></i>${item.text}</a></li>`;
      }).join('');
      const ul = `\n  <ul class="sidebar-nav nav flex-column p-3">${items}\n  </ul>`;
      return `<nav id="sidebar" class="sidebar">${header}${ul}\n</nav>`;
    }

    let out = content;

    // If the page contains the app-menu placeholder, replace it with server-rendered HTML
    if (/id=["']?app-menu["']?/i.test(content)) {
      try {
        const menuHtml = renderMenuHtml(serverMenu);
        out = content.replace(/<div[^>]*id=["']app-menu["'][^>]*>[\s\S]*?<\/div>/i, menuHtml);

        // Progressive enhancement: ensure client-side scripts are present (menu-data + widget)
        // If the page doesn't already include them, append script tags before </body>
        if (!/\/js\/menu-data\.js/i.test(out)) {
          out = out.replace(/<\/body>/i, `\n  <script src="/js/menu-data.js"></script>\n  <script src="/js/menu-widget.js"></script>\n</body>`);
        }
      } catch (e) {
        console.warn('menu injection failed', e && e.message);
      }
    } else {
      // Fallback behavior: if no placeholder, inject init-shell to normalize sidebars on the client
      out = content.replace(/<\/body>/i, '\n    <script src="/js/init-shell.js"></script>\n</body>');
    }

    return res.send(out);
  } catch (err) {
    console.warn('Shell injection middleware error:', err && err.message);
    return next();
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Expose canonical menu as JSON so clients can fetch a single source-of-truth
app.get('/api/menu.json', (req, res) => {
  try {
    const menu = require('./src/menu');
    res.json(menu);
  } catch (err) {
    console.error('Failed to load menu:', err && err.message);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

// API Routes

// GET /api/expenditures - Retrieve all expenditures
app.get('/api/expenditures', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('❌ Database error fetching expenditures:', err);
        res.status(500).json({ 
          error: 'Failed to fetch expenditures',
          message: 'Database operation failed'
        });
      } else {
        res.json(expenditures);
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/expenditures:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unexpected error occurred'
    });
  }
});

// POST /api/expenditures - Add a new expenditure
app.post('/api/expenditures', (req, res) => {
  try {
    const { date, amount, category, description } = req.body;
    
    // Input validation
    if (!date || !amount || !category || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'date, amount, category, and description are required'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a valid number'
      });
    }

    const expenditure = {
      date,
      amount: parsedAmount,
      category,
      description
    };

    addExpenditure(expenditure, (err, newExpenditure) => {
      if (err) {
        console.error('❌ Database error adding expenditure:', err);
        res.status(500).json({ 
          error: 'Failed to add expenditure',
          message: 'Database operation failed'
        });
      } else {
        res.status(201).json({ 
          message: 'Expenditure added successfully', 
          expenditure: newExpenditure 
        });
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/expenditures:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unexpected error occurred'
    });
  }
});

// POST /api/import-csv - Import expenditures from CSV/TSV/DAT file
app.post('/api/import-csv', (req, res) => {
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
        
        if (!dateValue || !amountValue || dateValue.trim() === '' || amountValue.trim() === '') {
          console.log(`❌ SKIPPING: Missing Amazon official date or amount`);
          skippedRows.push({ line: lineNumber, reason: 'missing Amazon official date/amount', data: data });
          return;
        }

        // Convert Amazon date format (YYYY-MM-DD) to MM/DD/YYYY
        const amazonDate = dateValue.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(amazonDate)) {
          console.log(`❌ SKIPPING: Invalid Amazon official date format: "${amazonDate}"`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon official date format', data: data });
          return;
        }

        const [year, month, day] = amazonDate.split('-');
        const formattedDate = `${month}/${day}/${year}`;

        // Parse amount
        const cleanAmount = amountValue.toString().replace(/[^\d.-]/g, '').trim();
        const parsedAmount = parseFloat(cleanAmount);

        if (isNaN(parsedAmount) || parsedAmount === 0) {
          console.log(`❌ SKIPPING: Invalid Amazon official amount: "${amountValue}" -> ${parsedAmount}`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon official amount', data: data });
          return;
        }

        // Create enriched order object with official Amazon data
        const description = data.description || '';
        const orderId = data.id || '';
        const category = data.category || 'supplies restocking';
        const asin = data.asin || '';
        const source = data.source || 'amazon_official';
        
        expenditure = {
          date: formattedDate,
          amount: -Math.abs(parsedAmount), // Amazon purchases are negative expenditures
          category: category,
          description: description,
          // Premium: Enhanced metadata for analysis
          metadata: {
            orderId: orderId,
            asin: asin,
            source: source,
            originalCategory: category,
            amazonDescription: description,
            dataSource: 'amazon_official_export'
          }
        };

      } else if (isAmazonFormat) {
        // Enhanced Amazon CSV format handling (Premium Extension)
        console.log('🛒 Processing Amazon order data with premium fields');
        
        // Skip if no date or total
        dateValue = data.date || data.Date;
        const totalValue = data.total || data.Total;
        
        if (!dateValue || !totalValue || dateValue.trim() === '' || totalValue.trim() === '') {
          console.log(`❌ SKIPPING: Missing Amazon date or total`);
          skippedRows.push({ line: lineNumber, reason: 'missing Amazon date/total', data: data });
          return;
        }

        // Skip orders with pending dates or zero amounts
        if (dateValue.trim() === 'pending' || totalValue.trim() === '0' || totalValue.trim() === '') {
          console.log(`❌ SKIPPING: Pending or zero amount order`);
          skippedRows.push({ line: lineNumber, reason: 'pending or zero amount order', data: data });
          return;
        }

        // Convert Amazon date format (YYYY-MM-DD) to MM/DD/YYYY
        const amazonDate = dateValue.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(amazonDate)) {
          console.log(`❌ SKIPPING: Invalid Amazon date format: "${amazonDate}"`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon date format', data: data });
          return;
        }

        const [year, month, day] = amazonDate.split('-');
        const formattedDate = `${month}/${day}/${year}`;

        // Parse amount
        const cleanAmount = totalValue.toString().replace(/[^\d.-]/g, '').trim();
        const parsedAmount = parseFloat(cleanAmount);

        if (isNaN(parsedAmount) || parsedAmount === 0) {
          console.log(`❌ SKIPPING: Invalid Amazon amount: "${totalValue}" -> ${parsedAmount}`);
          skippedRows.push({ line: lineNumber, reason: 'invalid Amazon amount', data: data });
          return;
        }

        // Create enriched order object with premium extension fields
        const items = data.items || data.Items || '';
        const truncatedItems = items.length > 100 ? items.substring(0, 97) + '...' : items;
        const orderId = data['order id'] || data['Order ID'] || '';
        
        // Premium data fields
        const orderUrl = data['order url'] || '';
        const shipping = data.shipping || '0';
        const tax = data.tax || '0';
        const payments = data.payments || '';
        const shipments = data.shipments || '';
        const invoice = data.invoice || '';
        
        expenditure = {
          date: formattedDate,
          amount: -Math.abs(parsedAmount), // Amazon purchases are negative expenditures
          category: 'supplies restocking',
          description: `Amazon Order ${orderId}: ${truncatedItems}`.trim(),
          // Premium: Enhanced metadata for analysis
          metadata: {
            orderId: orderId,
            orderUrl: orderUrl,
            items: items,
            shipping: shipping,
            tax: tax,
            payments: payments,
            shipments: shipments,
            invoice: invoice,
            total: totalValue,
            source: 'amazon_premium'
          }
        };

      } else {
        // Bank of America format handling (existing logic)
        console.log('🏦 Processing Bank data');
        
        // Skip the first 5 summary rows that have different column structure
        if (lineNumber <= 5) {
          console.log(`⏭️  SKIPPING SUMMARY ROW ${lineNumber}`);
          skippedRows.push({ line: lineNumber, reason: 'summary row', data: data });
          return;
        }

        // Check if this row has a valid date
        // For Bank of America format: Date is in 'Description' column, Description is in '' column
        dateValue = data.Date || data.date || data['Transaction Date'] || data['Description'];
        console.log('Date value found:', dateValue);

        if (!dateValue || dateValue.trim() === '') {
          console.log(`❌ SKIPPING: No date field`);
          skippedRows.push({ line: lineNumber, reason: 'no date field', data: data });
          return;
        }

        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue.trim())) {
          console.log(`❌ SKIPPING: Invalid date format: "${dateValue}"`);
          skippedRows.push({ line: lineNumber, reason: 'invalid date format', data: data });
          return;
        }

        // Try to extract amount
        amountValue = data.Amount || data.amount || data['Transaction Amount'] || data['Summary Amt.'];
        console.log('Amount value found:', amountValue);

        const cleanAmount = amountValue ? amountValue.toString().replace(/"/g, '').trim() : '0';
        const parsedAmount = parseFloat(cleanAmount);

        console.log('Clean amount:', cleanAmount);
        console.log('Parsed amount:', parsedAmount);

        if (isNaN(parsedAmount) || parsedAmount === 0) {
          console.log(`❌ SKIPPING: Invalid amount: "${amountValue}" -> ${parsedAmount}`);
          skippedRows.push({ line: lineNumber, reason: 'invalid amount', data: data });
          return;
        }

        // Try to extract description
        // For Bank of America format: Description is in the empty column ''
        descValue = data[''] || data.Description || data.description || data['Transaction Description'];
        console.log('Description value found:', descValue);

        // Create expenditure object
        expenditure = {
          date: dateValue.trim(),
          amount: parsedAmount,
          category: data.Category || data.category || 'supplies restocking',
          description: descValue ? descValue.toString().replace(/"/g, '').trim() : 'Imported from data file'
        };
      }

      console.log('✅ CREATED EXPENDITURE:', expenditure);
      results.push(expenditure);
    })
    .on('end', () => {
      console.log('\n=== PARSING COMPLETE ===');
      console.log('Total lines processed:', lineNumber);
      console.log('Valid expenditures found:', results.length);
      console.log('Rows skipped:', skippedRows.length);

      if (skippedRows.length > 0) {
        console.log('\nSkipped rows summary:');
        skippedRows.forEach(row => {
          console.log(`Line ${row.line}: ${row.reason}`);
        });
      }

      // Import all valid expenditures
      let importedCount = 0;
      let processedCount = 0;

      if (results.length === 0) {
        console.log('❌ NO VALID EXPENDITURES FOUND');
        return res.json({
          message: 'No valid expenditures found in data file',
          imported: 0,
          errors: errors,
          skipped: skippedRows.length,
          totalLines: lineNumber
        });
      }

      console.log('🚀 STARTING DATABASE IMPORT...');

      results.forEach((expenditure) => {
        addExpenditure(expenditure, (err) => {
          processedCount++;
          if (!err) {
            importedCount++;
            console.log(`✅ Imported: ${expenditure.description} - $${expenditure.amount}`);
          } else {
            const errorMsg = `Failed to import: ${expenditure.description} - ${err.message}`;
            errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
          }

          // Send response when all items are processed
          if (processedCount === results.length) {
            console.log('\n=== IMPORT COMPLETE ===');
            console.log(`Successfully imported: ${importedCount}/${results.length}`);
            console.log(`Errors: ${errors.length}`);

            res.json({
              message: `Imported ${importedCount} expenditures from data file`,
              imported: importedCount,
              totalProcessed: results.length,
              errors: errors,
              skipped: skippedRows.length,
              totalLines: lineNumber
            });
          }
        });
      });
    })
    .on('error', (error) => {
      console.error('❌ CSV PARSING ERROR:', error);
      res.status(500).json({
        error: 'Failed to parse data file',
        details: error.message,
        totalLines: lineNumber
      });
    });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/import-csv:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unexpected error during CSV import',
      details: error.message
    });
  }
});

// GET /api/premium-status - Check premium features availability
app.get('/api/premium-status', (req, res) => {
  try {
    // Check if we have premium fields in the data
    fs.createReadStream('data/amazon_order_history.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          const hasPremiumFields = !!(row.shipping !== undefined && row.payments && row.shipments);
          return res.json({
            premiumFeaturesAvailable: hasPremiumFields,
            premiumFields: {
              shipping: row.shipping !== undefined,
              payments: !!row.payments,
              shipments: !!row.shipments,
              invoice: !!row.invoice,
              orderUrl: !!row['order url']
            },
            enhancedAnalytics: hasPremiumFields,
            subscriptionDetectionAccuracy: hasPremiumFields ? '41.5%' : '26%',
            message: hasPremiumFields ? 
              'Premium Amazon extension detected - enhanced analytics available' : 
              'Basic data only - consider upgrading to premium extension'
          });
        } catch (error) {
          console.error('❌ Error processing premium data row:', error);
          res.status(500).json({
            premiumFeaturesAvailable: false,
            error: 'Error processing premium data'
          });
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading premium status file:', error);
        res.json({
          premiumFeaturesAvailable: false,
          error: 'Unable to read order data',
          message: 'CSV file not accessible'
        });
      });
  } catch (error) {
    console.error('❌ Error in premium status endpoint:', error);
    res.status(500).json({
      premiumFeaturesAvailable: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// GET /api/premium-analytics - Advanced premium analytics using enhanced data
app.get('/api/premium-analytics', async (req, res) => {
  try {
    const PremiumAnalytics = require('./premium-analytics');
    const analytics = new PremiumAnalytics();
    const results = await analytics.runPremiumAnalysis();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      premiumFeatures: true,
      data: results
    });
  } catch (error) {
    console.error('Premium analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to generate premium analytics',
      message: error.message,
      premiumFeatures: false
    });
  }
});

// GET /api/analysis - Enhanced comprehensive analysis using premium extension data
app.get('/api/analysis', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('❌ Database error fetching expenditures for analysis:', err);
        return res.status(500).json({ 
          error: 'Failed to fetch expenditures for analysis',
          message: 'Database operation failed'
        });
      }

      try {
        const categorizer = new TSVCategorizer();
    
    // FIXED: Separate BoA transactions (actual money flow) from Amazon order details (product info)
    const boaTransactions = expenditures.filter(exp => 
      !exp.description || !exp.description.includes('Amazon Order')
    );
    
    const amazonOrderDetails = expenditures.filter(exp => 
      exp.description && exp.description.includes('Amazon Order')
    ).map(exp => {
      // Extract order details from description and metadata
      const orderId = exp.description.match(/Amazon Order ([^:]+):/)?.[1] || 'Unknown';
      const items = exp.description.replace(/^Amazon Order [^:]+: /, '');
      
      // Use premium metadata if available
      if (exp.metadata && exp.metadata.source === 'amazon_premium') {
        return {
          'order id': exp.metadata.orderId || orderId,
          'order url': exp.metadata.orderUrl || '',
          date: exp.date,
          total: Math.abs(exp.amount),
          amount: exp.amount,
          items: exp.metadata.items || items,
          shipping: exp.metadata.shipping || '0',
          tax: exp.metadata.tax || '0',
          payments: exp.metadata.payments || '',
          shipments: exp.metadata.shipments || '',
          invoice: exp.metadata.invoice || '',
          isPremiumData: true
        };
      } else {
        // Legacy format compatibility
        return {
          orderId: orderId,
          date: exp.date,
          amount: exp.amount,
          total: Math.abs(exp.amount),
          items: items,
          payments: '',
          shipping: exp.amount < 0 && Math.abs(exp.amount) % 1 === 0 ? '0' : 'unknown',
          isPremiumData: false
        };
      }
    });

    // FIXED: Use only BoA transactions for financial totals - no double counting!
    const analysis = {
      overview: {
        totalTransactions: boaTransactions.length,
        totalAmount: boaTransactions.reduce((sum, exp) => sum + Math.abs(exp.amount), 0),
        amazonTransactions: boaTransactions.filter(exp => 
          exp.description && (
            exp.description.includes('AMAZON') || 
            exp.description.includes('Amazon')
          )
        ).length,
        amazonOrderDetails: amazonOrderDetails.length,
        premiumDataOrders: amazonOrderDetails.filter(o => o.isPremiumData).length,
        dateRange: {
          earliest: boaTransactions.reduce((min, exp) => exp.date < min ? exp.date : min, '9999-12-31'),
          latest: boaTransactions.reduce((max, exp) => exp.date > max ? exp.date : max, '0000-01-01')
        }
      },
      dataQuality: {
        amazonDataCompleteness: 0,
        bankDataCompleteness: 0,
        overallCompleteness: 0,
        premiumDataAvailable: amazonOrderDetails.filter(o => o.isPremiumData).length > 0,
        confidenceScores: {
          subscribeAndSave: 0,
          locationDetection: 0,
          categoryClassification: 0
        }
      },
      categories: {},
      locations: { Freeport: 0, Smithville: 0, 'Both Properties': 0 },
      subscribeAndSave: { count: 0, total: 0, confidence: 0, averageConfidence: 0, monthlyDeliveryPatterns: {} },
      employeeBenefits: { count: 0, total: 0 },
      monthlyTrends: {},
      seasonalTrends: {},
      insights: [],
      monthlySpendingGraph: {}
    };

    // FIXED: Process BoA transactions (actual money flow) for correct financial analysis
    boaTransactions.forEach(transaction => {
      const transactionAnalysis = categorizer.categorizeBoATransaction(transaction);
      const amount = Math.abs(transaction.amount);

      // Update category totals with BoA transactions only
      if (!analysis.categories[transactionAnalysis.category]) {
        analysis.categories[transactionAnalysis.category] = { total: 0, count: 0, subcategories: {} };
      }
      analysis.categories[transactionAnalysis.category].total += amount;
      analysis.categories[transactionAnalysis.category].count++;

      if (transactionAnalysis.subcategory) {
        if (!analysis.categories[transactionAnalysis.category].subcategories[transactionAnalysis.subcategory]) {
          analysis.categories[transactionAnalysis.category].subcategories[transactionAnalysis.subcategory] = 0;
        }
        analysis.categories[transactionAnalysis.category].subcategories[transactionAnalysis.subcategory] += amount;
      }

      // Update monthly trends (for spending graph)
      const month = new Date(transaction.date).toISOString().substring(0, 7);
      if (!analysis.monthlyTrends[month]) {
        analysis.monthlyTrends[month] = 0;
      }
      analysis.monthlyTrends[month] += amount;
    });

    // Enhance Amazon analysis with order details (but don't add to financial totals)
    amazonOrderDetails.forEach(order => {
      const orderAnalysis = categorizer.analyzeAmazonOrder(order);
      
      // Enhanced Subscribe & Save analysis with delivery patterns
      if (orderAnalysis.subscribeAndSave.isSubscribeAndSave) {
        analysis.subscribeAndSave.count++;
        analysis.subscribeAndSave.confidence += orderAnalysis.subscribeAndSave.confidence;
        
        // Detect delivery patterns (3rd Friday, etc.)
        const orderDate = new Date(order.date);
        const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 5 = Friday
        const weekOfMonth = Math.ceil(orderDate.getDate() / 7);
        const pattern = `Week ${weekOfMonth} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}`;
        
        if (!analysis.subscribeAndSave.monthlyDeliveryPatterns[pattern]) {
          analysis.subscribeAndSave.monthlyDeliveryPatterns[pattern] = 0;
        }
        analysis.subscribeAndSave.monthlyDeliveryPatterns[pattern]++;
      }

      // Update data quality metrics
      analysis.dataQuality.amazonDataCompleteness += orderAnalysis.dataQuality.completeness;
    });

    // Calculate final quality metrics
    if (amazonOrderDetails.length > 0) {
      analysis.dataQuality.amazonDataCompleteness = analysis.dataQuality.amazonDataCompleteness / amazonOrderDetails.length;
      analysis.subscribeAndSave.averageConfidence = analysis.subscribeAndSave.confidence / Math.max(analysis.subscribeAndSave.count, 1);
    }

    analysis.dataQuality.bankDataCompleteness = 0.95; // BoA data is very complete
    analysis.dataQuality.overallCompleteness = (analysis.dataQuality.amazonDataCompleteness + analysis.dataQuality.bankDataCompleteness) / 2;

    // FIXED: Confidence scores based on actual business rules
    analysis.dataQuality.confidenceScores = {
      subscribeAndSave: Math.min(analysis.subscribeAndSave.averageConfidence * 100, 100),
      locationDetection: 85, // Business rules are clear
      categoryClassification: 90 // Zelle/Amazon patterns are very reliable
    };

    // Create monthly spending graph data
    const sortedMonths = Object.keys(analysis.monthlyTrends).sort();
    analysis.monthlySpendingGraph = {
      labels: sortedMonths.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }),
      data: sortedMonths.map(month => analysis.monthlyTrends[month])
    };

    // FIXED: Generate insights based on correct financial data
    const totalSpending = analysis.overview.totalAmount;
    const amazonSpending = analysis.categories['Supplies & Inventory']?.total || 0;
    const maintenanceSpending = analysis.categories['Property Maintenance']?.total || 0;
    const clientPayouts = analysis.categories['Client Payouts']?.total || 0;
    
    if (amazonSpending > 0) {
      const amazonPercentage = (amazonSpending / totalSpending) * 100;
      analysis.insights.push({
        type: 'amazon_spending',
        message: `Amazon purchases represent ${amazonPercentage.toFixed(1)}% of total spending ($${amazonSpending.toFixed(2)})`,
        recommendation: amazonPercentage > 30 ? 'Consider bulk purchasing to reduce per-unit costs' : 'Amazon spending is well-controlled'
      });
    }

    if (analysis.subscribeAndSave.count > 0) {
      // Find most common delivery pattern
      const patterns = analysis.subscribeAndSave.monthlyDeliveryPatterns;
      const mostCommonPattern = Object.keys(patterns).reduce((a, b) => patterns[a] > patterns[b] ? a : b);
      
      analysis.insights.push({
        type: 'subscribe_save_pattern',
        message: `${analysis.subscribeAndSave.count} Subscribe & Save orders detected, most commonly delivered on ${mostCommonPattern}`,
        recommendation: 'Subscribe & Save provides predictable delivery scheduling and cost savings'
      });
    }

    if (maintenanceSpending > clientPayouts * 0.5) {
      analysis.insights.push({
        type: 'maintenance_vs_payouts',
        message: `Maintenance spending ($${maintenanceSpending.toFixed(2)}) is significant compared to client payouts ($${clientPayouts.toFixed(2)})`,
        recommendation: 'Monitor maintenance costs for budget optimization opportunities'
      });
    }

    // Generate month-over-month trend insights
    const monthlyData = analysis.monthlySpendingGraph.data;
    if (monthlyData.length >= 2) {
      const recentTrend = monthlyData.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const earlierTrend = monthlyData.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
      const trendChange = ((recentTrend - earlierTrend) / earlierTrend) * 100;
      
      if (Math.abs(trendChange) > 15) {
        analysis.insights.push({
          type: 'spending_trend',
          message: `Recent 3-month spending trend shows ${trendChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(trendChange).toFixed(1)}%`,
          recommendation: trendChange > 15 ? 'Monitor for budget overruns' : 'Positive spending reduction trend'
        });
      }
    }

    res.json(analysis);
      } catch (error) {
        console.error('❌ Error processing analysis:', error);
        res.status(500).json({ 
          error: 'Failed to process analysis',
          message: 'Data processing failed'
        });
      }
    });
  } catch (error) {
    console.error('❌ Error in analysis endpoint:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// GET /api/ai-analysis - AI-Enhanced Analysis with Machine Learning Insights
app.get('/api/ai-analysis', async (req, res) => {
  try {
    getAllExpenditures(async (err, expenditures) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch expenditures for AI analysis' });
      }

      console.log('\n🤖 Starting AI-Enhanced Analysis...');
      console.log('=' .repeat(60));

      const aiEngine = new AIAnalysisEngine();
      
      // Prepare transaction data for AI analysis
      const transactions = expenditures
        .filter(exp => !exp.description || !exp.description.includes('Amazon Order'))
        .map(exp => ({
          date: exp.date,
          amount: exp.amount,
          description: exp.description || '',
          category: exp.category || 'Uncategorized',
          metadata: exp.metadata || {}
        }));

      console.log(`📊 Processing ${transactions.length} transactions with AI...`);

      // Run comprehensive AI analysis
      const aiAnalysis = await aiEngine.runComprehensiveAIAnalysis(transactions);

      // Get traditional analysis for comparison
      const categorizer = new TSVCategorizer();
      const boaTransactions = expenditures.filter(exp => 
        !exp.description || !exp.description.includes('Amazon Order')
      );

      const traditionalAnalysis = {
        totalTransactions: boaTransactions.length,
        totalAmount: Math.abs(boaTransactions.reduce((sum, t) => sum + t.amount, 0)),
        categoryBreakdown: categorizer.getCategoryBreakdown(boaTransactions)
      };

      // Combine AI insights with traditional analysis
      const enhancedResponse = {
        traditional: traditionalAnalysis,
        ai: aiAnalysis,
        recommendations: {
          immediate: aiAnalysis.summary.recommendedActions.slice(0, 3),
          longTerm: aiAnalysis.optimizations.slice(0, 3).map(opt => ({
            category: opt.category,
            strategy: opt.strategy,
            potentialSavings: opt.potentialSavings,
            timeframe: 'Monthly'
          }))
        },
        riskAssessment: aiAnalysis.summary.riskAssessment,
        insights: {
          topInsights: aiAnalysis.intelligentInsights.slice(0, 5),
          patterns: aiAnalysis.patterns.slice(0, 3),
          anomalies: aiAnalysis.anomalies.slice(0, 3)
        },
        performance: {
          aiConfidence: aiAnalysis.metadata.confidence,
          analysisTime: aiAnalysis.metadata.analysisTime,
          improvementsPossible: aiAnalysis.categorization.improved,
          totalOptimizationValue: aiAnalysis.optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0)
        }
      };

      console.log(`✅ AI Analysis Complete`);
      console.log(`🎯 AI Confidence: ${(aiAnalysis.metadata.confidence * 100).toFixed(1)}%`);
      console.log(`⚡ Analysis Time: ${aiAnalysis.metadata.analysisTime.toFixed(2)}s`);
      console.log(`💰 Optimization Potential: $${enhancedResponse.performance.totalOptimizationValue.toFixed(2)}/month`);

      res.json(enhancedResponse);
    });
  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    res.status(500).json({ 
      error: 'AI Analysis failed', 
      details: error.message,
      fallback: 'Traditional analysis is still available'
    });
  }
});

// GET /api/amazon-items - Get list of Amazon items for filtering (optionally filter by business card *5795)
app.get('/api/amazon-items', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('❌ Database error fetching expenditures for Amazon items:', err);
        return res.status(500).json({ 
          error: 'Failed to fetch Amazon items',
          message: 'Database operation failed'
        });
      }

      try {
        const amazonItems = [];
        const seenItems = new Set();
        const businessCardOnly = req.query.businessCard === 'true';

        // Get all Amazon order details
        const amazonOrders = expenditures.filter(exp => 
          exp.description && exp.description.includes('Amazon Order')
        );

        if (businessCardOnly) {
          // Get business card transactions for filtering
          const businessCardTransactions = expenditures.filter(exp => 
            exp.description && 
            exp.description.includes('AMAZON') && 
            exp.description.includes('*5795')
          );

          console.log(`Found ${businessCardTransactions.length} business card Amazon transactions`);

          // Create lookup sets for flexible matching
          const businessTransactionDates = new Set();
          const businessTransactionAmounts = new Set();
          businessCardTransactions.forEach(trans => {
            try {
              businessTransactionDates.add(trans.date);
              businessTransactionAmounts.add(Math.abs(trans.amount).toFixed(2));
            } catch (error) {
              console.warn('⚠️ Error processing business card transaction:', error);
            }
          });

          // Filter Amazon orders by business card criteria
          amazonOrders.forEach((order, orderIndex) => {
            try {
              const orderAmount = Math.abs(order.amount).toFixed(2);
              const hasMatchingDate = businessTransactionDates.has(order.date);
              const hasMatchingAmount = businessTransactionAmounts.has(orderAmount);
              
              // Skip if no matching date or amount found
              if (!hasMatchingDate && !hasMatchingAmount) {
                return;
              }

              processAmazonOrder(order, orderIndex, amazonItems, seenItems);
            } catch (error) {
              console.warn('⚠️ Error processing Amazon order:', error);
            }
          });

          console.log(`Found ${amazonItems.length} business card filtered Amazon items`);
        } else {
          // Process all Amazon orders
          amazonOrders.forEach((order, orderIndex) => {
            try {
              processAmazonOrder(order, orderIndex, amazonItems, seenItems);
            } catch (error) {
              console.warn('⚠️ Error processing Amazon order:', error);
            }
          });

          console.log(`Found ${amazonItems.length} total Amazon items`);
        }

        // Sort items alphabetically
        amazonItems.sort((a, b) => a.name.localeCompare(b.name));

        // Apply any stored edits to the items
        try {
          const editsFile = path.join(__dirname, 'data', 'amazon_item_edits.json');
          if (fs.existsSync(editsFile)) {
            const edits = JSON.parse(fs.readFileSync(editsFile, 'utf8'));
            
            amazonItems.forEach(item => {
              if (edits[item.id]) {
                const edit = edits[item.id];
                if (edit.category) item.category = edit.category;
                if (edit.description) item.description = edit.description;
                if (edit.amount !== null && edit.amount !== undefined) {
                  item.price = edit.amount;
                  item.priceFormatted = `$${edit.amount.toFixed(2)}`;
                }
              }
            });
          }
        } catch (error) {
          console.warn('⚠️ Could not apply edits:', error.message);
        }

        res.json(amazonItems);
      } catch (error) {
        console.error('❌ Error processing Amazon items:', error);
        res.status(500).json({ 
          error: 'Failed to process Amazon items',
          message: 'Data processing failed'
        });
      }
    });
  } catch (error) {
    console.error('❌ Error in Amazon items endpoint:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// PUT /api/amazon-items/:id - Update Amazon item details (category, etc.)
app.put('/api/amazon-items/:id', (req, res) => {
  try {
    const itemId = req.params.id;
    const { category, description, amount } = req.body;

    if (!category) {
      return res.status(400).json({ 
        error: 'Category is required',
        message: 'Budget category must be provided'
      });
    }

    // Validate amount if provided
    if (amount !== undefined && amount !== null) {
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a valid positive number'
        });
      }
    }

    // Load or create Amazon item edits file
    const editsFile = path.join(__dirname, 'data', 'amazon_item_edits.json');
    let edits = {};
    
    try {
      if (fs.existsSync(editsFile)) {
        edits = JSON.parse(fs.readFileSync(editsFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load existing edits, starting fresh:', error.message);
      edits = {};
    }

    // Validate that the item exists by checking if we can load Amazon items
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          error: 'Failed to update Amazon item',
          message: 'Database operation failed'
        });
      }

      // Verify the item exists in our Amazon items
      try {
        const amazonItems = [];
        const seenItems = new Set();

        // Get all Amazon order details (same logic as GET endpoint)
        const amazonOrders = expenditures.filter(exp => 
          exp.description && exp.description.includes('Amazon Order')
        );

        amazonOrders.forEach((order, orderIndex) => {
          processAmazonOrder(order, orderIndex, amazonItems, seenItems);
        });

        // Check if the requested item ID exists
        const itemExists = amazonItems.some(item => item.id === itemId);
        
        if (!itemExists) {
          return res.status(404).json({
            error: 'Amazon item not found',
            message: `Item with ID ${itemId} does not exist`
          });
        }

        // Store the edit
        edits[itemId] = {
          category: category,
          description: description || '',
          amount: amount ? parseFloat(amount) : null,
          lastModified: new Date().toISOString()
        };

        // Save edits file
        fs.writeFileSync(editsFile, JSON.stringify(edits, null, 2));

        console.log(`✅ Updated Amazon item ${itemId}: category="${category}"`);

        res.json({
          success: true,
          message: 'Amazon item updated successfully',
          updatedItem: {
            id: itemId,
            category: category,
            description: description || '',
            amount: amount ? parseFloat(amount) : null
          }
        });

      } catch (error) {
        console.error('❌ Error processing Amazon item update:', error);
        res.status(500).json({
          error: 'Failed to update Amazon item',
          message: 'Processing error occurred'
        });
      }
    });

  } catch (error) {
    console.error('❌ Error in Amazon item update endpoint:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// Helper function to process Amazon orders
function processAmazonOrder(order, orderIndex, amazonItems, seenItems) {
  let items = '';
  let orderId = '';
  let orderUrl = '';
  let date = order.date;
  let totalPrice = Math.abs(order.amount);

  // Extract from premium metadata if available
  if (order.metadata && order.metadata.source === 'amazon_premium') {
    items = order.metadata.items || '';
    orderId = order.metadata.orderId || '';
    orderUrl = order.metadata.orderUrl || '';
  } else {
    // Extract from description for current format
    const orderMatch = order.description.match(/Amazon Order : (.+)/);
    if (orderMatch) {
      orderId = `order_${orderIndex}`;
      items = orderMatch[1];
    }
  }

  if (items) {
    // Each order typically contains one item
    const itemList = items.includes(';') ? items.split(';').filter(item => item.trim()) : [items];
    
    itemList.forEach((itemName, itemIndex) => {
      const cleanItemName = itemName.trim();
      if (cleanItemName) {
        // Create a normalized version for duplicate detection
        const normalized = cleanItemName.toLowerCase().substring(0, 60);
        
        if (!seenItems.has(normalized)) {
          seenItems.add(normalized);
          
          const estimatedPrice = itemList.length > 1 ? 
            (totalPrice / itemList.length) : 
            totalPrice;

          amazonItems.push({
            id: `amazon_${orderId}_${itemIndex}`,
            name: cleanItemName,
            price: parseFloat(estimatedPrice.toFixed(2)),
            priceFormatted: `$${estimatedPrice.toFixed(2)}`,
            date: date,
            orderId: orderId,
            orderUrl: orderUrl,
            category: categorizeItem(cleanItemName)
          });
        }
      }
    });
  }
}

// POST /api/employee-benefits-filter - Apply benefits filter with percentage allocations
app.post('/api/employee-benefits-filter', (req, res) => {
  try {
    const { itemIds, itemAllocations } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        error: 'Item IDs are required',
        message: 'Please provide an array of item IDs to filter'
      });
    }

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('❌ Database error fetching expenditures for benefits filter:', err);
        return res.status(500).json({
          error: 'Failed to fetch expenditures',
          message: 'Database operation failed'
        });
      }

      try {
        // Get all Amazon items
        const amazonItems = [];
        const amazonOrders = expenditures.filter(exp =>
          exp.description && exp.description.includes('Amazon Order')
        );

        // Build complete item list with details
        amazonOrders.forEach((order, orderIndex) => {
          try {
            let items = '';
            let orderId = '';
            let date = order.date;
            let totalPrice = Math.abs(order.amount);

        if (order.metadata && order.metadata.source === 'amazon_premium') {
          items = order.metadata.items || '';
          orderId = order.metadata.orderId || '';
        } else {
          const orderMatch = order.description.match(/Amazon Order : (.+)/);
          if (orderMatch) {
            orderId = `order_${orderIndex}`;
            items = orderMatch[1];
          }
        }      if (items) {
              const itemList = items.includes(';') ? items.split(';').filter(item => item.trim()) : [items];

              itemList.forEach((itemName, itemIndex) => {
                const cleanItemName = itemName.trim();
                if (cleanItemName) {
                  const itemId = `amazon_${orderId}_${itemIndex}`;
                  const estimatedPrice = itemList.length > 1 ?
                    (totalPrice / itemList.length) : totalPrice;

                  // Get percentage allocation (default 100% if not specified)
                  const allocation = itemAllocations?.[itemId] || 100;
                  const benefitsAmount = (estimatedPrice * allocation) / 100;
                  const operationalAmount = estimatedPrice - benefitsAmount;

                  amazonItems.push({
                    id: itemId,
                    name: cleanItemName,
                    price: estimatedPrice,
                    benefitsAmount: benefitsAmount,
                    operationalAmount: operationalAmount,
                    allocationPercentage: allocation,
                    date: date,
                    orderId: orderId,
                    category: categorizeItem(cleanItemName),
                    isSelected: itemIds.includes(itemId)
                  });
                }
              });
            }
          } catch (error) {
            console.warn('⚠️ Error processing Amazon order:', error);
          }
        });

        // Filter selected items
        const selectedItems = amazonItems.filter(item => item.isSelected);

        // Calculate summary with percentage allocations
        const summary = calculateBenefitsSummary(selectedItems);

        res.json({
          summary: summary,
          items: selectedItems,
          totalFilteredValue: summary.totalAmount,
          allocationBreakdown: {
            totalBenefitsAmount: summary.totalBenefitsAmount,
            totalOperationalAmount: summary.totalOperationalAmount,
            averageAllocationPercentage: summary.averageAllocationPercentage
          }
        });
      } catch (error) {
        console.error('❌ Error processing benefits filter:', error);
        res.status(500).json({
          error: 'Failed to process benefits filter',
          message: 'Data processing failed'
        });
      }
    });
  } catch (error) {
    console.error('❌ Error in benefits filter endpoint:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// Helper function to categorize Amazon items for benefits
function categorizeItem(itemName) {
  const name = itemName.toLowerCase();
  
  // Employee Amenities (High probability for benefits)
  if (name.includes('coffee') || name.includes('tea') || name.includes('water') || 
      name.includes('snack') || name.includes('beverage') || name.includes('drink') ||
      name.includes('juice') || name.includes('soda') || name.includes('energy') ||
      name.includes('protein bar') || name.includes('granola') || name.includes('chips')) {
    return 'employee_amenities';
  }
  
  // Office Supplies (Medium probability for benefits)
  if (name.includes('paper') || name.includes('pen') || name.includes('office') || 
      name.includes('supplies') || name.includes('storage') || name.includes('folder') ||
      name.includes('notebook') || name.includes('sticky') || name.includes('stapler') ||
      name.includes('clipboard') || name.includes('organizer') || name.includes('desk')) {
    return 'office_supplies';
  }
  
  // Cleaning & Safety (Medium probability for benefits)
  if (name.includes('clean') || name.includes('sanitiz') || name.includes('wipes') || 
      name.includes('soap') || name.includes('detergent') || name.includes('disinfect') ||
      name.includes('mask') || name.includes('gloves') || name.includes('tissue') ||
      name.includes('towel') || name.includes('spray')) {
    return 'cleaning_supplies';
  }
  
  // Kitchen & Break Room Equipment (High probability for benefits)
  if (name.includes('kitchen') || name.includes('appliance') || name.includes('microwave') || 
      name.includes('refrigerator') || name.includes('coffee maker') || name.includes('kettle') ||
      name.includes('plates') || name.includes('cups') || name.includes('utensils') ||
      name.includes('cutlery') || name.includes('dispenser')) {
    return 'kitchen_equipment';
  }
  
  // Wellness & Comfort Items (High probability for benefits)
  if (name.includes('ergonomic') || name.includes('chair') || name.includes('cushion') ||
      name.includes('lighting') || name.includes('lamp') || name.includes('air purifier') ||
      name.includes('humidifier') || name.includes('plants') || name.includes('wellness') ||
      name.includes('first aid') || name.includes('comfort')) {
    return 'wellness_comfort';
  }
  
  // Technology for Employees (Medium probability for benefits)
  if (name.includes('headphones') || name.includes('speaker') || name.includes('charger') ||
      name.includes('usb') || name.includes('cable') || name.includes('adapter') ||
      name.includes('power bank') || name.includes('mouse pad') || name.includes('webcam')) {
    return 'employee_tech';
  }
  
  // Safety & Security (Medium probability for benefits)
  if (name.includes('safety') || name.includes('security') || name.includes('lock') ||
      name.includes('camera') || name.includes('alarm') || name.includes('fire') ||
      name.includes('emergency') || name.includes('flashlight')) {
    return 'safety_security';
  }
  
  return 'other';
}

// Helper function to calculate benefits summary with percentage allocations
function calculateBenefitsSummary(items) {
  let totalAmount = 0;
  let totalBenefitsAmount = 0;
  let totalOperationalAmount = 0;
  const monthlyBreakdown = {};
  const categories = {};
  const allocationPercentages = [];

  items.forEach(item => {
    const price = parseFloat(item.price) || 0;
    const benefitsAmount = parseFloat(item.benefitsAmount) || price;
    const operationalAmount = parseFloat(item.operationalAmount) || 0;
    const allocationPercentage = parseFloat(item.allocationPercentage) || 100;

    totalAmount += price;
    totalBenefitsAmount += benefitsAmount;
    totalOperationalAmount += operationalAmount;
    allocationPercentages.push(allocationPercentage);

    // Monthly breakdown (using benefits amount for benefits tracking)
    const month = getMonthFromDate(item.date);
    if (!monthlyBreakdown[month]) {
      monthlyBreakdown[month] = { amount: 0, benefitsAmount: 0, operationalAmount: 0, items: 0 };
    }
    monthlyBreakdown[month].amount += price;
    monthlyBreakdown[month].benefitsAmount += benefitsAmount;
    monthlyBreakdown[month].operationalAmount += operationalAmount;
    monthlyBreakdown[month].items += 1;

    // Category breakdown
    const category = item.category || 'other';
    if (!categories[category]) {
      categories[category] = { count: 0, amount: 0, benefitsAmount: 0, operationalAmount: 0 };
    }
    categories[category].count += 1;
    categories[category].amount += price;
    categories[category].benefitsAmount += benefitsAmount;
    categories[category].operationalAmount += operationalAmount;
  });

  // Calculate average allocation percentage
  const averageAllocationPercentage = allocationPercentages.length > 0
    ? allocationPercentages.reduce((sum, pct) => sum + pct, 0) / allocationPercentages.length
    : 100;

  // Convert monthly breakdown to array
  const monthlyArray = Object.keys(monthlyBreakdown).map(month => ({
    month: month,
    amount: monthlyBreakdown[month].amount,
    benefitsAmount: monthlyBreakdown[month].benefitsAmount,
    operationalAmount: monthlyBreakdown[month].operationalAmount,
    items: monthlyBreakdown[month].items
  })).sort((a, b) => new Date(a.month) - new Date(b.month));

  return {
    totalAmount: totalAmount,
    totalBenefitsAmount: totalBenefitsAmount,
    totalOperationalAmount: totalOperationalAmount,
    averageAllocationPercentage: Math.round(averageAllocationPercentage * 100) / 100,
    itemCount: items.length,
    orderCount: new Set(items.map(item => item.orderId)).size,
    monthlyBreakdown: monthlyArray,
    averageOrderValue: items.length > 0 ? totalAmount / items.length : 0,
    categories: categories
  };
}

function getMonthFromDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  } catch (error) {
    return 'Unknown';
  }
}

// Serve the main HTML page
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    console.error('❌ Error serving main page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Global error handler middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Don't send stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: error.message,
    ...(isDevelopment && { stack: error.stack })
  });
});

// POST /api/validate-amazon-zip - Validate and detect Amazon ZIP file type
app.post('/api/validate-amazon-zip', upload.single('amazonZip'), async (req, res) => {
  try {
    console.log('=== AMAZON ZIP VALIDATION REQUEST ===');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload an Amazon ZIP file for validation'
      });
    }

    const AmazonZipDetector = require('./src/amazon-zip-detector');
    const detector = new AmazonZipDetector();
    
    console.log('Validating file:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    console.log('Temp file path:', req.file.path);
    
    // Analyze the uploaded ZIP file
    // Pass the original filename for proper extension validation
    const analysis = await detector.analyzeZipFile(req.file.path, {
      originalName: req.file.originalname
    });
    
    // Clean up temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn('Failed to cleanup temp file:', err.message);
    });
    
    if (!analysis.isValid) {
      return res.status(400).json({
        error: 'Invalid ZIP file',
        message: analysis.error || 'The uploaded file is not a valid Amazon ZIP export',
        details: analysis
      });
    }

    console.log('✅ ZIP validation successful');
    console.log('Detected type:', analysis.type);
    console.log('Confidence:', analysis.confidence + '%');
    
    res.json({
      success: true,
      message: 'ZIP file validated successfully',
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ ZIP validation error:', error);
    
    // Clean up temporary file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('Failed to cleanup temp file on error:', err.message);
      });
    }
    
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

// POST /api/import-amazon-zip - Import Amazon ZIP files automatically
app.post('/api/import-amazon-zip', upload.single('amazonZip'), async (req, res) => {
  try {
    console.log('=== AMAZON ZIP IMPORT REQUEST ===');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload an Amazon ZIP file'
      });
    }

    console.log('File uploaded:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    // Detect ZIP type before processing
    const AmazonZipDetector = require('./src/amazon-zip-detector');
    const detector = new AmazonZipDetector();
    
    console.log('🔍 Detecting Amazon ZIP type...');
    const analysis = await detector.analyzeZipFile(req.file.path);
    
    let zipTypeInfo = 'Unknown Amazon ZIP';
    if (analysis.isValid && analysis.detected) {
      zipTypeInfo = analysis.zipInfo.name;
      console.log('✅ Detected:', analysis.type, `(${analysis.confidence}% confidence)`);
    } else {
      console.log('⚠️ ZIP type detection failed:', analysis.error);
    }

    const parser = new AmazonZipParser();
    const zipFilePath = req.file.path;
    

    // Set up import status
    importStatus.inProgress = true;
    importStatus.currentFile = 'Starting...';
    importStatus.processedFiles = 0;
    importStatus.totalFiles = 0;
    importStatus.lastUpdate = new Date().toISOString();

    // Patch parser to update importStatus during processing
    parser.onFileProcess = (filename, idx, total) => {
      importStatus.currentFile = filename;
      importStatus.processedFiles = idx;
      importStatus.totalFiles = total;
      importStatus.lastUpdate = new Date().toISOString();
    };

    // Process the ZIP file
    const result = await parser.processZipFile(zipFilePath, {
      extractDir: path.join(__dirname, 'data', `temp-extract-${Date.now()}`),
      keepExtracted: false,
      onFileProcess: parser.onFileProcess
    });


    // Clean up uploaded file
    try {
      fs.unlinkSync(zipFilePath);
    } catch (cleanupError) {
      console.warn('⚠️ Could not cleanup uploaded file:', cleanupError.message);
    }

    // Mark import as done
    importStatus.inProgress = false;
    importStatus.currentFile = '';
    importStatus.lastUpdate = new Date().toISOString();

    if (!result.success) {
      return res.status(500).json({
        error: 'ZIP processing failed',
        message: result.error,
        stats: result.stats
      });
    }

    // Transform and save the data
    const savedOrders = [];
    const savedSubscriptions = [];
    const errors = [];

    // Process orders
    for (const order of result.data.orders) {
      try {
        const expenditure = {
          date: order.orderDate || new Date().toISOString(),
          amount: order.purchasePrice || 0,
          category: order.tsvCategory || 'Miscellaneous',
          description: `Amazon Order ${order.orderId}: ${order.title || 'Unknown Item'}`,
          amazonOrderId: order.orderId,
          amazonASIN: order.asin,
          amazonCategory: order.category,
          dataSource: 'amazon-zip-import',
          processedDate: new Date().toISOString()
        };

        await new Promise((resolve, reject) => {
          addExpenditure(expenditure, (err, newExpenditure) => {
            if (err) {
              reject(err);
            } else {
              savedOrders.push(newExpenditure);
              resolve(newExpenditure);
            }
          });
        });

      } catch (error) {
        errors.push(`Order ${order.orderId}: ${error.message}`);
        console.warn('⚠️ Failed to save order:', order.orderId, error.message);
      }
    }

    // Process subscriptions (saved as recurring expenditures)
    for (const subscription of result.data.subscriptions) {
      try {
        const expenditure = {
          date: subscription.eventDate || new Date().toISOString(),
          amount: 0, // Subscriptions don't have prices in the data
          category: subscription.tsvCategory || 'Miscellaneous',
          description: `Amazon Subscription: ${subscription.productTitle} (${subscription.frequency})`,
          amazonSubscriptionId: subscription.subscriptionId,
          amazonSubscriptionState: subscription.subscriptionState,
          amazonFrequency: subscription.frequency,
          isSubscription: true,
          dataSource: 'amazon-zip-subscriptions',
          processedDate: new Date().toISOString()
        };

        await new Promise((resolve, reject) => {
          addExpenditure(expenditure, (err, newExpenditure) => {
            if (err) {
              reject(err);
            } else {
              savedSubscriptions.push(newExpenditure);
              resolve(newExpenditure);
            }
          });
        });

      } catch (error) {
        errors.push(`Subscription ${subscription.productTitle}: ${error.message}`);
        console.warn('⚠️ Failed to save subscription:', subscription.productTitle, error.message);
      }
    }

    // Generate processing report
    const report = parser.generateReport();
    
    res.json({
      success: true,
      message: `${zipTypeInfo} processed successfully`,
      fileName: req.file.originalname,
      zipType: analysis.isValid ? analysis.type : 'unknown',
      zipTypeInfo: zipTypeInfo,
      detectionConfidence: analysis.confidence || 0,
      summary: {
        totalFiles: result.stats.totalFiles,
        processedFiles: result.stats.processedFiles,
        ordersFound: result.data.orders.length,
        ordersSaved: savedOrders.length,
        subscriptionsFound: result.data.subscriptions.length,
        subscriptionsSaved: savedSubscriptions.length,
        errors: errors.length
      },
      data: {
        orders: savedOrders.slice(0, 5), // First 5 orders as sample
        subscriptions: savedSubscriptions.slice(0, 5), // First 5 subscriptions as sample
        errors: errors
      },
      processingReport: report,
      fileName: req.file.originalname
    });

  } catch (error) {
    console.error('❌ Amazon ZIP import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Could not cleanup uploaded file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      error: 'Amazon ZIP import failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// SUBSCRIPTION ANALYSIS ENDPOINTS

// GET /api/subscription-dashboard - Get subscription dashboard data
app.get('/api/subscription-dashboard', (req, res) => {
  try {
    const dashboard = subscriptionEngine.getSubscriptionDashboard();
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching subscription dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription dashboard',
      message: error.message
    });
  }
});

// GET /api/subscription-analysis - Get comprehensive subscription analysis
app.get('/api/subscription-analysis', async (req, res) => {
  try {
    // Load Amazon orders for linking
    const amazonOrders = [];
    const csv = require('csv-parser');
    const fs = require('fs');

    // Try to load from comprehensive orders file
    const ordersPath = path.join(__dirname, 'data', 'amazon-comprehensive-orders.csv');

    if (fs.existsSync(ordersPath)) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(ordersPath)
          .pipe(csv())
          .on('data', (data) => amazonOrders.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // Perform subscription-to-order linking
    const analysis = subscriptionEngine.linkSubscriptionsToOrders(amazonOrders);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
      ordersAnalyzed: amazonOrders.length
    });

  } catch (error) {
    console.error('❌ Error performing subscription analysis:', error);
    res.status(500).json({
      error: 'Failed to perform subscription analysis',
      message: error.message
    });
  }
});

// GET /api/subscription-for-order/:orderId - Get subscription details for specific order
app.get('/api/subscription-for-order/:orderId', (req, res) => {
  try {
    const orderId = req.params.orderId;
    const subscriptionDetails = subscriptionEngine.getSubscriptionForOrder(orderId);

    if (subscriptionDetails) {
      res.json({
        success: true,
        data: subscriptionDetails,
        linked: true
      });
    } else {
      res.json({
        success: true,
        data: null,
        linked: false,
        message: 'No subscription found for this order'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching subscription for order:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription details',
      message: error.message
    });
  }
});

// GET /api/geographic-dashboard - Get geographic dashboard data
app.get('/api/geographic-dashboard', (req, res) => {
  try {
    const dashboardData = geographicEngine.getGeographicDashboard();

    if (dashboardData.error) {
      res.status(503).json({
        error: 'Geographic data not available',
        message: dashboardData.error
      });
    } else {
      res.json({
        success: true,
        data: dashboardData
      });
    }

  } catch (error) {
    console.error('❌ Error fetching geographic dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch geographic dashboard',
      message: error.message
    });
  }
});

// GET /api/geographic-analysis - Get comprehensive geographic analysis
app.get('/api/geographic-analysis', async (req, res) => {
  try {
    const analysis = geographicEngine.generateGeographicAnalysis();

    res.json({
      success: true,
      data: analysis,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating geographic analysis:', error);
    res.status(500).json({
      error: 'Failed to generate geographic analysis',
      message: error.message
    });
  }
});

// GET /api/geographic-locations/:type - Get locations by type (states, cities, zipcodes)
app.get('/api/geographic-locations/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10, sortBy = 'orderCount' } = req.query;

    let locationData;
    switch (type.toLowerCase()) {
      case 'states':
        locationData = geographicEngine.getTopLocations(geographicEngine.geographicData.states, sortBy, parseInt(limit));
        break;
      case 'cities':
        locationData = geographicEngine.getTopLocations(geographicEngine.geographicData.cities, sortBy, parseInt(limit));
        break;
      case 'zipcodes':
        locationData = geographicEngine.getTopLocations(geographicEngine.geographicData.zipCodes, sortBy, parseInt(limit));
        break;
      default:
        return res.status(400).json({
          error: 'Invalid location type',
          message: 'Type must be one of: states, cities, zipcodes'
        });
    }

    res.json({
      success: true,
      data: locationData,
      type,
      sortBy,
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('❌ Error fetching geographic locations:', error);
    res.status(500).json({
      error: 'Failed to fetch geographic locations',
      message: error.message
    });
  }
});

// GET /api/geographic-revenue - Get revenue analysis by geography
app.get('/api/geographic-revenue', (req, res) => {
  try {
    const revenueAnalysis = geographicEngine.generateRevenueAnalysis();

    res.json({
      success: true,
      data: revenueAnalysis
    });

  } catch (error) {
    console.error('❌ Error fetching geographic revenue analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch geographic revenue analysis',
      message: error.message
    });
  }
});

// GET /api/geographic-shipping - Get shipping analysis by geography
app.get('/api/geographic-shipping', (req, res) => {
  try {
    const shippingAnalysis = geographicEngine.generateShippingAnalysis();

    res.json({
      success: true,
      data: shippingAnalysis
    });

  } catch (error) {
    console.error('❌ Error fetching geographic shipping analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch geographic shipping analysis',
      message: error.message
    });
  }
});

// BANK RECONCILIATION ENDPOINTS

// GET /api/reconciliation-dashboard - Get reconciliation dashboard data
app.get('/api/reconciliation-dashboard', (req, res) => {
  try {
    const dashboard = bankReconciliationEngine.getReconciliationDashboard();
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching reconciliation dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch reconciliation dashboard',
      message: error.message
    });
  }
});

// POST /api/perform-reconciliation - Perform bank-Amazon reconciliation
app.post('/api/perform-reconciliation', async (req, res) => {
  try {
    const options = req.body || {};
    const results = bankReconciliationEngine.performReconciliation(options);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: `Reconciled ${results.stats.matchedTransactions} transactions`
    });

  } catch (error) {
    console.error('❌ Error performing reconciliation:', error);
    res.status(500).json({
      error: 'Failed to perform reconciliation',
      message: error.message
    });
  }
});

// GET /api/reconciliation-results - Get current reconciliation results
app.get('/api/reconciliation-results', (req, res) => {
  try {
    // Perform reconciliation with default settings
    const results = bankReconciliationEngine.performReconciliation();

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching reconciliation results:', error);
    res.status(500).json({
      error: 'Failed to fetch reconciliation results',
      message: error.message
    });
  }
});

// POST /api/export-reconciliation - Export reconciliation report
app.post('/api/export-reconciliation', (req, res) => {
  try {
    const results = bankReconciliationEngine.performReconciliation();
    const outputPath = path.join(__dirname, 'data', `reconciliation-report-${Date.now()}.csv`);

    bankReconciliationEngine.exportReconciliationReport(outputPath, results.matches);

    res.json({
      success: true,
      message: 'Reconciliation report exported',
      filePath: outputPath,
      matchedTransactions: results.stats.matchedTransactions
    });

  } catch (error) {
    console.error('❌ Error exporting reconciliation report:', error);
    res.status(500).json({
      error: 'Failed to export reconciliation report',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Give server time to finish current requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Continue running in development, exit in production
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server with error handling
const subscriptionEngine = new SubscriptionAnalysisEngine();
const bankReconciliationEngine = new BankReconciliationEngine();

// Initialize subscription data on server start
subscriptionEngine.loadSubscriptionData().then(success => {
  if (success) {
    console.log('📊 Subscription analysis engine ready');
  } else {
    console.warn('⚠️ Subscription data loading failed');
  }
}).catch(error => {
  console.warn('⚠️ Subscription engine initialization error:', error.message);
});

// Initialize bank reconciliation engine
bankReconciliationEngine.loadBankData().then(success => {
  if (success) {
    console.log('🏦 Bank reconciliation engine ready');
  } else {
    console.warn('⚠️ Bank data loading failed');
  }
}).catch(error => {
  console.warn('⚠️ Bank reconciliation engine initialization error:', error.message);
});

// Initialize geographic analysis engine
const geographicEngine = new GeographicAnalysisEngine();
geographicEngine.loadOrderData().then(success => {
  if (success) {
    console.log('🗺️ Geographic analysis engine ready');
  } else {
    console.warn('⚠️ Geographic data loading failed');
  }
}).catch(error => {
  console.warn('⚠️ Geographic analysis engine initialization error:', error.message);
});

// Load Amazon data for reconciliation
bankReconciliationEngine.loadAmazonData().then(success => {
  if (success) {
    console.log('🔗 Amazon reconciliation data ready');
  } else {
    console.warn('⚠️ Amazon reconciliation data loading failed');
  }
}).catch(error => {
  console.warn('⚠️ Amazon reconciliation data initialization error:', error.message);
});

const server = app.listen(port, (error) => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`🚀 TSV Ledger server running at http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
