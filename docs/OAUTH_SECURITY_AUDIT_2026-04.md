# OAuth Security Audit (2026-04-10)

## Scope

- Worker OAuth flow: [worker/src/oauth.js](worker/src/oauth.js)
- Session validation: [worker/src/session.js](worker/src/session.js)
- Session creation: [worker/src/helpers.js](worker/src/helpers.js)

## Summary

Current OAuth flow is functional but has high-priority security gaps that should be addressed before Phase 0 is considered complete.

## Findings

### 1) Missing OAuth `state` validation (High)

- `state` is generated in `/oauth/*/start`, but callback does not validate returned `state`.
- Risk: CSRF/login injection via forged callback.

### 2) Session token in URL query parameter (High)

- Callback redirects with `/?session=<token>`.
- Risk: token leak through browser history, logs, referrer propagation, screenshot sharing.

### 3) No PKCE for OAuth code flow (Medium)

- Current exchange uses client secret only.
- Risk: weaker authorization-code interception protection for public clients/redirect surfaces.

### 4) Long fixed session lifetime (Medium)

- Session expiry is fixed 7 days in DB.
- Risk: longer stolen-token window if token leaks.

### 5) No explicit replay/one-time callback nonce binding (Medium)

- No callback nonce store/check tied to initiation.
- Risk: callback replay acceptance under some attack conditions.

### 6) Access/refresh token storage hardening unclear (Low/Medium)

- OAuth account tokens persisted in D1; no explicit encryption-at-rest envelope in app code.
- Risk: blast radius if DB exfiltration occurs.

## Existing Strengths

- Random token/id generation via Web Crypto.
- Server-side session lookup checks expiry.
- Provider-scoped endpoints and allowed providers are explicit.
- OAuth cancellation/error handling avoids broken states.

## Recommended Remediation Plan

### P0 (immediate)

1. Validate OAuth `state` in callback against server-stored one-time state.
2. Stop returning session token via URL query string.
   - Use secure HttpOnly cookie or short-lived one-time exchange code.

### P1

3. Add PKCE (`code_challenge` / `code_verifier`) for Google/GitHub flows.
4. Add rolling session inactivity timeout and optional absolute max age.

### P2

5. Add nonce/replay protection for callback exchange records.
6. Add token storage hardening strategy (envelope encryption + key rotation docs).

## Ticket Mapping

- Issue #9 covers audit/documentation and should reference this report.
- Implementation follow-ups should be tracked as child tasks under Ticket #1 Phase 0.

## Verification Targets After Fixes

- Negative test: callback with mismatched `state` rejected.
- Negative test: replayed callback rejected.
- Session token not visible in URL/address bar during auth completion.
- OAuth E2E tests still pass for Google/GitHub happy paths.
