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

### ADR-008: Expense Apportionment via Percentage Slider
**Context**: Expenses need to be split between Business Supplies and Board Member Benefits (e.g., paper towels 70% business, 30% benefits)  
**Decision**: Card-based UI with single horizontal slider for percentage allocation  
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

## Rejected Alternatives
| Rejected | Why |
|----------|-----|
| React/Vue | Build step, bundle size |
| Tailwind | Requires build |
| Express | Always-on server cost |
| Firebase Auth | Heavier SDK, vendor lock-in, 3K DAU limit on free |
| Clerk | MFA requires paid plan, closed source |
| Supabase Auth | Requires Supabase infrastructure, not CloudFlare D1 |
| Password-based auth | Requires hashing infra, breach monitoring, reset flows |
