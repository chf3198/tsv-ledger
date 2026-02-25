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
    // Bulk allocation state
    showBulkApplyModal: false,
    bulkApplySource: null,
    bulkApplyMatches: [],
    bulkApplyDebounceTimer: null,
    lastSliderInteraction: 0,
    // Shell state (ADR-010)
    menuOpen: false, route: 'dashboard',
    // Auth state (ADR-009)
    auth: JSON.parse(localStorage.getItem('tsv-auth') || '{"user":null,"authenticated":false}'),
    showAuthModal: false, showUserMenu: false,
    // Payment method purge state (ADR-017)
    showPurgeModal: false, purgeTarget: null,

    get totals() {
      return { supplies: sumByCategory(this.expenses, 'Business Supplies'), benefits: sumByCategory(this.expenses, 'Board Member Benefits'), uncategorized: sumByCategory(this.expenses, 'Uncategorized') };
    },
    get paymentMethods() { return getPaymentMethodStats(this.expenses); },
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
    getPaymentMethodLabel,

    // Payment method purge (ADR-017)
    openPurgeModal(method) { this.purgeTarget = method; this.showPurgeModal = true; },
    closePurgeModal() { this.purgeTarget = null; this.showPurgeModal = false; },
    confirmPurge() {
      if (!this.purgeTarget) return;
      this.expenses = filterByPaymentMethod(this.expenses, this.purgeTarget);
      this.save(); this.closePurgeModal();
    },

    // noUiSlider integration
    // Initializes allocation slider - position and value depend on column context
    // Business column: slider at businessPercent (e.g., 80% shows slider at 80)
    // Benefits column: slider at (100 - businessPercent) (e.g., 80% business shows slider at 20)
    initSlider(element, expense) {
      if (!window.noUiSlider || element.noUiSlider) return;

      const businessPercent = expense.businessPercent ?? 100;
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

      // Update handlers: Convert slider position to businessPercent
      // Business column: slider value IS businessPercent
      // Benefits column: slider value is benefitsPercent, so businessPercent = 100 - slider
      const updateBusinessPercent = (values) => {
        const sliderValue = Math.round(values[0]);
        const newBusinessPercent = isBenefitsColumn ? (100 - sliderValue) : sliderValue;

        // Mark that user is actively interacting with slider
        this.lastSliderInteraction = Date.now();

        if (newBusinessPercent !== expense.businessPercent) {
          expense.businessPercent = newBusinessPercent;

          // Update all other sliders for this expense to stay in sync
          const allSliders = document.querySelectorAll(`[data-expense-id="${expense.id}"]`);
          allSliders.forEach(slider => {
            if (slider !== element && slider.noUiSlider) {
              const isOtherBenefits = slider.closest('.benefits') !== null;
              const targetValue = isOtherBenefits ? (100 - newBusinessPercent) : newBusinessPercent;
              slider.noUiSlider.set(targetValue, false); // false = don't fire events
            }
          });

          this.updateExpense();
        }
      };

      // Listen to both 'slide' (user interaction) and 'set' (programmatic)
      element.noUiSlider.on('slide', updateBusinessPercent);
      element.noUiSlider.on('set', updateBusinessPercent);

      // Only check for bulk apply when user finishes dragging (mouseup/touchend)
      element.noUiSlider.on('end', () => {
        const currentValue = isBenefitsColumn ? (100 - expense.businessPercent) : expense.businessPercent;
        element.noUiSlider.set(currentValue, false);
        this.debouncedBulkApplyCheck(expense);
      });
    },

    // Preset allocation buttons
    setAllocation(expense, percent) {
      expense.businessPercent = percent;

      // Update all sliders for this expense immediately
      const allSliders = document.querySelectorAll(`[data-expense-id="${expense.id}"]`);
      allSliders.forEach(slider => {
        if (slider.noUiSlider) {
          const isSliderBenefits = slider.closest('.benefits') !== null;
          const targetValue = isSliderBenefits ? (100 - percent) : percent;
          slider.noUiSlider.set(targetValue, false);
        }
      });

      this.updateExpense();
      this.debouncedBulkApplyCheck(expense);
    },

    // Debounced bulk apply check to prevent modal during rapid changes
    debouncedBulkApplyCheck(expense) {
      clearTimeout(this.bulkApplyDebounceTimer);
      this.bulkApplyDebounceTimer = setTimeout(() => {
        // Only show modal if user hasn't interacted with slider recently
        const timeSinceLastInteraction = Date.now() - this.lastSliderInteraction;
        if (timeSinceLastInteraction > 500) {
          this.checkForBulkApplyOpportunity(expense);
        }
      }, 800); // Wait 800ms after last change
    },

    // Bulk allocation: Find matching expenses
    findMatchingExpenses(sourceExpense) {
      const normalizedDescription = sourceExpense.description.trim().toLowerCase();
      return this.expenses.filter(e =>
        e.id !== sourceExpense.id &&
        e.description.trim().toLowerCase() === normalizedDescription &&
        e.businessPercent !== sourceExpense.businessPercent
      );
    },

    // Bulk allocation: Check if bulk apply should be offered
    checkForBulkApplyOpportunity(expense) {
      const matches = this.findMatchingExpenses(expense);
      if (matches.length > 0) {
        this.bulkApplySource = expense;
        this.bulkApplyMatches = matches;
        this.showBulkApplyModal = true;
      }
    },

    // Bulk allocation: Apply to all matching items
    applyBulkAllocation() {
      if (!this.bulkApplySource || this.bulkApplyMatches.length === 0) return;

      const targetPercent = this.bulkApplySource.businessPercent;
      this.bulkApplyMatches.forEach(expense => {
        expense.businessPercent = targetPercent;

        // Update all sliders for this expense
        const sliders = document.querySelectorAll(`[data-expense-id="${expense.id}"]`);
        sliders.forEach(slider => {
          if (slider.noUiSlider) {
            const isSliderBenefits = slider.closest('.benefits') !== null;
            const sliderValue = isSliderBenefits ? (100 - targetPercent) : targetPercent;
            slider.noUiSlider.set(sliderValue, false);
          }
        });
      });

      this.updateExpense();
      this.closeBulkApplyModal();
    },

    // Bulk allocation: Close modal
    closeBulkApplyModal() {
      this.showBulkApplyModal = false;
      this.bulkApplySource = null;
      this.bulkApplyMatches = [];
    },

    // Auth methods (ADR-009) - UI only, actual OAuth in CloudFlare Worker
    authWith(provider) { console.log('Auth with:', provider); this.showAuthModal = false; },
    logout() { this.auth = { user: null, authenticated: false };
      localStorage.removeItem('tsv-auth'); this.showUserMenu = false; }
  };
}
