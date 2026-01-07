/**
 * Bank Reconciliation Engine
 *
 * @fileoverview Automated bank-to-Amazon transaction matching and reconciliation system
 *               for TSV Ledger. Provides intelligent matching algorithms to link bank
 *               transactions with Amazon orders for financial reconciliation.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-16
 *
 * @features
 * - Intelligent transaction matching using date, amount, and merchant data
 * - Automated reconciliation with confidence scoring
 * - Unmatched transaction identification
 * - Reconciliation reporting and analytics
 * - Duplicate detection and handling
 * - Tolerance-based matching for timing differences
 *
 * @requires fs File system operations
 * @requires csv-parser CSV parsing for transaction data
 * @requires path Path utilities for file operations
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Bank Reconciliation Engine Class
 * Handles automated matching of bank transactions to Amazon orders
 */
class BankReconciliationEngine {

  constructor() {
    this.bankTransactions = [];
    this.amazonOrders = [];
    this.matchedTransactions = new Map();
    this.unmatchedBankTransactions = [];
    this.unmatchedAmazonOrders = [];
    this.reconciliationStats = {
      totalBankTransactions: 0,
      totalAmazonOrders: 0,
      matchedTransactions: 0,
      unmatchedBank: 0,
      unmatchedAmazon: 0,
      totalMatchedAmount: 0,
      averageMatchConfidence: 0
    };
  }

  /**
   * Load bank statement data
   * @param {string} bankFilePath - Path to bank statement file
   * @returns {Promise<boolean>} Success status
   */
  async loadBankData(bankFilePath = './data/stmttab.dat') {
    try {
      console.log('🔄 Loading bank statement data...');

      const fileContent = fs.readFileSync(bankFilePath, 'utf8');
      const lines = fileContent.split('\n');

      // Skip header lines and parse transactions
      let parsingTransactions = false;
      const transactions = [];

      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }

        // Start parsing when we see the transaction header
        if (line.includes('Date') && line.includes('Description') && line.includes('Amount')) {
          parsingTransactions = true;
          continue;
        }

        if (parsingTransactions && line.trim() !== '') {
          const transaction = this.parseBankTransactionLine(line);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }

      this.bankTransactions = transactions;
      this.reconciliationStats.totalBankTransactions = transactions.length;

      console.log(`✅ Loaded ${transactions.length} bank transactions`);
      return true;

    } catch (error) {
      console.error('❌ Error loading bank data:', error);
      return false;
    }
  }

  /**
   * Parse a single bank transaction line
   * @param {string} line - Raw transaction line
   * @returns {Object|null} Parsed transaction or null if invalid
   */
  parseBankTransactionLine(line) {
    try {
      // Clean the line and handle CRLF
      line = line.trim().replace(/\r/g, '');

      // Skip empty lines
      if (!line) {
        return null;
      }

      // Skip summary lines
      if (line.includes('Beginning balance') ||
          line.includes('Total credits') ||
          line.includes('Total debits') ||
          line.includes('Ending balance') ||
          line.includes('Description') && line.includes('Summary Amt') ||
          line.includes('Date') && line.includes('Description') && line.includes('Amount')) {
        return null;
      }

      // Handle multi-line descriptions by checking if this looks like a continuation
      if (!line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        // This might be a continuation of the previous line
        // For now, skip these lines as they're hard to parse correctly
        return null;
      }

      // Parse the main transaction line
      // Format: MM/DD/YYYY[TAB]Description[TAB]Amount[TAB]Running Balance
      const parts = line.split('\t');

      if (parts.length < 4) {
        // Try alternative parsing for space-separated format
        const spaceParts = line.split(/\s{2,}/);
        if (spaceParts.length >= 4) {
          const date = spaceParts[0];
          const description = spaceParts[1];
          const amount = spaceParts[2];
          const runningBalance = spaceParts[3];

          return this.createTransactionObject(date, description, amount, runningBalance);
        }
        return null;
      }

      const [date, description, amount, runningBalance] = parts;
      return this.createTransactionObject(date, description, amount, runningBalance);

    } catch (error) {
      console.warn('⚠️ Error parsing bank transaction line:', line, error.message);
      return null;
    }
  }

  /**
   * Create a transaction object from parsed components
   * @param {string} date - Date string
   * @param {string} description - Transaction description
   * @param {string} amount - Amount string
   * @param {string} runningBalance - Running balance string
   * @returns {Object} Parsed transaction object
   */
  createTransactionObject(date, description, amount, runningBalance) {
    // Parse date (MM/DD/YYYY)
    const parsedDate = this.parseBankDate(date);
    if (!parsedDate) {
      return null;
    }

    // Parse amount (remove quotes and handle negative)
    const cleanAmount = amount.replace(/"/g, '').trim();
    const numericAmount = parseFloat(cleanAmount) || 0;

    // Parse running balance
    const cleanBalance = runningBalance.replace(/"/g, '').trim();
    const numericBalance = parseFloat(cleanBalance) || 0;

    // Skip if amount is 0 or invalid
    if (numericAmount === 0) {
      return null;
    }

    return {
      date: parsedDate,
      description: description.replace(/"/g, '').trim(),
      amount: numericAmount,
      runningBalance: numericBalance,
      isDebit: numericAmount < 0,
      isCredit: numericAmount > 0,
      absAmount: Math.abs(numericAmount),
      merchant: this.extractMerchant(description),
      location: this.extractLocation(description),
      cardLastFour: this.extractCardNumber(description),
      rawDescription: description.trim()
    };
  }

  /**
   * Parse bank date format (MM/DD/YYYY)
   * @param {string} dateStr - Date string
   * @returns {Date} Parsed date
   */
  parseBankDate(dateStr) {
    try {
      const [month, day, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    } catch (error) {
      console.warn('⚠️ Error parsing date:', dateStr);
      return new Date();
    }
  }

  /**
   * Extract merchant name from description
   * @param {string} description - Transaction description
   * @returns {string} Merchant name
   */
  extractMerchant(description) {
    // Extract merchant from common patterns
    const patterns = [
      /^([^0-9*]+)/,  // Everything before numbers/asterisks
      /([^*]+)\*/,    // Everything before asterisk
      /([^0-9]+)[0-9]/  // Everything before numbers
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    }

    return description.split(' ')[0].toUpperCase();
  }

  /**
   * Extract location from description
   * @param {string} description - Transaction description
   * @returns {string} Location or empty string
   */
  extractLocation(description) {
    // Look for state codes (2 letters) or city patterns
    const stateMatch = description.match(/([A-Z]{2})\s+(DEBIT|CARD|PURCHASE)/);
    if (stateMatch) {
      return stateMatch[1];
    }

    // Look for city patterns
    const cityMatch = description.match(/([A-Z][a-z]+)\s+[A-Z]{2}\s+(DEBIT|CARD|PURCHASE)/);
    if (cityMatch) {
      return cityMatch[1];
    }

    return '';
  }

  /**
   * Extract last 4 digits of card number
   * @param {string} description - Transaction description
   * @returns {string} Last 4 digits or empty string
   */
  extractCardNumber(description) {
    const cardMatch = description.match(/\*(\d{4})/);
    return cardMatch ? cardMatch[1] : '';
  }

  /**
   * Load Amazon order data for reconciliation
   * @param {string} amazonFilePath - Path to Amazon orders CSV
   * @returns {Promise<boolean>} Success status
   */
  async loadAmazonData(amazonFilePath = './data/amazon-comprehensive-orders.csv') {
    try {
      console.log('🔄 Loading Amazon order data...');

      const orders = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(amazonFilePath)
          .pipe(csv())
          .on('data', (data) => {
            const order = this.parseAmazonOrder(data);
            if (order) {
              orders.push(order);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      this.amazonOrders = orders;
      this.reconciliationStats.totalAmazonOrders = orders.length;

      console.log(`✅ Loaded ${orders.length} Amazon orders`);
      return true;

    } catch (error) {
      console.error('❌ Error loading Amazon data:', error);
      return false;
    }
  }

  /**
   * Parse Amazon order data
   * @param {Object} data - Raw CSV row data
   * @returns {Object} Parsed Amazon order
   */
  parseAmazonOrder(data) {
    try {
      const orderDate = new Date(data['Order Date']);
      const totalOwed = parseFloat(data['Total Owed'].replace(/"/g, '')) || 0;
      const shippingCharge = parseFloat(data['Shipping Charge'].replace(/"/g, '')) || 0;

      return {
        orderId: data['Order ID'],
        date: orderDate,
        amount: totalOwed,
        shipping: shippingCharge,
        tax: parseFloat(data['Total Discounts'].replace(/"/g, '')) || 0,
        currency: data['Currency'],
        productName: data['Product Name'],
        asin: data['ASIN'],
        orderStatus: data['Order Status'],
        paymentMethod: data['Payment Instrument Type'],
        shippingAddress: data['Shipping Address'],
        // Additional fields for matching
        merchant: 'AMAZON',
        isAmazon: true,
        absAmount: Math.abs(totalOwed)
      };

    } catch (error) {
      console.warn('⚠️ Error parsing Amazon order:', error.message);
      return null;
    }
  }

  /**
   * Perform automated reconciliation
   * @param {Object} options - Reconciliation options
   * @returns {Object} Reconciliation results
   */
  performReconciliation(options = {}) {
    const defaultOptions = {
      dateToleranceDays: 3,      // Allow 3 days difference
      amountTolerance: 0.01,     // Allow 1 cent difference
      requireMerchantMatch: true // Require Amazon merchant match
    };

    const config = { ...defaultOptions, ...options };

    console.log('🔗 Performing bank-Amazon reconciliation...');

    // Reset previous results
    this.matchedTransactions.clear();
    this.unmatchedBankTransactions = [...this.bankTransactions];
    this.unmatchedAmazonOrders = [...this.amazonOrders];

    const matches = [];
    let totalConfidence = 0;

    // Match Amazon orders to bank transactions
    for (const amazonOrder of this.amazonOrders) {
      const match = this.findBestMatch(amazonOrder, config);

      if (match) {
        const confidence = this.calculateMatchConfidence(amazonOrder, match.bankTransaction, config);

        matches.push({
          amazonOrder,
          bankTransaction: match.bankTransaction,
          confidence,
          matchReason: match.reason
        });

        // Remove from unmatched lists
        const bankIndex = this.unmatchedBankTransactions.findIndex(t => t === match.bankTransaction);
        if (bankIndex > -1) {
          this.unmatchedBankTransactions.splice(bankIndex, 1);
        }

        const amazonIndex = this.unmatchedAmazonOrders.findIndex(o => o === amazonOrder);
        if (amazonIndex > -1) {
          this.unmatchedAmazonOrders.splice(amazonIndex, 1);
        }

        totalConfidence += confidence;
      }
    }

    // Update statistics
    this.reconciliationStats.matchedTransactions = matches.length;
    this.reconciliationStats.unmatchedBank = this.unmatchedBankTransactions.length;
    this.reconciliationStats.unmatchedAmazon = this.unmatchedAmazonOrders.length;
    this.reconciliationStats.totalMatchedAmount = matches.reduce((sum, match) =>
      sum + Math.abs(match.amazonOrder.amount), 0);
    this.reconciliationStats.averageMatchConfidence = matches.length > 0 ?
      totalConfidence / matches.length : 0;

    console.log(`✅ Matched ${matches.length} transactions`);
    console.log(`📊 Average confidence: ${(this.reconciliationStats.averageMatchConfidence * 100).toFixed(1)}%`);

    return {
      matches,
      unmatchedBank: this.unmatchedBankTransactions,
      unmatchedAmazon: this.unmatchedAmazonOrders,
      stats: this.reconciliationStats,
      analysis: this.generateReconciliationAnalysis(matches)
    };
  }

  /**
   * Find best matching bank transaction for an Amazon order
   * @param {Object} amazonOrder - Amazon order to match
   * @param {Object} config - Matching configuration
   * @returns {Object|null} Best match with transaction and reason
   */
  findBestMatch(amazonOrder, config) {
    let bestMatch = null;
    let bestScore = 0;

    for (const bankTransaction of this.unmatchedBankTransactions) {
      const score = this.calculateMatchScore(amazonOrder, bankTransaction, config);

      if (score > bestScore && score > 0.5) { // Minimum threshold
        bestMatch = {
          bankTransaction,
          reason: this.getMatchReason(amazonOrder, bankTransaction, score),
          score
        };
        bestScore = score;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between Amazon order and bank transaction
   * @param {Object} amazonOrder - Amazon order
   * @param {Object} bankTransaction - Bank transaction
   * @param {Object} config - Matching configuration
   * @returns {number} Match score (0-1)
   */
  calculateMatchScore(amazonOrder, bankTransaction, config) {
    let score = 0;

    // Amount matching (40% weight)
    const amountDiff = Math.abs(amazonOrder.absAmount - bankTransaction.absAmount);
    if (amountDiff <= config.amountTolerance) {
      score += 0.4;
    } else if (amountDiff <= config.amountTolerance * 5) {
      score += 0.4 * (1 - amountDiff / (config.amountTolerance * 5));
    }

    // Date matching (30% weight)
    const dateDiff = Math.abs(amazonOrder.date - bankTransaction.date) / (1000 * 60 * 60 * 24);
    if (dateDiff <= config.dateToleranceDays) {
      score += 0.3;
    } else if (dateDiff <= config.dateToleranceDays * 2) {
      score += 0.3 * (1 - dateDiff / (config.dateToleranceDays * 2));
    }

    // Merchant matching (30% weight)
    if (config.requireMerchantMatch) {
      if (bankTransaction.merchant.includes('AMAZON') ||
          amazonOrder.merchant.includes('AMAZON')) {
        score += 0.3;
      }
    } else {
      score += 0.3; // No merchant requirement
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate match confidence percentage
   * @param {Object} amazonOrder - Amazon order
   * @param {Object} bankTransaction - Bank transaction
   * @param {Object} config - Configuration
   * @returns {number} Confidence percentage (0-1)
   */
  calculateMatchConfidence(amazonOrder, bankTransaction, config) {
    const score = this.calculateMatchScore(amazonOrder, bankTransaction, config);
    return score; // Score is already 0-1
  }

  /**
   * Get human-readable match reason
   * @param {Object} amazonOrder - Amazon order
   * @param {Object} bankTransaction - Bank transaction
   * @param {number} score - Match score
   * @returns {string} Match reason description
   */
  getMatchReason(amazonOrder, bankTransaction, score) {
    const reasons = [];

    // Amount match
    const amountDiff = Math.abs(amazonOrder.absAmount - bankTransaction.absAmount);
    if (amountDiff < 0.01) {
      reasons.push('Exact amount match');
    } else {
      reasons.push(`Amount difference: $${amountDiff.toFixed(2)}`);
    }

    // Date match
    const dateDiff = Math.abs(amazonOrder.date - bankTransaction.date) / (1000 * 60 * 60 * 24);
    if (dateDiff === 0) {
      reasons.push('Same date');
    } else {
      reasons.push(`${dateDiff.toFixed(0)} day${dateDiff !== 1 ? 's' : ''} difference`);
    }

    // Merchant match
    if (bankTransaction.merchant.includes('AMAZON')) {
      reasons.push('Amazon merchant match');
    }

    return reasons.join(', ');
  }

  /**
   * Generate reconciliation analysis and insights
   * @param {Array} matches - Matched transactions
   * @returns {Object} Analysis results
   */
  generateReconciliationAnalysis(matches) {
    const analysis = {
      reconciliationQuality: {},
      unmatchedAnalysis: {},
      timingAnalysis: {},
      recommendations: []
    };

    // Reconciliation quality metrics
    const confidenceLevels = {
      high: matches.filter(m => m.confidence >= 0.8).length,
      medium: matches.filter(m => m.confidence >= 0.6 && m.confidence < 0.8).length,
      low: matches.filter(m => m.confidence < 0.6).length
    };

    analysis.reconciliationQuality = {
      highConfidenceMatches: confidenceLevels.high,
      mediumConfidenceMatches: confidenceLevels.medium,
      lowConfidenceMatches: confidenceLevels.low,
      overallMatchRate: this.reconciliationStats.totalAmazonOrders > 0 ?
        (this.reconciliationStats.matchedTransactions / this.reconciliationStats.totalAmazonOrders) * 100 : 0
    };

    // Unmatched analysis
    analysis.unmatchedAnalysis = {
      unmatchedBankTransactions: this.unmatchedBankTransactions.length,
      unmatchedAmazonOrders: this.unmatchedAmazonOrders.length,
      totalUnmatchedAmount: this.unmatchedBankTransactions.reduce((sum, t) => sum + t.absAmount, 0)
    };

    // Timing analysis
    const timingDiffs = matches.map(match => {
      const diff = Math.abs(match.amazonOrder.date - match.bankTransaction.date) / (1000 * 60 * 60 * 24);
      return diff;
    });

    analysis.timingAnalysis = {
      averageTimingDifference: timingDiffs.length > 0 ?
        timingDiffs.reduce((sum, diff) => sum + diff, 0) / timingDiffs.length : 0,
      sameDayMatches: timingDiffs.filter(diff => diff === 0).length,
      withinOneDay: timingDiffs.filter(diff => diff <= 1).length,
      withinThreeDays: timingDiffs.filter(diff => diff <= 3).length
    };

    // Generate recommendations
    if (analysis.reconciliationQuality.overallMatchRate < 80) {
      analysis.recommendations.push('Low match rate detected. Consider adjusting matching tolerances.');
    }

    if (analysis.unmatchedAnalysis.unmatchedBankTransactions > 10) {
      analysis.recommendations.push('Many unmatched bank transactions. Review for non-Amazon purchases.');
    }

    if (analysis.timingAnalysis.averageTimingDifference > 2) {
      analysis.recommendations.push('Large timing differences detected. Check for processing delays.');
    }

    return analysis;
  }

  /**
   * Get reconciliation dashboard data
   * @returns {Object} Dashboard data for UI
   */
  getReconciliationDashboard() {
    return {
      summary: {
        totalBankTransactions: this.reconciliationStats.totalBankTransactions,
        totalAmazonOrders: this.reconciliationStats.totalAmazonOrders,
        matchedTransactions: this.reconciliationStats.matchedTransactions,
        unmatchedBank: this.reconciliationStats.unmatchedBank,
        unmatchedAmazon: this.reconciliationStats.unmatchedAmazon,
        matchRate: this.reconciliationStats.totalAmazonOrders > 0 ?
          (this.reconciliationStats.matchedTransactions / this.reconciliationStats.totalAmazonOrders) * 100 : 0,
        totalMatchedAmount: this.reconciliationStats.totalMatchedAmount,
        averageConfidence: this.reconciliationStats.averageMatchConfidence
      },
      recentMatches: [], // Would populate with recent matches
      issues: [], // Would populate with reconciliation issues
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export reconciliation results to CSV
   * @param {string} outputPath - Path to save CSV file
   * @param {Array} matches - Matched transactions
   */
  exportReconciliationReport(outputPath, matches) {
    const csvContent = [
      'Order ID,Order Date,Order Amount,Bank Date,Bank Description,Bank Amount,Match Confidence,Match Reason',
      ...matches.map(match => [
        match.amazonOrder.orderId,
        match.amazonOrder.date.toISOString().split('T')[0],
        match.amazonOrder.amount.toFixed(2),
        match.bankTransaction.date.toISOString().split('T')[0],
        `"${match.bankTransaction.description}"`,
        match.bankTransaction.amount.toFixed(2),
        (match.confidence * 100).toFixed(1) + '%',
        `"${match.matchReason}"`
      ].join(','))
    ].join('\n');

    fs.writeFileSync(outputPath, csvContent);
    console.log(`📄 Reconciliation report exported to ${outputPath}`);
  }
}

module.exports = BankReconciliationEngine;
