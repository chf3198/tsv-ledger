---
mode: agent
tools: ["read_file", "run_in_terminal", "manage_todo_list"]
description: Initialize new session with full context from previous handoff
---

# New Session Initialization

Execute session startup protocol to load context from previous agent.

## Step 1: Load Project State

Read essential context files:

- `CURRENT_STATE.md` - project status and recent changes
- `TODO.md` - active tasks
- `AGENTS.md` - quick reference

## Step 2: Check Repository State

Run diagnostics:

```bash
git status
git log --oneline -5
git branch --show-current
```

## Step 3: Verify Environment

Check if server is needed:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "Server not running"
```

## Step 4: Load Todo List

Use `manage_todo_list` with `operation: read` to check for any persisted tasks.

## Step 5: Output Session Brief

Print a session initialization summary:

```
═══════════════════════════════════════════════════════════
                  SESSION INITIALIZED
═══════════════════════════════════════════════════════════

📂 PROJECT: TSV Ledger v[version]
🌿 BRANCH: [current branch]
📊 STATUS: [clean/uncommitted changes]

📋 RECENT CONTEXT:
[Key points from CURRENT_STATE.md]

✅ READY TO WORK ON:
[Priority items from TODO or CURRENT_STATE]

⚠️ KNOWN ISSUES:
[Any blockers from CURRENT_STATE]

💡 Ask me what you'd like to accomplish this session!
═══════════════════════════════════════════════════════════
```
