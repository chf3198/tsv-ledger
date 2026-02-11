/**
 * Pure utility functions for expense calculations
 * No side effects, easy to test
 */

// (Expense[], string) -> number
const sumByCategory = (expenses, category) => 
  expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);

// (Expense[], string) -> number
const countByCategory = (expenses, category) => 
  expenses.filter(e => e.category === category).length;

// (Expense[], Filters) -> Expense[]
const filterExpenses = (expenses, { location, category, startDate, endDate }) =>
  expenses.filter(e =>
    (!location || e.location === location) &&
    (!category || e.category === category) &&
    (!startDate || e.date >= startDate) &&
    (!endDate || e.date <= endDate)
  ).sort((a, b) => b.date.localeCompare(a.date));

// () -> string (YYYY-MM-DD)
const today = () => new Date().toISOString().split('T')[0];

// () -> Filters
const emptyFilters = () => ({ location: '', category: '', startDate: '', endDate: '' });

// () -> NewExpense
const emptyExpense = () => ({ date: today(), description: '', location: '', category: '', amount: null });

// (number) -> string
const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

window.sumByCategory = sumByCategory;
window.countByCategory = countByCategory;
window.filterExpenses = filterExpenses;
window.today = today;
window.emptyFilters = emptyFilters;
window.emptyExpense = emptyExpense;
window.formatCurrency = formatCurrency;
