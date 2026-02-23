// Allocation slider component using noUiSlider
// Provides visual allocation interface for expenses

import noUiSlider from '../node_modules/nouislider/dist/nouislider.mjs';

window.AllocationSlider = {
  // Initialize slider for an expense element
  init(element, expenseData, updateCallback) {
    const slider = element.querySelector('.allocation-slider');
    if (!slider || slider.noUiSlider) return;

    const initialValue = expenseData.businessPercent || 100;

    noUiSlider.create(slider, {
      start: [initialValue],
      connect: [true, false],
      range: {
        min: 0,
        max: 100
      },
      step: 1,
      tooltips: {
        to: (value) => Math.round(value) + '%'
      },
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value)
      },
      // Visual styling via connect option
      cssClasses: {
        target: 'noUi-target',
        base: 'noUi-base',
        origin: 'noUi-origin',
        handle: 'noUi-handle',
        handleLower: 'noUi-handle-lower',
        handleUpper: 'noUi-handle-upper',
        touchArea: 'noUi-touch-area',
        horizontal: 'noUi-horizontal',
        vertical: 'noUi-vertical',
        background: 'noUi-background',
        connect: 'noUi-connect',
        connects: 'noUi-connects',
        ltr: 'noUi-ltr',
        rtl: 'noUi-rtl',
        textDirectionLtr: 'noUi-txt-dir-ltr',
        textDirectionRtl: 'noUi-txt-dir-rtl',
        draggable: 'noUi-draggable',
        drag: 'noUi-state-drag',
        tap: 'noUi-state-tap',
        active: 'noUi-active',
        tooltip: 'noUi-tooltip',
        pips: 'noUi-pips',
        pipsHorizontal: 'noUi-pips-horizontal',
        pipsVertical: 'noUi-pips-vertical',
        marker: 'noUi-marker',
        markerHorizontal: 'noUi-marker-horizontal',
        markerVertical: 'noUi-marker-vertical',
        markerNormal: 'noUi-marker-normal',
        markerLarge: 'noUi-marker-large',
        markerSub: 'noUi-marker-sub',
        value: 'noUi-value',
        valueHorizontal: 'noUi-value-horizontal',
        valueVertical: 'noUi-value-vertical',
        valueNormal: 'noUi-value-normal',
        valueLarge: 'noUi-value-large',
        valueSub: 'noUi-value-sub'
      }
    });

    // Update expense when slider changes
    slider.noUiSlider.on('update', (values) => {
      const newPercent = Math.round(values[0]);
      if (newPercent !== expenseData.businessPercent) {
        updateCallback(newPercent);
      }
    });
  },

  // Update slider value programmatically
  setValue(element, value) {
    const slider = element.querySelector('.allocation-slider');
    if (slider && slider.noUiSlider) {
      slider.noUiSlider.set(value);
    }
  },

  // Destroy slider instance
  destroy(element) {
    const slider = element.querySelector('.allocation-slider');
    if (slider && slider.noUiSlider) {
      slider.noUiSlider.destroy();
    }
  }
};
