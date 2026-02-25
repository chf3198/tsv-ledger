/**
 * Payment Method utilities for expense filtering (ADR-017)
 * Groups expenses by payment method and provides purge functionality
 */

/**
 * Get unique payment methods with counts and totals
 * @param {Array} expenses - Array of expense objects
 * @returns {Array} Array of {method, count, total} objects sorted by total desc
 */
const getPaymentMethodStats = (expenses) => {
  const stats = {};
  expenses.forEach(e => {
    const method = e.paymentMethod || 'Unknown';
    if (!stats[method]) stats[method] = { method, count: 0, total: 0 };
    stats[method].count++;
    stats[method].total += e.amount;
  });
  return Object.values(stats).sort((a, b) => b.total - a.total);
};

/**
 * Get friendly label for payment method
 * @param {string} method - Raw payment method string
 * @returns {string} Human-friendly label
 */
const getPaymentMethodLabel = (method) => {
  if (method === 'panda01') return 'Whole Foods (In-Store)';
  if (method === 'Unknown') return 'Unknown Payment Method';
  return method;
};

/**
 * Filter expenses by excluding a payment method
 * @param {Array} expenses - Array of expense objects
 * @param {string} methodToRemove - Payment method to exclude
 * @returns {Array} Filtered expenses
 */
const filterByPaymentMethod = (expenses, methodToRemove) => {
  return expenses.filter(e => (e.paymentMethod || 'Unknown') !== methodToRemove);
};
