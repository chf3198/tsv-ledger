# tsv-ledger

<p align="center">
  <a href="https://github.com/chf3198/tsv-ledger/actions/workflows/playwright.yml"><img src="https://github.com/chf3198/tsv-ledger/actions/workflows/playwright.yml/badge.svg" alt="Tests"></a>
  <a href="https://github.com/chf3198/tsv-ledger/releases"><img src="https://img.shields.io/github/v/release/chf3198/tsv-ledger?color=00d9a5" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-PolyForm%20NC%201.0-blue.svg" alt="PolyForm Noncommercial"></a>
  <a href="https://tsv-ledger.pages.dev"><img src="https://img.shields.io/badge/demo-live-e94560" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="https://tsv-ledger.pages.dev">Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/DESIGN.md">Documentation</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

**tsv-ledger** is a browser-based expense allocation tool for sole proprietors and self-employed workers. It imports Amazon Order History (CSV/ZIP) and Bank of America statements (DAT), lets you split each transaction between Business and Personal using intuitive sliders, and exports a categorized CSV ready for tax prep or accounting software. Built with Alpine.js, Pico CSS, noUiSlider, and Cloudflare Pages/Workers/D1 — zero frontend build step.

---

## Features

| Feature | Description |
|---------|-------------|
| **Smart Import** | Drag-and-drop Amazon Order History (CSV/ZIP) and Bank of America statements (DAT). Automatic parsing and transaction categorization. |
| **Expense Allocation** | Slider-based percentage split (0–100%) per transaction. Designed for tax categorization of mixed-use business/personal items. |
| **Dual-Column Board** | Visual Business vs. Personal columns. Split items appear proportionally in both. |
| **OAuth Authentication** | Sign in with Google or GitHub via Cloudflare Workers. Optional cloud sync across devices. |
| **Local-First** | Works fully offline with localStorage. Data stays on your device by default — no account required. |
| **CSV Export** | Download categorized expenses as CSV for accounting software or tax preparation. |

---

## Quick Start

```bash
git clone https://github.com/chf3198/tsv-ledger.git
cd tsv-ledger
npm install
npm start
# Open http://localhost:8080
```

Or try the **[Live Demo](https://tsv-ledger.pages.dev)** — no installation required.

---

## Testing

```bash
npm test          # Run all 40 Playwright E2E tests
npm run lint      # Check file sizes (≤100 lines per file)
npm run test:ui   # Interactive Playwright test runner
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | Alpine.js (15 kB) | Reactive state management |
| **Styling** | Pico CSS (10 kB) | Classless semantic styling |
| **Sliders** | noUiSlider (12 kB) | Expense allocation interface |
| **Testing** | Playwright | 40 E2E browser tests |
| **Hosting** | Cloudflare Pages | Static hosting + preview deploys |
| **API** | Cloudflare Workers | OAuth + session management |
| **Database** | Cloudflare D1 | SQLite-backed optional cloud sync |

Zero frontend build step — no bundler, no transpiler. Just HTML, CSS, and JavaScript.

---

## Project Structure

```
tsv-ledger/
├── index.html           # Alpine.js SPA entry point
├── css/
│   ├── shell.css        # App shell layout
│   └── app.css          # Component styles
├── js/
│   ├── app.js           # Alpine state machine
│   ├── amazon-parser.js # Amazon Order History parser
│   ├── boa-parser.js    # Bank of America statement parser
│   ├── auth.js          # OAuth client
│   └── storage.js       # localStorage CRUD
├── worker/              # Cloudflare Worker API
│   └── src/
│       ├── index.js     # API routes
│       ├── oauth.js     # OAuth handlers
│       └── session.js   # Session management
├── tests/               # Playwright E2E specs
└── docs/
    ├── DESIGN.md        # Architecture and data model
    └── adr/             # Architecture Decision Records
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [DESIGN.md](docs/DESIGN.md) | Architecture, data model, and design decisions |
| [ADRs](docs/adr/) | Architecture Decision Records |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [SECURITY.md](SECURITY.md) | Security policy |

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

- [Report a bug](https://github.com/chf3198/tsv-ledger/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/chf3198/tsv-ledger/issues/new?template=feature_request.yml)
- [Join discussions](https://github.com/chf3198/tsv-ledger/discussions)

---

## License

**[PolyForm Noncommercial 1.0.0](LICENSE)** — free for personal, educational, and non-commercial use. Commercial use requires a paid license. See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md) or contact [curtisfranks@gmail.com](mailto:curtisfranks@gmail.com).

© 2026 Curtis Franks
