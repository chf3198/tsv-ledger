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

### After EVERY Edit (Mandatory)

```
1. Make ONE change
2. Run: npm test 2>&1 | grep -E "(passed|failed)"
3. Show user EXACT grep output (never interpret)
4. Ask user: "Does this look correct?"
5. If user approves + tests pass → commit
6. If tests fail → IMMEDIATELY revert
7. NEVER make second change while first is unverified
```

**Critical**: Always show **raw data**, never my interpretation.
- ✅ "Output: 33 passed, 7 failed"
- ❌ "Most tests are passing" (hallucination risk)

### When Debugging

```
1. Capture actual error (console, test output)
2. Form hypothesis
3. Make ONE targeted fix
4. Verify fix works
5. If doesn't work → REVERT and try different approach
```

## Red Flags (STOP IMMEDIATELY)

**User must watch for these** (agent cannot reliably self-detect):

1. **Tests passing → failing** without understanding why
2. **Multiple similar fixes** that don't work (>2 attempts)
3. **Re-reading same code** without new insight
4. **Uncertainty about what change caused issue**
5. **User intervention required** to diagnose problem
6. **Agent repetition** - explaining same thing multiple times
7. **Agent interpretation** - summarizing instead of showing raw data

**User action**: Say "STOP and REVERT" immediately.  
**Agent action**: Request user confirmation if uncertain.

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
- [ ] **USER**: Create git checkpoint: `git commit -m "checkpoint before [feature]"`
- [ ] **USER**: Confirm actively watching for red flags
- [ ] **AGENT**: Show current test status with `npm test 2>&1 | grep -E "passed|failed"`
- [ ] **AGENT**: Wait for user approval to proceed
- [ ] Know success criteria
- [ ] Know rollback command: `git restore [files]`
```

### During Work (After EACH Change)

```markdown
## Change Verification Loop
1. **AGENT**: Make ONE small change
2. **AGENT**: Run `npm test 2>&1 | grep -E "passed|failed"`
3. **AGENT**: Show user EXACT output (no interpretation!)
4. **AGENT**: Ask "Does this match expectations?"
5. **USER**: Approve or Request Revert
6. If approved + tests pass → `git commit -m "feat: [what works]"`
7. If fail → `git restore [file]` immediately
```

**Critical**: Agent shows RAW DATA only. User interprets results.

### Circuit Breaker (USER Enforced)

```markdown
## User Watchlist (Check during each change)
- [ ] Has agent re-read same code 2+ times? → STOP
- [ ] Has agent attempted same fix 3+ times? → STOP
- [ ] Is agent's explanation becoming repetitive? → STOP
- [ ] Are tests passing → failing without clear reason? → STOP
- [ ] Is agent showing uncertainty but proceeding? → STOP
- [ ] Is agent summarizing instead of showing data? → STOP

If ANY checked → **USER SAYS: "STOP and REVERT NOW"**
```

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

### Agent Commitments

As an AI agent, I commit to:

1. **Show raw data, never interpret test results**
   - Use `grep` to extract pass/fail counts
   - Display EXACT output to user
   - Let user interpret, not me

2. **Request user approval after EACH change**
   - Not just at the end
   - Show what changed
   - Wait for explicit "proceed"

3. **Admit uncertainty immediately**
   - Say "I'm not sure" instead of guessing
   - Ask for user judgment
   - Propose rollback if uncertain

4. **Revert on first failure**
   - If test fails, immediately suggest `git restore`
   - Don't attempt multiple fixes without reverting
   - Let user decide to try different approach

5. **Never batch unverified changes**
   - ONE change at a time
   - Verify it works
   - Commit
   - Then next change

6. **Recognize I cannot detect my own hallucinations**
   - Rely on programmatic tools (grep, not reading)
   - Trust environment feedback over my interpretation
   - Ask user to verify my understanding

### User Responsibilities

As the overseer, user must:

1. **Act as active monitor, not passive observer**
   - Watch for red flags during conversation
   - Don't assume agent will self-regulate
   - Interrupt if something feels wrong

2. **Enforce circuit breakers**
   - Count agent's attempts on same issue
   - Notice repetitive explanations
   - Say "STOP" when red flags appear

3. **Verify raw data**
   - Don't trust agent's test result interpretations
   - Look at grep output directly
   - Check git diff before approving changes

4. **Commit frequently**
   - After each successful change
   - Creates rollback points
   - Enables bisecting if issues found later

5. **Understand the code**
   - Can't effectively oversee without domain knowledge
   - Ask agent to explain if unclear
   - Don't approve changes you don't understand

### The Partnership Model

**Agent**: Junior developer with perfect memory, no common sense  
**User**: Senior developer with judgment, experience, oversight

**Neither can succeed alone.**  
**Together, we can prevent compounding errors.**

This protocol is now part of the standard development workflow.
