---
name: 'Cloudflare Worker Patterns'
description: 'Patterns for worker/src/ modules - API routes, OAuth, sessions, D1 database'
applyTo: 'worker/**'
---

# Cloudflare Worker Patterns

## API Route Structure (worker/src/index.js)

**Pattern**: Route dispatcher with CORS preflight:
```javascript
export default {
  async fetch(request, env) {
    const CORS = getCorsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    // Public routes (no auth required)
    if (path.startsWith('/auth/oauth')) return handleOAuth(request, env);
    if (path.startsWith('/auth/session')) return handleSession(request, env);

    // Protected routes (require Bearer token)
    const user = await getSessionUser(request, env);
    if (!user) return new Response('Unauthorized', { status: 401, headers: CORS });

    if (path.startsWith('/expenses')) return handleExpenses(request, env, user);

    return new Response('Not Found', { status: 404, headers: CORS });
  }
};
```

**CORS Origin Whitelist** (ADR-020):
- `https://tsv-ledger.pages.dev` (production)
- `https://*.tsv-ledger.pages.dev` (branch previews via regex)
- `http://localhost:3000`, `http://127.0.0.1:3000` (dev)

## Authentication Flow (ADR-009, 019)

### OAuth Callback (oauth.js)
1. Receive `code` from Google/GitHub
2. Exchange for access token via provider API
3. Fetch user profile
4. Create session in D1: `INSERT INTO sessions (user_id, token, expires_at)`
5. Return JWT to frontend: `{ token, user: { id, name, avatar }, exp }`

### Session Validation (session.js)
**Pattern**: JWT Bearer token verification:
```javascript
// Frontend sends: Authorization: Bearer <token>
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const payload = await verifyJWT(token, env.JWT_SECRET);
const session = await env.DB.prepare(
  'SELECT * FROM sessions WHERE token = ? AND expires_at > ?'
).bind(payload.sid, Date.now()).first();
```

**Token Lifecycle**:
- Expiry: 30 days (configurable in session.js)
- Refresh: Not yet implemented (ADR-019 notes future enhancement)
- Revocation: DELETE from sessions table on sign-out

## D1 Database Schema (worker/schema.sql)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  provider TEXT NOT NULL, -- 'google' | 'github'
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON serialized Expense[]
  synced_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Cloud Sync Pattern (ADR-023)

**Conflict resolution**: Last-write-wins (client timestamp comparison)
**Sync trigger**: After every localStorage write (optional, user-enabled in storage mode)
**Payload**: Full expense array (no delta sync in v3.5.0)

```javascript
// Frontend: POST /expenses/sync
fetch('/expenses/sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ expenses: [...] })
});

// Worker response: { synced: true, serverExpenses: [...] }
```

## Environment Variables (wrangler.toml)

```toml
[env.production]
vars = {
  GOOGLE_CLIENT_ID = "...",
  GITHUB_CLIENT_ID = "...",
  ALLOWED_ORIGINS = "https://tsv-ledger.pages.dev"
}

[[d1_databases]]
binding = "DB"
database_name = "tsv-ledger-prod"
database_id = "..."
```

**Secrets** (never commit): Set via `wrangler secret put`:
- `JWT_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_SECRET`

## Testing Worker Locally

```bash
# Start dev server with D1 local database
npx wrangler dev --local --persist

# Test OAuth callback (use ngrok for redirect_uri)
ngrok http 8787
# Set OAuth redirect_uri to https://<ngrok-url>/auth/oauth/callback
```

**Note**: Cannot test OAuth locally without tunneling (Google/GitHub require HTTPS redirect_uri).

## Common Error Patterns

### 1. CORS Preflight Failures
**Symptom**: `fetch('/api/...')` fails with CORS error in browser console
**Cause**: Missing `OPTIONS` handler or wrong `Access-Control-Allow-Origin`
**Solution**: Ensure `getCorsHeaders()` includes origin in whitelist, return CORS headers on ALL responses (including errors)

### 2. D1 Binding Not Available
**Symptom**: `env.DB is undefined`
**Cause**: Missing `[[d1_databases]]` in wrangler.toml or wrong binding name
**Solution**: Check wrangler.toml has correct `binding = "DB"` and `wrangler dev --local --persist` uses local D1

### 3. JWT Verification Failures
**Symptom**: All authenticated requests return 401
**Cause**: JWT_SECRET mismatch between signing and verification
**Solution**: Ensure same secret used in `signJWT()` (session.js) and `verifyJWT()` (session.js). Check `wrangler secret list` for production.

## Module Export Pattern

**✅ DO**: Named exports, re-export in index.js for route handlers:
```javascript
// oauth.js
export async function handleOAuth(request, env) { ... }

// index.js
import { handleOAuth } from './oauth.js';
```

**❌ DON'T**: Default exports (makes tree-shaking harder, less explicit imports)
