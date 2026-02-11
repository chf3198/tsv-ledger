/**
 * Category Guesser - Pure functional categorization
 * @module categorizer
 */

const CATEGORIES = Object.freeze({
  BENEFITS: 'Employee Benefits',
  SUPPLIES: 'Office Supplies'
});

const KEYWORDS = Object.freeze({
  benefits: ['benefit', 'health', 'insurance', 'dental', '401k', 'retirement', 'wellness', 'gym', 'meal', 'lunch'],
  supplies: ['paper', 'printer', 'ink', 'staple', 'pen', 'folder', 'desk', 'chair', 'computer', 'software']
});

// Pure: string -> boolean
const containsAny = (text, keywords) => keywords.some(k => text.includes(k));

// Pure: string -> string|null
const matchExplicit = (explicit) => {
  const lower = (explicit || '').toLowerCase();
  if (containsAny(lower, ['benefit', 'employee'])) return CATEGORIES.BENEFITS;
  if (containsAny(lower, ['supply', 'supplies', 'office'])) return CATEGORIES.SUPPLIES;
  return null;
};

// Pure: string -> string
const matchKeywords = (desc) => {
  const lower = (desc || '').toLowerCase();
  if (containsAny(lower, KEYWORDS.benefits)) return CATEGORIES.BENEFITS;
  if (containsAny(lower, KEYWORDS.supplies)) return CATEGORIES.SUPPLIES;
  return CATEGORIES.SUPPLIES;
};

// Pure: (string, string) -> string
const guessCategory = (explicit, description) =>
  matchExplicit(explicit) || matchKeywords(description);
