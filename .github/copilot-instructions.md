# Copilot Instructions

## The Loop (execute on every task)

```
DESIGN → TEST → CODE → VERIFY → REFLECT → COMMIT → ADAPT
                          ↓
                    If fails → REVERT (ERROR_PREVENTION.md)
```

## Habits (non-negotiable)

### Before Coding

1. Read DESIGN.md
2. Update DESIGN.md with ADR
3. Write failing E2E test
4. Confirm test fails

### After Coding

```bash
npm test && npm run lint   # STOP if fails
```

### After Every Task

1. Log to REFLECTION_LOG.md
2. If same issue 2x → add checklist item

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
npm test          # E2E tests
npm run lint      # 100-line check
gh release create # GitHub releases (installed)
```

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
| Detailed workflow    | [AI_AGENT_PROTOCOL.md](docs/AI_AGENT_PROTOCOL.md)   |
| Self-improvement     | [SELF_EVOLUTION.md](docs/SELF_EVOLUTION.md)         |
| Insight memory       | [REFLECTION_LOG.md](docs/REFLECTION_LOG.md)         |
| **Error prevention** | **[ERROR_PREVENTION.md](docs/ERROR_PREVENTION.md)** |
| Code style           | [STYLE.md](docs/STYLE.md)                           |
| TDD cycle            | [WORKFLOW.md](docs/WORKFLOW.md)                     |
