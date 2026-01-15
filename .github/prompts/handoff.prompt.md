---
mode: agent
tools:
  [
    "read_file",
    "create_file",
    "replace_string_in_file",
    "run_in_terminal",
    "manage_todo_list",
  ]
description: Generate structured session handoff for seamless AI agent transitions
---

# Session Handoff Protocol

Execute a structured handoff to preserve session context for the next AI agent.

## Step 1: Gather Current State

Read and analyze:

- `CURRENT_STATE.md` - existing project state
- `TODO.md` - active task tracking
- `git status` - uncommitted changes
- `git log --oneline -5` - recent commits

## Step 2: Document This Session

Create a handoff summary including:

### Accomplishments This Session

- List all completed tasks
- Note files created/modified
- Summarize key decisions made

### In-Progress Work

- Partially completed tasks
- Current blockers or issues
- Specific context the next agent needs

### Recommended Next Steps

- Prioritized action items
- Any time-sensitive items
- Suggested approach for continuing

## Step 3: Update CURRENT_STATE.md

Update the "Recent Changes" table with today's session summary.
Format: `| [DATE] | **[SUMMARY]**: [details] |`

## Step 4: Commit Changes

If there are uncommitted changes:

```bash
git add -A
git commit -m "chore: session handoff - [brief summary]"
```

## Step 5: Output Handoff Summary

Print a formatted handoff block that can be copied to start the next session:

```
═══════════════════════════════════════════════════════════
                    SESSION HANDOFF
═══════════════════════════════════════════════════════════

📋 CONTEXT FOR NEXT AGENT:
[Key context points]

✅ COMPLETED THIS SESSION:
[List of accomplishments]

🔄 IN PROGRESS:
[Partially done work]

⚠️ BLOCKERS/NOTES:
[Important warnings or context]

📌 RECOMMENDED NEXT STEPS:
1. [First priority]
2. [Second priority]
3. [Third priority]

💡 TIP: Start by reading CURRENT_STATE.md and running `git status`
═══════════════════════════════════════════════════════════
```
