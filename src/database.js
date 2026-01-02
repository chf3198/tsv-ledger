/**
 * Database Module - JSON File Operations
 *
 * Handles all data persistence operations for the TSV Ledger application.
 * Manages expenditure data storage and retrieval using JSON files.
 * Supports test database isolation through environment variables.
 *
 * @module database
 * @author TSV Ledger Team
 * @version 2.2.2
 */

const fs = require("fs");
const path = require("path");

// Data file path - support test database isolation
const getDataFilePath = () => {
  // Use test database when NODE_ENV is 'test' or PROCESS.TEST_DB is set
  if (process.env.NODE_ENV === "test" || process.env.TEST_DB) {
    return path.join(
      __dirname,
      "..",
      "tests",
      "data",
      "test-expenditures.json"
    );
  }
  return path.join(__dirname, "..", "data", "expenditures.json");
};

// Ensure data directory exists
const ensureDataDir = () => {
  const dataFile = getDataFilePath();
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
};

ensureDataDir();

/**
 * Reads expenditures from the JSON data file
 *
 * Retrieves all stored expenditure records from the persistent JSON file storage.
 * This is the primary data retrieval method for the expense tracking system.
 *
 * @returns {Array<Object>} Array of expenditure objects, empty array if read fails
 * @throws {Error} Logs error to console but returns empty array for graceful degradation
 *
 * @example
 * const expenditures = readExpenditures();
 * // Returns: [{ id: 1, description: 'Office supplies', amount: 150.00, date: '2025-01-15' }, ...]
 */
function readExpenditures() {
  try {
    const dataFile = getDataFilePath();
    const data = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading expenditures file:", err);
    return [];
  }
}

/**
 * Writes expenditures array to the JSON data file
 *
 * Persists expenditure data to disk using JSON file storage.
 * Includes pretty-printing for human readability during development.
 *
 * @param {Array<Object>} expenditures - Array of expenditure objects to save
 * @param {number} expenditures[].id - Unique identifier for the expenditure
 * @param {string} expenditures[].description - Description of the expense
 * @param {number} expenditures[].amount - Expense amount
 * @param {string} [expenditures[].date] - Date of the expense (ISO format)
 * @param {string} [expenditures[].category] - Business category classification
 *
 * @example
 * const expenditures = [
 *   { id: 1, description: 'Office supplies', amount: 150.00, date: '2025-01-15' }
 * ];
 * writeExpenditures(expenditures);
 * // Saves data to data/expenditures.json
 */
function writeExpenditures(expenditures) {
  try {
    const dataFile = getDataFilePath();
    fs.writeFileSync(dataFile, JSON.stringify(expenditures, null, 2));
  } catch (err) {
    console.error("Error writing expenditures file:", err);
  }
}

/**
 * Retrieves all expenditures with callback pattern
 *
 * Asynchronous wrapper for reading expenditures, following Node.js callback conventions.
 * Used by Express routes for API responses.
 *
 * @param {Function} callback - Callback function with (error, data) signature
 * @param {Error|null} callback.error - Error object if operation failed, null on success
 * @param {Array<Object>} callback.data - Array of expenditure objects
 *
 * @example
 * getAllExpenditures((error, expenditures) => {
 *   if (error) {
 *     console.error('Failed to get expenditures:', error);
 *     return;
 *   }
 *   console.log('Retrieved', expenditures.length, 'expenditures');
 * });
 */
function getAllExpenditures(callback) {
  const expenditures = readExpenditures();
  callback(null, expenditures);
}

/**
 * Adds a new expenditure to the data store
 *
 * Creates a new expenditure record with auto-generated ID and persists it to storage.
 * Follows REST API patterns for resource creation.
 *
 * @param {Object} expenditure - New expenditure data (without id)
 * @param {string} expenditure.description - Description of the expense (required)
 * @param {number} expenditure.amount - Expense amount (required)
 * @param {string} [expenditure.date] - Date of the expense (optional)
 * @param {string} [expenditure.category] - Business category (optional)
 * @param {Function} callback - Callback function with (error, data) signature
 * @param {Error|null} callback.error - Error object if operation failed, null on success
 * @param {Object} callback.data - Created expenditure object with generated id
 *
 * @example
 * const newExpense = {
 *   description: 'Team lunch at Texas Roadhouse',
 *   amount: 200.00,
 *   date: '2025-01-16',
 *   category: 'Food & Dining'
 * };
 *
 * addExpenditure(newExpense, (error, createdExpense) => {
 *   if (error) {
 *     console.error('Failed to add expenditure:', error);
 *     return;
 *   }
 *   console.log('Created expense with ID:', createdExpense.id);
 * });
 */
function addExpenditure(expenditure, callback, options = {}) {
  const expenditures = readExpenditures();
  const { allowUpdates = true, preserveUserData = true } = options;

  // Check for existing record using unique identifiers
  const existingIndex = findExistingExpenditureIndex(expenditures, expenditure);

  if (existingIndex !== -1 && allowUpdates) {
    // Update existing record with smart merging
    const existing = expenditures[existingIndex];
    const merged = mergeExpenditureData(
      existing,
      expenditure,
      preserveUserData
    );

    expenditures[existingIndex] = merged;
    writeExpenditures(expenditures);
    callback(null, merged, true); // true indicates this was an update
  } else {
    // Create new record
    const { id: _, ...expenditureData } = expenditure;
    const newExpenditure = {
      id: expenditures.length + 1,
      ...expenditureData,
      // Initialize user data fields if not present
      userNotes: expenditure.userNotes || "",
      customFields: expenditure.customFields || {},
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    expenditures.push(newExpenditure);
    writeExpenditures(expenditures);
    callback(null, newExpenditure, false); // false indicates this was a new record
  }
}

/**
 * Finds existing expenditure index by unique identifiers
 * Used for duplicate prevention during imports
 *
 * @param {Array<Object>} expenditures - Array of existing expenditures
 * @param {Object} newExpenditure - New expenditure to check for duplicates
 * @returns {number} Index of existing expenditure, or -1 if not found
 */
function findExistingExpenditureIndex(expenditures, newExpenditure) {
  // Priority 1: Check by Amazon Order ID (most reliable)
  if (newExpenditure.amazonOrderId) {
    const index = expenditures.findIndex(
      (exp) => exp.amazonOrderId === newExpenditure.amazonOrderId
    );
    if (index !== -1) return index;
  }

  // Priority 2: Check by Amazon Subscription ID
  if (newExpenditure.amazonSubscriptionId) {
    const index = expenditures.findIndex(
      (exp) => exp.amazonSubscriptionId === newExpenditure.amazonSubscriptionId
    );
    if (index !== -1) return index;
  }

  // Priority 3: Check by Amazon ASIN + Date (for item-level matching)
  if (newExpenditure.amazonASIN && newExpenditure.date) {
    const index = expenditures.findIndex(
      (exp) =>
        exp.amazonASIN === newExpenditure.amazonASIN &&
        exp.date === newExpenditure.date
    );
    if (index !== -1) return index;
  }

  // Priority 4: Fuzzy match by date, amount, and description (for bank transactions)
  // Only match if all three match exactly to avoid false positives
  if (
    newExpenditure.date &&
    newExpenditure.amount &&
    newExpenditure.description
  ) {
    const index = expenditures.findIndex(
      (exp) =>
        exp.date === newExpenditure.date &&
        exp.amount === newExpenditure.amount &&
        exp.description === newExpenditure.description
    );
    if (index !== -1) return index;
  }

  return -1; // No duplicate found
}

/**
 * Merges import data with existing expenditure, preserving user modifications
 * User-editable fields take precedence over import data
 *
 * @param {Object} existing - Existing expenditure record
 * @param {Object} imported - New imported data
 * @param {boolean} preserveUserData - Whether to preserve user modifications
 * @returns {Object} Merged expenditure object
 */
function mergeExpenditureData(existing, imported, preserveUserData = true) {
  const merged = { ...existing };

  // Always update these fields from import (they're authoritative)
  merged.amazonOrderId = imported.amazonOrderId || merged.amazonOrderId;
  merged.amazonSubscriptionId =
    imported.amazonSubscriptionId || merged.amazonSubscriptionId;
  merged.amazonASIN = imported.amazonASIN || merged.amazonASIN;
  merged.amazonCategory = imported.amazonCategory || merged.amazonCategory;
  merged.dataSource = imported.dataSource || merged.dataSource;
  merged.processedDate = imported.processedDate || merged.processedDate;

  // Update metadata if provided
  if (imported.metadata) {
    merged.metadata = { ...merged.metadata, ...imported.metadata };
  }

  // Preserve user modifications if requested
  if (preserveUserData) {
    // User-editable fields - keep existing values
    merged.category = merged.category || imported.category;
    merged.description = merged.description || imported.description;
    merged.userNotes = merged.userNotes || imported.userNotes || "";
    merged.customFields = { ...imported.customFields, ...merged.customFields };

    // Keep existing amount/date unless they're clearly wrong (zero/null)
    if (merged.amount && merged.amount !== 0) {
      // Keep existing amount
    } else {
      merged.amount = imported.amount;
    }

    if (merged.date) {
      // Keep existing date
    } else {
      merged.date = imported.date;
    }
  } else {
    // Overwrite with import data
    merged.category = imported.category || merged.category;
    merged.description = imported.description || merged.description;
    merged.amount = imported.amount;
    merged.date = imported.date;
    merged.userNotes = imported.userNotes || merged.userNotes || "";
    merged.customFields = { ...merged.customFields, ...imported.customFields };
  }

  // Update last modified timestamp
  merged.lastModified = new Date().toISOString();

  // Ensure createdAt is preserved
  merged.createdAt = merged.createdAt || new Date().toISOString();

  return merged;
}

/**
 * Test Database Management Functions
 * These functions are only available when NODE_ENV=test or TEST_DB is set
 */

/**
 * Clear all test data from the database
 * Only works in test environment to prevent accidental data loss
 *
 * @returns {boolean} True if cleared successfully, false if not in test mode
 */
function clearTestData() {
  if (process.env.NODE_ENV !== "test" && !process.env.TEST_DB) {
    console.warn("⚠️ clearTestData() only works in test environment");
    return false;
  }

  try {
    fs.writeFileSync(dataFile, JSON.stringify([]));
    return true;
  } catch (err) {
    console.error("Error clearing test data:", err);
    return false;
  }
}

/**
 * Reset test database to initial state
 * Recreates the data file with empty array
 *
 * @returns {boolean} True if reset successfully
 */
function resetTestDatabase() {
  if (process.env.NODE_ENV !== "test" && !process.env.TEST_DB) {
    console.warn("⚠️ resetTestDatabase() only works in test environment");
    return false;
  }

  try {
    // Ensure directory exists
    const dataFile = getDataFilePath();
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataFile, JSON.stringify([]));
    return true;
  } catch (err) {
    console.error("Error resetting test database:", err);
    return false;
  }
}

/**
 * Check if currently using test database
 *
 * @returns {boolean} True if using test database
 */
function isTestDatabase() {
  return process.env.NODE_ENV === "test" || !!process.env.TEST_DB;
}

/**
 * Get current database file path (for debugging)
 *
 * @returns {string} Absolute path to current database file
 */
function getDatabasePath() {
  return getDataFilePath();
}

// Export the functions
module.exports = {
  getAllExpenditures,
  addExpenditure,
  writeExpenditures,
  clearTestData,
  resetTestDatabase,
  isTestDatabase,
  getDatabasePath,
  getDataFilePath,
};
