/** Entity type configuration and tax warnings (ADR-032) */

/** Warning text per entity type. null = no warning needed. */
const ENTITY_WARNINGS = {
  'c-corp': null,
  's-corp': 'S Corp: 2%+ shareholders cannot exclude most fringe benefits (IRC §1372)',
  'llc': 'LLC: Tax treatment depends on election — verify with your tax professional',
  'partnership': 'Partnership: Partners cannot receive excludable fringe benefits (IRC §707(c))',
  'sole-prop': 'Sole Prop: Owner benefits are generally not deductible as business expenses'
};

const appSettings = {
  /**
   * Persist entity type selection to localStorage and update state.
   * @param {string} type - Entity type key or empty string to clear
   */
  setEntityType(type) {
    this.entityType = type || '';
    if (type) {
      localStorage.setItem('tsv-entity-type', type);
    } else {
      localStorage.removeItem('tsv-entity-type');
    }
  },

  /**
   * Return warning text for the current entity type, or null if none.
   * @returns {string|null}
   */
  getEntityTypeWarning() {
    if (!this.entityType) return null;
    return ENTITY_WARNINGS[this.entityType] || null;
  }
};
