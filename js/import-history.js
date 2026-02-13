/**
 * Import History Tracking
 * Persists import metadata to localStorage for audit trail
 */

const IMPORT_HISTORY_KEY = 'tsv-import-history';
const MAX_HISTORY = 50;

/**
 * Load import history from localStorage
 * @returns {Array<Object>} Array of import records, newest first
 */
const loadImportHistory = () => {
  const json = localStorage.getItem(IMPORT_HISTORY_KEY);
  return json ? JSON.parse(json) : [];
};

/**
 * Add an import record to history
 * @param {Object} record - Import metadata
 * @param {string} record.type - "amazon-zip" | "amazon-csv" | "boa-dat"
 * @param {string} record.filename - Uploaded file name
 * @param {number} record.recordsCount - New expenses added
 * @param {number} record.duplicatesCount - Duplicates skipped
 * @param {number} record.skipped - Invalid records
 * @param {Object} record.dateRange - {earliest, latest} ISO date strings
 * @param {boolean} record.success - Overall success status
 */
const addImportRecord = (record) => {
  const history = loadImportHistory();
  const newRecord = {
    id: `import-${Date.now()}`,
    timestamp: Date.now(),
    ...record
  };

  history.unshift(newRecord); // Add to front (newest first)

  // Trim to MAX_HISTORY
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(trimmed));
};

/**
 * Format date range for display
 * @param {string} earliest - ISO date
 * @param {string} latest - ISO date
 * @returns {string} Formatted range, e.g., "Jan 15, 2024 → Feb 10, 2024"
 */
const formatDateRange = (earliest, latest) => {
  if (!earliest || !latest) return 'Unknown date range';

  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  const start = new Date(earliest).toLocaleDateString('en-US', opts);
  const end = new Date(latest).toLocaleDateString('en-US', opts);

  return earliest === latest ? start : `${start} → ${end}`;
};

/**
 * Create import record from import result
 * @param {Object} params - Import parameters
 * @returns {Object} Import record
 */
const createImportRecord = ({ ext, result, filename, newCount, dupCount }) => {
  const dates = result.expenses.map(e => e.date).filter(Boolean);
  return {
    type: ext === 'zip' ? 'amazon-zip' : ext === 'csv' ? 'amazon-csv' : 'boa-dat',
    filename: result.filename || filename,
    recordsCount: newCount,
    duplicatesCount: dupCount,
    skipped: result.skipped || 0,
    dateRange: dates.length > 0
      ? { earliest: dates.sort()[0], latest: dates.sort().reverse()[0] }
      : null,
    success: true
  };
};
