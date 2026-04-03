# Copilot Instructions

**TSV Ledger**: Minimal business expense allocation app (v3.5.0). Tax categorization for business vs. board member benefits. Alpine.js frontend + Cloudflare Workers backend.

## The Loop (execute on every task)

```
DESIGN → TEST → CODE → VERIFY → REFLECT → COMMIT → ADAPT
                          ↓
                    If fails → REVERT (ERROR_PREVENTION.md)
```

## Habits (non-negotiable)

### Before Coding

1. Read [DESIGN.md](docs/DESIGN.md) and relevant [ADRs](docs/adr/)
2. Confirm feature aligns with [ROADMAP.md](docs/ROADMAP.md)
3. Write failing E2E test (Playwright in `tests/`)
4. Confirm test fails: `npm test`

### After Coding

```bash
npm test && npm run lint   # STOP if fails - lint enforces 100-line max
```

### After Every Task

1. Log decision to [REFLECTION_LOG.md](docs/REFLECTION_LOG.md)
2. If same issue 2x → add to [ERROR_PREVENTION.md](docs/ERROR_PREVENTION.md) checklist

## Architecture Essentials

**Context-specific instructions**: See `.github/instructions/` for targeted guidance:
- `frontend.instructions.md` → Alpine.js patterns, pure functions, localStorage schema
- `backend.instructions.md` → Worker API routes, OAuth flow, D1 database
- `testing.instructions.md` → Playwright E2E patterns, test helpers, visual regression
- `documentation.instructions.md` → ADR format, reflection log, markdown standards

**Note**: VS Code Copilot automatically applies relevant `.instructions.md` files based on the file you're editing. The sections below provide high-level architecture overview.

### Three-Layer Pattern

```
Frontend (index.html, Alpine.js)
  ├─ Reads/writes: localStorage → storage.js (pure + side effects)
  ├─ Auth state: auth.js (JWT Bearer tokens, ADR-019)
  └─ Routes to: /api/* via fetch + Authorization header
         ↓
Cloudflare Worker (worker/src/)
  ├─ /auth/oauth     → Google/GitHub (ADR-009)
  ├─ /auth/session   → Session validation + JWT
  ├─ /auth/passkey   → Passkey registration/login
  └─ /expenses/*     → D1 sync (ADR-023)
         ↓
Cloudflare D1 (SQLite)
  └─ users, sessions, expenses (schema: worker/schema.sql)
```

### Storage Architecture (Critical - ADR-024)

**Default behavior: localStorage-first, no network required.**

Files: `js/storage.js` (pure functions), `js/app.js` (state management)

- **Load**: `loadExpenses()` → parses localStorage with migration logic
- **Save**: `saveExpenses(array)` → writes to localStorage directly
- **Cloud sync** (optional, ADR-023): After localStorage saves, fetch `/api/expenses/sync` with Bearer token
- **Migration**: `businessPercent` field replaces legacy `category` field; see storage.js line 28–31

**Key pattern**: Pure functions handle data transformation, side effects (localStorage access) clearly marked with `Effect:` comments.

### UI State Management (Alpine.js)

**Single source of truth**: `expenseApp()` in app.js returns the reactive state object.

Key alpine files:
- `index.html`: x-data, x-text, x-model, x-show directives
- `app.js`: State object returned by `expenseApp()` (495 lines split into sections via comments)
- `allocation-slider.js`: Wraps noUiSlider for 0–100% allocation UI (ADR-015)

**Getters** (reactive computed properties):
- `get totals()` → `{ supplies, benefits, uncategorized }`
- `get paymentMethods()` → stats for payment method cards
- `get counts()` → expense counts by category
- `get showNav()` → visibility logic during onboarding (ADR-025)

**State sections** (organized by comment blocks in app.js):
1. Core: expenses, filters, import
2. Pagination: cardPageSize, businessCardsPage, benefitsCardsPage
3. Auth (ADR-009, 021): auth.user, authenticated, showAuthModal, showUserMenu
4. Storage mode (ADR-024): storageMode, onboardingStep, onboardingComplete (ADR-025)
5. Bulk actions: showBulkApplyModal, bulkApplyMatches

### Parser Modules (Self-Contained)

- `amazon-parser.js`: ZIP/CSV → Expense[] (handles "Orders" sheets in Amazon ZIP exports)
- `boa-parser.js`: Bank of America DAT → Expense[]
- `categorizer.js`: Rule-based category guessing (heuristics, not ML)

**Pattern**: Each parser exports `parseCSV(text) → Expense[]`. Used by `import.spec.js` for validation.

### Authentication Layers (ADR-009, 019, 021)

**Frontend side** (`js/auth.js`):
- `validateSession()` → fetches `/auth/session` + stores JWT in localStorage
- `signOut()` → clears localStorage auth state
- `getAuthHeader()` → returns `{ Authorization: 'Bearer <token>' }`

**Worker side** (`worker/src/`):
- `session.js`: JWT validation, token refresh
- `oauth.js`: Google/GitHub OAuth callback processing
- `passkey.js`: Passkey registration (future; not yet integrated in UI)

**UI button visibility** (ADR-021): Check `auth.authenticated` before showing user menu. During onboarding (ADR-025), entire auth section hidden.

### Module Export Patterns

| Module Type | Export Pattern | File Example | Usage |
|-------------|----------------|--------------|-------|
| **Parser** | `export function parseCSV(text) → Expense[]` | amazon-parser.js, boa-parser.js | Direct named export |
| **Utility (Pure)** | Direct export, no side effects | storage.js:getUniqueLocations | Import or window.* |
| **Utility (Side Effects)** | Comment as `// Effect:` + export | storage.js:loadExpenses | Always document side effects |
| **Alpine Helpers** | Export on `window.*` for template access | utils.js:formatCurrency | Templates can't import ES modules |
| **Worker Modules** | Named export + re-export in index.js | worker/src/oauth.js | Enables tree-shaking |

**Why**: Consistent exports enable AI to predict module structure; Alpine template helpers must be global; side effect markers prevent unsafe refactoring.

## Constraints

- **≤100 lines per file** (no exceptions - lint enforced)
  - **Why**: Alpine state objects grow exponentially in complexity with size; low-cost AI models (Haiku, GPT-5 mini) lose context tracking after ~150 lines; files >100 lines correlate with 1.4x more test failures. Keeps cognitive load manageable for agents.

- **Test first** (no code without failing test)
  - **Why**: TDD prevents overengineering; tests document expected behavior before implementation; prevents regressions. Failing test = requirement specification.

- **Design first** (no code without ADR)
  - **Why**: ADRs capture decision context and trade-offs. Writing code first loses rationale. Future agents need "why" to make edge-case decisions correctly.

## Git Workflow (always follow without asking)

1. `git checkout -b feat/feature-name` before starting
2. Commit with conventional commit messages
3. `git checkout master && git merge feat/... --no-ff` after tests pass
4. Push to remote when appropriate
5. **Delete feature branch after merge**: `git push origin --delete feat/...`

**Never ask permission for git operations. Always use proper branching.**

### GitHub Repository Health Check

Run after releases or if GitHub shows unexpected content:

```bash
gh api repos/{owner}/{repo} --jq '{default_branch, pushed_at}'
gh api repos/{owner}/{repo}/branches --jq '.[].name'
```

**If stale content appears**: Check default branch first, not browser cache.

## User Interaction Rules

- **DO consult user**: Design decisions, UX choices, feature prioritization
- **DO prompt user**: UAT testing, acceptance verification
- **DO NOT ask user**: Git practices, code formatting, lint fixes, test execution
- **NEVER ask user to run tests**: Agent runs all automated tests (npm test, npm run lint). User only performs UAT.

## Constraints

- **≤100 lines per file** (no exceptions)
- **Test first** (no code without failing test)
- **Design first** (no code without ADR)

## Commands

```bash
npm test              # E2E tests (Playwright, ~60 tests)
npm run lint          # 100-line file check + outputs file stats
npm start             # Dev server on :8080
npm run test:headed   # E2E tests with browser visible
npm run test:ui       # Interactive test explorer
npm run test:visual   # Capture UI screenshots for regression testing
```

## Testing Patterns

**E2E First**: Write test file in `tests/` BEFORE code. Test names match features: `*.spec.js`.

**Playwright Setup** (`playwright.config.js`):
- Target: `http://localhost:3000` (dev server)
- Timeout: 30s per test
- Reporter: Default + visual snapshots

**Test Structure**:
```javascript
test('feature description', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[x-data*="expenseApp"]', 'input value');
  await expect(page.locator('.total')).toContainText('$1,234.56');
});
```

**LocalStorage Testing**: Tests reset storage between runs via `page.context().clearCookies()` + custom cleanup.

**Auth Testing** (`tests/auth-*.spec.js`): Mock JWT tokens in localStorage; never hit real OAuth endpoints in tests.

## Known Error Patterns (Check First When Debugging)

| Error | Symptom | Solution | Reference |
|-------|---------|----------|----------|
| **Alpine race condition** | Click doesn't fire handlers | Use `page.evaluate()` to set Alpine state directly | tests/helpers/auth-helpers.js:35 |
| **localStorage persistence** | Tests fail due to stale data | `clear() + reload() + waitForAlpine()` pattern | tests/auth-*.spec.js:10 |
| **Line count creep in app.js** | File approaching 500+ lines | Extract getters to separate module | Planned ADR-026 |
| **CORS preflight failures** | Fetch fails with CORS error | Check `getCorsHeaders()` whitelist + return CORS on ALL responses | worker/src/index.js:15 |
| **D1 binding unavailable** | `env.DB is undefined` | Check wrangler.toml `binding = "DB"` | worker/wrangler.toml:10 |

**If error repeats 2x**: Add to [ERROR_PREVENTION.md](docs/ERROR_PREVENTION.md) checklist.

## Visual Testing (agent self-verification)

Before asking user for UAT, capture and review screenshots:

```bash
# Capture all UI states
npm run test:visual

# Generate analysis report with screenshots
npm run test:visual:analyze

# View screenshots (start server, open preview)
cd scripts/visual-test/screenshots && python3 -m http.server 9090
# Then open http://localhost:9090/preview.html

# Run visual regression tests (Playwright)
npx playwright test tests/visual.spec.js --update-snapshots  # Create baselines
npx playwright test tests/visual.spec.js                      # Compare
```

Screenshots saved to `scripts/visual-test/screenshots/`. Review for:

- Modal positioning and visibility
- Button styling and accessibility
- Layout issues (overlapping elements)
- Mobile responsiveness

## Deployment Workflow (MANDATORY)

**Production URL**: https://tsv-ledger.pages.dev

After pushing to master, ALWAYS verify deployment against live URL:

```bash
# 1. Push to GitHub
git push origin master

# 2. Deploy to Cloudflare Pages (auto-deploy unreliable)
npx wrangler pages deploy . --project-name=tsv-ledger --branch=master

# 3. VERIFY against live production URL (not local files!)
curl -s "https://tsv-ledger.pages.dev/" | grep "<expected change>"
```

**NEVER trust local files or git status as proof of deployment.**
**ALWAYS verify the live URL before telling user to UAT.**

If verification fails:

1. Check `npx wrangler pages deployment list --project-name=tsv-ledger`
2. Re-deploy manually with wrangler command above

## Release Workflow

After merging to master with version bump:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z - Description"
git push origin master --tags
gh release create vX.Y.Z --title "vX.Y.Z - Title" --notes "Release notes..."
```

## Environment

This is a Chromebook dev environment. Agent has root/sudo access.
Install tools via CLI as needed (apt, npm, etc). Don't ask permission.

## Knowledge Location

| What                 | Where                                               |
| -------------------- | --------------------------------------------------- |
| Architecture & ADRs  | [DESIGN.md](docs/DESIGN.md)                         |
| ADR dependencies     | [docs/adr/README.md](docs/adr/README.md) (dependency matrix) |
| Detailed workflow    | [AI_AGENT_PROTOCOL.md](docs/AI_AGENT_PROTOCOL.md)   |
| Self-improvement     | [SELF_EVOLUTION.md](docs/SELF_EVOLUTION.md)         |
| Insight memory       | [REFLECTION_LOG.md](docs/REFLECTION_LOG.md)         |
| **Error prevention** | **[ERROR_PREVENTION.md](docs/ERROR_PREVENTION.md)** |
| Code style           | [STYLE.md](docs/STYLE.md)                           |
| TDD cycle            | [WORKFLOW.md](docs/WORKFLOW.md)                     |
| Context-specific rules | [.github/instructions/](/.github/instructions/) (auto-applied by VS Code) |
