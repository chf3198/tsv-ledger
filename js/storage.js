/**
 * Storage - Pure functions + isolated side effects
 * @module storage
 *
 * localStorage schema (v3.5.0):
 * {
 *   'tsv-expenses': Expense[],           // Main data array
 *   'tsv-storage-mode': 'local'|'cloud', // ADR-024: User choice (local-first vs cloud sync)
 *   'tsv-auth': { token, user, exp },    // ADR-019: JWT session (token = Bearer JWT, exp = Unix timestamp)
 *   'tsv-onboarding-complete': 'true',   // ADR-025: Setup wizard completion flag
 *   'tsv-guest-acknowledged': 'true',    // Guest mode warning modal state
 *   'tsv-import-history': ImportRecord[] // ADR-013: Duplicate detection (file hash + import timestamp)
 * }
 *
 * Expense schema:
 * {
 *   id: string,              // "amazon-{orderID}-{idx}" or "boa-{date}-{idx}"
 *   date: string,            // ISO 8601 (YYYY-MM-DD)
 *   description: string,     // Item description from CSV
 *   amount: number,          // Dollars (not cents)
 *   businessPercent: number, // 0-100, default 100 (ADR-014: replaces old 'category' field)
 *   paymentMethod: string,   // Credit card last 4 or bank account name
 *   adjusted: boolean        // Tracks allocation: true = collapsed slider, false = expanded/editable
 * }
 *
 * Migration logic: Converts legacy 'category'→'businessPercent' and 'reviewed'→'adjusted'
 */

const STORAGE_KEY = 'tsv-expenses';

// PURE FUNCTIONS

// Pure: Expense[] -> string[]
const getUniqueLocations = (expenses) =>
  [...new Set(expenses.map(e => e.location).filter(Boolean))].sort();

// Pure: Expense -> string
const expenseToCSVRow = (e) => {
  const category = e.businessPercent >= 50 ? 'Office Supplies' : 'Employee Benefits';
  return [e.date, `"${(e.description || '').replace(/"/g, '""')}"`, e.location, category, (e.amount || 0).toFixed(2)].join(',');
};

// Pure: Expense[] -> string
const expensesToCSV = (expenses) =>
  ['Date,Description,Location,Category,Amount', ...expenses.map(expenseToCSVRow)].join('\n');

// SIDE EFFECTS (clearly marked)

// Effect: () -> Expense[]
const loadExpenses = () => {
  try {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // Migrate: category→businessPercent, reviewed→adjusted
    return expenses.map(e => ({
      ...e,
      businessPercent: e.businessPercent !== undefined ? e.businessPercent :
        (e.category === 'Business Supplies' ? 100 :
         e.category === 'Board Member Benefits' ? 0 : 100),
      adjusted: e.adjusted !== undefined ? e.adjusted : (e.reviewed || false)
    }));
  }
  catch { return []; }
};

// Effect: Expense[] -> void
const saveExpenses = (expenses) => localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));

// Effect: (Expense[], string) -> void
const exportToCSV = (expenses, filename) => {
  const blob = new Blob([expensesToCSV(expenses)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
};

// Exports
window.getUniqueLocations = getUniqueLocations;
window.loadExpenses = loadExpenses;
window.saveExpenses = saveExpenses;
window.exportToCSV = exportToCSV;
