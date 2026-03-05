/** Bulk allocation methods (ADR-015, ADR-026) */
const appAllocation = {
  loadMoreBusiness() {
    this.businessCardsPage++;
  },
  loadMoreBenefits() {
    this.benefitsCardsPage++;
  },
  findMatchingExpenses(sourceExpense) {
    const normalizedDescription = sourceExpense.description.trim().toLowerCase();
    return this.expenses.filter(e =>
      e.id !== sourceExpense.id &&
      e.description.trim().toLowerCase() === normalizedDescription &&
      e.businessPercent !== sourceExpense.businessPercent
    );
  },
  debouncedBulkApplyCheck(expense) {
    clearTimeout(this.bulkApplyDebounceTimer);
    this.bulkApplyDebounceTimer = setTimeout(() => {
      const timeSinceLastInteraction = Date.now() - this.lastSliderInteraction;
      if (timeSinceLastInteraction > 500) {
        this.checkForBulkApplyOpportunity(expense);
      }
    }, 800);
  },
  checkForBulkApplyOpportunity(expense) {
    const matches = this.findMatchingExpenses(expense);
    if (matches.length > 0) {
      this.bulkApplySource = expense;
      this.bulkApplyMatches = matches;
      this.showBulkApplyModal = true;
    }
  },
  applyBulkAllocation() {
    if (!this.bulkApplySource || this.bulkApplyMatches.length === 0) return;
    const targetPercent = this.bulkApplySource.businessPercent;
    const matchIds = new Set(this.bulkApplyMatches.map(e => e.id));
    const shouldCollapse = (targetPercent === 0 || targetPercent === 100);

    // Immutable update: create new objects with reviewed state for 0%/100% (Alpine reactivity + ADR-018)
    this.expenses = this.expenses.map(expense =>
      matchIds.has(expense.id)
        ? { ...expense, businessPercent: targetPercent, reviewed: shouldCollapse }
        : expense
    );

    // NOTE: Don't manually update slider DOM - Alpine will re-render correctly
    // when reviewed property changes, which triggers x-show="!e.reviewed" update
    this.save();
    this.closeBulkApplyModal();
  },
  closeBulkApplyModal() {
    this.showBulkApplyModal = false;
    this.bulkApplySource = null;
    this.bulkApplyMatches = [];
  }
};
