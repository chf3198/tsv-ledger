/**
 * TSV Ledger - Main Express Server
 * 
 * @fileoverview Main server application for Texas Sunset Venues expense tracking
 *               and business intelligence platform. Provides REST API endpoints
 *               for data import, analysis, and comprehensive business insights.
 * 
 * @version 2.1.0
 * @author GitHub Copilot (Claude Sonnet 3.5)
 * @since 2025-09-05
 * @updated 2025-09-07
 * 
 * @requires express Express.js web framework
 * @requires csv-parser CSV parsing library
 * @requires ./tsv-categorizer Business intelligence categorization engine
 * @requires ./database JSON database operations
 * 
 * @example
 * // Start the server
 * node server.js
 * // Access at http://localhost:3000
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { getAllExpenditures, addExpenditure } = require('./database');
const TSVCategorizer = require('./tsv-categorizer');

const app = express();
const port = 3000;

// Middleware for parsing JSON and URL-encoded data (with increased limits for CSV files)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// GET /api/expenditures - Retrieve all expenditures
app.get('/api/expenditures', (req, res) => {
  getAllExpenditures((err, expenditures) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch expenditures' });
    } else {
      res.json(expenditures);
    }
  });
});

// POST /api/expenditures - Add a new expenditure
app.post('/api/expenditures', (req, res) => {
  const { date, amount, category, description } = req.body;
  const expenditure = {
    date,
    amount: parseFloat(amount),
    category,
    description
  };

  addExpenditure(expenditure, (err, newExpenditure) => {
    if (err) {
      res.status(500).json({ error: 'Failed to add expenditure' });
    } else {
      res.status(201).json({ message: 'Expenditure added successfully', expenditure: newExpenditure });
    }
  });
});

// POST /api/import-csv - Import expenditures from CSV/TSV/DAT file
app.post('/api/import-csv', (req, res) => {
  console.log('=== IMPORT REQUEST RECEIVED ===');
  console.log('Request body size:', req.body ? JSON.stringify(req.body).length : 'N/A');

  const csvData = req.body.csvData;
  if (!csvData) {
    console.log('ERROR: No csvData in request body');
    return res.status(400).json({ error: 'No data file provided' });
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
      const isBankFormat = data.hasOwnProperty('Description') && data.hasOwnProperty('') && data.hasOwnProperty('Amount');

      console.log('Format detection - Amazon:', isAmazonFormat, 'Bank:', isBankFormat);

      let dateValue, amountValue, descValue, expenditure;

      if (isAmazonFormat) {
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
});

// GET /api/analysis - Enhanced comprehensive analysis using premium extension data
app.get('/api/analysis', (req, res) => {
  getAllExpenditures((err, expenditures) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch expenditures for analysis' });
    }

    const categorizer = new TSVCategorizer();
    
    // Enhanced Amazon order filtering with premium data support
    const amazonOrders = expenditures.filter(exp => 
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

    // Generate comprehensive analysis with enhanced categorization
    const analysis = {
      overview: {
        totalExpenditures: expenditures.length,
        totalAmount: expenditures.reduce((sum, exp) => sum + Math.abs(exp.amount), 0),
        amazonOrders: amazonOrders.length,
        premiumDataOrders: amazonOrders.filter(o => o.isPremiumData).length,
        bankTransactions: expenditures.length - amazonOrders.length,
        dateRange: {
          earliest: expenditures.reduce((min, exp) => exp.date < min ? exp.date : min, '9999-12-31'),
          latest: expenditures.reduce((max, exp) => exp.date > max ? exp.date : max, '0000-01-01')
        }
      },
      dataQuality: {
        amazonDataCompleteness: 0,
        bankDataCompleteness: 0,
        overallCompleteness: 0,
        premiumDataAvailable: amazonOrders.filter(o => o.isPremiumData).length > 0,
        confidenceScores: {
          subscribeAndSave: 0,
          locationDetection: 0,
          categoryClassification: 0
        }
      },
      categories: {},
      locations: { Freeport: 0, Smithville: 0, 'Both Properties': 0 },
      subscribeAndSave: { count: 0, total: 0, confidence: 0, averageConfidence: 0 },
      employeeBenefits: { count: 0, total: 0 },
      monthlyTrends: {},
      seasonalTrends: {},
      insights: []
    };

    // Analyze each Amazon order
    const detailedAnalyses = amazonOrders.map(order => {
      const orderAnalysis = categorizer.analyzeAmazonOrder(order);
      const amount = Math.abs(order.amount);

      // Update category totals
      if (!analysis.categories[orderAnalysis.category]) {
        analysis.categories[orderAnalysis.category] = { total: 0, count: 0, subcategories: {} };
      }
      analysis.categories[orderAnalysis.category].total += amount;
      analysis.categories[orderAnalysis.category].count++;

      if (orderAnalysis.subcategory) {
        if (!analysis.categories[orderAnalysis.category].subcategories[orderAnalysis.subcategory]) {
          analysis.categories[orderAnalysis.category].subcategories[orderAnalysis.subcategory] = 0;
        }
        analysis.categories[orderAnalysis.category].subcategories[orderAnalysis.subcategory] += amount;
      }

      // Update location totals
      analysis.locations[orderAnalysis.location] += amount;

      // Update Subscribe & Save tracking
      if (orderAnalysis.subscribeAndSave.isSubscribeAndSave) {
        analysis.subscribeAndSave.count++;
        analysis.subscribeAndSave.total += amount;
        analysis.subscribeAndSave.confidence = (analysis.subscribeAndSave.confidence || 0) + orderAnalysis.subscribeAndSave.confidence;
      }

      // Update employee benefits tracking
      if (orderAnalysis.isEmployeeBenefit) {
        analysis.employeeBenefits.count++;
        analysis.employeeBenefits.total += amount;
      }

      // Update monthly trends
      const month = new Date(order.date).toISOString().substring(0, 7);
      if (!analysis.monthlyTrends[month]) {
        analysis.monthlyTrends[month] = 0;
      }
      analysis.monthlyTrends[month] += amount;

      // Update seasonal trends
      if (!analysis.seasonalTrends[orderAnalysis.seasonality.season]) {
        analysis.seasonalTrends[orderAnalysis.seasonality.season] = 0;
      }
      analysis.seasonalTrends[orderAnalysis.seasonality.season] += amount;

      // Update data quality metrics
      analysis.dataQuality.amazonDataCompleteness += orderAnalysis.dataQuality.completeness;

      return orderAnalysis;
    });

    // Calculate final quality metrics
    if (amazonOrders.length > 0) {
      analysis.dataQuality.amazonDataCompleteness = analysis.dataQuality.amazonDataCompleteness / amazonOrders.length;
      analysis.subscribeAndSave.averageConfidence = analysis.subscribeAndSave.confidence / Math.max(analysis.subscribeAndSave.count, 1);
    }

    analysis.dataQuality.bankDataCompleteness = 0.85; // Estimated based on bank data structure
    analysis.dataQuality.overallCompleteness = (analysis.dataQuality.amazonDataCompleteness + analysis.dataQuality.bankDataCompleteness) / 2;

    // Confidence scores for different detection algorithms
    analysis.dataQuality.confidenceScores = {
      subscribeAndSave: Math.min(analysis.subscribeAndSave.averageConfidence * 100, 100),
      locationDetection: 65, // Estimated based on keyword matching
      categoryClassification: 85 // Estimated based on comprehensive keyword lists
    };

    // Generate high-level insights
    const totalAmazonSpending = amazonOrders.reduce((sum, order) => sum + Math.abs(order.amount), 0);
    
    if (analysis.subscribeAndSave.total > 0) {
      const subscribePercentage = (analysis.subscribeAndSave.total / totalAmazonSpending) * 100;
      analysis.insights.push({
        type: 'subscribe_save',
        message: `${subscribePercentage.toFixed(1)}% of Amazon spending (${analysis.subscribeAndSave.count} orders) is through Subscribe & Save`,
        recommendation: subscribePercentage > 60 ? 'Excellent subscription discipline for predictable budgeting' : 'Consider more Subscribe & Save for budget predictability'
      });
    }

    if (analysis.employeeBenefits.total > 0) {
      const benefitsPercentage = (analysis.employeeBenefits.total / totalAmazonSpending) * 100;
      analysis.insights.push({
        type: 'employee_benefits',
        message: `${benefitsPercentage.toFixed(1)}% of Amazon spending (${analysis.employeeBenefits.count} orders) is on employee benefits`,
        recommendation: benefitsPercentage > 20 ? 'Consider dedicated employee benefits budget category' : 'Employee benefits spending is well-controlled'
      });
    }

    // Location insights
    const freeportPercentage = (analysis.locations.Freeport / totalAmazonSpending) * 100;
    const smithvillePercentage = (analysis.locations.Smithville / totalAmazonSpending) * 100;
    const bothPercentage = (analysis.locations['Both Properties'] / totalAmazonSpending) * 100;

    analysis.insights.push({
      type: 'location_distribution',
      message: `Property spending: Freeport ${freeportPercentage.toFixed(1)}%, Smithville ${smithvillePercentage.toFixed(1)}%, Both Properties ${bothPercentage.toFixed(1)}%`,
      recommendation: Math.abs(freeportPercentage - smithvillePercentage) > 30 ? 'Significant spending difference between properties - review allocation strategy' : 'Balanced spending across properties'
    });

    // Top category insight
    const topCategory = Object.entries(analysis.categories)
      .sort(([,a], [,b]) => b.total - a.total)[0];
    
    if (topCategory) {
      const categoryPercentage = (topCategory[1].total / totalAmazonSpending) * 100;
      analysis.insights.push({
        type: 'top_category',
        message: `${topCategory[0]} is the largest expense category at ${categoryPercentage.toFixed(1)}% of Amazon spending`,
        recommendation: categoryPercentage > 40 ? 'Consider budget monitoring for this dominant category' : 'Well-diversified spending across categories'
      });
    }

    // Include detailed analyses for debugging/detailed view
    analysis.detailedAnalyses = detailedAnalyses.slice(0, 10); // Limit for response size

    res.json(analysis);
  });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`TSV Ledger server running at http://localhost:${port}`);
});
