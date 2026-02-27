# ADR-019: JWT Bearer Tokens for Authentication

**Date**: 2026-02-25
**Status**: Accepted

## Context

App hosted on Cloudflare Pages needs backend authentication via Cloudflare Workers. Critical constraint: cross-origin requests cannot use cookies reliably due to browser restrictions on third-party cookies (Safari ITP, Chrome phase-out).

## Decision

Use JWT-based authentication with Bearer tokens stored in localStorage instead of cookies.

**Flow**:

```
Frontend (tsv-ledger.pages.dev)
    │
    │ Authorization: Bearer <session-token>
    ▼
Worker (tsv-ledger-api.chf3198.workers.dev)
    │
    │ Validate token, query D1
    ▼
D1 Database (sessions, users)
```

**OAuth Callback**:

```
User → Google/GitHub OAuth → Worker callback
    → Worker creates session in D1
    → Redirect to frontend with ?session=<token>
    → Frontend stores token in localStorage
```

## Why NOT Cookies

| Issue        | Impact                               |
| ------------ | ------------------------------------ |
| Safari ITP   | Blocks third-party cookies entirely  |
| Chrome       | Phasing out third-party cookies      |
| SameSite     | Cross-origin requires `None; Secure` |
| GitHub Pages | Cannot set response headers          |

## Why Bearer Tokens

- Work with any CORS configuration
- No browser cookie restrictions
- Stored in localStorage (acceptable for session)
- Stateless verification possible

## Implementation

**Worker OAuth callback**:

```javascript
const sessionToken = await createSession(env, user.id);
return Response.redirect(`${frontend}/?session=${sessionToken}`);
```

**Frontend session handling**:

```javascript
const params = new URLSearchParams(window.location.search);
const session = params.get("session");
if (session) {
  localStorage.setItem("tsv-session", session);
  window.history.replaceState({}, "", window.location.pathname);
}
```

**API calls**:

```javascript
const token = localStorage.getItem("tsv-session");
fetch("/api/...", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## Consequences

### Positive

- ✅ Works with static hosting (GitHub/Cloudflare Pages)
- ✅ No third-party cookie issues
- ✅ Simple CORS: just allow the origin

### Negative

- ⚠️ localStorage tokens accessible to XSS (mitigate with CSP)
- ⚠️ Must manually include token in every request
- ⚠️ No automatic cookie expiry (must check server-side)
