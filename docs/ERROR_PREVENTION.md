# Error Prevention Protocol for AI Agents

> Safeguards to prevent compounding errors and failure spirals

## Core Principle

**The autonomous nature of agents means higher costs and the potential for compounding errors.**  
— Anthropic, "Building effective agents"

## Circuit Breakers

### 1. Test Verification After EVERY Change

```bash
# After EACH file edit:
npm test && npm run lint

# If fails → STOP and REVERT
git restore <file>
```

**Never proceed to next change while tests are failing.**

### 2. Git Checkpoints

```bash
# Before starting new work:
git commit -m "checkpoint: working state before [feature]"

# This creates a rollback point
```

### 3. Test Output Verification

- **Read test output carefully**
- Never misread "7 passed" as "39 passed"
- If output is ambiguous, run `npm test 2>&1 | grep -E "(passed|failed)"`

### 4. One Change at a Time

- Make ONE change
- Verify it works
- Commit
- Then move to next change

**DO NOT** batch multiple unverified changes.

### 5. Maximum Iteration Limit

If same fix attempted 3 times without success:
1. **STOP**
2. **REVERT** to last known good state
3. **RESEARCH** the problem
4. **REFLECT** on why approach failed

## Verification Loops

### After Edit

```
1. Make change
2. Run tests
3. If pass → commit
4. If fail → analyze OR revert
5. NEVER move forward with failing tests
```

### When Debugging

```
1. Capture actual error (console, test output)
2. Form hypothesis
3. Make ONE targeted fix
4. Verify fix works
5. If doesn't work → REVERT and try different approach
```

## Red Flags (STOP IMMEDIATELY)

1. **Tests passing → failing** without understanding why
2. **Multiple similar fixes** that don't work
3. **Re-reading same code** without new insight
4. **Uncertainty about what change caused issue**
5. **User intervention required** to diagnose problem

## Recovery From Failure Spiral

If you recognize you're in a failure spiral:

```bash
# 1. STOP making changes
# 2. Check git status
git status

# 3. Restore to last known good
git restore <modified-files>

# 4. Verify restoration
npm test

# 5. Log the failure
# Add entry to REFLECTION_LOG.md documenting:
# - What went wrong
# - Why approach failed  
# - How to prevent next time
```

## Anthropic Best Practices Integration

From "Building effective agents":

### Start Simple
- Simple prompts first
- Add complexity ONLY when simple solutions fail
- Measure performance before and after

### Transparency
- Make planning steps explicit
- Show what you're doing and why
- Log decisions for review

### Tool Design (Agent-Computer Interface)
- Test tools thoroughly
- Clear documentation
- Iterate based on actual usage patterns

### Evaluator Pattern
Use for complex changes:
1. Make change
2. Run automated evaluation (tests)
3. If fails, get feedback (error messages)
4. Iterate OR revert

## Practical Application

### Before Starting Work

```markdown
## Task: [Feature Name]

### Pre-flight Checklist
- [ ] All tests currently passing
- [ ] Git status clean or changes committed
- [ ] Understand success criteria
- [ ] Know how to verify success

### Rollback Plan
- Last known good commit: [SHA]
- Files that will change: [list]
- Rollback command: `git restore [files]`
```

### During Work

- ✅ Make one small change
- ✅ Run `npm test && npm run lint`
- ✅ If pass: `git commit -m "feat: [what works]"`
- ✅ If fail: Fix immediately OR revert

### After Work

```markdown
## Completed: [Feature Name]

### Results
- [ ] All tests passing (including new ones)
- [ ] Lint passing
- [ ] All files ≤100 lines
- [ ] Changes committed
- [ ] Reflection logged if issues encountered
```

## Integration with Development Loop

```
DESIGN → TEST → CODE → VERIFY ✓ → REFLECT → COMMIT → ADAPT
                          ↓
                       CIRCUIT
                       BREAKER
                          ↓
                    If fails → REVERT
```

## Key Metrics

Track these to identify when you're compounding errors:

- **Fix attempts**: If >2 for same issue → STOP and REVERT
- **Test pass rate**: Should NEVER decrease
- **Time without progress**: If >15min on same issue → STEP BACK
- **Uncertainty level**: If unclear what to do → RESEARCH first

## Example: What Should Have Happened

### Apportionment Slider Incident (2026-02-10)

**What Happened:**
1. Implemented slider feature
2. Tests failed (7 passing, 33 failing)
3. Misread as "39 passing"
4. Made multiple "fixes" without verification
5. Each fix made things worse
6. Required user intervention

**What Should Have Happened:**
```bash
# 1. Implement slider feature
# 2. Run tests - see 7 pass, 33 fail
npm test 2>&1 | grep -E "passed|failed"
# Output: "7 passed, 33 failed"

# 3. STOP - Test pass rate DECREASED
# 4. REVERT immediately
git restore js/app.js index.html tests/basic.spec.js

# 5. Verify restoration
npm test  # Should show original pass rate

# 6. Analyze WHY tests failed BEFORE making ANY fixes
# - Open browser to see actual errors
# - Capture console output
# - Understand root cause

# 7. Make ONE targeted fix
# 8. Verify it works
# 9. If works → commit, if not → revert and try different approach
```

## Commitment

As an AI agent, I commit to:

1. **Never batch unverified changes**
2. **Revert immediately when tests fail**
3. **Read test output accurately**
4. **Stop after 2-3 failed fix attempts**
5. **Use git checkpoints liberally**
6. **Log failures for learning**

This protocol is now part of the standard development workflow.
