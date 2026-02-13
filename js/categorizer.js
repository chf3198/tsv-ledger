/**
 * Category System - Defaults to uncategorized pending user review
 * @module categorizer
 */

const CATEGORIES = Object.freeze({
  BENEFITS: 'Board Member Benefits',
  SUPPLIES: 'Business Supplies',
  UNCATEGORIZED: 'Uncategorized'
});

// Pure: (string, string) -> string
// Always return Uncategorized - user must manually categorize after import
// This prevents premature assumptions and aligns with progressive disclosure UX
const guessCategory = (explicit, description) => CATEGORIES.UNCATEGORIZED;
