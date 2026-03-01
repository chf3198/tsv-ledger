# ADR-025: Welcome Wizard for First-Time Users

## Status

Accepted

## Context

When first-time users load TSV Ledger, they encounter:

- Empty Dashboard with "$0.00" cards and "No expenses yet"
- Empty Expenses view with empty allocation columns
- Settings with Export/Clear buttons that do nothing
- Storage mode modal only triggered when clicking Import

This violates UX best practices:

- **Empty states are dead ends** (UserOnboard research)
- **Cognitive overload** from 4 nav options when only 1 is useful
- **Storage choice feels like an obstacle** rather than an opportunity

## Decision

Implement a **Welcome Wizard** that:

1. **Replaces** all empty-state handling (not adds to it)
2. **Hides navigation** until user has data
3. **Consolidates** storage + import into a single flow

### The Wizard Steps

```
Step 1: Welcome
  "📊 TSV Expenses"
  "Track Amazon orders & bank statements..."
  [Get Started →]

Step 2: Storage Choice
  "Where should your data live?"
  [☁️ Cloud Sync] → triggers OAuth
  [💻 Local Only] → proceeds to Step 3

Step 3: First Import
  [Drop zone for CSV/ZIP]

Step 4: Success
  "🎉 Imported X expenses!"
  [View Dashboard →] → reveals full nav
```

### Simplification Achieved

| Removed/Simplified               | Benefit                              |
| -------------------------------- | ------------------------------------ |
| Empty states on Dashboard        | One wizard handles all first-time UX |
| Empty states on Expenses         | Same                                 |
| Empty states on Settings         | Same                                 |
| Conditional `navigateToImport()` | Wizard flow eliminates guard logic   |
| Separate storage modal           | Integrated into wizard Step 2        |
| Scattered "No expenses yet" text | Consolidated into welcome message    |

### State Management

```javascript
// Single flag controls entire onboarding
onboardingComplete: localStorage.getItem('tsv-onboarding-complete') === 'true'

// Navigation visibility
get showNav() { return this.onboardingComplete || this.expenses.length > 0; }
```

## Consequences

### Positive

- **Less code** - removes 4 empty-state implementations
- **Better UX** - guided flow vs confusing empty app
- **Front-loaded value** - user sees success within seconds
- **Progressive disclosure** - complexity revealed only when needed

### Negative

- Returning users with no data see wizard again (acceptable - they can import)
- Need to handle "skip" for users who just want to explore

### Trade-offs Accepted

- Wizard is opinionated - users must follow the flow
- No "demo mode" - we prioritize real data import over exploration

## Implementation Notes

1. Add `onboardingStep` state (0-3)
2. Add `onboardingComplete` persisted flag
3. Create wizard section in index.html
4. Hide nav items when `!showNav`
5. Remove redundant empty state text from each route
6. Simplify `navigateToImport()` (wizard handles the flow)

## References

- UserOnboard: Empty States pattern
- NNGroup: Progressive Disclosure
- Basecamp: "Less Software" philosophy
- YAGNI principle (Fowler)
