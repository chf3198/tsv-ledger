# ADR-023: Cloud Sync Integration

**Date**: February 28, 2026
**Status**: Approved
**Context**: Backend API and client library exist but aren't connected

## Decision

Wire up cloud sync so authenticated users sync to D1:

1. Load `cloud-sync.js` in index.html
2. Call `fullSync()` after OAuth sign-in completes
3. Call `syncToCloud()` after imports (when authenticated)
4. Call `syncToCloud()` after allocation changes (when authenticated)
5. Continue localStorage as fallback for guest mode

## Data Flow

```
Guest Mode:          Authenticated:
Import → localStorage   Import → localStorage → API → D1
Change → localStorage   Change → localStorage → API → D1
                        Sign-in → fullSync() merges local + cloud
```

## Sync Points

| Event             | Guest | Authenticated            |
| ----------------- | ----- | ------------------------ |
| Import CSV/ZIP    | local | local + cloud            |
| Allocation change | local | local + cloud            |
| Sign-in           | —     | fullSync()               |
| Load app          | local | local (cloud on sign-in) |

## Consequences

- Authenticated users get multi-device sync
- Guest mode unchanged (local only + warnings)
- localStorage remains source of truth until sync
- Cloud overwrites local after fullSync (cloud wins)
