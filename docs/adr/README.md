# Architecture Decision Records

> Lightweight records of significant design decisions with context and consequences.

Each ADR documents a significant design decision, capturing the forces at play,
the decision made, and its tradeoffs. ADRs are immutable once accepted—supersede
rather than modify.

## Index

| ADR                                     | Title                           | Status   |
| --------------------------------------- | ------------------------------- | -------- |
| 001                                     | Static-first with edge API      | Accepted |
| 002                                     | Three fixed categories          | Accepted |
| 003                                     | localStorage before backend     | Accepted |
| 009                                     | Multi-provider OAuth            | Accepted |
| 011                                     | Custom auth (not Auth.js)       | Accepted |
| 013                                     | Duplicate detection for imports | Accepted |
| 014                                     | Percentage-based allocation     | Accepted |
| 015                                     | noUiSlider for allocation UX    | Accepted |
| 016                                     | Dual-column allocation board    | Accepted |
| 017                                     | Payment method purge            | Accepted |
| [019](019-jwt-bearer-tokens.md)         | JWT Bearer tokens               | Accepted |
| [020](020-cloudflare-pages-previews.md) | Cloudflare Pages previews       | Accepted |
| [021](021-auth-button-visibility.md)    | Auth button visibility          | Accepted |

> ADRs 001–018 are archived in [DESIGN-archive.md](../DESIGN-archive.md).
> Recent ADRs (019+) have individual files.

## ADR Dependency Matrix

**How to use**: Before modifying code mentioned in "Used By" column, read "Depends On" ADRs to understand constraints.

| ADR | Title | Depends On | Used By | Conflict Risk |
|-----|-------|------------|---------|---------------|
| 019 | JWT Bearer Tokens | 009 (OAuth) | 023 (Cloud Sync), worker/src/session.js | None |
| 020 | CF Pages Previews | 001 (Static-first) | Deployment workflow, scripts/deploy-preview.sh | Low |
| 021 | Auth Button Visibility | 009 (OAuth) | 025 (Onboarding), index.html:auth-section | **High** (UI coordination) |
| 022 | Product Repositioning | None | Marketing copy, DESIGN.md, README.md | None |
| 023 | Cloud Sync Integration | 003 (localStorage-first), 019 (JWT) | js/storage.js, worker/src/expenses.js | Medium (sync conflicts) |
| 024 | Storage Mode Selection | 003, 023 | 025 (Onboarding), js/app.js:storageMode | None |
| 025 | Onboarding Wizard | 024, 021 | index.html:wizard, js/app.js:showNav | **High** (modifying showNav breaks onboarding flow) |

**Conflict risk levels**:
- **High**: Changes require coordinating across multiple files; test extensively
- **Medium**: Changes may require sync logic updates or conflict resolution
- **Low**: Changes isolated to specific subsystem
- **None**: Changes don't affect other ADRs

## Template

```markdown
# ADR-NNN: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context

What is the issue? What forces are at play?

## Decision

What is the change proposed?

## Consequences

What becomes easier? What becomes harder?
```

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Michael Nygard
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)
