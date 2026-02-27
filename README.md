# TSV Ledger

> Expense allocation tracker for Texas Sunset Venues nonprofit

A single-page web app for importing and allocating business expenses between
**Business Supplies** and **Board Member Benefits** for tax reporting.

[![Playwright Tests](https://github.com/curtisfranks/tsv-ledger/actions/workflows/playwright.yml/badge.svg)](https://github.com/curtisfranks/tsv-ledger/actions)

## Features

| Feature               | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| **Import**            | Drag-drop Amazon Order History CSV/ZIP, Bank of America DAT |
| **Allocation**        | Slider-based percentage split (0–100%) per expense          |
| **Dual-Column Board** | Business vs Benefits columns with split items in both       |
| **OAuth**             | Google and GitHub sign-in via Cloudflare Workers            |
| **Export**            | Download categorized data as CSV                            |
| **Persistence**       | localStorage (offline) with optional cloud sync             |

## Quick Start

```bash
git clone https://github.com/curtisfranks/tsv-ledger.git
cd tsv-ledger
npm install
npm start           # http://localhost:8080
```

## Testing

```bash
npm test            # Playwright E2E tests (40 specs)
npm run lint        # File size check (≤100 lines)
npm run test:ui     # Interactive test runner
```

## Tech Stack

| Layer    | Technology      | Purpose                  |
| -------- | --------------- | ------------------------ |
| UI       | Alpine.js 15kb  | Reactive state           |
| Styling  | Pico CSS 10kb   | Classless semantics      |
| Sliders  | noUiSlider 12kb | Allocation interface     |
| Tests    | Playwright      | E2E browser testing      |
| Hosting  | CF Pages        | Static + branch previews |
| API      | CF Workers      | OAuth + sessions         |
| Database | CF D1           | SQLite (optional sync)   |

## Project Structure

```
tsv-ledger/
├── index.html          # Alpine.js SPA
├── css/
│   ├── shell.css       # App shell layout
│   └── app.css         # Component styles
├── js/
│   ├── app.js          # Alpine state machine
│   ├── amazon-parser.js# Order history parser
│   ├── boa-parser.js   # Bank statement parser
│   └── storage.js      # localStorage CRUD
├── worker/
│   └── src/            # Cloudflare Worker API
├── tests/              # Playwright specs
└── docs/
    ├── DESIGN.md       # Architecture overview
    └── adr/            # Decision records
```

## Documentation

- [DESIGN.md](docs/DESIGN.md) — Architecture and data model
- [ADRs](docs/adr/) — Architecture Decision Records
- [CHANGELOG.md](CHANGELOG.md) — Version history

## License

MIT © Texas Sunset Venues
