# ADR-026: Disclaimer Visibility and Export Attribution

## Status

Accepted

## Context

TSV Ledger is explicitly positioned as an expense allocation assistant, not a tax advisor. The roadmap and legal posture require the "Not Tax Advice" disclaimer to be visible in product workflows and carried into exported artifacts.

Current state:

- Footer contains legal links, but export action does not foreground disclaimer context.
- CSV export does not include explicit disclaimer attribution.

## Decision

1. Add a visible legal disclaimer message in the Settings export area, adjacent to export controls.
2. Include disclaimer attribution in CSV exports as a dedicated `Disclaimer` column.
3. Keep wording consistent with legal docs: assistance only, user verification responsibility.

## Consequences

### Positive

- Legal intent is visible at action time (export workflow).
- Exported files preserve compliance context when shared externally.
- Minimal implementation risk with no new dependencies.

### Negative

- CSV schema changes by one column; downstream consumers must tolerate/add mapping.

### Trade-offs Accepted

- Chose column-based attribution over file preamble comments to keep CSV shape deterministic.
