/**
 * TSV Expenses - Alpine.js App with Functional Core
 * Pure functions for logic, Alpine for reactivity
 */

// Pure: (Expense[], string) -> number
const sumByCategory = (expenses, category) => 
  expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);

// Pure: (Expense[], string) -> number
const countByCategory = (expenses, category) => 
  expenses.filter(e => e.category === category).length;

// Pure: (Expense[], Filters) -> Expense[]
const filterExpenses = (expenses, { location, category, startDate, endDate }) =>
  expenses.filter(e =>
    (!location || e.location === location) &&
    (!category || e.category === category) &&
    (!startDate || e.date >= startDate) &&
    (!endDate || e.date <= endDate)
  ).sort((a, b) => b.date.localeCompare(a.date));

// Pure: () -> string
const today = () => new Date().toISOString().split('T')[0];

// Pure: () -> Filters
const emptyFilters = () => ({ location: '', category: '', startDate: '', endDate: '' });

// Pure: () -> NewExpense
const emptyExpense = () => ({ date: today(), description: '', location: '', category: '', amount: null });

function expenseApp() {
  return {
    expenses: [], filteredExpenses: [], locations: [], dragover: false,
    importStatus: '', importError: false, filters: emptyFilters(), newExpense: emptyExpense(),
    // Shell state (ADR-010)
    menuOpen: false, route: 'dashboard',
    // Auth state (ADR-009)
    auth: JSON.parse(localStorage.getItem('tsv-auth') || '{"user":null,"authenticated":false}'),
    showAuthModal: false, showUserMenu: false,

    get totals() {
      return { supplies: sumByCategory(this.expenses, 'Office Supplies'),
               benefits: sumByCategory(this.expenses, 'Employee Benefits') };
    },
    get counts() {
      return { supplies: countByCategory(this.expenses, 'Office Supplies'),
               benefits: countByCategory(this.expenses, 'Employee Benefits') };
    },
    get filteredTotal() { return this.filteredExpenses.reduce((s, e) => s + e.amount, 0); },

    init() { this.expenses = loadExpenses(); this.refresh(); },
    refresh() { this.locations = getUniqueLocations(this.expenses); this.applyFilters(); },
    save() { saveExpenses(this.expenses); this.refresh(); },

    handleDrop(e) {
      this.dragover = false;
      const file = e.dataTransfer.files[0];
      file?.name.endsWith('.csv') ? this.importCSV(file) : this.setError('Please drop a CSV file');
    },
    handleFileSelect(e) { e.target.files[0] && this.importCSV(e.target.files[0]); },
    setError(msg) { this.importStatus = msg; this.importError = true; },

    async importCSV(file) {
      this.importStatus = 'Importing...'; this.importError = false;
      try {
        const { expenses, skipped } = await parseCSVFile(file, guessCategory);
        this.expenses = [...this.expenses, ...expenses];
        this.save();
        this.importStatus = `✓ Imported ${expenses.length}` + (skipped ? `, skipped ${skipped}` : '');
      } catch (e) { this.setError('Import failed: ' + e.message); }
    },

    addExpense() {
      if (!this.newExpense.description || !this.newExpense.amount) return;
      this.expenses = [...this.expenses, { ...this.newExpense, id: Date.now(), amount: +this.newExpense.amount }];
      this.save(); this.newExpense = emptyExpense();
    },
    updateExpense() { this.save(); },
    deleteExpense(id) { confirm('Delete?') && (this.expenses = this.expenses.filter(e => e.id !== id), this.save()); },
    clearAll() { confirm('Delete ALL?') && (this.expenses = [], this.save()); },
    applyFilters() { this.filteredExpenses = filterExpenses(this.expenses, this.filters); },
    clearFilters() { this.filters = emptyFilters(); this.applyFilters(); },
    exportCSV() { exportToCSV(this.filteredExpenses, `tsv-expenses-${today()}.csv`); },
    formatCurrency,
    // Auth methods (ADR-009) - UI only, actual OAuth in CloudFlare Worker
    authWith(provider) { console.log('Auth with:', provider); this.showAuthModal = false; },
    logout() { this.auth = { user: null, authenticated: false }; 
      localStorage.removeItem('tsv-auth'); this.showUserMenu = false; }
  };
}
