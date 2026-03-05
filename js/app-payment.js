/** Payment method purge operations (ADR-017, ADR-026) */
const appPayment = {
  openPurgeModal(method) {
    this.purgeTarget = method;
    this.showPurgeModal = true;
  },
  closePurgeModal() {
    this.purgeTarget = null;
    this.showPurgeModal = false;
  },
  confirmPurge() {
    if (!this.purgeTarget) return;
    this.expenses = filterByPaymentMethod(this.expenses, this.purgeTarget);
    this.save();
    this.closePurgeModal();
  }
};
