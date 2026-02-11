/**
 * TSV Expenses - Alpine.js App with Functional Core
 * Utilities loaded from utils.js
 */

function expenseApp() {
  return {
    expenses: [], filteredExpenses: [], locations: [], dragover: false,
    importStatus: '', importError: false, importComplete: false, filters: emptyFilters(), newExpense: emptyExpense(),
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
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'csv') this.importFile(file);
      else if (ext === 'dat') this.importFile(file);
      else this.setError('Please drop a CSV or DAT file');
    },
    handleFileSelect(e) { 
      const file = e.target.files[0];
      if (file) this.importFile(file);
    },
    setError(msg) { this.importStatus = msg; this.importError = true; this.importComplete = false; },

    async importFile(file) {
      this.importStatus = 'Importing...'; this.importError = false; this.importComplete = false;
      try {
        const text = await file.text();
        const ext = file.name.split('.').pop().toLowerCase();
        
        let result;
        if (ext === 'csv') {
          // Detect Amazon CSV vs generic CSV
          if (text.includes('Order ID') && text.includes('Product Name')) {
            result = parseAmazonCSV(text, guessCategory);
          } else {
            result = await parseCSVFile(file, guessCategory);
          }
        } else if (ext === 'dat') {
          result = parseBOAStatement(text, guessCategory);
        } else {
          throw new Error('Unsupported file type');
        }

        this.expenses = [...this.expenses, ...result.expenses];
        this.save();
        this.importStatus = `✓ Imported ${result.expenses.length}` + (result.skipped ? `, skipped ${result.skipped}` : '');
        this.importComplete = true;
      } catch (e) { this.setError('Import failed: ' + e.message); }
    },

    formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
