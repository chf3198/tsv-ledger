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
