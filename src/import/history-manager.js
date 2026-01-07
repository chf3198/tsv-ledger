/**
 * Import History Manager
 *
 * Manages import history tracking and persistence for TSV Ledger.
 * Stores successful import records with metadata.
 *
 * @module import/history-manager
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Import history entry
 * @typedef {Object} ImportHistoryEntry
 * @property {string} timestamp - ISO timestamp of import
 * @property {string} fileName - Name of imported file
 * @property {number} recordCount - Number of records imported
 * @property {string} importType - Type of import (csv, zip, etc.)
 * @property {string} status - Import status (success, partial, failed)
 */

/** @type {ImportHistoryEntry[]} */
let importHistory = [];

/**
 * Gets the path to the import history file
 * @param {string} dataFilePath - Path to the main data file
 * @returns {string} Path to import history file
 */
function getImportHistoryFile(dataFilePath) {
  return dataFilePath.replace('expenditures.json', 'import-history.json');
}

/**
 * Loads import history from file
 * @param {string} dataFilePath - Path to the main data file
 * @returns {ImportHistoryEntry[]} Array of import history entries
 */
function loadImportHistory(dataFilePath) {
  const historyFile = getImportHistoryFile(dataFilePath);
  if (!fs.existsSync(historyFile)) {
    return [];
  }

  try {
    const data = fs.readFileSync(historyFile, 'utf8');
    const parsed = JSON.parse(data);

    // Handle legacy format where history was wrapped in an object
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.history &&
      Array.isArray(parsed.history)
    ) {
      return parsed.history;
    }

    // Handle direct array format
    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch (error) {
    console.error('Error loading import history:', error.message);
    return [];
  }
}

/**
 * Saves import history to file
 * @param {string} dataFilePath - Path to the main data file
 * @param {ImportHistoryEntry[]} history - History entries to save
 * @returns {void}
 */
function saveImportHistory(dataFilePath, history) {
  const historyFile = getImportHistoryFile(dataFilePath);
  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving import history:', error.message);
  }
}

/**
 * Adds a new entry to import history
 * @param {string} dataFilePath - Path to the main data file
 * @param {ImportHistoryEntry} entry - History entry to add
 * @returns {ImportHistoryEntry[]} Updated history array
 */
function addImportHistoryEntry(dataFilePath, entry) {
  const history = loadImportHistory(dataFilePath);
  const newHistory = [...history, entry];
  saveImportHistory(dataFilePath, newHistory);
  importHistory = newHistory;
  return newHistory;
}

/**
 * Gets the current import history
 * @param {string} dataFilePath - Path to the main data file
 * @returns {ImportHistoryEntry[]} Array of import history entries
 */
function getImportHistory(dataFilePath) {
  if (importHistory.length === 0) {
    importHistory = loadImportHistory(dataFilePath);
  }
  return [...importHistory];
}

/**
 * Clears import history
 * @param {string} dataFilePath - Path to the main data file
 * @returns {void}
 */
function clearImportHistory(dataFilePath) {
  importHistory = [];
  saveImportHistory(dataFilePath, []);
}

module.exports = {
  loadImportHistory,
  saveImportHistory,
  addImportHistoryEntry,
  getImportHistory,
  clearImportHistory
};
