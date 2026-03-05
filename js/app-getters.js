/** Alpine.js computed getters exported via window.appGetters (ADR-026) */
window.appGetters = {
  get showNav() {
    const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
    return !app || app.onboardingComplete || (localStorage.getItem('tsv-storage-mode') && app.expenses.length && app.onboardingStep === 1);
  },
  get totals() {
    const exp = document.querySelector('[x-data]')?._x_dataStack?.[0]?.expenses || [];
    return { supplies: sumByCategory(exp, 'Business Supplies'), benefits: sumByCategory(exp, 'Board Member Benefits'), uncategorized: sumByCategory(exp, 'Uncategorized') };
  },
  get paymentMethods() {
    const exp = document.querySelector('[x-data]')?._x_dataStack?.[0]?.expenses || [];
    return getPaymentMethodStats(exp);
  },
  get counts() {
    const exp = document.querySelector('[x-data]')?._x_dataStack?.[0]?.expenses || [];
    return { supplies: countByCategory(exp, 'Business Supplies'), benefits: countByCategory(exp, 'Board Member Benefits'), uncategorized: countByCategory(exp, 'Uncategorized') };
  },
  get filteredTotal() {
    return (document.querySelector('[x-data]')?._x_dataStack?.[0]?.filteredExpenses || []).reduce((s, e) => s + e.amount, 0);
  },
  get totalSupplies() {
    const exp = document.querySelector('[x-data]')?._x_dataStack?.[0]?.expenses || [];
    return exp.reduce((s, e) => s + (e.amount * (e.businessPercent ?? 100) / 100), 0);
  },
  get totalBenefits() {
    const exp = document.querySelector('[x-data]')?._x_dataStack?.[0]?.expenses || [];
    return exp.reduce((s, e) => s + (e.amount * (100 - (e.businessPercent ?? 100)) / 100), 0);
  },
  get businessCards() {
    const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
    if (!app?.expenses.length) return [];
    const q = app.allocationSearchQuery?.toLowerCase() || '';
    return app.expenses
      .filter(e => (e.businessPercent ?? 100) > 0)
      .filter(e => !q || e.description.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  get benefitsCards() {
    const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
    if (!app?.expenses.length) return [];
    const q = app.allocationSearchQuery?.toLowerCase() || '';
    return app.expenses
      .filter(e => (100 - (e.businessPercent ?? 100)) > 0)
      .filter(e => !q || e.description.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  get businessCardsVisible() {
    const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
    return app ? this.businessCards.slice(0, app.businessCardsPage * app.cardPageSize) : [];
  },
  get benefitsCardsVisible() {
    const app = document.querySelector('[x-data]')?._x_dataStack?.[0];
    return app ? this.benefitsCards.slice(0, app.benefitsCardsPage * app.cardPageSize) : [];
  },
  get hasMoreBusinessCards() {
    return this.businessCards.length > this.businessCardsVisible.length;
  },
  get hasMoreBenefitsCards() {
    return this.benefitsCards.length > this.benefitsCardsVisible.length;
  }
};
