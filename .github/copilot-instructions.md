---
name: tsv-ledger-agent
description: Specialized AI assistant for TSV Ledger development, focusing on modular Node.js/Express.js applications with AI analysis, Amazon integration, and componentized frontend architecture
---

# Copilot Instructions for TSV Ledger

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

## Comprehensive Testing Workflow - 100% Error-Free Development

**MANDATORY REQUIREMENT**: Every code change, feature addition, or bug fix MUST undergo complete testing before being considered complete. The app must be 100% functional with zero errors, bugs, or regressions.

**AI AGENT RESPONSIBILITY**: The AI agent is responsible for all phases and types of testing including unit tests, integration tests, E2E tests, API tests, performance tests, accessibility tests, visual tests, and UX testing. The AI agent must perform comprehensive testing using automated tools and cannot delegate testing responsibilities to users.

### Testing Stack & Tools

**Unit Testing**: Jest (existing) - 90%+ coverage required
**Integration Testing**: Supertest + Jest (add to stack)
**E2E Testing**: Playwright (existing) - All user workflows tested
**API Testing**: Newman (Postman CLI) + Supertest
**Visual Regression**: Playwright screenshots + Chromatic
**Performance Testing**: Artillery
**Accessibility Testing**: axe-playwright
**Code Quality**: ESLint + Prettier (existing ESLint)
**Coverage Reporting**: Jest + Codecov
**CI/CD**: GitHub Actions for automated testing pipeline

### Development Testing Cycle (DDTRE with 100% Testing)

**Discuss** → **Design** → **Develop** → **Test** → **Revise** → **Evolve**

1. **Pre-Development Testing**: Run full test suite to establish baseline
2. **During Development**: Run relevant unit tests continuously
3. **Post-Development Testing**: Complete testing pipeline before commit
4. **Integration Testing**: All components work together without errors
5. **E2E Testing**: Full user workflows function correctly
6. **Performance/Accessibility**: No regressions in speed or usability
7. **Visual Testing**: UI appears correctly across external browsers (Chrome, Firefox, Safari, Edge)
8. **API Testing**: All endpoints return correct data without errors

### Testing Requirements by Component

**Backend (src/)**:

- Unit tests for all functions (90%+ coverage)
- Integration tests for API routes
- Error handling tests for edge cases
- Database operation tests

**Frontend (public/)**:

- Component rendering tests
- User interaction tests
- Form validation tests
- Error state handling tests

**API Endpoints (/api/\*)**:

- Response format validation
- Error status codes
- Data integrity checks
- Performance benchmarks

### Zero-Bug Policy

**NEVER COMMIT** code that:

- Fails any test in the pipeline
- Has console errors in external browser dev tools
- Breaks existing functionality
- Has accessibility violations
- Performs below performance thresholds
- Has visual regressions

**ALWAYS VERIFY**:

- All tests pass: `npm run test:all`
- No console errors in external browser dev tools
- All user workflows complete successfully
- API responses are valid and timely
- Visual appearance matches design
- Accessibility standards met

### Testing Commands

```bash
# Full test suite (mandatory before any commit)
npm run test:all

# Individual test categories
npm run test:unit          # Unit tests with coverage
npm run test:integration   # API integration tests
npm run test:e2e           # End-to-end user workflows
npm run test:performance   # Performance benchmarks
npm run test:accessibility # Accessibility compliance
npm run test:visual        # Visual regression tests

# Code quality
npm run lint               # ESLint code quality
npm run format             # Prettier code formatting

# Coverage reporting
npm run test:coverage      # Combined coverage report
```

### Command Execution Guidelines

**CRITICAL**: Never run commands that block the chat interface. All server processes and long-running commands MUST use `isBackground: true`.

**🚫 NEVER DO:**
- Run `node server.js` without `isBackground: true` or timeout
- Pipe indefinite server output to `head`, `tail`, or `grep` without timeout
- Execute commands that run indefinitely without proper background handling

**✅ ALWAYS DO:**
- Use `timeout N` for testing server startup (e.g., `timeout 10 node server.js`)
- Use `isBackground: true` for development servers and long-running processes
- Use `curl` to health endpoints for non-blocking server readiness checks

**Server Management**:
- Start development server with `isBackground: true`
- Use `pkill` or similar to stop background processes before restarting
- Test API endpoints with `curl` after confirming server is running
- Never run `node server.js` without `isBackground: true` unless for quick syntax checks

**Background Process Checklist**:
- [ ] Development servers: `isBackground: true`
- [ ] Watch tasks: `isBackground: true`
- [ ] Long-running tests: `isBackground: true`
- [ ] Build processes: `isBackground: true`
- [ ] Quick commands (ls, grep, etc.): `isBackground: false`

**Server Testing Patterns**:
- [ ] Testing server startup? → Use `timeout 10 node server.js`
- [ ] Checking server health? → Use `curl -s http://localhost:3000/health`
- [ ] Starting development server? → Use `isBackground: true`

### Browser Testing Requirements

**CRITICAL**: All UX and visual testing MUST be performed in external browsers (Chrome, Firefox, Safari, Edge), NOT VS Code's Simple Browser. The Simple Browser has known compatibility issues and does not accurately represent the user experience.

**🚫 NEVER USE** `open_simple_browser` tool for testing - it violates testing standards and produces unreliable results.

**Browser Testing Checklist**:
- [ ] Open app in external browser at `http://localhost:3000`
- [ ] Check browser console for JavaScript errors
- [ ] Verify UI renders correctly across different browsers
- [ ] Test all user workflows end-to-end
- [ ] Validate responsive design on mobile/desktop
- [ ] Confirm accessibility features work properly

### CI/CD Pipeline Requirements

**GitHub Actions** must run on every PR and push:

- All tests pass
- Coverage meets thresholds (90%+)
- No linting errors
- Performance within limits
- Accessibility compliant
- Visual tests pass

### Error Prevention Measures

1. **TypeScript Migration**: Gradually migrate to TypeScript for compile-time error prevention
2. **Mutation Testing**: Use Stryker to ensure tests catch real bugs
3. **Runtime Monitoring**: Implement error tracking (Sentry) for production issues
4. **Code Reviews**: Require testing evidence in PR descriptions
5. **Automated Fixes**: Use ESLint --fix and Prettier for consistent code

### Testing Evidence Requirements

**PR Template** must include:

- [ ] All tests pass locally
- [ ] Coverage report attached
- [ ] Screenshots/videos of functionality
- [ ] Performance benchmarks
- [ ] Accessibility audit results
- [ ] Manual testing checklist completed

**NEVER MERGE** without complete testing evidence.

## Git & Version Control Best Practices

- **Conventional Commits**: Use format `<type>[scope]: <description>`. Types: feat, fix, docs, style, refactor, perf, test, chore. Example: `feat: add Amazon ZIP import functionality`.
- **Atomic Commits**: Each commit addresses one logical change; keep commits small and focused.
- **Commit Messages**: Write clear, imperative descriptions; reference issues/PRs if applicable.
- **Branching**: Use feature branches (e.g., `feature/amazon-integration`); merge via PRs with reviews.
- **GitHub Integration**: Create descriptive PR titles/descriptions; link to issues; use labels for categorization.
- **Never Commit**: Without tests passing; sensitive data; large binary files (use .gitignore).

## Comprehensive Codebase Optimization Requirements

### File Size Analysis (99% Quality Rating Target)

**ALL FILES MUST BE UNDER 300 LINES** - This is a hard requirement for AI optimization and maintainability:

- **Backend JS Files**: `src/**/*.js` < 300 lines each
- **Frontend JS Files**: `public/js/**/*.js` < 300 lines each
- **HTML Component Files**: `public/components/**/*.html` < 300 lines each
- **Test Files**: `tests/**/*.js` < 300 lines each
- **Documentation**: `docs/**/*.md` < 300 lines each

### Componentization Strategy

**HTML FILES > 500 LINES MUST BE COMPONENTIZED**:

- Break into `public/components/[feature]/[component].html` files
- Each component < 300 lines with single responsibility
- Use server-side includes or JavaScript imports for composition

**JAVASCRIPT FILES > 300 LINES MUST BE MODULARIZED**:

- Break into `public/js/modules/[feature]/[module].js` files
- Each module < 300 lines with focused functionality
- Use ES6 imports/exports for composition

### Quality Metrics Tracking

- **Functional Programming**: Pure functions, immutability patterns
- **Modular Architecture**: Feature-based directory structure
- **File Size Compliance**: Zero violations of 300-line limit
- **AI Optimization**: Copilot-indexable with clear naming
- **Test Coverage**: Comprehensive test suites
- **Documentation**: JSDoc comments throughout
- **Version Control**: Conventional commits maintained
- **Suggestions**: Ensure functional style; review for security.
- **Queries**: Use #codebase in Copilot Chat for repo-wide searches.
- **Self-Evolution**: Update KTS post-changes; use these instructions iteratively; document lessons in KnowledgeTransferTest/.
- **Tools**: Anima for Figma-to-Bootstrap.
- **Server Usage**: Keep the development server running for user access outside of development cycles; only restart when code changes require it (e.g., after modifying `server.js` or routes).

## Code Organization & Quality Assurance

- **Component Architecture**: HTML files > 500 lines must be componentized into `public/components/[feature]/[component].html` files < 300 lines.
- **Frontend Modularization**: Large JS files in `public/js/` must be broken into `public/js/modules/` with focused responsibilities.
- **File Organization**: Group related functions in modules; use index.js for exports if needed.
- **Documentation**: Maintain README.md, API docs; update CODEBASE_ARCHITECTURE.md post-structural changes.
- **Indexing**: Ensure code is Copilot-indexable; use descriptive names and comments for better AI suggestions.
- **Code Reviews**: Self-review for adherence to standards; run lints/tests before commits.
- **KTS Integration**: After changes, update KnowledgeTransferTest/ with new patterns, lessons, or improvements.

## Boundaries

- ✅ **Always Do**: Code in `src/`, `tests/`, `docs/`; run tests; functional style; DDTRE cycle; use conventional commits; update KTS.
- ⚠️ **Ask First**: New dependencies; modify `package.json`; change schema.
- 🚫 **Never Do**: Exfiltrate secrets; modify `.gitignore`; commit without tests; shut down server unnecessarily; commit untested or undocumented changes; use `open_simple_browser` for testing; run commands that block chat (use `isBackground: true` for servers/long-running processes).

## Reorganization Goals

- Subdivide into independent feature apps (dashboard, amazon-integration, etc.).
- Functional design at module/feature levels.
- Update `docs/CODEBASE_ARCHITECTURE.md` post-changes.

## Componentization Completion Summary

**✅ MAJOR HTML COMPONENTIZATION COMPLETED** - All HTML files exceeding 500 lines have been successfully broken down into focused, reusable components under 300 lines each:

- **geographic-analysis.html** (1010 lines) → `public/components/geographic-analysis/geographic-analysis.html` (157 lines)
- **navigation-e2e-test.html** (804 lines) → `public/components/navigation-e2e-test/navigation-e2e-test.html` (196 lines)
- **employee-benefits.html** (768 lines) → `public/components/employee-benefits/employee-benefits.html` (160 lines)
- **reconciliation.html** (721 lines) → `public/components/reconciliation/reconciliation.html` (195 lines)
- **amazon-zip-import.html** (551 lines) → `public/components/amazon-zip-import/amazon-zip-import.html` (216 lines)
- **subscription-analysis.html** (569 lines) → `public/components/subscription-analysis/subscription-analysis.html` (204 lines)

**IMPACT**: Repository now achieves significantly improved AI optimization and maintainability. All component files meet the 300-line limit requirement, enabling better Copilot understanding, easier maintenance, and enhanced development workflow. Core functionality verified with passing unit tests.
