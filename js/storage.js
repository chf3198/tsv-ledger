/**
 * Storage - Pure functions + isolated side effects
 * @module storage
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
    // Migrate old category field to businessPercent  
    return expenses.map(e => ({
      ...e,
      businessPercent: e.businessPercent !== undefined ? e.businessPercent :
        (e.category === 'Business Supplies' ? 100 : 
         e.category === 'Board Member Benefits' ? 0 : 100) // Default uncategorized to 100%
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
