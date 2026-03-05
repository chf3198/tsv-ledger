/** Allocation UI methods - slider initialization and interaction (ADR-015, ADR-018, ADR-026) */
const appAllocationUI = {
  initSlider(element, expense) {
    const slider = element;
    if (!slider || slider.noUiSlider) return;

    const isSliderBenefits = slider.closest('.benefits') !== null;
    const initialValue = isSliderBenefits
      ? (100 - (expense.businessPercent ?? 100))
      : (expense.businessPercent ?? 100);

    noUiSlider.create(slider, {
      start: [initialValue],
      connect: [true, false],
      range: { min: 0, max: 100 },
      step: 1,
      tooltips: { to: (value) => Math.round(value) + '%' },
      format: { to: (value) => Math.round(value), from: (value) => Number(value) }
    });

    slider.noUiSlider.on('start', () => {
      this.lastSliderInteraction = Date.now();
    });

    slider.noUiSlider.on('update', (values) => {
      const sliderPercent = Math.round(values[0]);
      const businessPercent = isSliderBenefits ? (100 - sliderPercent) : sliderPercent;

      if (businessPercent !== (expense.businessPercent ?? 100)) {
        // Immutable update via map (Alpine reactivity)
        this.expenses = this.expenses.map(e =>
          e.id === expense.id ? { ...e, businessPercent } : e
        );
        this.save();
      }
    });

    slider.noUiSlider.on('end', () => {
      this.debouncedBulkApplyCheck(expense);
    });
  },

  setAllocation(expense, businessPercent) {
    const matchIds = new Set([expense.id]);
    this.expenses = this.expenses.map(e =>
      matchIds.has(e.id)
        ? { ...e, businessPercent, reviewed: (businessPercent === 0 || businessPercent === 100) }
        : e
    );

    // Update slider UI
    setTimeout(() => {
      const sliders = document.querySelectorAll(`[data-expense-id="${expense.id}"]`);
      sliders.forEach(slider => {
        if (slider.noUiSlider) {
          const isSliderBenefits = slider.closest('.benefits') !== null;
          const sliderValue = isSliderBenefits ? (100 - businessPercent) : businessPercent;
          slider.noUiSlider.set(sliderValue, false);
        }
      });
    }, 0);

    this.save();
  },

  toggleReviewed(expense) {
    const matchIds = new Set([expense.id]);
    this.expenses = this.expenses.map(e =>
      matchIds.has(e.id) ? { ...e, reviewed: !e.reviewed } : e
    );
    this.save();
  }
};
