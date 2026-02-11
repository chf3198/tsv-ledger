# AI Agent Development Protocol

## The Golden Rule
```
DESIGN FIRST. Always update DESIGN.md before changing code.
```

## The Complete Loop (with Self-Evolution)
```
┌─────────────────────────────────────────────────────┐
│  0. DESIGN        Update DESIGN.md with decision    │
│  1. UNDERSTAND    What exactly is being asked?      │
│  2. TEST FIRST    Write failing test                │
│  3. IMPLEMENT     Minimal code to pass              │
│  4. VERIFY        npm test && npm run lint          │
│  5. REFLECT       Log outcome to REFLECTION_LOG.md  │
│  6. REFACTOR      Clean while green                 │
│  7. COMMIT        Atomic, descriptive               │
│  8. ADAPT         Update protocol if pattern found  │
└─────────────────────────────────────────────────────┘
```

## Step 0: DESIGN (Before ANY code!)
Update DESIGN.md answering:
1. **Context**: What forces/constraints exist?
2. **Decision**: What choice are you making?
3. **Consequences**: What are the trade-offs?
4. **Fit**: Does this align with existing architecture?

**If it doesn't fit → discuss before proceeding**

## Step 1: UNDERSTAND
- Restate the request
- Identify acceptance criteria
- Check DESIGN.md for architectural context

## Step 2: TEST FIRST (Red)
- Write E2E test describing expected behavior
- Run test - confirm it FAILS
- Failure should be clear and specific

## Step 3: IMPLEMENT (Green)
- Write MINIMAL code to pass
- No premature optimization
- One logical change per edit

## Step 4: VERIFY
```bash
npm test && npm run lint
```
**STOP if either fails.**

## Step 5: REFACTOR
- Only while tests are GREEN
- Split files >100 lines
- Extract functions >20 lines

## Step 6: COMMIT
```bash
git commit -m "type: description"
```

## Why Design First?

> "The motivation behind previous decisions is visible for everyone.
> Nobody is left scratching their heads." — Michael Nygard

- Prevents blind acceptance of bad patterns
- Prevents blind changes that break things
- Creates shared understanding
- Captures WHY, not just WHAT
If same issue occurs **twice**:
- Add checklist item or verification step
- Document in REFLECTION_LOG.md
- Do NOT change core rules (100-line, test-first, design-first)

## Anti-Patterns
| ❌ Don't | ✅ Do |
|----------|-------|
| Code without design update | Update DESIGN.md first |
| Write code then tests | Write test first |
| Skip verification | Always verify |
| Ignore failures | Log and analyze every failure |
| Skip reflection | Reflect after every task |
