# TSV Expenses

**Minimal business expense tracker for Texas Sunset Venues**

A single-page web app for tracking and categorizing business expenses across locations, with two primary categories:
- 🏢 **Office Supplies**
- 👥 **Employee Benefits**

## Features

- **CSV Import** - Drag & drop or file select
- **Smart Categorization** - Auto-categorizes by keywords (AI-upgradeable)
- **Location Tracking** - Filter expenses by venue location
- **Real-time Totals** - Split view for Supplies vs Benefits
- **Export** - Download filtered data as CSV
- **Local Storage** - Data persists in browser (cloud-upgradeable)

## Quick Start

```bash
# Clone and open
git clone https://github.com/your-username/tsv-ledger.git
cd tsv-ledger
git checkout feat/minimal-spa

# Install and run
npm install
npm start

# Open http://localhost:8080
```

## Testing

```bash
npm test              # Run Playwright E2E tests
npm run test:headed   # Run with browser visible
npm run test:ui       # Interactive test UI
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI** | Alpine.js (3kb) | Reactive without build step |
| **CSS** | Pico CSS | Beautiful, classless, semantic |
| **Storage** | localStorage | Zero-config, upgradeable to D1 |
| **Tests** | Playwright | Reliable, fast, CI-ready |

## Project Structure

```
tsv-expenses/
├── index.html          # Single page app (170 lines)
├── app.js              # Alpine.js logic (250 lines)
├── tests/
│   └── e2e.spec.js     # Playwright tests (150 lines)
├── playwright.config.js
└── package.json
```

**Total: ~570 lines of code**

## Roadmap (Optional Upgrades)

- [ ] **CloudFlare Workers** - Serverless API for multi-device sync
- [ ] **CloudFlare D1** - SQLite database for persistence
- [ ] **OpenRouter AI** - Smart categorization using free LLMs
- [ ] **GitHub Pages** - Free static hosting

## License

MIT
