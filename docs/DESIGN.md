# Design Document

> **This is a living document. Update BEFORE writing code.**

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Pages (static hosting)                      │
│  tsv-ledger.pages.dev + branch previews                 │
│  index.html + css/*.css + js/*.js                       │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch() + Bearer token
┌──────────────────────▼──────────────────────────────────┐
│  CloudFlare Worker (API)                                │
│  tsv-ledger-api.chf3198.workers.dev                     │
│  /auth/* (OAuth, sessions) + /api/* (expenses CRUD)     │
└──────────────────────┬──────────────────────────────────┘
                       │ D1 SQL
┌──────────────────────▼──────────────────────────────────┐
│  CloudFlare D1 (SQLite)                                 │
│  users, accounts, sessions, expenses tables             │
└─────────────────────────────────────────────────────────┘
```

## Core Principles

1. **≤100 lines per file** - Enforced by lint
2. **Pure functions** - Side effects at edges only
3. **E2E tests first** - No code without failing test
4. **Minimal dependencies** - Justify in this doc

## Approved Stack

| Tool               | Purpose        | Justification                      |
| ------------------ | -------------- | ---------------------------------- |
| Alpine.js          | Reactivity     | 3kb, no build, declarative         |
| Pico CSS           | Styling        | Classless, accessible              |
| Playwright         | E2E tests      | Industry standard                  |
| Cloudflare Pages   | Static hosting | Branch previews for UAT, free      |
| Cloudflare Workers | API backend    | Edge compute, D1 integration       |
| Cloudflare D1      | Database       | SQLite at edge, free tier generous |
| GitHub Pages       | Backup hosting | Free, auto-deploy (legacy)         |

## Decision Log

### ADR-001: Static-First with Edge API

**Context**: Need cheap/free hosting with good performance
**Decision**: GitHub Pages + CloudFlare Workers
**Consequences**: No server-side rendering, requires CORS handling

### ADR-002: Three Fixed Categories with Uncategorized Default

**Context**: User wants simple Business Supplies vs Board Member Benefits split
**Decision**: Hard-code three categories: "Business Supplies", "Board Member Benefits", "Uncategorized"
**Default Behavior**: All imported expenses default to "Uncategorized" pending user review
**Rationale**:

- Prevents premature tax categorization assumptions
- Aligns with progressive disclosure UX principles (Nielsen Norman Group)
- Honest state representation - acknowledges categorization hasn't occurred
- User must manually review and categorize after import
  **Consequences**:
- Simpler UI, clearer user workflow
- Dashboard shows uncategorized warning until user reviews
- No AI/keyword-based auto-categorization until v2
- Correct terminology: "Board Member Benefits" (no employees exist)

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
- All imports default to "Uncategorized" category
- Default businessPercent = 100 (will apply when user categorizes as Business Supplies)

**Consequences**:

- No backend required for import (privacy-first)
- ZIP support eliminates manual extraction step
- CSV parser must handle quoted fields with embedded commas
- BOA parser must handle pipe delimiter and optional quotes
- Large files (>1000 rows) may cause UI lag
- Import validation errors shown inline
- Duplicate detection required (see ADR-013)

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
  amount: number,         // dollars (not cents)
  category: string,       // "Business Supplies" | "Board Member Benefits" | "Uncategorized"
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

### ADR-013: Duplicate Detection for Overlapping Imports

**Context**: Users import bank/Amazon data regularly; date ranges will overlap causing duplicate expenses
**Decision**: Detect duplicates by ID before adding to storage, track duplicate count in import history
**Detection Strategy**:

- Amazon: ID = `amazon-{OrderID}-{idx}` (OrderID is unique per Amazon order)
- BOA: ID = `boa-{date}-{idx}` (row index prevents collision within same file, but NOT across imports)
- BOA needs stronger hash: `boa-{date}-{amount}-{description.slice(0,20)}`
- Check `loadExpenses()` array for existing `expense.id` before adding

**Import History Data**:

```javascript
{
  id: "import-{timestamp}",
  timestamp: 1707782400000,
  type: "amazon-zip" | "amazon-csv" | "boa-dat",
  filename: string,
  recordsCount: number,      // New expenses added
  duplicatesCount: number,   // Skipped (already exist)
  skipped: number,           // Invalid (null/zero amount)
  dateRange: { earliest, latest },
  success: boolean
}
```

**UI Display**:

- Timeline/feed on `/import-history` route
- Card per import with success/partial/error color coding
- Empty state: "No imports yet. Import your first file to get started." (link to /import)
- Max 50 imports stored (trim oldest on overflow)

**Consequences**:

- ✅ Prevents duplicate expenses from overlapping imports
- ✅ Users see audit trail of all imports
- ✅ Duplicate count indicates data freshness
- ✅ Under 100 lines (import-history.js ~45 lines, UI ~30 lines, tests ~65 lines)
- ⚠️ BOA duplicate detection not perfect (same transaction on same day will collide)
- ⚠️ No "undo import" feature (manual deletion required)

### ADR-014: Percentage-Based Allocation Interface

**Context**: App goal is "helping businesses determine how much of Amazon orders are employee benefits". Category dropdown (ADR-002) was vestigial from categorization approach. Needed simpler allocation interface.

**Decision**: Replace category dropdown with percentage slider for business allocation

**Implementation**:

- Expenses view: Replace `<select>` with `<input type="range" min="0" max="100">`
- Data model: Already had `businessPercent` field (default 100%)
- Display: Show split amounts (Supplies $ / Benefits $) per row
- Remove: Category filters, date filters (non-essential for allocation)
- Keep: Delete button, search/filter for finding items

**UI Structure**:

```
| Date | Description | Amount | Business % | Supplies | Benefits | Delete |
|------|-------------|--------|------------|----------|----------|--------|
| 2/10 | Coffee      | $50.00 | [===75%==] | $37.50   | $12.50   | 🗑️     |
```

**Totals Calculation**:

```javascript
totalSupplies = Σ((amount * businessPercent) / 100);
totalBenefits = Σ((amount * (100 - businessPercent)) / 100);
```

**Migration**: Storage already migrated category to businessPercent (ADR-002), defaults:

- `Business Supplies` → 100%
- `Board Member Benefits` → 0%
- `Uncategorized` → 100%

**Consequences**:

- ✅ Aligns UI with core app goal (allocation not categorization)
- ✅ Simpler UX: one slider vs dropdown + complex categorization rules
- ✅ Real-time visual feedback: see split amounts update as slider moves
- ✅ Under 100 lines: HTML ~15 lines, app.js +2 computed properties, storage migration reused
- ✅ All tests passing (17/17)
- ⚠️ No keyboard shortcuts for slider (could add arrow key increments later)
- ⚠️ No preset buttons (e.g., "75%", "50%") - slider only

### ADR-015: noUiSlider Integration for Enhanced Allocation UX

**Date**: February 23, 2026
**Status**: Approved
**Context**: Allocation interface is the core app functionality. Native HTML range input lacks visual feedback that helps users understand the allocation split at a glance.

**Decision**: Integrate noUiSlider library for enhanced slider UX

**Rationale**:

- **Visual clarity**: Colored track segments show business/benefits split instantly
- **Live tooltips**: Percentage visible while dragging (no need to look at table columns)
- **Professional polish**: Purpose-built allocation tool appearance
- **Mobile-optimized**: Better touch handling, optimized targets
- **Zero dependencies**: Standalone vanilla JS, works with Alpine.js
- **Lightweight**: 12KB minified (smaller than Alpine.js itself)
- **Accessible**: ARIA support, keyboard navigation built-in
- **Cross-browser**: Consistent styling, one API (no vendor prefixes)
- **Still under 100 lines**: Create modular `js/allocation-slider.js` component

**Implementation**:

```javascript
// js/allocation-slider.js (~80 lines)
// - Initialize noUiSlider for each expense row
// - Colored track: green (business) to blue (benefits)
// - Tooltip shows percentage while dragging
// - Integrates with Alpine.js via x-init

// index.html
// - Include noUiSlider CSS and JS from CDN
// - Replace <input type="range"> with <div> for noUiSlider
// - Use x-init to initialize sliders
```

**Dependencies Added**:

- noUiSlider 15.8.1 (via CDN, no npm build required)
- wNumb (bundled with noUiSlider, for percentage formatting)

**Consequences**:

- ✅ **Better UX for core feature**: Visual split, live feedback, professional appearance
- ✅ **Maintains constraints**: Under 100 lines, no build step (CDN), Alpine.js compatible
- ✅ **Improved accessibility**: Better than native range for screen readers
- ✅ **Mobile-first**: Optimized touch targets and gestures
- ⚠️ **External dependency**: 12KB library (justified for core feature)
- ⚠️ **Test updates**: Playwright tests need to interact with noUiSlider API
- ⚠️ **CDN dependency**: Requires internet for first load (can cache)

### ADR-016: Dual-Column Allocation Board

**Date**: February 24, 2026
**Status**: Approved
**Context**: Previous allocation interface (ADR-014, ADR-015) showed all expenses in a single table with sliders. Users had to mentally track which items were Business Supplies vs Board Member Benefits. Split items (partially allocated to both categories) were difficult to identify. Needed better visual organization to match the app's core goal: determining how Amazon orders split between business and benefits.

**Decision**: Transform allocation view into dual-column board layout - "Business Supplies" | "Board Member Benefits"

**Rationale**:

- **Mental model match**: Columns represent the two categories users care about
- **Spatial organization**: Items naturally sorted by allocation (100% left, 100% right, splits in both)
- **Visual scanning**: Easier to review "what's in Business" vs "what's in Benefits"
- **Split item visibility**: Orange border + appears in both columns when partially allocated
- **Independent scrolling**: Each column scrolls separately, headers stay fixed
- **Responsive**: Single column on mobile, dual columns on tablet+
- **Search efficiency**: Single search filters both columns simultaneously

**Implementation**:

```javascript
// js/app.js - Computed properties for each column
get businessCards() {
  return this.expenses
    .filter(e => (e.businessPercent ?? 100) > 0)  // Has business allocation
    .filter(e => matches search query)
    .sort(by date DESC);
}

get benefitsCards() {
  return this.expenses
    .filter(e => (100 - businessPercent) > 0)  // Has benefits allocation
    .filter(e => matches search query)
    .sort(by date DESC);
}

// Slider initialization detects column context
initSlider(element, expense) {
  const isBenefitsColumn = element.closest('.benefits') !== null;
  // Slider position: Business=businessPercent, Benefits=(100-businessPercent)
  const initialValue = isBenefitsColumn ? (100 - businessPercent) : businessPercent;
  // Tooltip shows actual slider value (not inverted)
}
```

**CSS Architecture**:

- Grid layout: `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`
- Sticky headers: `position: sticky; top: 0; z-index: 10`
- Independent scroll: `.cards-container { overflow-y: auto }`
- Split item indicator: Orange left border + gradient background
- Responsive breakpoints: 640px (stack), 768px (reduced spacing), 1024px (full spacing)

**UX Features**:

1. **Unified search**: Single input at top filters both columns
2. **Visible IDs**: Last 8 characters of expense ID for reference
3. **Color coding**: Orange border for split items (in both columns)
4. **Column totals**: Dollar amount for each category in header
5. **Item counts**: Dynamic count updates as search filters
6. **Lazy loading**: 50 items per page, "Load More" button

**Consequences**:

- ✅ **Improved clarity**: Visual separation of Business vs Benefits
- ✅ **Split item awareness**: Immediately see items in both columns
- ✅ **Better navigation**: Fixed headers, independent scrolling
- ✅ **Efficient search**: One input filters all expenses
- ✅ **Responsive design**: Works on mobile (stacked) and desktop (side-by-side)
- ✅ **Maintains constraints**: No new dependencies, under 100 lines per file
- ⚠️ **Duplicate rendering**: Split items render twice (acceptable for clarity)
- ⚠️ **Complexity**: More CSS for sticky headers and scroll management

**Testing**:

- 17 E2E tests passing (Playwright)
- Tests verify: dual columns visible, sticky headers, independent scrolling, search filtering, slider tooltips

### ADR-017: Payment Method Purge for Personal Expense Filtering

**Context**: Amazon order exports include purchases from multiple payment methods (cards). Some cards are personal, others are business. Users need to remove personal purchases after import to keep only business-relevant expenses.

**Decision**: Post-import purge via Settings UI. Store `paymentMethod` on each expense, display grouped summary, allow one-click removal with confirmation.

**Data Model Change**:

```javascript
Expense {
  // ... existing fields
  paymentMethod: string  // "MasterCard - 5795", "Visa - 3889", "panda01", etc.
}
```

**UI Design** (Settings section):

- List discovered payment methods with item count and total
- "Remove" button per payment method
- Confirmation dialog before deletion (destructive action)
- Also captures `Website` field as payment method for Whole Foods detection (`panda01`)

**Implementation**:

1. `amazon-parser.js`: Extract field 15 (Payment Instrument Type) and field 0 (Website)
2. `app.js`: Add `paymentMethods` computed property, `purgeByPayment()` method
3. `index.html`: Add Payment Methods section to Settings view

**Consequences**:

- ✅ Simple mental model: import everything, then remove unwanted
- ✅ Reversible by re-importing (vs blocking at import time)
- ✅ Provides visibility into payment method distribution
- ✅ Handles Whole Foods (`panda01`) and any future sources
- ⚠️ Destructive action requires clear confirmation UX
- ⚠️ Purged items cannot be recovered without re-import

### ADR-018: Collapsible Reviewed Cards

**Context**: Users need to track which expense cards have been reviewed/allocated. With thousands of items, it's hard to distinguish reviewed from unreviewed.

**Decision**: Cards collapse after allocation to indicate "reviewed" state. Collapsed cards hide allocation controls but show key info. Manual expand allows re-adjustment.

**State Model**:

```javascript
Expense {
  // ... existing fields
  reviewed: boolean  // false = expanded, true = collapsed
}
```

**Behavior**:

- New items start expanded (`reviewed: false`)
- After allocation change (slider end or preset button), card auto-collapses (`reviewed: true`)
- Expand icon allows manual re-expansion
- State persists to localStorage with expense data

**UI (Collapsed State)**:

- Header visible: description, date
- Meta row visible: ID, position, payment method
- Amount row visible: allocated $, %, total, **expand icon (▶)**
- Hidden: slider, arrow buttons, preset buttons

**UI (Expanded State)**:

- All elements visible
- Collapse icon (▼) on amount row

**Icon Placement**: Right-aligned on the amount row:

```
$34.67   100%  of $34.67   [▼]
```

**Consequences**:

- ✅ Visual distinction between reviewed/unreviewed
- ✅ Reduces visual clutter after review
- ✅ State persists across sessions
- ✅ Non-destructive: can always re-expand
- ⚠️ Adds complexity to card rendering logic

### ADR-019: Cloud Sync Architecture for GitHub Pages + Cloudflare Workers

**Date**: February 25, 2026
**Status**: Approved
**Context**: App hosted on GitHub Pages (static) needs backend for authentication and data sync. Cloudflare Workers + D1 provides edge API with SQLite database.

**Critical Architecture Constraint**: Cross-origin requests from GitHub Pages (`curtisfranks.github.io`) to Worker API (`tsv-ledger-api.chf3198.workers.dev`) cannot use cookies reliably due to browser restrictions on third-party cookies.

**Decision**: JWT-based authentication with Bearer tokens stored in localStorage

**Research Sources**:

- MDN Web Authentication API documentation
- Cloudflare Workers CORS examples
- web.dev Passkey guides
- Auth.js deployment documentation

**Authentication Flow** (Token-based, not Cookie-based):

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Pages (curtisfranks.github.io/tsv-ledger)               │
│  Static HTML/JS - Alpine.js                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Authorization: Bearer <jwt>
                           │ (NOT cookies - cross-origin friendly)
┌──────────────────────────▼──────────────────────────────────────┐
│  Cloudflare Worker (tsv-ledger-api.chf3198.workers.dev)         │
│  Routes: /auth/*, /api/expenses/*                                │
│  CORS: Access-Control-Allow-Origin: *                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ D1 SQL queries
┌──────────────────────────▼──────────────────────────────────────┐
│  Cloudflare D1 (tsv-ledger-db)                                   │
│  Tables: users, sessions, passkeys, expenses, import_history    │
└─────────────────────────────────────────────────────────────────┘
```

**Why NOT Cookies**:

- Cross-origin cookies require `SameSite=None; Secure`
- Safari ITP blocks third-party cookies entirely
- Chrome phasing out third-party cookies
- GitHub Pages cannot set custom response headers

**Why JWT Bearer Tokens**:

- Works with any CORS configuration
- No browser cookie restrictions
- Stored in localStorage (acceptable for session tokens)
- Stateless verification (can also store in D1 for revocation)

**Implementation Phases**:

| Phase                 | Scope                               | Blocker?         |
| --------------------- | ----------------------------------- | ---------------- |
| 1. Auth endpoints     | Passkey + OAuth flows, JWT issuance | None             |
| 2. Session management | Token validation, refresh, logout   | Requires Phase 1 |
| 3. Expense sync       | CRUD with user ID                   | Requires Phase 2 |

**Auth Endpoints** (Worker):

```
POST /auth/passkey/register/start   → Challenge for new passkey
POST /auth/passkey/register/finish  → Verify & store passkey
POST /auth/passkey/login/start      → Challenge for existing user
POST /auth/passkey/login/finish     → Verify & issue JWT

GET  /auth/oauth/google/start       → Redirect to Google OAuth
GET  /auth/oauth/google/callback    → Exchange code, issue JWT
GET  /auth/oauth/github/start       → Redirect to GitHub OAuth
GET  /auth/oauth/github/callback    → Exchange code, issue JWT

GET  /auth/session                  → Validate JWT, return user info
POST /auth/session/logout           → Invalidate session in D1
```

**Frontend Token Storage**:

```javascript
// After successful auth:
localStorage.setItem(
  "tsv-auth",
  JSON.stringify({
    token: "jwt.token.here",
    user: { id, email, name },
    expiresAt: timestamp,
  }),
);

// For API calls:
fetch("/api/expenses/list", {
  headers: { Authorization: `Bearer ${token}` },
});
```

**Security Considerations**:

- JWT signed with AUTH_SECRET (env variable on Worker)
- Token expiry: 7 days (stored in `sessions` table for revocation)
- Passkeys: Origin-bound, phishing-resistant
- OAuth: PKCE flow for code exchange
- HTTPS enforced by both GitHub Pages and Cloudflare

**WebAuthn/Passkey Relying Party Configuration**:

```javascript
// CRITICAL: rpId must be the GitHub Pages domain
const rpId = "curtisfranks.github.io"; // NOT the worker domain
const rpName = "TSV Ledger";
```

**Consequences**:

- ✅ Works with GitHub Pages static hosting
- ✅ No third-party cookie issues
- ✅ Passkeys provide maximum security
- ✅ OAuth provides convenience
- ✅ D1 stores user data, expenses, sessions
- ⚠️ localStorage tokens accessible to XSS (mitigate with CSP)
- ⚠️ Must configure OAuth apps on Google/GitHub consoles
- ⚠️ Passkey rpId tied to GitHub Pages domain

**OAuth Configuration Required**:

| Provider | Console URL                    | Callback URL                                                            |
| -------- | ------------------------------ | ----------------------------------------------------------------------- |
| Google   | console.cloud.google.com       | `https://tsv-ledger-api.chf3198.workers.dev/auth/oauth/google/callback` |
| GitHub   | github.com/settings/developers | `https://tsv-ledger-api.chf3198.workers.dev/auth/oauth/github/callback` |

### ADR-020: Cloudflare Pages for Branch Preview Deployments

**Date**: February 26, 2026
**Status**: Approved
**Context**: GitHub Pages only deploys from main branch, requiring merge cycles for UAT iteration. Need branch preview URLs for efficient user acceptance testing.

**Decision**: Use Cloudflare Pages alongside GitHub Pages for preview deployments

**Deployment URLs**:
| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | `https://tsv-ledger.pages.dev` | Primary public URL |
| Production (backup) | `https://chf3198.github.io/tsv-ledger` | GitHub Pages fallback |
| Branch preview | `https://<branch>.tsv-ledger.pages.dev` | UAT before merge |

**Deploy Script** (`scripts/deploy-preview.sh`):

```bash
#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
rm -rf .deploy && mkdir -p .deploy
cp -r index.html css js .deploy/
npx wrangler pages deploy .deploy --project-name tsv-ledger --branch "$BRANCH"
```

**UAT Workflow**:

```
1. Agent makes changes on feature branch
2. Agent runs: ./scripts/deploy-preview.sh
3. User gets preview URL: https://feat-xyz.tsv-ledger.pages.dev
4. User performs UAT on preview
5. If issues → Agent fixes on same branch → redeploys → repeat
6. When approved → merge to master
```

**CORS Configuration** (Worker must allow):

```javascript
const ALLOWED_ORIGINS = [
  "https://tsv-ledger.pages.dev",
  "https://chf3198.github.io",
  /\.tsv-ledger\.pages\.dev$/, // Branch previews
];
```

**Consequences**:

- ✅ Branch previews enable fast UAT iteration without merge cycles
- ✅ Free tier includes unlimited preview deployments
- ✅ Same Cloudflare account as Worker and D1
- ✅ Global CDN with edge caching
- ⚠️ Requires manual deploy script (not auto on git push)
- ⚠️ Worker CORS must allow preview domains

## Rejected Alternatives

| Rejected            | Why                                                                               |
| ------------------- | --------------------------------------------------------------------------------- |
| React/Vue           | Build step, bundle size                                                           |
| Tailwind            | Requires build                                                                    |
| Express             | Always-on server cost                                                             |
| Firebase Auth       | Heavier SDK, vendor lock-in, 3K DAU limit on free                                 |
| Clerk               | MFA requires paid plan, closed source                                             |
| Supabase Auth       | Requires Supabase infrastructure, not CloudFlare D1                               |
| Auth.js (NextAuth)  | Framework-heavy, unclear CloudFlare Workers integration, overkill for 3 providers |
| Password-based auth | Requires hashing infra, breach monitoring, reset flows                            |
