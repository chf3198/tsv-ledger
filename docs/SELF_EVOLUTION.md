# Self-Evolution Protocol

> AI agents improve through structured reflection on outcomes.

## The Reflexion Loop

```
ACT → OBSERVE → REFLECT → ADAPT → PERSIST (to REFLECTION_LOG.md)
```

## After EVERY Task

Capture metrics:
| Metric | Question |
|--------|----------|
| **Success** | Tests pass? Lint pass? |
| **Efficiency** | Iterations to green? (target: ≤2) |
| **Adherence** | DESIGN.md updated first? |

## Reflection Templates

**On Failure** (test or lint):
```markdown
## [DATE] FAIL: [what]
**Root cause**: [analysis]
**Prevention**: [check to add]
```

**On Rework** (>2 iterations):
```markdown
## [DATE] REWORK: [what]
**Misunderstanding**: [analysis]
**Question to ask**: [upfront clarification]
```

## Self-Improvement Checklist

Before implementing:
- [ ] "What could go wrong?"
- [ ] "Does this fit DESIGN.md architecture?"

After implementing:
- [ ] DESIGN.md updated?
- [ ] Test written BEFORE code?
- [ ] All files ≤100 lines?
- [ ] `npm test && npm run lint` passed?

## Adaptation Rules

| When | Action |
|------|--------|
| Same issue **2x** | Add checklist item |
| Pattern helps **3x** | Promote to protocol |
| Step causes friction **3x** | Simplify |

**Never adapt**: 100-line limit, test-first, design-first

## Research Basis

- **Reflexion** (Shinn 2023) - Memory + self-reflection
- **STOP** (Zelikman 2023) - Recursive self-improvement  
- **Self-Refine** (Madaan 2023) - Iterative refinement
- **Agentic Design** (Ng 2024) - Reflection pattern

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Ignore failures | Log every failure |
| Change randomly | Change on pattern only |
| Skip reflection | Reflect is mandatory |
