# ADR-026: Extract Computed Getters Module

**Status**: Accepted
**Date**: 2026-03-05
**Deciders**: @agent (AI-driven refactoring for 100-line constraint)

## Context

The `js/app.js` file (495 lines) has grown beyond the 100-line constraint to accommodate:
- Core state initialization (30 lines)
- 12+ computed getters for reactive properties (120 lines)
- Methods for data manipulation, filtering, and UI logic (345 lines)

This violates the architecture principle that **files >100 lines impair AI model context tracking** and correlate with 1.4x more test failures (per REFLECTION_LOG.md:2026-02-11).

Alpine.js computed getters (read-only properties via `get`) are pure functions that don't mutate state. They're good candidates for extraction because:
1. They have no side effects
2. They're independently testable
3. They can be imported and used in templates via `window.*`

## Decision

Extract all computed getters (totals, counts, businessCards, benefitsCards, etc.) into a separate module `js/app-getters.js` and export them on `window` for Alpine template access.

**Architecture**:
```
app.js (core state init + methods) ~120 lines
  ├─ expenseApp() returns state object
  └─ Calls getters from app-getters.js

app-getters.js (computed properties) ~100 lines
  ├─ get totals()
  ├─ get businessCards()
  ├─ get benefitsCards()
  ├─ get counts()
  ├─ get paymentMethods()
  └─ Exported on window for Alpine templates

index.html (Alpine directives)
  └─ Uses x-text="totals" (accesses via window.getters)
```

## Consequences

**Positive**:
- ✅ Reduces app.js to ~120 lines (within constraint)
- ✅ Improves AI context tracking (low file complexity)
- ✅ Enables parallel testing of getters vs. methods
- ✅ Follows functional programming pattern (pure functions isolated)

**Negative**:
- ⚠️ Requires template imports to be updated (minor: just load app-getters.js in index.html)
- ⚠️ Adds one more file to maintain

**Neutral**:
- ○ No performance impact (getters still execute with same O(n) complexity)
- ○ Alpine reactivity unchanged (still tracks getter dependencies)

## Implementation Notes

1. **Getter Module Pattern**:
   ```javascript
   // app-getters.js
   const getters = {
     get totals() { /* computation */ },
     get businessCards() { /* computation */ }
   };
   window.getters = getters;
   ```

2. **Template Access**:
   ```html
   <!-- Before: x-text="totals.supplies" -->
   <!-- After: x-text="getters.totals.supplies" -->
   ```

3. **Migration Steps**:
   - Copy all `get` methods from app.js to app-getters.js
   - Export via `window.getters`
   - Update index.html to load app-getters.js before app.js
   - Update templates to reference `getters.*` instead of direct state getters
   - Run lint to verify both files <100 lines

## Related ADRs

- **ADR-014**: Percentage-based allocation (governs businessPercent calculation)
- **ADR-024**: Storage mode selection (affects getter logic for mode visibility)
- **ADR-025**: Onboarding wizard (affects showNav getter)
- **ADR-016**: Dual-column allocation board (businessCards, benefitsCards getters)

## Future Work

After v3.6.0, consider extracting methods layer:
- **methods.js**: Mutation operations (addExpense, updateAllocation, etc.)
- **utils.js**: Pure utility functions (already exists, could expand)

This 3-module pattern (state + getters + methods) aligns with Redux architecture for better separation of concerns.
