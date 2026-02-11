# Development Workflow

## The Golden Rule
```
DESIGN first. TEST first. REFLECT always.
```

## The Complete Loop
```
DESIGN → TEST → CODE → VERIFY → REFLECT → COMMIT → ADAPT
```

## Iterative Cycle
```
   ┌──────────┐
   │  DESIGN  │ ← Update DESIGN.md first
   └────┬─────┘
        ▼
   ┌──────────┐
   │  RED     │ ← Write failing test
   └────┬─────┘
        ▼
   ┌──────────┐
   │  GREEN   │ ← Minimal code to pass
   └────┬─────┘
        ▼
   ┌──────────┐
   │  VERIFY  │ ← npm test && npm run lint
   └────┬─────┘
        ▼
   ┌──────────┐
   │ REFLECT  │ ← Log to REFLECTION_LOG.md
   └────┬─────┘
        ▼
   ┌──────────┐
   │  COMMIT  │ ← Atomic commit
   └──────────┘
```

## Verification Checkpoint
After EVERY change:
```bash
npm test          # All E2E tests pass?
npm run lint      # All files ≤ 100 lines?
```
**STOP if either fails. Log failure to REFLECTION_LOG.md.**

## Commit Convention
```
type: description (max 50 chars)

Types: feat|fix|docs|refactor|test|chore
```

## When Stuck
1. Revert to last green commit
2. Make smaller change
3. Verify again
