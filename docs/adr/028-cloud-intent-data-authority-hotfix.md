# ADR-028: Cloud-Intent Signed-Out Data Authority Hotfix

## Status

Accepted

## Context

UAT exposed a high-priority security defect: cached expenses were rendered while signed out when `storageMode` remained `cloud` but `auth.authenticated` was false.

This state drift allowed local cached cloud data to appear without an authenticated session.

## Decision

1. In `loadData()`, enforce `data authority = none` when cloud intent is active and user is not authenticated.
2. Do not render cached expenses/import history in that state.
3. Show explicit re-auth prompt in the UI to recover cloud access.
4. Add E2E regression tests for this state.

## Consequences

### Positive

- Prevents signed-out rendering of cloud-intent cached data.
- Makes cloud access state explicit to users.
- Adds durable regression protection.

### Negative

- Introduces temporary UX split between local-mode banner and cloud-auth-required banner.
- Requires follow-up state-model cleanup (storage intent/session/data authority refactor).
