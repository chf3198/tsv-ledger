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
    this.bulkApplyMatches.forEach(expense => {
      expense.businessPercent = targetPercent;
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
  closeBulkApplyModal() {
    this.showBulkApplyModal = false;
    this.bulkApplySource = null;
    this.bulkApplyMatches = [];
  }
};
