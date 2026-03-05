/**
 * TSV Expenses - Alpine.js Core State Machine (ADR-026)
 * Methods delegated to specialized modules:
 * - app-auth.js: OAuth handlers
 * - app-crud.js: CRUD operations
 * - app-import.js: File import/parsing
 * - app-storage.js: Storage and cloud sync
 * - app-onboarding.js: Onboarding flow
 * - app-allocation.js: Bulk allocation
 * - app-payment.js: Payment purging
 * - app-getters.js: Computed properties
 */
function expenseApp() {
  return {
    // Core state
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
    auth: { user: null, authenticated: false },
    showAuthModal: false, showUserMenu: false,
    // Storage mode state (ADR-024)
    storageMode: localStorage.getItem('tsv-storage-mode') || null,
    // Onboarding wizard state (ADR-025)
    onboardingStep: 1, onboardingComplete: localStorage.getItem('tsv-onboarding-complete') === 'true',
    // Payment method purge state (ADR-017)
    showPurgeModal: false, purgeTarget: null,

    // ===== COMPUTED GETTERS (via app-getters.js) =====
    get showNav() { return window.appGetters.showNav; },
    get totals() { return window.appGetters.totals; },
    get paymentMethods() { return window.appGetters.paymentMethods; },
    get counts() { return window.appGetters.counts; },
    get filteredTotal() { return window.appGetters.filteredTotal; },
    get totalSupplies() { return window.appGetters.totalSupplies; },
    get totalBenefits() { return window.appGetters.totalBenefits; },
    get businessCards() { return window.appGetters.businessCards; },
    get benefitsCards() { return window.appGetters.benefitsCards; },
    get businessCardsVisible() { return window.appGetters.businessCardsVisible; },
    get benefitsCardsVisible() { return window.appGetters.benefitsCardsVisible; },
    get hasMoreBusinessCards() { return window.appGetters.hasMoreBusinessCards; },
    get hasMoreBenefitsCards() { return window.appGetters.hasMoreBenefitsCards; },

    // ===== INITIALIZATION =====
    async init() {
      await appAuth.handleOAuthCallback.call(this);
      await appStorage.loadData.call(this);
    },

    // ===== DELEGATED METHODS (via specialized modules) =====
    // Auth (app-auth.js)
    authWith(provider) { return appAuth.authWith.call(this, provider); },
    logout() { return appAuth.logout.call(this); },

    // CRUD (app-crud.js)
    addExpense() { return appCrud.addExpense.call(this); },
    updateExpense() { return appCrud.updateExpense.call(this); },
    deleteExpense(id) { return appCrud.deleteExpense.call(this, id); },
    clearAll() { return appCrud.clearAll.call(this); },
    applyFilters() { return appCrud.applyFilters.call(this); },
    clearFilters() { return appCrud.clearFilters.call(this); },
    exportCSV() { return appCrud.exportCSV.call(this); },
    formatDate(dateStr) { return appCrud.formatDate.call(this, dateStr); },

    // Import (app-import.js)
    handleDrop(e) { return appImport.handleDrop.call(this, e); },
    handleFileSelect(e) { return appImport.handleFileSelect.call(this, e); },
    setError(msg) { return appImport.setError.call(this, msg); },
    importFile(file) { return appImport.importFile.call(this, file); },

    // Storage (app-storage.js)
    refresh() { return appStorage.refresh.call(this); },
    save() { return appStorage.save.call(this); },
    syncToCloud() { return appStorage.syncToCloud.call(this); },
    loadData() { return appStorage.loadData.call(this); },
    fetchFromCloud() { return appStorage.fetchFromCloud.call(this); },

    // Onboarding (app-onboarding.js)
    navigateToImport() { return appOnboarding.navigateToImport.call(this); },
    selectStorageMode(mode) { return appOnboarding.selectStorageMode.call(this, mode); },
    completeOnboarding() { return appOnboarding.completeOnboarding.call(this); },

    // Allocation (app-allocation.js)
    loadMoreBusiness() { return appAllocation.loadMoreBusiness.call(this); },
    loadMoreBenefits() { return appAllocation.loadMoreBenefits.call(this); },
    findMatchingExpenses(e) { return appAllocation.findMatchingExpenses.call(this, e); },
    debouncedBulkApplyCheck(e) { return appAllocation.debouncedBulkApplyCheck.call(this, e); },
    checkForBulkApplyOpportunity(e) { return appAllocation.checkForBulkApplyOpportunity.call(this, e); },
    applyBulkAllocation() { return appAllocation.applyBulkAllocation.call(this); },
    closeBulkApplyModal() { return appAllocation.closeBulkApplyModal.call(this); },

    // Payment (app-payment.js)
    openPurgeModal(method) { return appPayment.openPurgeModal.call(this, method); },
    closePurgeModal() { return appPayment.closePurgeModal.call(this); },
    confirmPurge() { return appPayment.confirmPurge.call(this); },

    // Utility helpers (for templates)
    formatCurrency,
    formatDateRange,
    getPaymentMethodLabel
  };
}
