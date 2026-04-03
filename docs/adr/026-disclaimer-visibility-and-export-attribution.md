# ADR-026: Disclaimer Visibility and Export Attribution

## Status

Accepted

## Context

TSV Ledger is an expense allocation assistant and must clearly state it is not tax advice. Existing legal links are present, but export flow visibility and exported artifact attribution are not explicit.

## Decision

1. Add a visible legal disclaimer in the Settings export workflow.
2. Add a `Disclaimer` column to CSV exports with consistent legal attribution text.
3. Keep wording aligned with legal documentation and user-verification responsibility.

## Consequences

### Positive

- Legal context is visible at export time.
- Exported files preserve compliance context when shared.

### Negative

- CSV schema adds one column; downstream mappings may need adjustment.
