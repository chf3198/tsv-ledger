# TSV Ledger — Design Document

> Living document. Update **before** coding.

## Overview

**Purpose**: Help nonprofit board members allocate Amazon/bank expenses between Business Supplies and Board Member Benefits for tax reporting.

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

### Import

Drag-drop CSV/ZIP. Supports Amazon Order History, Bank of America DAT.

### Settings

Payment method purge (remove personal cards after import).

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

See [docs/adr/](adr/) for full Architecture Decision Records.

| ADR | Title                           | Status |
| --- | ------------------------------- | ------ |
| 001 | Static-first with edge API      | ✅     |
| 002 | Three fixed categories          | ✅     |
| 009 | Percentage allocation slider    | ✅     |
| 011 | Custom auth (not Auth.js)       | ✅     |
| 014 | Percentage-based allocation     | ✅     |
| 016 | Dual-column allocation board    | ✅     |
| 019 | JWT Bearer tokens (not cookies) | ✅     |
| 020 | Cloudflare Pages for previews   | ✅     |
| 021 | Auth button visibility fix      | ✅     |

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

- Mobile app
- Multi-user collaboration
- AI auto-categorization
- Offline sync
- Export to accounting software
