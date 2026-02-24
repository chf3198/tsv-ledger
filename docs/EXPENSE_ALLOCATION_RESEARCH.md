# Expense Allocation Research

## Research Date: February 13, 2026

## Executive Summary

This research explored UX patterns for percentage-based expense allocation interfaces. The goal is to redesign the TSV Ledger application to focus on its core mission: **helping businesses determine how much of their Amazon orders are employee benefits** (not general bank transaction categorization).

## Key Insights

### 1. Slider-Based Percentage Controls (Nielsen Norman Group)

**Source**: NN/g - Input Controls for Parameters: Sliders, Knobs, and Matrices

**Key Findings**:

- **Linked controls** are essential: Pair sliders (coarse adjustment) with text inputs (fine precision)
- **Real-time feedback** required: Users must see changes within ≤0.1 seconds
- **Default values matter**: Provide visual indicators (tick marks) showing neutral/default positions
- **Keyboard focus**: Auto-focus text input after slider adjustment to reduce mouse→keyboard homing time

**Relevance**: For our coffee example (75% Supplies / 25% Benefits), users need:

- Quick approximation via slider
- Fine-tuning via keyboard input
- Instant visual feedback showing split representation

### 2. Dual-Column Allocation Patterns

**Source**: GitHub - Kanban boards, expense splitting apps, SortableJS

**Key Findings**:

- **Visual affordances**: Card-based layouts with clear drag handles
- **Shared lists pattern**: SortableJS `group: 'shared'` enables drag-drop between columns
- **Cloning for partial splits**: `pull: 'clone'` creates visual representation of percentage splits
- **Swap thresholds**: `swapThreshold` parameter controls drag sensitivity (default 1.0, recommend 0.65 for nested use)

**Relevant Libraries**:

- **SortableJS** (13k+ stars): Vanilla JS, no jQuery, 6.7kb gzipped
  - Supports: shared lists, cloning, swap, nested sortables
  - Mobile-friendly with touch events
  - Animation built-in (`animation: 150`)
  - Works with Alpine.js (no framework conflicts)

### 3. Expense Splitting UX Patterns

**Source**: GitHub expense-splitting repos (Splitwise alternatives, TeilFair, CrewSplit)

**Common Patterns**:

1. **Card-based item representation** (not table rows)
2. **Percentage sliders with immediate feedback**
3. **Visual "remaining" indicators** (progress bars showing 100% total)
4. **Dual-pane layouts**: Source items → Split destination
5. **Color coding**: Full allocation (green), partial (orange), unallocated (grey)

**Anti-Patterns Observed**:

- ❌ Complex multi-step wizards
- ❌ Hidden percentage inputs (users couldn't find them)
- ❌ Delayed calculation updates
- ❌ Modal dialogs for splitting (breaks context)

### 4. Budget Allocation Tools

**Source**: 275 GitHub repos tagged "budget-tracker"

**Successful Patterns**:

- **Ocular** (Vue3): Drag-drop between budget categories
- **Personal Finance Apps**: Category-based card layouts
- **React/Vue libraries**: react-circle (percentage progress), rc-slider (range inputs)

**Key Insight**: Most successful tools use **visual metaphors** (filling containers, pie slices) rather than pure numerical inputs.

## Recommended UX Pattern

### Primary Interface: Dual-Column Card Layout

```
┌──────────────────────────────────────────────────────┐
│  Amazon Orders                                        │
├─────────────────────┬────────────────────────────────┤
│   SUPPLIES (75%)    │   BENEFITS (25%)               │
│                     │                                │
│ ┌─────────────────┐ │ ┌──────────────────────────┐   │
│ │ ☕ Coffee - $40  │ │ │ ☕ Coffee - $10 (25%)    │   │
│ │ [━━━━━━75%━━━━] │ │ │                          │   │
│ │ Split: 75/25    │ │ │ From order #123-456      │   │
│ └─────────────────┘ │ └──────────────────────────┘   │
│                     │                                │
│ ┌─────────────────┐ │                                │
│ │ 📦 Paper - $50  │ │                                │
│ │ [━━━━━100%━━━━] │ │                                │
│ │ 100% Supplies   │ │                                │
│ └─────────────────┘ │                                │
└─────────────────────┴────────────────────────────────┘
```

### Interaction Flow

1. **Initial State**: All Amazon orders appear in **Supplies column** (100%)
2. **Allocation**: Click/tap order card → inline slider appears
3. **Adjust**: Drag slider (0-100%) OR type precise number
4. **Visual Feedback**:
   - Card splits visually (width proportions)
   - Clone appears in Benefits column at matching %
   - Both cards sum to 100%
5. **Full Transfer**: Drag slider to 100% → card disappears from Supplies, appears only in Benefits
6. **Zero State**: Slider at 0% → card remains only in Supplies

### Technical Implementation

**Libraries to Use**:

1. **rc-slider** (12M downloads/month, React-compatible but vanilla build available)
   - Linked text input support
   - Mobile touch events
   - Keyboard navigation
   - Real-time onChange

   OR (simpler):

   **HTML5 `<input type="range">`** + linked `<input type="number">`
   - Native, zero dependencies
   - Works with Alpine.js `x-model`
   - Sufficient for our use case

2. **SortableJS** (optional, if drag-drop desired)
   - Enable dragging cards between columns
   - Clone mode for visual split representation
   - 6.7kb, vanilla JS, Alpine-friendly

### Alpine.js Data Model

```javascript
{
  orders: [
    {
      id: 'amz-12345',
      description: 'Coffee beans',
      amount: 50.00,
      benefitPercent: 25,  // 0-100
      date: '2026-02-10'
    }
  ],

  // Computed properties
  get suppliesTotal() {
    return this.orders.reduce((sum, o) =>
      sum + (o.amount * (100 - o.benefitPercent) / 100), 0
    )
  },

  get benefitsTotal() {
    return this.orders.reduce((sum, o) =>
      sum + (o.amount * o.benefitPercent / 100), 0
    )
  }
}
```

## Implementation Recommendations

### Phase 1: Amazon Allocation UI (CURRENT FOCUS)

1. **Keep**: Bank transaction support (BOA parser, CSV import) - needed for future features (landscaping, groceries, etc.)
2. **Focus**: Amazon orders allocation interface
3. **UI**: Dual-column layout (Supplies ⟷ Benefits) with percentage sliders
4. **Data model**: Add `benefitPercent` field to expense model (applies to all sources)
5. **Known issue**: Amazon orders will duplicate with Amazon payment bank transactions (tackle later)

**Key principle**: One feature at a time, build Amazon allocation first, then extend to other expense types.

### Phase 2: Slider Interface Implementation

1. Add `benefitPercent` field to expense data model (default: 0)
2. Create slider component (HTML5 range + linked number input)
3. Real-time Alpine.js reactivity for totals
4. Visual card representation with percentage display
5. Filter: "Show only Amazon orders" toggle for focused view

### Phase 3: Polish & Extension

1. Optional drag-drop with SortableJS (if user testing validates need)
2. Color coding (grey=0%, orange=partial, green=100% allocated)
3. Visual progress bars showing allocation %
4. Keyboard shortcuts (tab through orders, arrow keys for ±5%)
5. Apply allocation to other expense types (bank transactions for groceries, landscaping, etc.)

## Design Principles

1. **Progressive Disclosure**: Start simple (single slider), reveal complexity only when needed
2. **Immediate Feedback**: No "Apply" buttons—changes happen instantly
3. **Reversible Actions**: Easy to undo allocation changes
4. **Keyboard + Touch**: Support both interaction modes equally
5. **Visual Honesty**: Show unallocated state clearly (grey cards)

## Questions for User

1. **Drag-drop priority**: Would you prefer drag-drop cards OR just sliders?
2. **Batch operations**: Do you often set many orders to same % (e.g., "all coffee = 25%")?
3. **Reporting needs**: What do you do with final Supplies/Benefits totals?
4. **Mobile usage**: Will you use this on phone/tablet or desktop only?
5. **Import frequency**: How often do you import Amazon data? (Daily/Weekly/Monthly)

## Next Steps

1. **Update DESIGN.md** with new ADR for percentage-based benefit allocation
2. **Create wireframes** for dual-column layout
3. **Write E2E test** for percentage allocation (Amazon orders)
4. **Implement slider prototype** (MVP: one Amazon order, one slider)
5. **User test** with real Amazon order data
6. **Future ADR**: Handle Amazon order/payment duplication (when bank transactions extended)

## References

- Nielsen Norman Group: "Input Controls for Parameters: Sliders, Knobs, and Matrices"
- SortableJS: https://github.com/SortableJS/Sortable (6.7kb, 30k stars)
- rc-slider: https://www.npmjs.com/package/rc-slider (12M downloads/month)
- GitHub topics: expense-splitting, budget-tracker, kanban-board
- Interaction Design Foundation: "Affordances: Designing Intuitive User Interfaces"

## Appendix: Competitive Analysis

**Apps Reviewed**:

- **Splitwise** (expense sharing): Percentage splits with sliders
- **TeilFair** (cost allocation): Custom ratios, balance tracking
- **CrewSplit** (trip expenses): Offline-first, deterministic math
- **Ocular** (budgeting): Drag-drop category allocation
- **Personal Kanban boards**: Visual card movement patterns

**Common Success Factors**:

1. Visual representation of percentages (not just numbers)
2. Immediate feedback (no page refresh needed)
3. Touch-friendly interfaces (large hit targets)
4. Clear visual hierarchy (cards > tables)
5. Progressive disclosure (simple → complex as needed)
