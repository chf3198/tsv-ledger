/**
 * CSV Parser for Import
 *
 * Parses CSV/TSV data into expenditure objects for TSV Ledger.
 * Handles multiple formats: Amazon Chrome export, Amazon official, bank statements.
 *
 * @module import/csv-parser
 * @version 1.0.0
 */

const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Expenditure object
 * @typedef {Object} Expenditure
 * @property {string} id - Unique identifier
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} amount - Transaction amount
 * @property {string} description - Transaction description
 * @property {string} category - Categorized expense category
 * @property {string} source - Data source (amazon, bank, etc.)
 */

/**
 * Preprocesses Bank of America DAT file to extract data section
 * BOA files have a summary section at the top that needs to be skipped
 * @param {string} data - Raw file data
 * @returns {string} Preprocessed data with only the data section
 */
function preprocessBOAData(data) {
  const lines = data.split(/\r?\n/);

  // Look for the data header row: "Date\tDescription\tAmount\tRunning Bal."
  const headerIndex = lines.findIndex(line => {
    const normalized = line.toLowerCase().trim();
    return normalized.startsWith('date\t') &&
           normalized.includes('description') &&
           normalized.includes('amount');
  });

  if (headerIndex > 0) {
    // Found BOA format - return only from header row onwards
    return lines.slice(headerIndex).join('\n');
  }

  return data;
}

/**
 * Detects if data is Bank of America DAT format
 * @param {string} data - Raw file data
 * @returns {boolean} True if BOA format detected
 */
function isBOAFormat(data) {
  const firstLines = data.split(/\r?\n/).slice(0, 10).join('\n').toLowerCase();
  return (
    firstLines.includes('beginning balance') ||
    firstLines.includes('total credits') ||
    firstLines.includes('total debits') ||
    firstLines.includes('ending balance') ||
    (firstLines.includes('date\t') && firstLines.includes('running bal'))
  );
}

/**
 * Parses CSV/TSV data into expenditure objects
 * @param {string} csvData - Raw CSV/TSV data as string
 * @param {Object} options - Parsing options
 * @param {Function} options.onProgress - Progress callback (processed, total)
 * @param {Function} options.onError - Error callback (error)
 * @returns {Promise<{expenditures: Expenditure[], errors: string[], skipped: Object[]}>}
 */
async function parseCSVData(csvData, options = {}) {
  const { onProgress, onError } = options;

  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    const skippedRows = [];

    let lineNumber = 0;

    // Preprocess BOA DAT files to skip summary section
    let processedData = csvData;
    const isBOA = isBOAFormat(csvData);
    if (isBOA) {
      processedData = preprocessBOAData(csvData);
    }

    const separator = processedData.includes('\t') ? '\t' : ',';

    const csvStream = Readable.from(processedData);

    csvStream
      .pipe(
        csv({
          separator,
          skipEmptyLines: true
          // Let csv-parser auto-detect headers from first row
        })
      )
      .on('data', (data) => {
        lineNumber++;

        try {
          const expenditure = parseRow(data, lineNumber, isBOA);
          if (expenditure) {
            results.push(expenditure);
          } else {
            skippedRows.push({
              line: lineNumber,
              reason: 'Invalid or incomplete data'
            });
          }

          if (onProgress) {
            onProgress(results.length + skippedRows.length, lineNumber);
          }
        } catch (error) {
          const errorMsg = `Line ${lineNumber}: ${error.message}`;
          errors.push(errorMsg);
          if (onError) {
            onError(error);
          }
        }
      })
      .on('end', () => {
        resolve({
          expenditures: results,
          errors,
          skipped: skippedRows
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Parses a single CSV row into an expenditure object
 * @param {Object} data - Parsed CSV row data
 * @param {number} lineNumber - Line number for error reporting
 * @param {boolean} isBOA - Whether this is Bank of America format
 * @returns {Expenditure|null} Parsed expenditure or null if invalid
 */
function parseRow(data, lineNumber, isBOA = false) {
  // Bank of America DAT format detection
  const isBOAFormat = isBOA ||
    (data.hasOwnProperty('Date') &&
     data.hasOwnProperty('Description') &&
     data.hasOwnProperty('Amount') &&
     data.hasOwnProperty('Running Bal.'));

  // Detect file format based on column headers
  const isAmazonFormat =
    data.hasOwnProperty('order id') ||
    data.hasOwnProperty('Order ID') ||
    data.hasOwnProperty('date') ||
    data.hasOwnProperty('Order Date');
  const isAmazonOfficialFormat =
    data.hasOwnProperty('id') &&
    data.hasOwnProperty('asin') &&
    data.hasOwnProperty('source');
  const isBankFormat = isBOAFormat ||
    (data.hasOwnProperty('Description') &&
    data.hasOwnProperty('Amount'));

  let dateValue, amountValue, descValue, source;

  if (isBOAFormat) {
    // Bank of America DAT format - prioritize this check
    dateValue = data['Date'] || data.date;
    amountValue = data['Amount'] || data.amount;
    descValue = data['Description'] || data.description;
    source = 'bank-boa';

    // Skip rows without actual transaction data (e.g., "Beginning balance" rows)
    if (descValue && descValue.toLowerCase().includes('beginning balance')) {
      return null;
    }
  } else if (isAmazonOfficialFormat) {
    // Amazon Official Data format
    dateValue = data['Order Date'] || data.date || data.Date;
    amountValue =
      data['Purchase Price Per Unit ($)'] || data.amount || data.Amount;
    descValue =
      data['Product Name'] ||
      data.description ||
      data.Description ||
      'Amazon Purchase';
    source = 'amazon-official';
  } else if (isAmazonFormat) {
    // Amazon Chrome export format
    dateValue = data['Order Date'] || data.date || data.Date;
    amountValue = data['Total Owed'] || data.amount || data.Amount;
    descValue =
      data['Product Name'] ||
      data.description ||
      data.Description ||
      'Amazon Purchase';
    source = 'amazon-chrome';
  } else if (isBankFormat) {
    // Bank statement format
    dateValue = data['Date'] || data.date;
    amountValue = data['Amount'] || data.amount;
    descValue = data['Description'] || data.description;
    source = 'bank';
  } else {
    // Generic format
    dateValue = data.date || data.Date;
    amountValue = data.amount || data.Amount;
    descValue = data.description || data.Description;
    source = 'generic';
  }

  // Validate required fields
  if (!dateValue || !amountValue) {
    return null;
  }

  // Parse and validate date
  const parsedDate = parseDate(dateValue);
  if (!parsedDate) {
    throw new Error(`Invalid date format: ${dateValue}`);
  }

  // Parse and validate amount
  const parsedAmount = parseAmount(amountValue);
  if (parsedAmount === null) {
    throw new Error(`Invalid amount format: ${amountValue}`);
  }

  return {
    id: generateId(),
    date: parsedDate,
    amount: parsedAmount,
    description: descValue || 'Unknown',
    category: 'Uncategorized', // Will be categorized later
    source
  };
}

/**
 * Parses date string into YYYY-MM-DD format
 * @param {string} dateStr - Date string to parse
 * @returns {string|null} Formatted date or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) {
    return null;
  }

  try {
    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Parses amount string into number
 * @param {string|number} amountStr - Amount to parse
 * @returns {number|null} Parsed amount or null if invalid
 */
function parseAmount(amountStr) {
  if (amountStr === null || amountStr === undefined) {
    return null;
  }

  try {
    const cleaned = String(amountStr).replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Generates a unique ID for expenditure
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
  parseCSVData,
  parseRow,
  parseDate,
  parseAmount,
  preprocessBOAData,
  isBOAFormat
};
