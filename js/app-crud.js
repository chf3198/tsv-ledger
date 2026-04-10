/** CRUD operations for expenses (ADR-026 - methods extraction) */
const buildExportFilename = (authority) => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `tsv-ledger-export-${ymd}-${authority === 'cloud' ? 'cloud' : 'local'}.csv`;
};

const appCrud = {
  addExpense() {
    if (!this.newExpense.description || !this.newExpense.amount) return;
    this.expenses = [...this.expenses, { ...this.newExpense, id: Date.now(), amount: +this.newExpense.amount }];
    this.save();
    this.newExpense = emptyExpense();
  },
  updateExpense() {
    this.expenses = [...this.expenses];
    this.save();
  },
  deleteExpense(id) {
    confirm('Delete?') && (this.expenses = this.expenses.filter(e => e.id !== id), this.save());
  },
  clearAll() {
    if (confirm('Delete ALL expenses and import history?')) {
      this.expenses = [];
      this.importHistory = [];
      this.save();
      clearImportHistory();
    }
  },
  applyFilters() {
    this.filteredExpenses = filterExpenses(this.expenses, this.filters);
  },
  clearFilters() {
    this.filters = emptyFilters();
    this.applyFilters();
  },
  exportCSV() {
    exportToCSV(this.filteredExpenses, buildExportFilename(this.dataAuthority));
  },
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};
