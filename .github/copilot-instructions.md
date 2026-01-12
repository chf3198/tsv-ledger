---
name: tsv-ledger-agent
description: Specialized AI assistant for TSV Ledger development, focusing on modular Node.js/Express.js applications with AI analysis, Amazon integration, and componentized frontend architecture
---

# Copilot Instructions for TSV Ledger

## Rule Priority Hierarchy

When rules conflict, apply in this order (higher priority wins):

| Priority    | Source                                    | Scope                            | Example                                 |
| ----------- | ----------------------------------------- | -------------------------------- | --------------------------------------- |
| 1 (Highest) | Path-specific `.github/instructions/*.md` | Files matching `applyTo` pattern | `src.instructions.md` for `src/**/*.js` |
| 2           | This file (`copilot-instructions.md`)     | All repository files             | 300-line limit, testing requirements    |
| 3           | `AGENTS.md`                               | Session entry point              | Quick commands, workflow                |
| 4 (Lowest)  | General best practices                    | Fallback                         | Standard coding conventions             |

**Conflict Resolution**: Most specific rule wins. Path-specific instructions override general instructions.

## Overview

TSV Ledger is an advanced expense tracking platform with Amazon integration, AI analysis, Express.js backend, Bootstrap frontend, and JSON file storage. **FRONTEND COMPONENTIZATION**: HTML files are broken into reusable components under 300 lines each.

**Tech Stack**: Node.js, Express, Bootstrap 5, JSON files, Componentized HTML.

**Key Files**:

- `server.js` (main server with middleware for sidebar injection)
- `src/database.js` (JSON ops with test isolation via `TEST_DB`)
- `src/routes/` (modular API endpoints)
- `src/ai-analysis-engine.js` (AI insights using `tsv-categorizer.js`)
- `src/amazon-integration/` (ZIP extraction with `unzip` command)
- `public/components/` (reusable HTML components under 300 lines each)
- `public/js/modules/` (modular frontend JavaScript)

## Comprehensive File Size Standards

**ALL FILES MUST BE UNDER 300 LINES**:

- Backend JS files: < 300 lines
- Frontend JS files: < 300 lines
- HTML component files: < 300 lines
- Test files: < 300 lines
- Documentation: < 300 lines

**COMPONENTIZATION COMPLETED** ✅:

- ✅ geographic-analysis.html: 1010 lines → component/geographic-analysis/geographic-analysis.html (157 lines)
- ✅ navigation-e2e-test.html: 804 lines → component/navigation-e2e-test/navigation-e2e-test.html (196 lines)
- ✅ employee-benefits.html: 768 lines → component/employee-benefits/employee-benefits.html (160 lines)
- ✅ reconciliation.html: 721 lines → component/reconciliation/reconciliation.html (195 lines)
- ✅ amazon-zip-import.html: 551 lines → component/amazon-zip-import/amazon-zip-import.html (216 lines)
- ✅ subscription-analysis.html: 569 lines → component/subscription-analysis/subscription-analysis.html (204 lines)
- ✅ Existing components: data-import (219 lines), bank-reconciliation (197 lines), navigation (45-297 lines)

**REMAINING LARGE FILES** (require componentization for 99% quality rating):

- index.html: 3200 lines (partially componentized - major sections extracted)
- geographic-analysis.html: 1010 lines (component available)
- navigation-e2e-test.html: 804 lines (component available)
- employee-benefits.html: 768 lines (component available)
- reconciliation.html: 721 lines (component available)
- subscription-analysis.html: 569 lines (component available)
- amazon-zip-import.html: 551 lines (component available)

## Architecture

- **Modular Structure**: Features in `src/` subdirs, routes in `src/routes/`, components in `public/components/`
- **Data Flow**: Import (CSV via `multer` + `csv-parser`, ZIP via `amazon-zip-extractor.js`) → Database (`data/expenditures.json`) → Analysis (`ai-analysis-engine.js`) → API (`/api/*`) → Frontend (componentized HTML with injected sidebar from `src/menu.js`)
- **Frontend Components**: Large HTML files broken into `public/components/[feature]/[component].html` files under 300 lines each
- **Dependencies**: Minimal; key: `express`, `csv-parser`, `cheerio`, `multer`
- **Frontend Pattern**: Server middleware in `server.js` injects navigation into componentized HTML files using shared `src/menu.js`

## Key Components

- **Database**: JSON files; test isolation with `TEST_DB` env (uses `tests/data/test-expenditures.json`).
- **AI Analysis**: `src/ai-analysis-engine.js` for patterns/anomalies; `src/tsv-categorizer.js` for categorization.
- **Amazon Integration**: ZIP parsing in `src/amazon-integration/` (extractor, processor, parsers for orders/cart/returns); CRUD in `src/routes/amazon.js`.
- **Routes**: Under `/api` (import, data, analytics, amazon, etc.); each requires corresponding `src/` logic.
- **Frontend Components**: HTML files componentized into `public/components/` with reusable parts under 300 lines each.
- **Testing**: Jest for unit/integration, Playwright for e2e; run `npm test:all`.

## Comprehensive Testing Workflow

> **Full Details**: See [tests.instructions.md](.github/instructions/tests.instructions.md)

**Testing Stack**: Jest (unit), Supertest (integration), Playwright (E2E), ESLint (quality)

**Development Cycle**: Discuss → Design → Develop → Test → Revise → Evolve (DDTRE)

**Zero-Bug Policy**: Never commit code that fails tests or has console errors. Run `npm test` before every commit.

### Command Execution Guidelines

**CRITICAL**: Never run commands that block the chat interface.

| Command Type   | Required              | Example                                |
| -------------- | --------------------- | -------------------------------------- |
| Dev servers    | `isBackground: true`  | `npm run dev`                          |
| Server tests   | `timeout N`           | `timeout 10 node server.js`            |
| Health checks  | `curl`                | `curl -s http://localhost:3000/health` |
| Quick commands | `isBackground: false` | `ls`, `grep`, `wc -l`                  |

**🚫 NEVER**: Run `node server.js` without `isBackground: true` or use `open_simple_browser` for testing.

## Git & Version Control Best Practices

- **Conventional Commits**: Use format `<type>[scope]: <description>`. Types: feat, fix, docs, style, refactor, perf, test, chore. Example: `feat: add Amazon ZIP import functionality`.
- **Atomic Commits**: Each commit addresses one logical change; keep commits small and focused.
- **Commit Messages**: Write clear, imperative descriptions; reference issues/PRs if applicable.
- **Branching**: Use feature branches (e.g., `feature/amazon-integration`); merge via PRs with reviews.
- **GitHub Integration**: Create descriptive PR titles/descriptions; link to issues; use labels for categorization.
- **Never Commit**: Without tests passing; sensitive data; large binary files (use .gitignore).

## Comprehensive Codebase Optimization Requirements

> **Full Details**: See [frontend.instructions.md](.github/instructions/frontend.instructions.md)

**ALL FILES MUST BE UNDER 300 LINES** - Hard requirement for AI optimization:

| File Type       | Location                      | Limit       |
| --------------- | ----------------------------- | ----------- |
| Backend JS      | `src/**/*.js`                 | < 300 lines |
| Frontend JS     | `public/js/**/*.js`           | < 300 lines |
| HTML Components | `public/components/**/*.html` | < 300 lines |
| Tests           | `tests/**/*.js`               | < 300 lines |

**Componentization**: HTML > 500 lines → break into `public/components/[feature]/`

## Code Organization & Quality

- **Component Architecture**: HTML > 500 lines → componentize to < 300 lines
- **Documentation**: Maintain README.md, update CODEBASE_ARCHITECTURE.md post-changes
- **Indexing**: Use descriptive names for Copilot optimization
- **KTS Integration**: Update KnowledgeTransferTest/ with patterns and lessons

## Boundaries

- ✅ **Always Do**: Code in `src/`, `tests/`, `docs/`; run tests; functional style; DDTRE cycle; use conventional commits; update KTS.
- ⚠️ **Ask First**: New dependencies; modify `package.json`; change schema.
- 🚫 **Never Do**: Exfiltrate secrets; modify `.gitignore`; commit without tests; shut down server unnecessarily; commit untested or undocumented changes; use `open_simple_browser` for testing; run commands that block chat (use `isBackground: true` for servers/long-running processes).

## Reorganization Goals

- Subdivide into independent feature apps (dashboard, amazon-integration, etc.).
- Functional design at module/feature levels.
- Update `docs/CODEBASE_ARCHITECTURE.md` post-changes.

## Componentization Completion Summary

**✅ MAJOR HTML COMPONENTIZATION COMPLETED** - See [frontend.instructions.md](.github/instructions/frontend.instructions.md) for details. All HTML files > 500 lines have components under 300 lines in `public/components/`.
