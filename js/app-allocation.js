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
    const targetPercent = Math.max(0, Math.min(100, Math.round(Number(this.bulkApplySource.businessPercent ?? 100))));
    const matchIds = new Set(this.bulkApplyMatches.map(e => e.id));

    // Bulk apply is a review action: collapse all updated matches (ADR-018)
    this.expenses = this.expenses.map(expense =>
      matchIds.has(expense.id)
        ? { ...expense, businessPercent: targetPercent, reviewed: true }
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
