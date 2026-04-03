# ADR-029: Explicit Storage-Intent / Session-State / Data-Authority Model

**Date**: 2026-04-03
**Status**: Accepted
**Supersedes**: ADR-024 (storage mode selection), ADR-028 (cloud-intent hotfix)

## Context

ADR-028 patched the immediate P0 risk where `storageMode='cloud'` persisted in
localStorage after sign-out, causing cached data to render for unauthenticated
users. The patch added a boolean guard (`cloudAuthRequired`) but left the root
drift risk: **two independently persisted boolean fields (`storageMode` and
`auth.authenticated`) can drift out of sync**, requiring scattered if-chains to
detect all invalid combinations.

The repair exposed a missing abstraction: there is no single state field that
describes *what data the app is authorised to show*. Every gate that tries to
answer this question re-derives the answer independently, inconsistently.

## Decision

Replace the implicit dual-boolean approach with three explicit fields:

| Field | Type | Persistence | Source of truth |
|---|---|---|---|
| `storageIntent` | `'local'\|'cloud'\|null` | `tsv-storage-mode` (unchanged key) | User-declared preference at onboarding |
| `sessionState` | `'unauthenticated'\|'auth-pending'\|'authenticated'` | none — derived at init from session validation | Auth module |
| `dataAuthority` | `'local'\|'cloud'\|'none'` | none — computed getter | Derived from `storageIntent` + `sessionState` |

### Derivation rule for `dataAuthority`

```
storageIntent === 'local'                                        → 'local'
storageIntent === 'cloud' && sessionState === 'authenticated'   → 'cloud'
*                                                               → 'none'
```

`'none'` covers all drift combinations: cloud-intent + expired session,
cloud-intent + pending auth, null intent (pre-onboarding).

### Migration

- `storageMode` state field renamed to `storageIntent` in code.
  localStorage key `tsv-storage-mode` is **unchanged** — no data migration.
- `auth.authenticated` boolean kept in sync with `sessionState` for template
  backward compatibility. Internal logic uses `sessionState` directly.
- `cloudAuthRequired` flag removed. Replaced by: `dataAuthority === 'none'
  && storageIntent === 'cloud'`.

## Consequences

### Positive
- Single derived field (`dataAuthority`) answers all data-access gate questions.
- Drift states are prevented by design: impossible for `dataAuthority` to be
  `'cloud'` without an authenticated session.
- `sessionState: 'auth-pending'` enables future UX (loading spinner, retry
  count) without new state fields.
- All existing localStorage keys unchanged — zero migration friction for users.

### Negative
- `auth.authenticated` is now a maintained alias (updated alongside `sessionState`),
  adding a synchronisation responsibility in auth module methods.
- Templates that previously read `storageMode` directly must be updated to
  `storageIntent` or `dataAuthority`.

## Verification

- `tests/state-model.spec.js`: state machine E2E coverage for all derivation paths.
- `tests/data-authority.spec.js`: existing P0 regression tests remain green.
