# ADR-032: Entity Type Configuration and Tax Warnings

**Status**: Accepted
**Date**: 2026-04-10
**Version**: 3.7.0

## Context

The roadmap (Phase 1.2) requires entity-specific tax warnings to help users apply correct
fringe benefit treatment rules. Different entity types have fundamentally different rules:

- **C Corp**: Standard fringe benefit exclusions apply
- **S Corp**: IRC §1372 treats 2%+ shareholders as partners — most exclusions unavailable
- **LLC**: Rules depend on tax election (C Corp, S Corp, or partnership treatment)
- **Partnership**: IRC §707(c) — partners cannot receive excludable fringe benefits
- **Sole Proprietorship**: Owner benefits generally nondeductible as business expenses

Without entity type context the tool cannot surface relevant tax treatment warnings.

## Decision

Add a `entityType` field to app state, persisted to `localStorage` under `tsv-entity-type`.
A new `js/app-settings.js` module provides `setEntityType()` and `getEntityTypeWarning()`.
The warning surface appears in two places:
1. Inline under the selector in the Settings page
2. In the benefits allocation column header when benefits exist

C Corporation is treated as the default/no-warning case (standard exclusions apply).

## Consequences

- New localStorage key: `tsv-entity-type`
- New module: `js/app-settings.js` (≤100 lines)
- `app.js` gains `entityType` state field and `get entityTypeWarning` getter
- `index.html` Settings gains entity type selector article; benefits column gains warning line
- No changes to Expense data model or export format

## Alternatives Rejected

| Alternative | Reason rejected |
|---|---|
| Adjust default allocations by entity | Too prescriptive; users must control all allocations |
| Store entity type in Expense objects | Entity type is account-level, not per-expense |
| Display warning only on benefits cards | Too easy to miss; column-level is sufficient |
