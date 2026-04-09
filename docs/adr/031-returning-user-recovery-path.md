# ADR-031: Returning User Recovery Path

**Status**: Accepted
**Date**: 2026-04-09
**Deciders**: @chf3198

## Context

When a user returns to tsv-ledger with `tsv-storage-mode=cloud` and `tsv-onboarding-complete=true`
in localStorage but no active authentication session, they see a "Cloud Access Locked" banner
with only a "Sign In" button. There is no alternative forward path — the user is stuck if they
cannot or choose not to authenticate (e.g., different Google account, expired OAuth, or preference
change).

This creates a UX dead-end where the only escape is manually clearing browser storage.

## Decision

Add a "Start Fresh Locally" button to the cloud-locked banner alongside the existing "Sign In" button.
Clicking it calls `resetToOnboarding()` which:

1. Removes `tsv-storage-mode` from localStorage
2. Removes `tsv-onboarding-complete` from localStorage
3. Resets Alpine state (`storageIntent=null`, `onboardingComplete=false`, `onboardingStep=1`)
4. Returns the user to the onboarding wizard at step 1

This preserves any cached expense data in `tsv-expenses` — the user can choose local or cloud
again during onboarding. The data authority state machine (ADR-029) is not modified.

## Consequences

**Positive:**
- Eliminates UX dead-end for returning unauthenticated users
- No data loss — cached expenses remain in localStorage
- Minimal code change (2 lines HTML, 7 lines JS, 1 delegation line)

**Negative:**
- Users who accidentally click "Start Fresh" must redo onboarding (2 clicks)
- Does not auto-detect whether the user *can* authenticate (no session probe)

**Dependencies:** ADR-029 (Explicit State Model), ADR-025 (Onboarding Wizard)
