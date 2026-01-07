# AGENTS.md - TSV Ledger

## Project Summary

TSV Ledger is an expense tracking platform for Texas Sunset Venues with Amazon integration, AI-powered categorization, and Bootstrap 5 frontend. Uses JSON file storage (no database server).

**Version**: 2.2.3 | **Runtime**: Node.js 18+ | **Port**: 3000

## Validated Commands (January 2026)

| Command | Status | Time | Notes |
|---------|--------|------|-------|
| `npm install` | ⚠️ May fail | 30s | ChromeOS symlink issues - use `--no-bin-links` if needed |
| `npm run dev` | ✅ Works | 2s | Starts server with nodemon on port 3000 |
| `npm start` | ✅ Works | 1s | Production server start |
| `npm test` | ✅ Works | 15s | Runs Jest unit tests |
| `npm run test:e2e` | ✅ Works | 60s | Playwright E2E tests (requires server running) |
| `npm run lint` | ⚠️ Config needed | 5s | Requires `eslint.config.js` (ESLint v9 flat config) |

### Server Must Be Running For:
- E2E tests (`npm run test:e2e`)
- API endpoint testing
- Browser testing at `http://localhost:3000`

### Background Process Warning:
**ALWAYS** use `isBackground: true` when starting `npm run dev` or `node server.js` to avoid blocking the terminal.

## Project Layout

```
tsv-ledger/
├── server.js              # Main Express server - ALL routes registered here
├── src/
│   ├── database.js        # JSON file CRUD operations
│   ├── tsv-categorizer.js # AI categorization engine
│   ├── ai-analysis-engine.js
│   ├── routes/            # API route handlers
│   │   ├── amazon.js      # /api/amazon/* endpoints
│   │   ├── import.js      # /api/import/* endpoints
│   │   └── ...
│   └── amazon-integration/
│       ├── amazon-zip-extractor.js  # ZIP file processing
│       └── parsers/       # Order, cart, returns parsers
├── public/
│   ├── index.html         # Main frontend (3200 lines - being componentized)
│   ├── js/
│   │   └── app.js         # Main client-side JS
│   └── components/        # Reusable HTML components
├── tests/
│   ├── unit/              # Jest unit tests
│   ├── integration/       # API integration tests
│   └── e2e/               # Playwright E2E tests
├── data/
│   └── expenditures.json  # Main data store
└── .github/
    └── copilot-instructions.md  # Detailed AI instructions
```

## Critical Files to Know

| File | Purpose | When to Modify |
|------|---------|----------------|
| `server.js` | Route registration, middleware | Adding new API routes |
| `src/database.js` | All data operations | Changing data storage |
| `src/routes/*.js` | API endpoint handlers | Adding/modifying endpoints |
| `src/tsv-categorizer.js` | Business categorization | Changing expense categories |
| `public/index.html` | Main UI | Frontend changes |
| `data/expenditures.json` | All expense data | Never edit directly |

## DO This / DON'T Do That

### ✅ DO:
- Run `npm test` before committing any changes
- Use `isBackground: true` when starting server in terminal
- Create tests for new functionality in `tests/` directory
- Keep files under 300 lines - componentize if larger
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Check `data/expenditures.json` exists before running tests

### ❌ DON'T:
- Run `node server.js` without `isBackground: true` (blocks terminal)
- Edit `data/expenditures.json` directly (use API endpoints)
- Add routes directly to `server.js` (create in `src/routes/`)
- Skip testing - run `npm test` after every change
- Use `open_simple_browser` for UX testing (use external browser)
- Commit without running linter if available

## Adding New Features

### New API Endpoint:
1. Create `src/routes/new-feature.js`
2. Register in `server.js`: `app.use('/api/new-feature', require('./src/routes/new-feature'))`
3. Add tests in `tests/integration/new-feature.test.js`
4. Run `npm test` to verify

### New Frontend Component:
1. Create in `public/components/[feature]/`
2. Keep under 300 lines
3. Include in parent HTML via server-side injection or JS import

## Test Database

For testing, set `TEST_DB=true` environment variable:
- Uses `tests/data/test-expenditures.json` instead of production data
- Automatically isolated - no risk to real data

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `EACCES` on npm install | ChromeOS filesystem | Use `npm install --no-bin-links` |
| Tests fail with "no data" | Missing test fixtures | Copy sample to `tests/data/` |
| Server won't start | Port 3000 in use | `pkill -f "node server"` then retry |
| ESLint errors | Old config format | Ensure `eslint.config.js` exists (v9 flat config) |

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 3000 |
| `TEST_DB` | Use test database | false |
| `NODE_ENV` | Environment mode | development |

## For More Details

See `.github/copilot-instructions.md` for comprehensive development guidelines including:
- Complete testing workflow (DDTRE cycle)
- File size standards and componentization
- Git workflow and conventional commits
- Browser testing requirements
