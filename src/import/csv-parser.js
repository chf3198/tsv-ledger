/**
 * CSV Parser for Import
 *
 * Parses CSV/TSV data into expenditure objects for TSV Ledger.
 * Handles multiple formats: Amazon Chrome export, Amazon official, bank statements.
 *
 * @module import/csv-parser
 * @version 1.0.0
 */

const csv = require("csv-parser");
const { Readable } = require("stream");

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
    const separator = csvData.includes("\t") ? "\t" : ",";

    const csvStream = Readable.from(csvData);

    csvStream
      .pipe(
        csv({
          separator: separator,
          skipEmptyLines: true,
          headers: true,
        })
      )
      .on("data", (data) => {
        lineNumber++;

        try {
          const expenditure = parseRow(data, lineNumber);
          if (expenditure) {
            results.push(expenditure);
          } else {
            skippedRows.push({
              line: lineNumber,
              reason: "Invalid or incomplete data",
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
      .on("end", () => {
        resolve({
          expenditures: results,
          errors: errors,
          skipped: skippedRows,
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Parses a single CSV row into an expenditure object
 * @param {Object} data - Parsed CSV row data
 * @param {number} lineNumber - Line number for error reporting
 * @returns {Expenditure|null} Parsed expenditure or null if invalid
 */
function parseRow(data, lineNumber) {
  // Detect file format based on column headers
  const isAmazonFormat =
    data.hasOwnProperty("order id") ||
    data.hasOwnProperty("Order ID") ||
    data.hasOwnProperty("date") ||
    data.hasOwnProperty("Order Date");
  const isAmazonOfficialFormat =
    data.hasOwnProperty("id") &&
    data.hasOwnProperty("asin") &&
    data.hasOwnProperty("source");
  const isBankFormat =
    data.hasOwnProperty("Description") &&
    data.hasOwnProperty("") &&
    data.hasOwnProperty("Amount");

  let dateValue, amountValue, descValue, source;

  if (isAmazonOfficialFormat) {
    // Amazon Official Data format
    dateValue = data["Order Date"] || data.date || data.Date;
    amountValue =
      data["Purchase Price Per Unit ($)"] || data.amount || data.Amount;
    descValue =
      data["Product Name"] ||
      data.description ||
      data.Description ||
      "Amazon Purchase";
    source = "amazon-official";
  } else if (isAmazonFormat) {
    // Amazon Chrome export format
    dateValue = data["Order Date"] || data.date || data.Date;
    amountValue = data["Total Owed"] || data.amount || data.Amount;
    descValue =
      data["Product Name"] ||
      data.description ||
      data.Description ||
      "Amazon Purchase";
    source = "amazon-chrome";
  } else if (isBankFormat) {
    // Bank statement format
    dateValue = data["Date"] || data.date;
    amountValue = data["Amount"] || data.amount;
    descValue = data["Description"] || data.description;
    source = "bank";
  } else {
    // Generic format
    dateValue = data.date || data.Date;
    amountValue = data.amount || data.Amount;
    descValue = data.description || data.Description;
    source = "generic";
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
    description: descValue || "Unknown",
    category: "Uncategorized", // Will be categorized later
    source: source,
  };
}

/**
 * Parses date string into YYYY-MM-DD format
 * @param {string} dateStr - Date string to parse
 * @returns {string|null} Formatted date or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
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
  if (amountStr === null || amountStr === undefined) return null;

  try {
    const cleaned = String(amountStr).replace(/[$,\s]/g, "");
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
};
