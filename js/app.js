/**
 * TSV Expenses - Alpine.js App with Functional Core
 * Utilities loaded from utils.js
 */

function expenseApp() {
  return {
    expenses: [], filteredExpenses: [], locations: [], dragover: false,
    importStatus: '', importError: false, importComplete: false, filters: emptyFilters(), newExpense: emptyExpense(),
    importHistory: [],
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

    init() { this.expenses = loadExpenses(); this.importHistory = loadImportHistory(); this.refresh(); },
    refresh() { this.locations = getUniqueLocations(this.expenses); this.applyFilters(); },
    save() { saveExpenses(this.expenses); this.refresh(); },

    handleDrop(e) {
      this.dragover = false; const file = e.dataTransfer.files[0]; if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      (ext === 'csv' || ext === 'dat' || ext === 'zip') ? this.importFile(file) : this.setError('Please drop a CSV, DAT, or ZIP file');
    },
    handleFileSelect(e) { const file = e.target.files[0]; if (file) this.importFile(file); },
    setError(msg) { this.importStatus = msg; this.importError = true; this.importComplete = false; },

    async importFile(file) {
      this.importStatus = 'Importing...'; this.importError = false; this.importComplete = false;
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let result;

        if (ext === 'zip') {
          result = await importAmazonZip(file, guessCategory);
        } else {
          const text = await file.text();
          if (ext === 'csv') {
            result = text.includes('Order ID') && text.includes('Product Name')
              ? parseAmazonCSV(text, guessCategory)
              : await parseCSVFile(file, guessCategory);
          } else if (ext === 'dat') {
            result = parseBOAStatement(text, guessCategory);
          } else {
            throw new Error('Unsupported file type');
          }
        }

        // Duplicate detection (ADR-013)
        const existingIds = new Set(this.expenses.map(e => e.id));
        const newExpenses = result.expenses.filter(e => !existingIds.has(e.id));
        const duplicatesCount = result.expenses.length - newExpenses.length;

        this.expenses = [...this.expenses, ...newExpenses]; this.save();

        // Track import history
        addImportRecord(createImportRecord({ ext, result, filename: file.name, newCount: newExpenses.length, dupCount: duplicatesCount }));
        this.importHistory = loadImportHistory();

        // Update status
        this.importStatus = [`✓ ${newExpenses.length} new`, duplicatesCount > 0 ? `${duplicatesCount} duplicates` : '', result.skipped ? `${result.skipped} skipped` : ''].filter(Boolean).join(', ');
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
    formatDateRange,
    // Auth methods (ADR-009) - UI only, actual OAuth in CloudFlare Worker
    authWith(provider) { console.log('Auth with:', provider); this.showAuthModal = false; },
    logout() { this.auth = { user: null, authenticated: false };
      localStorage.removeItem('tsv-auth'); this.showUserMenu = false; }
  };
}
