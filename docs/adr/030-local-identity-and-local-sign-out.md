# ADR-030: Local Identity, Local Sign-Out, and Encrypted Vault Decision

**Date**: 2026-04-03
**Status**: Accepted
**Depends On**: ADR-024, ADR-029

## Context

ADR-029 made data visibility deterministic for cloud sessions, but the local path
still lacked user attribution and session boundaries. In local mode, data could
be visible without any named identity, and there was no explicit sign-out flow
for shared-device scenarios.

At the same time, ticket #21 required a decision on whether retained local data
should move into an encrypted vault backed by WebCrypto and a passphrase/PIN.

We need one coherent policy that answers:

- Who is the active local user?
- What happens when that local user signs out?
- Is local retention protected by a real security boundary or only a UX guard?

## Decision

### 1. Introduce explicit local identity

Persist a local profile in `tsv-local-profile`:

```json
{ "alias": "Local User" }
```

Rules:
- Choosing local mode creates a default local profile if none exists.
- Users may rename the alias in Settings.
- The header always shows an identity badge:
  - `Cloud: <name>` when `dataAuthority === 'cloud'`
  - `Local: <alias>` when `dataAuthority === 'local'`
  - `Signed out` otherwise

### 2. Introduce local sign-out outcomes

Persist `tsv-local-data-locked` as a soft-lock flag.

When local users choose **Local Sign Out**, offer three outcomes:

1. **Move to Cloud**
   - Set `storageIntent = 'cloud'`
   - If authenticated, sync immediately
   - If not authenticated, persist `tsv-pending-cloud-migration = 'true'`
     and require sign-in before sync completes

2. **Lock on This Device**
   - Keep local data in localStorage
   - Set `tsv-local-data-locked = 'true'`
   - `dataAuthority` becomes `none`
   - UI exposes `Resume Local Access`

3. **Delete Local Data**
   - Remove local expenses, import history, onboarding state, local profile, and
     lock state from localStorage
   - Return app to first-run onboarding

### 3. Encrypted local vault decision

**Do not implement a WebCrypto encrypted vault in Phase 0.**

Reasoning:
- WebCrypto only provides meaningful protection if a user supplies a secret not
  already stored on the device (passphrase/PIN).
- Adding a passphrase system introduces recovery, brute-force, timeout, and UX
  complexity beyond the current phase.
- A soft lock without a user secret is not cryptographic protection and must not
  be represented as such.

Therefore, Phase 0 ships:
- explicit local identity
- soft-lock for privacy/shoulder-surfing reduction
- delete-local-data for highest-confidence sign-out outcome
- migrate-to-cloud flow for account-based continuity

## Consequences

### Positive
- Local data now has an attributable active identity.
- Shared-device users get deterministic sign-out outcomes.
- The product avoids claiming security properties it does not actually provide.
- A future encrypted vault can be added behind a new ADR without breaking the
  state model.

### Negative
- Local lock is a UX/privacy boundary, not strong cryptographic security.
- Move-to-cloud can temporarily hide data until authentication completes.
- Additional localStorage keys increase state-surface area.

## Threat Model Notes

| Threat | Soft Lock | Delete Local Data | Encrypted Vault |
|---|---|---|---|
| Casual shoulder surfing | Mitigates | Mitigates | Mitigates |
| Same-browser accidental exposure | Mitigates | Mitigates | Mitigates |
| Malicious local user with DevTools | Does not mitigate | Mitigates after deletion | Partially mitigates |
| Device theft with unlocked session | Does not mitigate | Mitigates after deletion | Partially mitigates |
| Recovery without user secret | Easy | N/A | Hard/problematic |

## Follow-up Tasks

- Add a future passphrase-based unlock prototype only if product requirements
  justify real encrypted local retention.
- If encrypted retention is revisited, require PBKDF2/Argon2-style derivation,
  failed-attempt policy, idle timeout, and explicit recovery trade-offs.
- Keep `Local Sign Out` copy explicit that lock is a device privacy measure, not
  strong encryption.

## Verification

- E2E identity badge tests
- E2E local sign-out flow tests
- E2E security matrix coverage for local/cloud/locked/signed-out states
