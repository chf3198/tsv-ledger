/**
 * TSV Expenses - Alpine.js App with Functional Core
 * Utilities loaded from utils.js
 */

function expenseApp() {
  return {
    expenses: [], filteredExpenses: [], locations: [], dragover: false,
    importStatus: '', importError: false, importComplete: false, filters: emptyFilters(), newExpense: emptyExpense(),
    importHistory: [],
    cardPageSize: 50,
    businessCardsPage: 1,
    benefitsCardsPage: 1,
    allocationSearchQuery: '',
    // Shell state (ADR-010)
    menuOpen: false, route: 'dashboard',
    // Auth state (ADR-009)
    auth: JSON.parse(localStorage.getItem('tsv-auth') || '{"user":null,"authenticated":false}'),
    showAuthModal: false, showUserMenu: false,

    get totals() {
      return { supplies: sumByCategory(this.expenses, 'Business Supplies'), benefits: sumByCategory(this.expenses, 'Board Member Benefits'), uncategorized: sumByCategory(this.expenses, 'Uncategorized') };
    },
    get counts() {
      return { supplies: countByCategory(this.expenses, 'Business Supplies'), benefits: countByCategory(this.expenses, 'Board Member Benefits'), uncategorized: countByCategory(this.expenses, 'Uncategorized') };
    },
    get filteredTotal() { return this.filteredExpenses.reduce((s, e) => s + e.amount, 0); },
    get totalSupplies() { return this.expenses.reduce((sum, e) => sum + (e.amount * (e.businessPercent ?? 100) / 100), 0); },
    get totalBenefits() { return this.expenses.reduce((sum, e) => sum + (e.amount * (100 - (e.businessPercent ?? 100)) / 100), 0); },

    // Dual-column card filtering - maintain object references for Alpine reactivity
    // Business Supplies column: shows expenses with businessPercent > 0
    // Filters by unified search query, sorts by date descending
    get businessCards() {
      return this.expenses
        .map(e => {
          // Add computed properties directly to expense object for template access
          e.benefitsPercent = 100 - (e.businessPercent ?? 100);
          return e;
        })
        .filter(e => (e.businessPercent ?? 100) > 0)  // Has business allocation
        .filter(e => {
          if (!this.allocationSearchQuery || this.allocationSearchQuery.trim() === '') return true;
          const query = this.allocationSearchQuery.toLowerCase();
          return e.description.toLowerCase().includes(query) ||
                 e.id.toLowerCase().includes(query);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    // Board Member Benefits column: shows expenses with benefitsPercent > 0
    // Filters by unified search query, sorts by date descending
    get benefitsCards() {
      return this.expenses
        .map(e => {
          // Add computed properties directly to expense object for template access
          e.benefitsPercent = 100 - (e.businessPercent ?? 100);
          return e;
        })
        .filter(e => e.benefitsPercent > 0)  // Has benefits allocation
        .filter(e => {
          if (!this.allocationSearchQuery || this.allocationSearchQuery.trim() === '') return true;
          const query = this.allocationSearchQuery.toLowerCase();
          return e.description.toLowerCase().includes(query) ||
                 e.id.toLowerCase().includes(query);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Paginated views for lazy loading
    get businessCardsVisible() {
      return this.businessCards.slice(0, this.businessCardsPage * this.cardPageSize);
    },
    get benefitsCardsVisible() {
      return this.benefitsCards.slice(0, this.benefitsCardsPage * this.cardPageSize);
    },
    get hasMoreBusinessCards() {
      return this.businessCards.length > this.businessCardsVisible.length;
    },
    get hasMoreBenefitsCards() {
      return this.benefitsCards.length > this.benefitsCardsVisible.length;
    },

    loadMoreBusiness() { this.businessCardsPage++; },
    loadMoreBenefits() { this.benefitsCardsPage++; },

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
    updateExpense() {
      // Trigger reactivity by creating new array reference
      this.expenses = [...this.expenses];
      this.save();
    },
    deleteExpense(id) { confirm('Delete?') && (this.expenses = this.expenses.filter(e => e.id !== id), this.save()); },
    clearAll() {
      if (confirm('Delete ALL expenses and import history?')) {
        this.expenses = [];
        this.importHistory = [];
        this.save();
        clearImportHistory();
      }
    },
    applyFilters() { this.filteredExpenses = filterExpenses(this.expenses, this.filters); },
    clearFilters() { this.filters = emptyFilters(); this.applyFilters(); },
    exportCSV() { exportToCSV(this.filteredExpenses, `tsv-expenses-${today()}.csv`); },
    formatCurrency,
    formatDateRange,

    // noUiSlider integration
    // Initializes allocation slider - position and value depend on column context
    // Business column: slider at businessPercent (e.g., 80% shows slider at 80)
    // Benefits column: slider at (100 - businessPercent) (e.g., 80% business shows slider at 20)
    initSlider(element, expense) {
      if (!window.noUiSlider || element.noUiSlider) return;

      const businessPercent = expense.businessPercent || 100;
      const isBenefitsColumn = element.closest('.benefits') !== null;
      const initialValue = isBenefitsColumn ? (100 - businessPercent) : businessPercent;

      window.noUiSlider.create(element, {
        start: [initialValue],
        connect: [true, false],
        range: { min: 0, max: 100 },
        step: 1,
        tooltips: {
          to: (v) => Math.round(v) + '%'
        },
        format: { to: (v) => Math.round(v), from: (v) => Number(v) }
      });

      // Update handler: Convert slider position to businessPercent
      // Business column: slider value IS businessPercent
      // Benefits column: slider value is benefitsPercent, so businessPercent = 100 - slider
      element.noUiSlider.on('update', (values) => {
        const sliderValue = Math.round(values[0]);
        const newBusinessPercent = isBenefitsColumn ? (100 - sliderValue) : sliderValue;
        if (newBusinessPercent !== expense.businessPercent) {
          expense.businessPercent = newBusinessPercent;
          this.updateExpense();
        }
      });
    },

    // Preset allocation buttons
    setAllocation(expense, percent) {
      expense.businessPercent = percent;
      // Update slider if it exists
      const sliderEl = document.querySelector(`[data-expense-id="${expense.id}"]`);
      if (sliderEl && sliderEl.noUiSlider) {
        sliderEl.noUiSlider.set(percent);
      }
      this.updateExpense();
    },

    // Auth methods (ADR-009) - UI only, actual OAuth in CloudFlare Worker
    authWith(provider) { console.log('Auth with:', provider); this.showAuthModal = false; },
    logout() { this.auth = { user: null, authenticated: false };
      localStorage.removeItem('tsv-auth'); this.showUserMenu = false; }
  };
}
