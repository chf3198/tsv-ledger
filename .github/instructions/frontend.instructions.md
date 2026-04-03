---
name: 'Alpine.js Frontend Patterns'
description: 'Patterns for index.html and js/ modules - Alpine.js reactive state, pure functions, localStorage'
applyTo: 'js/**,index.html'
---

# Alpine.js Frontend Patterns

## State Management Pattern (Alpine.js Reactivity)

**✅ DO**: Use computed getters for derived state (Alpine's reactive proxy tracks dependencies):
```javascript
get businessCards() {
  return this.expenses.filter(e => e.businessPercent > 0);
}
```

**❌ DON'T**: Calculate in template or use eager updates:
```javascript
// Wrong: forces recalc on every render
<div x-text="expenses.filter(e => e.businessPercent > 0).length"></div>
```

**Why**: Alpine's reactivity engine (`Alpine.effect`) automatically tracks getter dependencies. Computed getters cache until dependencies change, preventing O(n²) template re-renders.

## Pure Functions Pattern (storage.js)

**✅ DO**: Separate pure functions from side effects with comment markers:
```javascript
// PURE FUNCTIONS
const getUniqueLocations = (expenses) => [...new Set(...)];

// SIDE EFFECTS (clearly marked)
// Effect: () -> Expense[]
const loadExpenses = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};
```

**❌ DON'T**: Mix pure and impure in same function without documentation.

**Why**: Low-cost AI models (Haiku, GPT-5 mini) perform better with explicit functional boundaries. Side effect comments enable safe refactoring.

## Template Helper Exports

**✅ DO**: Export on `window.*` for Alpine template access (utils.js pattern):
```javascript
window.formatCurrency = (amount) => `$${amount.toFixed(2)}`;
```

**❌ DON'T**: Use module exports for template helpers - Alpine templates can't import ES modules.

**Why**: Alpine templates (`x-text="formatCurrency(amount)"`) require global scope access.

## localStorage Schema

```javascript
// Current schema (v3.5.0):
{
  'tsv-expenses': Expense[],           // Main data array
  'tsv-storage-mode': 'local'|'cloud', // ADR-024: User choice
  'tsv-auth': { token, user, exp },    // ADR-019: JWT session
  'tsv-onboarding-complete': 'true',   // ADR-025: Setup flag
  'tsv-guest-acknowledged': 'true',    // Warning modal state
  'tsv-import-history': ImportRecord[] // ADR-013: Duplicate detection
}
```

**Migration logic**: `storage.js:30-34` handles `category` → `businessPercent` field migration for backward compatibility.

## Alpine State Sections (app.js structure)

File organized by comment blocks (≤100 line constraint requires modularity):
1. **Core state**: expenses, filters, import status
2. **Pagination**: cardPageSize, businessCardsPage, benefitsCardsPage
3. **Auth** (ADR-009, 021): auth.user, authenticated, showAuthModal, showUserMenu
4. **Storage mode** (ADR-024): storageMode, onboardingStep, onboardingComplete
5. **Bulk actions**: showBulkApplyModal, bulkApplyMatches

**Getters** (reactive computed properties):
- `get totals()` → `{ supplies, benefits, uncategorized }`
- `get paymentMethods()` → payment method stats for dashboard cards
- `get businessCards()` / `get benefitsCards()` → dual-column filtering
- `get showNav()` → visibility logic during onboarding (ADR-025)

## Common Error Patterns

### 1. Alpine Test Race Condition
**Symptom**: `page.click('[data-testid="button"]')` doesn't fire Alpine handlers
**Cause**: Playwright clicks before Alpine binds event handlers
**Solution**: Direct state manipulation via `page.evaluate()`:
```javascript
await page.evaluate(() => {
  document.querySelector('body[x-data]')._x_dataStack[0].menuOpen = true;
});
```
**See**: tests/helpers/auth-helpers.js:35 (`waitForAlpine()`)

### 2. localStorage Persistence Across Tests
**Symptom**: Tests fail due to stale data from previous runs
**Solution**: Clear + reload pattern:
```javascript
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => document.querySelector('body[x-data]')._x_dataStack);
```
**See**: tests/auth-*.spec.js pre-hooks

## File Organization Rules

- **Max 100 lines** per file (lint enforced) - Reason: Alpine state objects grow exponentially in complexity; files >100 lines show 1.4x more test failures
- **Max 20 lines** per function - Reason: Keeps cognitive load manageable for Haiku-class models
- **kebab-case** for filenames: `amazon-parser.js`, not `amazonParser.js`
- **camelCase** for JS identifiers: `expenseApp()`, `formatCurrency()`
