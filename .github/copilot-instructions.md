---
name: tsv-ledger-agent
description: Specialized AI assistant for TSV Ledger development, focusing on modular Node.js/Express.js applications with AI analysis and Amazon integration
---

# Copilot Instructions for TSV Ledger

## Overview
TSV Ledger is an advanced expense tracking platform with Amazon integration, AI analysis, Express.js backend, Bootstrap frontend, and JSON file storage.

**Tech Stack**: Node.js, Express, Bootstrap 5, JSON files.

**Key Files**: `server.js` (main server with middleware for sidebar injection), `src/database.js` (JSON ops with test isolation via `TEST_DB`), `src/routes/` (modular API endpoints), `src/ai-analysis-engine.js` (AI insights using `tsv-categorizer.js`), `src/amazon-integration/` (ZIP extraction with `unzip` command).

## Coding Standards
- Functional programming: Pure functions, immutability. Example: `const processExpenditures = (data) => data.filter(e => e.amount > 0).map(e => ({ ...e, processed: true }));`
- Naming: camelCase for variables/functions (e.g., `getAllExpenditures`), kebab-case for files (e.g., `amazon-zip-extractor.js`).
- Files under 300 lines for AI context.
- JSDoc comments on functions.
- Error handling: Try-catch with meaningful messages, graceful degradation.

## Architecture
- **Modular Structure**: Features in `src/` subdirs, routes in `src/routes/`.
- **Data Flow**: Import (CSV via `multer` + `csv-parser`, ZIP via `amazon-zip-extractor.js`) → Database (`data/expenditures.json`) → Analysis (`ai-analysis-engine.js`) → API (`/api/*`) → Frontend (static HTML with injected sidebar from `src/menu.js`).
- **Dependencies**: Minimal; key: `express`, `csv-parser`, `cheerio`, `multer`.
- **Frontend Pattern**: Server middleware in `server.js` injects navigation into `.html` files using shared `src/menu.js`.

## Key Components
- **Database**: JSON files; test isolation with `TEST_DB` env (uses `tests/data/test-expenditures.json`).
- **AI Analysis**: `src/ai-analysis-engine.js` for patterns/anomalies; `src/tsv-categorizer.js` for categorization.
- **Amazon Integration**: ZIP parsing in `src/amazon-integration/` (extractor, processor, parsers for orders/cart/returns); CRUD in `src/routes/amazon.js`.
- **Routes**: Under `/api` (import, data, analytics, amazon, etc.); each requires corresponding `src/` logic.
- **Testing**: Jest for unit/integration, Playwright for e2e; run `npm test:all`.

## Developer Workflows
- **Development**: `npm run dev` (nodemon).
- **Testing**: `npm test` (unit+integration+e2e), `npm run test:e2e` (Playwright), `npm run test-backend` (scripts/smart-test.sh).
- **Server Mgmt**: `npm run server-start/stop/status`.
- **DDTRE Cycle**: Discuss → Design → Develop → Test → Revise → Evolve (use KTS for self-improvement).

## Git & Version Control Best Practices
- **Conventional Commits**: Use format `<type>[scope]: <description>`. Types: feat, fix, docs, style, refactor, perf, test, chore. Example: `feat: add Amazon ZIP import functionality`.
- **Atomic Commits**: Each commit addresses one logical change; keep commits small and focused.
- **Commit Messages**: Write clear, imperative descriptions; reference issues/PRs if applicable.
- **Branching**: Use feature branches (e.g., `feature/amazon-integration`); merge via PRs with reviews.
- **GitHub Integration**: Create descriptive PR titles/descriptions; link to issues; use labels for categorization.
- **Never Commit**: Without tests passing; sensitive data; large binary files (use .gitignore).

## AI-Specific Guidelines
- **Context**: Open files like `src/database.js` for data ops, `src/routes/amazon.js` for Amazon.
- **Suggestions**: Ensure functional style; review for security.
- **Queries**: Use #codebase in Copilot Chat for repo-wide searches.
- **Self-Evolution**: Update KTS post-changes; use these instructions iteratively; document lessons in KnowledgeTransferTest/.
- **Tools**: Anima for Figma-to-Bootstrap.
- **Server Usage**: Keep the development server running for user access outside of development cycles; only restart when code changes require it (e.g., after modifying `server.js` or routes).

## Code Organization & Quality Assurance
- **File Organization**: Group related functions in modules; use index.js for exports if needed.
- **Documentation**: Maintain README.md, API docs; update CODEBASE_ARCHITECTURE.md post-structural changes.
- **Indexing**: Ensure code is Copilot-indexable; use descriptive names and comments for better AI suggestions.
- **Code Reviews**: Self-review for adherence to standards; run lints/tests before commits.
- **KTS Integration**: After changes, update KnowledgeTransferTest/ with new patterns, lessons, or improvements.

## Boundaries
- ✅ **Always Do**: Code in `src/`, `tests/`, `docs/`; run tests; functional style; DDTRE cycle; use conventional commits; update KTS.
- ⚠️ **Ask First**: New dependencies; modify `package.json`; change schema.
- 🚫 **Never Do**: Exfiltrate secrets; modify `.gitignore`; commit without tests; shut down server unnecessarily; commit untested or undocumented changes.

## Reorganization Goals
- Subdivide into independent feature apps (dashboard, amazon-integration, etc.).
- Functional design at module/feature levels.
- Update `docs/CODEBASE_ARCHITECTURE.md` post-changes.
