/** Storage and sync methods (ADR-023, ADR-024, ADR-026) */
const appStorage = {
  refresh() {
    computeItemPositions(this.expenses);
    this.locations = getUniqueLocations(this.expenses);
    this.applyFilters();
  },
  async save() {
    saveExpenses(this.expenses);
    this.refresh();
    if (this.storageMode === 'cloud' && this.auth.authenticated) {
      await this.syncToCloud();
    }
  },
  async syncToCloud() {
    if (!window.cloudSync?.isAuthenticated()) return;
    try {
      const cloud = await window.cloudSync.fullSync();
      this.expenses = loadExpenses();
      this.importHistory = loadImportHistory();
      this.refresh();
    } catch (e) { console.error('Cloud sync failed:', e); }
  },
  async loadData() {
    if (!this.onboardingComplete) return;
    if (this.storageMode === 'cloud' && this.auth.authenticated) {
      await this.fetchFromCloud();
    } else {
      this.expenses = loadExpenses();
      this.importHistory = loadImportHistory();
    }
    this.refresh();
  },
  async fetchFromCloud() {
    try {
      const data = await window.cloudSync.fetchFromCloud();
      this.expenses = data.expenses || [];
      this.importHistory = data.importHistory || [];
      saveExpenses(this.expenses);
      localStorage.setItem('tsv-import-history', JSON.stringify(this.importHistory));
    } catch (e) {
      console.error('Cloud fetch failed, using local cache:', e);
      this.expenses = loadExpenses();
      this.importHistory = loadImportHistory();
    }
  }
};
