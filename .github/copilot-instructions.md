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

## File Size Standards

**ALL FILES MUST BE UNDER 300 LINES** - Hard requirement for AI optimization:

| File Type       | Location                      | Limit       |
| --------------- | ----------------------------- | ----------- |
| Backend JS      | `src/**/*.js`                 | < 300 lines |
| Frontend JS     | `public/js/**/*.js`           | < 300 lines |
| HTML Components | `public/components/**/*.html` | < 300 lines |
| Tests           | `tests/**/*.js`               | < 300 lines |

**If file exceeds limit**: Extract to `public/components/[feature]/` or `src/[feature]/`

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

## Code Organization

- **Documentation**: Update `CODEBASE_ARCHITECTURE.md` after structural changes
- **Naming**: Use descriptive names for Copilot optimization
- **KTS**: Update `KnowledgeTransferTest/` with patterns and lessons learned

## Boundaries

- ✅ **Always Do**: Code in `src/`, `tests/`, `docs/`; run tests; functional style; DDTRE cycle; use conventional commits; update KTS.
- ⚠️ **Ask First**: New dependencies; modify `package.json`; change schema.
- 🚫 **Never Do**: Exfiltrate secrets; modify `.gitignore`; commit without tests; shut down server unnecessarily; commit untested or undocumented changes; use `open_simple_browser` for testing; run commands that block chat (use `isBackground: true` for servers/long-running processes).

## Reorganization Goals

- Subdivide into independent feature apps (dashboard, amazon-integration, etc.)
- Functional design at module/feature levels
- Track progress in `CURRENT_STATE.md`

## Session Management & Handoff Protocol

**Optimal Session Length**: ~20-25 complex exchanges before degradation risk increases.

### Handoff Triggers (When to Execute `/handoff`)

| Trigger                        | Action                        |
| ------------------------------ | ----------------------------- |
| Completing major feature/task  | Run `/handoff` prompt         |
| ~20+ exchanges on complex work | Proactive handoff recommended |
| Switching to unrelated topic   | Start new session             |
| Slow responses / summarization | Handoff immediately           |
| End of work session            | Always run `/handoff`         |

### Handoff Execution

Use prompt: `/handoff` or ask "execute handoff protocol"

**Handoff Steps** (automated via `.github/prompts/handoff.prompt.md`):

1. Document session accomplishments
2. Capture in-progress work with context
3. Update `CURRENT_STATE.md` with session summary
4. Commit changes: `chore: session handoff - [summary]`
5. Output formatted handoff block for next agent

### New Session Start

Use prompt: `/session-start` or ask "initialize session"

**Startup Steps** (automated via `.github/prompts/session-start.prompt.md`):

1. Read `CURRENT_STATE.md` and `TODO.md`
2. Check `git status` and recent commits
3. Verify environment (server status)
4. Output session brief with priorities

### Context Preservation Files

| File               | Purpose                        | Update Frequency |
| ------------------ | ------------------------------ | ---------------- |
| `CURRENT_STATE.md` | Project status, recent changes | Every handoff    |
| `TODO.md`          | Task tracking                  | As tasks change  |
| `AGENTS.md`        | Quick reference                | Rarely           |
| Todo list tool     | In-session task tracking       | During session   |
