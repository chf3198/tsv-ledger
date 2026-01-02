/**
 * Import Status Tracker
 *
 * Manages import status tracking for TSV Ledger data imports.
 * Provides real-time progress updates and error reporting.
 *
 * @module import/status-tracker
 * @version 1.0.0
 */

/**
 * Import status object
 * @typedef {Object} ImportStatus
 * @property {boolean} isImporting - Whether an import is currently in progress
 * @property {string} currentStep - Current step in the import process
 * @property {number} progress - Progress percentage (0-100)
 * @property {number} totalRecords - Total records to process
 * @property {number} processedRecords - Records processed so far
 * @property {Array<string>} errors - Array of error messages
 */

/** @type {ImportStatus} */
let importStatus = {
  isImporting: false,
  currentStep: "",
  progress: 0,
  totalRecords: 0,
  processedRecords: 0,
  errors: [],
};

/**
 * Resets the import status to initial state
 * @returns {void}
 */
function resetImportStatus() {
  importStatus = {
    isImporting: false,
    currentStep: "",
    progress: 0,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
  };
}

/**
 * Updates the current import step
 * @param {string} step - The current step description
 * @returns {void}
 */
function setImportStep(step) {
  importStatus.currentStep = step;
}

/**
 * Updates the import progress
 * @param {number} processed - Number of records processed
 * @param {number} total - Total number of records
 * @returns {void}
 */
function updateImportProgress(processed, total) {
  importStatus.processedRecords = processed;
  importStatus.totalRecords = total;
  importStatus.progress = total > 0 ? Math.round((processed / total) * 100) : 0;
}

/**
 * Adds an error to the import status
 * @param {string} error - Error message to add
 * @returns {void}
 */
function addImportError(error) {
  importStatus.errors.push(error);
}

/**
 * Gets the current import status (immutable copy)
 * @returns {ImportStatus} Copy of the current import status
 */
function getImportStatus() {
  return { ...importStatus, errors: [...importStatus.errors] };
}

/**
 * Starts the import process
 * @returns {void}
 */
function startImport() {
  importStatus.isImporting = true;
  importStatus.errors = [];
  importStatus.progress = 0;
  importStatus.processedRecords = 0;
}

/**
 * Completes the import process
 * @returns {void}
 */
function completeImport() {
  importStatus.isImporting = false;
  importStatus.currentStep = "Import completed";
  importStatus.progress = 100;
}

module.exports = {
  resetImportStatus,
  setImportStep,
  updateImportProgress,
  addImportError,
  getImportStatus,
  startImport,
  completeImport,
};
