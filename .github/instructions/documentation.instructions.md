---
name: 'Documentation Patterns'
description: 'Patterns for docs/ - ADRs, reflection log, design docs, markdown formatting'
applyTo: 'docs/**,*.md'
---

# Documentation Patterns

## Architecture Decision Records (ADRs)

**Location**: `docs/adr/{number}-{title}.md`

**Template** (docs/adr/README.md):
```markdown
# ADR-NNN: Title

**Status**: Accepted | Superseded by ADR-XXX | Deprecated
**Date**: YYYY-MM-DD
**Deciders**: @username

## Context

What is the issue we're facing in our context?

## Decision

What is the change that we're proposing/doing?

## Consequences

What becomes easier or harder after this decision?

- **Positive**: ...
- **Negative**: ...
- **Neutral**: ...
```

**Numbering**: Sequential (019, 020, 021, ...). ADRs 001–018 archived in `DESIGN-archive.md`.

**Immutability**: ADRs never edited after acceptance. Supersede with new ADR if decision changes.

### ADR Dependency Matrix

| ADR | Title | Depends On | Used By | Conflict Risk |
|-----|-------|------------|---------|---------------|
| 019 | JWT Bearer Tokens | 009 (OAuth) | 023 (Cloud Sync), Backend session.js | None |
| 020 | CF Pages Previews | 001 (Static-first) | Deployment workflow | Low |
| 021 | Auth Button Visibility | 009 (OAuth) | 025 (Onboarding), index.html | High (UI coordination) |
| 022 | Product Repositioning | None | Marketing copy, DESIGN.md | None |
| 023 | Cloud Sync Integration | 003 (localStorage-first), 019 (JWT) | storage.js, worker/expenses.js | Medium (sync conflicts) |
| 024 | Storage Mode Selection | 003, 023 | 025 (Onboarding), app.js storageMode | None |
| 025 | Onboarding Wizard | 024, 021 | index.html, app.js showNav logic | High (modifying showNav breaks onboarding) |

**How to use**: Before modifying code mentioned in "Used By" column, read "Depends On" ADRs to understand constraints.

## Reflection Log (docs/REFLECTION_LOG.md)

**Purpose**: Track decisions, insights, and adaptations over time. Used for self-improvement and error prevention.

**When to log** (mandatory after every task):
1. Log successful outcomes with "SUCCESS: {summary}"
2. Log failures with root cause analysis
3. If same issue repeats 2x, add to ERROR_PREVENTION.md

**Template**:
```markdown
### YYYY-MM-DD SUCCESS: Feature Name

**Context**: User requested X
**Outcome**: Implemented Y + Z optimizations → Result
**Insight**:
- Key learning 1
- Key learning 2

**Test Fix Details**: (if applicable)
\```javascript
// BEFORE (flaky): ...
// AFTER (reliable): ...
\```

**Adaptation**:
- ✅ Always do X going forward
- ❌ Never do Y again (causes Z)
```

**Recent Entries** (read first when working on similar feature):
- 2026-02-11: VS Code Copilot optimization (Alpine race conditions, symbol density)
- 2026-02-13: Import history + duplicate detection (Alpine function scope, test isolation)

## Design Document (docs/DESIGN.md)

**Purpose**: Living document. Update BEFORE coding (never retroactively).

**Structure**:
1. **Overview**: Purpose, target market, core UX
2. **Architecture**: Diagram (Frontend → Worker → D1)
3. **Core Principles**: Constraints (≤100 lines, pure functions, test-first)
4. **Tech Stack**: Tools + justifications
5. **Data Model**: Expense schema, totals calculation
6. **Key Screens**: Dashboard, dual-column board, import, settings
7. **Auth Flow**: OAuth callback → session creation → JWT return
8. **Decision Log**: ADR index with links
9. **Rejected Alternatives**: Why not React/Vue, Firebase, cookies
10. **File Map**: Directory structure with purpose per file

**Update frequency**: Before every feature (add ADR), never delete sections (supersede with new ADR).

## Error Prevention Checklist (docs/ERROR_PREVENTION.md)

**Purpose**: Automated safeguards to prevent repeating mistakes.

**Structure**:
1. **Core Principle**: Agent operates autonomously, client defines requirements only
2. **Automated Circuit Breakers**: Test verification, git checkpoints, iteration limits
3. **Repeat Offender Patterns**: Common errors with solutions
4. **Verification Steps**: Pre-commit checklist

**When to add**: If same error happens 2x in REFLECTION_LOG.md, add checklist item here.

**Example entries**:
1. **Alpine test race condition** → Use `page.evaluate()` to set state directly
2. **localStorage persistence** → `clear() + reload()` pattern
3. **Line count creep in app.js** → Extract getters to separate module

## Markdown Formatting Standards

**Headings**:
```markdown
# H1: Document Title (once per file)
## H2: Major Sections
### H3: Subsections
```

**Code blocks** (always specify language):
````markdown
```javascript
const foo = () => {};
```

```bash
npm test
```
````

**Links**:
- **Internal docs**: `[ADRs](docs/adr/)` (relative paths)
- **External**: `[Alpine.js](https://alpinejs.dev)` (absolute URLs)
- **File references in instructions**: `storage.js:30-34` (line ranges for context)

**Tables**:
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Value A  | Value B  |
```

**Emphasis**:
- `**Bold**` for key terms, warnings ("**MANDATORY**", "**Critical**")
- `*Italic*` for examples, soft emphasis
- `` `code` `` for inline code, file names, commands

**Lists**:
- Use `-` for unordered lists (consistent across repo)
- Use `1.`, `2.`, `3.` for ordered lists (auto-renumbering in editors)
- Nest with 2-space indentation

## Documentation Read Order (Critical Path)

**For new features**:
1. [DESIGN.md](../DESIGN.md) - Architecture overview, data model
2. [REFLECTION_LOG.md](../REFLECTION_LOG.md) - Recent entries only (last 5)
3. [ADR for feature](../adr/) - Specific decision record(s)
4. [ERROR_PREVENTION.md](../ERROR_PREVENTION.md) - Common mistakes to avoid
5. [STYLE.md](../STYLE.md) - Code formatting rules

**For debugging**:
1. [ERROR_PREVENTION.md](../ERROR_PREVENTION.md) - Known error patterns
2. [REFLECTION_LOG.md](../REFLECTION_LOG.md) - Search for similar past issues
3. [tests/helpers/](../../tests/helpers/) - Test helper implementations

**Why**: Reading in order prevents redundant exploration; prioritizes "why" (ADRs) over "how" (code).

## Common Documentation Errors

### 1. Retroactive ADR Creation
**Wrong**: Write code, then document decision in ADR
**Right**: Write ADR BEFORE coding (even if quick sketch), update after implementation
**Why**: ADRs capture decision context; writing after loses rationale

### 2. Verbose ADRs
**Wrong**: 3-page ADR with every implementation detail
**Right**: 1-page ADR with decision + trade-offs; link to detailed docs if needed
**Why**: ADRs should be scannable; implementation details belong in code comments

### 3. Stale DESIGN.md Sections
**Wrong**: Leave outdated architecture diagrams after refactor
**Right**: Update DESIGN.md immediately when architecture changes, strikethrough old sections
**Why**: Stale docs mislead AI agents; creates false assumptions

### 4. Missing "Why" in Reflection Log
**Wrong**: "Fixed bug in auth.js" (no context)
**Right**: "Fixed race condition in auth.js - Alpine handlers not bound before click event. Root cause: missing waitForAlpine(). Adaptation: Always use test helper for Alpine interactions."
**Why**: Future debugging requires context; generic entries don't enable learning

## JSDoc Patterns (Code Documentation)

**Module headers** (all .js files):
```javascript
/**
 * Module Name - Brief description
 * @module module-name
 */
```

**Function documentation** (public functions only):
```javascript
/**
 * Parse Amazon Order History CSV into Expense array
 * @param {string} csvText - Raw CSV content from Amazon export
 * @returns {Expense[]} Array of parsed expenses with businessPercent=100
 * @throws {Error} If CSV format is invalid or missing required columns
 */
function parseCSV(csvText) { ... }
```

**Why**: JSDoc increases "symbol density" for AI code navigation (150-200% improvement per REFLECTION_LOG.md:2026-02-11); enables autocomplete and type hints.
