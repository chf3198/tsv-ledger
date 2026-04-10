# TSV Ledger — Design Document

> Living document. Update **before** coding.

## Overview

**Purpose**: Amazon Expense Allocation for Tax Prep — help accountants (including business owners acting as their own accountant) allocate Amazon/bank expenses between Business Supplies and Board Member Benefits for tax reporting.

**Target Market**: For-profit C Corporations, S Corporations, LLCs (nonprofit on roadmap)

**Core UX**: Import → Allocate (slider) → Export totals

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Cloudflare Pages (tsv-ledger.pages.dev)        │
│  Static: index.html, css/*, js/*                │
└─────────────────────┬───────────────────────────┘
                      │ fetch + Bearer token
┌─────────────────────▼───────────────────────────┐
│  Cloudflare Worker (tsv-ledger-api)             │
│  /auth/*  OAuth, sessions                       │
└─────────────────────┬───────────────────────────┘
                      │ D1 SQL
┌─────────────────────▼───────────────────────────┐
│  Cloudflare D1 (SQLite)                         │
│  users, accounts, sessions, expenses            │
└─────────────────────────────────────────────────┘
```

## Core Principles

| Principle      | Constraint                   |
| -------------- | ---------------------------- |
| Small files    | ≤100 lines (lint enforced)   |
| Pure functions | Side effects at edges        |
| Test first     | No code without failing test |
| Minimal deps   | Justify in ADR               |

## Tech Stack

| Tool       | Purpose    | Size |
| ---------- | ---------- | ---- |
| Alpine.js  | Reactivity | 15kb |
| Pico CSS   | Styling    | 10kb |
| noUiSlider | Allocation | 12kb |
| Playwright | E2E tests  | —    |
| CF Pages   | Hosting    | Free |
| CF Workers | API        | Free |
| CF D1      | Database   | Free |

## Data Model

```javascript
Expense {
  id: string,              // "amazon-{orderID}-{idx}"
  date: string,            // ISO 8601
  description: string,
  amount: number,          // dollars
  businessPercent: number, // 0-100, default 100
  benefitSubcategory: string, // Taxable Compensation | De Minimis Benefits | Working Condition Fringe | IRC §119 Meals/Lodging | Requires Review
  paymentMethod: string,
  reviewed: boolean
}
```

**Totals**:

- Business = Σ(amount × businessPercent / 100)
- Benefits = Σ(amount × (100 - businessPercent) / 100)

## Key Screens

### Dashboard

Two summary cards: Business Supplies total, Board Member Benefits total.

### Expenses (Dual-Column Board)

```
┌─────────────────────┬─────────────────────┐
│ 🏢 Business Supplies│ 👥 Board Benefits   │
│ $1,234.56 (42)      │ $567.89 (18)        │
├─────────────────────┼─────────────────────┤
│ ┌─────────────────┐ │ ┌─────────────────┐ │
│ │ Coffee beans    │ │ │ Gift cards      │ │
│ │ $50 ○──●───○ 75%│ │ │ $100 ○───●──○ 0%│ │
│ └─────────────────┘ │ └─────────────────┘ │
└─────────────────────┴─────────────────────┘
```

Split items (1-99%) appear in **both** columns with orange border.

Benefits cards now include a fringe benefit subcategory selector with default `Requires Review` when any benefits allocation exists.

### Import

Drag-drop CSV/ZIP. Supports Amazon Order History, Bank of America DAT.

### Settings

Payment method purge (remove personal cards after import).

Retention/deletion controls:
- `Clear All` permanently deletes all expenses and import history from local storage.
- Local identity sign-out supports `Delete Local Data` for shared-device cleanup.

Export naming:
- CSV downloads use `tsv-ledger-export-YYYYMMDD-(local|cloud).csv`.
- Filenames intentionally exclude user names, account identifiers, and source filename metadata.
- CSV exports include a `BenefitSubcategory` column for tax-meaningful benefit classification.

## Auth Flow

```
User clicks "Sign In"
    ↓
Modal: Google | GitHub | Passkey
    ↓
OAuth redirect → Provider → Callback
    ↓
Worker creates session, returns token
    ↓
Frontend stores in localStorage
    ↓
Header shows: [avatar] User Name ▼
```

**UI States**:

- Signed out: `Sign In` text (white on blue header)
- Signed in: Avatar (24px circle) + name + dropdown menu

## Decision Log

See [ADR index](adr/README.md) for full Architecture Decision Records.

| ADR                                         | Title                        | Version |
| ------------------------------------------- | ---------------------------- | ------- |
| 001                                         | Static-first with edge API   | 1.0.0   |
| 002                                         | Three fixed categories       | 1.0.0   |
| 003                                         | localStorage before backend  | 1.0.0   |
| 009                                         | Multi-provider OAuth         | 2.0.0   |
| 011                                         | Custom auth (not Auth.js)    | 2.0.0   |
| 013                                         | Duplicate detection          | 2.1.0   |
| 014                                         | Percentage-based allocation  | 3.0.0   |
| 015                                         | noUiSlider integration       | 3.0.0   |
| 016                                         | Dual-column allocation board | 3.1.0   |
| 017                                         | Payment method purge         | 3.1.0   |
| [019](adr/019-jwt-bearer-tokens.md)         | JWT Bearer tokens            | 3.1.0   |
| [020](adr/020-cloudflare-pages-previews.md) | CF Pages previews            | 3.1.0   |
| [021](adr/021-auth-button-visibility.md)    | Auth button visibility       | 3.1.0   |
| [022](adr/022-product-repositioning.md)     | Product repositioning        | 3.3.0   |
| [023](adr/023-cloud-sync-integration.md)    | Cloud sync integration       | 3.5.0   |
| [024](adr/024-storage-mode-selection.md)    | Storage mode selection       | 3.5.0   |
| [025](adr/025-onboarding-wizard.md)         | Onboarding wizard            | 3.6.0   |
| [026](adr/026-disclaimer-visibility-and-export-attribution.md) | Disclaimer visibility/export attribution | 3.6.1   |
| [027](adr/027-validation-gate-stabilization.md) | Validation gate stabilization | 3.6.1   |
| [028](adr/028-cloud-intent-data-authority-hotfix.md) | Cloud-intent data authority hotfix | 3.6.2   |
| [029](adr/029-explicit-state-model.md) | Explicit storage-intent/session-state/data-authority model | 3.6.3   |
| [030](adr/030-local-identity-and-local-sign-out.md) | Local identity, local sign-out, and encrypted vault decision | 3.6.4   |

> ADRs 001–018 archived in [DESIGN-archive.md](DESIGN-archive.md)

## Rejected Alternatives

| Rejected         | Reason                    |
| ---------------- | ------------------------- |
| React/Vue        | Build step, bundle size   |
| Firebase Auth    | Vendor lock-in, limits    |
| Auth.js          | Too heavy for 2 providers |
| Cookies for auth | Cross-origin issues       |

## File Map

```
index.html          Main app (Alpine.js)
css/
  shell.css         App shell layout
  app.css           Component styles
js/
  app.js            Alpine app state
  amazon-parser.js  CSV parsing
  boa-parser.js     Bank DAT parsing
  storage.js        localStorage CRUD
worker/
  src/index.js      API router
  src/oauth.js      Google/GitHub OAuth
  src/helpers.js    Auth utilities
tests/
  auth-*.spec.js    Auth button tests
  allocation.spec.js Slider tests
```

## Non-Goals (v1)

See [ROADMAP.md](ROADMAP.md) for future phases.

Current v1 scope intentionally excludes:

- Mobile native app (web-first)
- Multi-user collaboration (local-first)
- AI auto-categorization (planned Phase 3)
- Offline sync (PWA planned)
- Accounting software integration (planned Phase 2)
- Export to accounting software
