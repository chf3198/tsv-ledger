# ADR-024: Storage Mode Selection

**Date**: February 28, 2026
**Status**: Approved
**Context**: Hybrid local/cloud storage creates sync bugs and user confusion

## Problem

Current design has issues:

1. Data saved to localStorage first, then synced to cloud
2. Field mismatches between frontend and database
3. Users unclear whether their data is local or cloud
4. Merge conflicts when signing in with existing local data

## Decision

**Clean separation**: User chooses storage mode BEFORE importing data.

### Two Modes

| Mode  | Storage      | Auth Required | Behavior                       |
| ----- | ------------ | ------------- | ------------------------------ |
| Guest | localStorage | No            | Local only, warned about risks |
| Cloud | D1 Database  | Yes           | Cloud only, multi-device sync  |

### User Flow

```
First Visit → Storage Choice Modal
    ↓
┌─────────────────────┐  ┌─────────────────────┐
│ 🔒 CLOUD MODE       │  │ 💻 LOCAL MODE       │
│                     │  │                     │
│ Sign in required    │  │ No account needed   │
│ Syncs across devices│  │ Data on this device │
│ Automatic backup    │  │ only                │
│                     │  │                     │
│ [Sign In →]         │  │ [Use Locally]       │
└─────────────────────┘  └─────────────────────┘
```

### Storage Key

```javascript
localStorage.setItem("tsv-storage-mode", "local" | "cloud");
```

### API Behavior

- **Local mode**: All CRUD via localStorage, no API calls
- **Cloud mode**: All CRUD via API, localStorage as cache only

## Consequences

- No more hybrid merge issues
- Clear user expectations
- Simpler codebase (no sync logic needed)
- Users can switch modes (with data export/import)
