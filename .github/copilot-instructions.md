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

## Constraints
- **≤100 lines per file** (no exceptions)
- **Test first** (no code without failing test)
- **Design first** (no code without ADR)

## Commands
```bash
npm test          # E2E tests
npm run lint      # 100-line check
```

## Knowledge Location
| What | Where |
|------|-------|
| Architecture & ADRs | [DESIGN.md](docs/DESIGN.md) |
| Detailed workflow | [AI_AGENT_PROTOCOL.md](docs/AI_AGENT_PROTOCOL.md) |
| Self-improvement | [SELF_EVOLUTION.md](docs/SELF_EVOLUTION.md) |
| Insight memory | [REFLECTION_LOG.md](docs/REFLECTION_LOG.md) |
| **Error prevention** | **[ERROR_PREVENTION.md](docs/ERROR_PREVENTION.md)** |
| Code style | [STYLE.md](docs/STYLE.md) |
| TDD cycle | [WORKFLOW.md](docs/WORKFLOW.md) |
