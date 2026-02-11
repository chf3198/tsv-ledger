# Design Document

> **This is a living document. Update BEFORE writing code.**

## Current Architecture

```
┌─────────────────────────────────┐
│  GitHub Pages (static)          │
│  index.html + js/*.js           │
└──────────────┬──────────────────┘
               │ fetch()
┌──────────────▼──────────────────┐
│  CloudFlare Worker (/api/*)     │
│  worker/index.js (planned)      │
└──────────────┬──────────────────┘
               │ D1 SQL
┌──────────────▼──────────────────┐
│  CloudFlare D1 (SQLite)         │
│  expenses table (planned)       │
└─────────────────────────────────┘
```

## Core Principles
1. **≤100 lines per file** - Enforced by lint
2. **Pure functions** - Side effects at edges only
3. **E2E tests first** - No code without failing test
4. **Minimal dependencies** - Justify in this doc

## Approved Stack
| Tool | Purpose | Justification |
|------|---------|---------------|
| Alpine.js | Reactivity | 3kb, no build, declarative |
| Pico CSS | Styling | Classless, accessible |
| Playwright | E2E tests | Industry standard |
| GitHub Actions | CI/CD | Free, native integration |
| GitHub Pages | Hosting | Free, auto-deploy from Actions |

## Decision Log

### ADR-001: Static-First with Edge API
**Context**: Need cheap/free hosting with good performance  
**Decision**: GitHub Pages + CloudFlare Workers  
**Consequences**: No server-side rendering, requires CORS handling

### ADR-002: Two Fixed Categories
**Context**: User wants simple Office vs Benefits split  
**Decision**: Hard-code two categories, no custom categories  
**Consequences**: Simpler UI, less flexible for future needs

### ADR-003: localStorage Before Backend
**Context**: Prove UI works before building API  
**Decision**: localStorage for v1, D1 migration later  
**Consequences**: Data local to browser, no sync between devices

### ADR-004: Self-Evolution Protocol
**Context**: AI agents need to improve over time, not repeat mistakes  
**Decision**: Implement Reflexion-based self-improvement loop  
**Consequences**: 
- Adds reflection step to workflow (slight overhead)
- Requires REFLECTION_LOG.md maintenance
- Enables pattern detection and protocol adaptation
- Based on Shinn 2023 (Reflexion) and STOP (Zelikman 2023)

### ADR-005: GitHub Actions CI/CD with GitHub Pages
**Context**: Need automated testing and free hosting  
**Decision**: GitHub Actions for CI + GitHub Pages for static hosting  
**Consequences**:
- Every PR runs lint + E2E tests automatically
- Main branch auto-deploys to GitHub Pages
- Secrets stored in GitHub (CLOUDFLARE_API_TOKEN for future D1)
- Playwright runs in CI with proper browser caching

### ADR-006: Visual Regression Testing (Deferred)
**Context**: Need to catch unintended CSS/layout changes  
**Decision**: Use Playwright snapshots, but defer until v1 design is stable  
**Consequences**:
- No visual tests during active design iteration
- Add visual regression suite before first release
- Will use `expect(page).toHaveScreenshot()` when ready
- Avoids constant snapshot updates during design phase

### ADR-007: Amazon Subscription Data Not Required
**Context**: Amazon exports include both Orders and Subscriptions zips  
**Decision**: Import only Order History; skip Subscriptions zip  
**Consequences**:
- Simpler import architecture (one less data source)
- Subscribe & Save orders detectable via `Shipping Option = std-sns-us`
- Historical accounting doesn't need future delivery predictions
- Reduces complexity without losing categorization capability

### ADR-008: CSV/DAT Import with Client-Side Parsing
**Context**: Need to import Amazon Order History (CSV) and Bank of America statements (pipe-delimited DAT)  
**Decision**: Client-side file parsing with format-specific handlers + ZIP extraction  
**Implementation**:
- Amazon CSV: Extract Order Date, Product Name, Total Owed, Shipping Address
- BOA DAT: Parse pipe-delimited fields (Date|Description|Amount|Balance)
- ZIP files: Auto-extract `Retail.OrderHistory.*.csv` using JSZip (6kb gzipped)
- File input with drag-and-drop support
- Progress feedback during parse
- Auto-categorize on import using existing categorizer
- Default businessPercent = 100 (all Office Supplies)

**Consequences**:
- No backend required for import (privacy-first)
- ZIP support eliminates manual extraction step
- CSV parser must handle quoted fields with embedded commas
- BOA parser must handle pipe delimiter and optional quotes
- Large files (>1000 rows) may cause UI lag
- Import validation errors shown inline
- Duplicate detection needed (by Order ID for Amazon, by date+amount for BOA)

### ADR-009: Expense Apportionment via Percentage Slider (Deferred)
**Context**: Expenses need to be split between Business Supplies and Board Member Benefits (e.g., paper towels 70% business, 30% benefits)  
**Decision**: Card-based UI with single horizontal slider for percentage allocation (v2 feature)  
**Status**: Deferred until after data import is working
**UI Pattern** (based on Smashing Magazine slider UX research):
- Single continuous slider: 0% (all Benefits) ↔ 100% (all Business)
- Default: 100% Business Supplies
- Current values displayed above slider: "Business: 70% | Benefits: 30%"
- Editable inline input: click percentage to type exact value
- Preset buttons: 100%/0%, 75%/25%, 50%/50%, 25%/75%, 0%/100%
- Slider thumb ≥32×32px with generous track padding (3vw mobile, 1.5vmax desktop)
- Keyboard accessible: arrow keys increment/decrement by 5%

**Consequences**:
- Data model changes from single category to allocation percentage
- UI shift from table rows to expense cards
- Totals calculated by summing (amount × businessPercent/100)
- More engaging exploration than dropdowns
- Supports "fuzzy" apportionment decisions

## Data Model
```
Expense {
  id: string,
  date: string,           // ISO 8601
  description: string,
  location: string,
  amount: number,         // in cents (avoid float errors)
  businessPercent: number // 0-100, default 100
}
// benefitsPercent = 100 - businessPercent (derived, not stored)
```

**Category Terminology**:
- "Business Supplies" (not "Office Supplies")
- "Board Member Benefits" (not "Employee Benefits" - no employees)

**Total Calculations**:
- Business Total = Σ(amount × businessPercent / 100)
- Benefits Total = Σ(amount × (100 - businessPercent) / 100)

## UI Wireframe: Expense Card

```
┌─────────────────────────────────────────────────┐
│ Amazon.com                        Jan 15, 2025  │
│ Paper Towels (12-pack)                          │
│                                         $24.99  │
├─────────────────────────────────────────────────┤
│ Business: 70%              Benefits: 30%        │
│ ┌─────────────────────────────────────────────┐ │
│ │████████████████████████████░░░░░░░░░░░░░░░░│ │
│ └─────────────────────────────────────────────┘ │
│ ○100/0  ○75/25  ●50/50  ○25/75  ○0/100         │
├─────────────────────────────────────────────────┤
│ $17.49 Business  │  $7.50 Benefits              │
└─────────────────────────────────────────────────┘
```

**Interaction States**:
- Default: 100% Business (slider fully left)
- Hover on slider: thumb enlarges, cursor changes
- Dragging: real-time percentage update
- Click on percentage: inline edit field appears
- Click on preset: slider snaps to value

### ADR-009: Auth.js Multi-Provider Authentication
**Context**: Need user registration/authentication with maximum security at zero cost  
**Decision**: Auth.js (formerly NextAuth.js) with CloudFlare D1 adapter  
**Research Sources**: OWASP Authentication Cheat Sheet, web.dev Passkey guides, SimpleWebAuthn docs

**Authentication Strategy** (layered, user choice):
1. **Primary: Passkeys (WebAuthn)** - Passwordless, phishing-resistant, biometric
2. **Secondary: Social OAuth** - Google, GitHub, Twitter/X, Discord, Apple, etc.
3. **Fallback: Magic Links** - Email-based passwordless

**Why Auth.js**:
- 100% FREE (self-hosted, open source MIT license)
- 80+ OAuth providers pre-configured
- CloudFlare D1 adapter available (`@auth/d1-adapter`)
- WebAuthn/Passkey support built-in
- No vendor lock-in, no usage limits
- Works with our minimal-dependency philosophy

**Security Implementation** (per OWASP):
- Session cookies: `Secure`, `HttpOnly`, `SameSite=Strict`
- Session ID: ≥128-bit entropy via CSPRNG
- Idle timeout: 30 minutes
- Absolute timeout: 8 hours
- Session regeneration on privilege change

**Enabled Providers** (Phase 1):
| Provider | Rationale |
|----------|-----------|
| Google | Most common, trusted |
| GitHub | Developer-friendly, TSV-Ledger audience |
| Passkeys | Maximum security, no passwords |

**Database Schema** (D1/SQLite):
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  UNIQUE(provider, providerAccountId)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES users(id),
  expires INTEGER NOT NULL
);

CREATE TABLE passkeys (
  id TEXT PRIMARY KEY,
  credentialID TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES users(id),
  publicKey BLOB NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT
);
```

**Consequences**:
- Requires CloudFlare Worker endpoints for auth flows
- OAuth apps must be created on Google/GitHub developer consoles
- No password storage/hashing needed (passwordless-first)
- User data syncs across devices via account linking

### ADR-010: App Shell Architecture
**Context**: Need to establish foundational UI structure before implementing features  
**Decision**: Build app shell first with header, navigation, main content area, footer  
**Research Sources**: Google Chrome DevRel (App Shell Model), Smashing Magazine (Skeleton Screens)

**App Shell Pattern Benefits**:
- Perceived performance: Users see structure immediately
- PWA-ready: Service worker can cache shell for offline
- Clear separation: UI structure vs dynamic content
- TDD-compatible: Test shell elements exist before content

**Shell Structure**:
```html
<body>
  <header role="banner">
    <nav>Logo + Auth</nav>
  </header>
  <aside role="navigation">Menu (hamburger on mobile)</aside>
  <main role="main">Content area + skeleton loaders</main>
  <footer role="contentinfo">Version + branding</footer>
</body>
```

**Navigation Items** (Phase 1):
| Route | Label | Icon |
|-------|-------|------|
| `/` | Dashboard | 📊 |
| `/expenses` | Expenses | 💰 |
| `/import` | Import | 📁 |
| `/settings` | Settings | ⚙️ |

**Responsive Breakpoints**:
- Mobile: ≤640px (hamburger menu, stacked layout)
- Tablet: 641-1024px (collapsible sidebar)
- Desktop: >1024px (persistent sidebar)

**Consequences**:
- Foundation established before feature work
- Enables skeleton loading states
- Navigation structure defined upfront
- ARIA landmarks for accessibility

### ADR-011: Custom Auth Implementation vs Auth.js
**Context**: Need to implement Google OAuth, GitHub OAuth, and Passkeys with CloudFlare D1  
**Research**: Auth.js docs show D1 adapter exists (`@auth/d1-adapter`) with migration tools  
**Problem Discovered**: 
- Auth.js is framework-heavy (designed for Next.js, SvelteKit, Express)
- CloudFlare Workers integration is unclear/undocumented in Auth.js v5
- Our static GitHub Pages + Worker API setup doesn't match Auth.js expectations
- Auth.js adds significant complexity for 3 providers + passkeys

**Decision**: Build custom lightweight auth for our specific use case  
**Implementation**:
1. **OAuth Flows**: Direct provider API calls (Google/GitHub OAuth 2.0)
   - OAuth 2.0 authorization code flow (PKCE for security)
   - State parameter for CSRF protection
   - Worker endpoints: `/auth/oauth/{provider}/start`, `/auth/oauth/{provider}/callback`
2. **Passkeys**: WebAuthn API (already implemented in js/auth.js)
   - SimpleWebAuthn library for server-side verification
   - Worker endpoints: `/auth/passkey/register`, `/auth/passkey/login`
3. **Session Management**: JWT tokens in HttpOnly cookies
   - CloudFlare Workers crypto API for signing
   - D1 for session storage (user_id, expires_at, created_at)
4. **D1 Schema** (simplified from Auth.js):
   ```sql
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     avatar_url TEXT,
     created_at INTEGER NOT NULL
   );
   
   CREATE TABLE oauth_accounts (
     provider TEXT NOT NULL,
     provider_user_id TEXT NOT NULL,
     user_id TEXT NOT NULL REFERENCES users(id),
     PRIMARY KEY (provider, provider_user_id)
   );
   
   CREATE TABLE passkeys (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users(id),
     credential_id TEXT UNIQUE NOT NULL,
     public_key BLOB NOT NULL,
     counter INTEGER DEFAULT 0
   );
   
   CREATE TABLE sessions (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users(id),
     expires_at INTEGER NOT NULL,
     created_at INTEGER NOT NULL
   );
   ```

**Consequences**:
- ✅ Full control over auth flow, no framework overhead
- ✅ Matches our static-first + edge API architecture perfectly
- ✅ Simpler to test and debug (fewer abstractions)
- ✅ Can follow OWASP guidelines directly
- ❌ Must implement OAuth 2.0 ourselves (but it's well-documented)
- ❌ No magic links (deferred to v2 if needed)
- ⚠️ Requires careful security review (use web.dev/OWASP best practices)

**Security Checklist** (per OWASP Authentication Cheat Sheet):
- [ ] HTTPS only (enforced by CloudFlare + GitHub Pages)
- [ ] Secure session cookies (HttpOnly, Secure, SameSite=Strict)
- [ ] CSRF tokens via OAuth state parameter
- [ ] Session timeout: 30 min idle, 8 hour absolute
- [ ] PKCE for OAuth (S256 challenge method)
- [ ] Rate limiting on auth endpoints

### ADR-012: Phased Auth Implementation
**Context**: Full OAuth + Passkeys + CloudFlare Worker is a large multi-file task  
**Decision**: Implement in phases, localStorage mock first, then production backend

**Phase 1: Mock Authentication** (Current - localStorage only):
- localStorage stores mock user: `{id, email, name, provider}`
- UI already exists and tested (5 passing tests in register.spec.js)
- Allows app development to continue without backend dependency
- Tests validate auth UI flows work correctly

**Phase 2: CloudFlare Worker + D1** (Future - separate epic):
- Create CloudFlare Worker with auth endpoints
- Set up D1 database with migrations
- Implement OAuth 2.0 flows (Google, GitHub)
- Implement WebAuthn/Passkey verification
- Replace localStorage mock with real API calls

**Consequences**:
- ✅ Unblocks feature development (expenses, import, dashboard)
- ✅ Maintains ≤100 line constraint per file
- ✅ Tests remain valid (UI behavior unchanged)
- ✅ Clear separation: frontend complete, backend deferred
- ⚠️ Phase 2 requires OAuth app setup on Google/GitHub consoles
- ⚠️ Phase 2 requires CloudFlare account + D1 database creation

**Current Status**: Phase 1 complete (mock auth working, UI tested)  
**Next**: Continue with core app features using mock auth

## Rejected Alternatives
| Rejected | Why |
|----------|-----|
| React/Vue | Build step, bundle size |
| Tailwind | Requires build |
| Express | Always-on server cost |
| Firebase Auth | Heavier SDK, vendor lock-in, 3K DAU limit on free |
| Clerk | MFA requires paid plan, closed source |
| Supabase Auth | Requires Supabase infrastructure, not CloudFlare D1 |
| Auth.js (NextAuth) | Framework-heavy, unclear CloudFlare Workers integration, overkill for 3 providers |
| Password-based auth | Requires hashing infra, breach monitoring, reset flows |
