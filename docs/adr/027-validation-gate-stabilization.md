# ADR-027: Validation Gate Stabilization

## Status

Accepted

## Context

Repository validation gates were failing due two process-level issues:

1. Visual regression tests used state assumptions inconsistent with onboarding/storage behavior.
2. Lint gate enforced a hard 100-line rule while existing legacy files already exceeded the limit, causing permanent red status.

## Decision

1. Make visual tests deterministic with explicit onboarding/storage setup per case.
2. Update lint to enforce 100-line limits for new files while allowing existing oversize legacy files up to recorded baseline sizes.

## Consequences

### Positive

- Test gate reflects real regressions instead of setup drift.
- Lint gate becomes actionable for ongoing work.

### Negative

- Legacy oversize debt remains and must be paid down over time.
