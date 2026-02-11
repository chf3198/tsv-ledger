# Error Prevention Protocol for AI Agents

> Automated safeguards to prevent compounding errors without requiring client oversight

## Core Principle

**The agent must operate autonomously with self-enforcing technical safeguards. The client defines requirements and approves completed features, but does not monitor development processes.**

Client role: Requirements, business decisions, feature approval  
Agent role: Implementation with built-in circuit breakers and automated verification

## Automated Circuit Breakers

### 1. Programmatic Test Verification

```bash
# Store baseline BEFORE any work
BASELINE=$(npm test 2>&1 | grep -oP '\d+(?= passed)')
echo "$BASELINE" > /tmp/test-baseline.txt

# After EACH file edit, run automated check:
CURRENT=$(npm test 2>&1 | grep -oP '\d+(?= passed)')
if [ "$CURRENT" -lt "$BASELINE" ]; then
  echo "CIRCUIT BREAKER: Tests regressed ($BASELINE → $CURRENT)"
  git restore .
  exit 1
fi
npm run lint || { git restore .; exit 1; }
```

**Key**: Use regex extraction and arithmetic comparison, never interpretation.

### 2. Mandatory Git Checkpoints

```bash
# Before starting ANY task:
git add -A && git commit -m "checkpoint: before [task]"

# After each successful change:
git add -A && git commit -m "feat: [what works]"
```

### 3. Iteration Limits (Hard Coded)

```bash
# Track attempts programmatically
ATTEMPT=1
MAX_ATTEMPTS=3

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  # Make change
  # Test
  if npm test 2>&1 | grep -q "0 failed"; then
    git commit -m "success: attempt $ATTEMPT"
    break
  else
    git restore .
    ATTEMPT=$((ATTEMPT + 1))
  fi
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "CIRCUIT BREAKER: Max attempts exceeded, reverting to checkpoint"
  git reset --hard HEAD~$MAX_ATTEMPTS
  exit 1
fi
```

### 4. Zero Tolerance for Failing Tests

```bash
# Wrap every code change in:
if ! npm test 2>&1 | grep -q "0 failed"; then
  git restore .
  exit 1
fi
```

**Never proceed with any failing tests.**

### 5. Automated Rollback Wrapper

```bash
# Template for risky changes:
git add -A && git commit -m "checkpoint: before experiment"
# Make experimental change
if ! (npm test && npm run lint); then
  git reset --hard HEAD~1
  exit 1
else
  git commit -m "experiment succeeded"
fi
```

## Programmatic Verification (No Human Monitoring)

### Automated Test Counting

```bash
# WRONG (requires interpretation):
# "Most tests are passing" ❌

# RIGHT (programmatic extraction):
PASSED=$(npm test 2>&1 | grep -oP '\d+(?= passed)')
FAILED=$(npm test 2>&1 | grep -oP '\d+(?= failed)')
echo "Counts: $PASSED passed, $FAILED failed"  # Raw numbers only

# Automated decision:
if [ "$FAILED" -gt 0 ]; then
  git restore .
fi
```

### Exit Codes Over Prose

```bash
# Use shell exit codes for decisions:
npm test
if [ $? -ne 0 ]; then
  git restore .
  exit 1
fi

# Not: "The tests mostly passed so let's continue" (hallucination risk)
```

### Self-Imposed Discipline

1. **ONE change per cycle**: No "while I'm here" additions
2. **Revert immediately on failure**: Don't analyze, don't fix again, restore
3. **Use search tools**: `grep_search` and `semantic_search` instead of re-reading files
4. **Hard limits**: 3 attempts max, then revert ALL and try different strategy
5. **Checkpoint wrapping**: Every risky change in git checkpoint sandwich

## Internal Warning Signs (Self-Monitoring)

These trigger automatic actions, no human judgment required:

1. **Test regression detected**: `CURRENT_PASSING < BASELINE_PASSING` → Auto-revert
2. **Any test failures**: `FAILED > 0` → Auto-revert  
3. **Iteration count exceeded**: `ATTEMPT > 3` → Reset to checkpoint
4. **Same file read 3+ times**: Use grep/search instead → If triggered, note in reflection log
5. **Lint failures**: `npm run lint` exits non-zero → Auto-revert

**Action**: Shell scripts enforce these automatically via exit codes and git restore.

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

## Autonomous Development Workflow

### Before Starting (Automated Setup)

```bash
#!/bin/bash
# run-task.sh - Wraps development work with safeguards

TASK_NAME="$1"
BASELINE_PASSING=$(npm test 2>&1 | grep -oP '\d+(?= passed)')
echo "$BASELINE_PASSING" > /tmp/baseline-passing.txt

git add -A && git commit -m "checkpoint: before $TASK_NAME"
echo "✓ Checkpoint created, baseline: $BASELINE_PASSING passing tests"
```

### During Work (Automated Verification)

```bash
#!/bin/bash
# verify-change.sh - Run after EACH code edit

BASELINE=$(cat /tmp/baseline-passing.txt)
CURRENT=$(npm test 2>&1 | grep -oP '\d+(?= passed)')
FAILED=$(npm test 2>&1 | grep -oP '\d+(?= failed)')

echo "Test counts: $CURRENT passed, $FAILED failed (baseline: $BASELINE)"

if [ "$FAILED" -gt 0 ]; then
  echo "CIRCUIT BREAKER: Tests failing"
  git restore .
  exit 1
fi

if [ "$CURRENT" -lt "$BASELINE" ]; then
  echo "CIRCUIT BREAKER: Test regression"
  git restore .
  exit 1
fi

npm run lint || { echo "CIRCUIT BREAKER: Lint failed"; git restore .; exit 1; }

git add -A && git commit -m "verified: $1"
echo "✓ Change verified and committed"
```

### Usage Pattern

```bash
# Start task
./run-task.sh "apportionment-slider"

# Make ONE code change
# Then verify:
./verify-change.sh "added slider UI element"

# Make NEXT change
# Then verify again:
./verify-change.sh "added slider event handler"

# Continue until complete
```

### Built-in Safeguards Summary

- ✅ Automatic test counting (no interpretation)
- ✅ Auto-revert on any failure
- ✅ Auto-revert on regression
- ✅ Lint enforcement
- ✅ Forced commits after success
- ✅ Shell exit codes enforce rules
- ❌ No human monitoring required

## Development Loop Integration

```
DESIGN → TEST → CODE → AUTO-VERIFY → REFLECT → AUTO-COMMIT → ADAPT
                              ↓
                        CIRCUIT BREAKER
                         (automated)
                              ↓
                         If fails → AUTO-REVERT
```

**All verification is programmatic. No human intervention required during development cycles.**

## Automated Metrics Tracking

```bash
# metrics.sh - Track progress automatically

ATTEMPTS=$(git log --oneline --since="1 hour ago" | grep -c "checkpoint" || echo 0)
REVERTS=$(git log --oneline --since="1 hour ago" | grep -c "CIRCUIT BREAKER" || echo 0)
CURRENT_PASSING=$(npm test 2>&1 | grep -oP '\d+(?= passed)')

echo "Metrics (last hour):"
echo "  Attempts: $ATTEMPTS"
echo "  Reverts: $REVERTS"
echo "  Tests passing: $CURRENT_PASSING"

# Automated stopping conditions:
if [ $REVERTS -gt 3 ]; then
  echo "WARNING: Too many reverts, consider different approach"
  exit 1
fi
```

**Key metrics** (tracked automatically):
- Fix attempts on same issue (limit: 3)
- Test pass count (must never decrease)
- Revert frequency (>3/hour = stop and research)

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

## Commitment to Autonomous Operation

### Agent's Self-Enforcing Rules

1. **Use programmatic tools only**
   - `grep -oP '\d+(?= passed)'` not interpretation
   - Shell arithmetic `[ $A -lt $B ]` not judgment
   - Exit codes `if [ $? -ne 0 ]` not analysis

2. **Automatic revert on failure**
   - Any test failure → `git restore .`
   - Any regression → `git restore .`
   - Any lint failure → `git restore .`
   - No analysis, no second chances, just restore

3. **Hard iteration limits**
   - Max 3 attempts per approach
   - After 3 failures → revert ALL attempts
   - Try completely different strategy

4. **ONE minimal change per cycle**
   - No batching unverified changes
   - No "while I'm here" additions
   - One change, verify, commit, repeat

5. **Checkpoints wrap risky changes**
   - git commit BEFORE experimenting
   - If experiment fails → reset --hard
   - If succeeds → commit result

6. **Use search tools not repeated reads**
   - `grep_search` for code patterns
   - `semantic_search` for concepts
   - Max 2 reads of same file per task

### Client-Agent Boundary

**Client provides:**
- Requirements and specifications
- Business logic decisions
- Design direction
- Approval of completed features

**Client does NOT:**
- Monitor test output during development
- Enforce technical circuit breakers
- Verify individual code changes
- Track development metrics

**Agent provides:**
- Implementation with automated safeguards
- Built-in verification and rollback
- Self-enforcing quality gates
- Completed, tested features for approval

**Agent does NOT:**
- Require monitoring during work
- Delegate technical verification to client
- Proceed without automated checks
- Compound errors (prevented by automation)

### The Autonomous Model

**Agent = Self-Regulating Developer**
- Programmatic checks replace human judgment
- Shell scripts enforce safety rules
- Git automation ensures rollback capability
- Circuit breakers trigger automatically

**Client = Requirements Owner & Approver**
- Defines what to build
- Approves completed work
- Makes business decisions
- Not involved in development execution

**No technical oversight required from client during development.**

This protocol enables autonomous operation with built-in safety.
