# Knowledge Transfer System (KTS) - v2.0

**Updated:** January 7, 2026  
**Purpose:** Enable seamless handoffs between AI agent sessions and developers

## Quick Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `AGENTS.md` | Entry point, validated commands | Start of ANY session |
| `CURRENT_STATE.md` | Live project status | Continuing interrupted work |
| `TODO.md` | Task tracking | Planning work |
| `.github/copilot-instructions.md` | Detailed dev guidelines | When coding |
| `.github/instructions/*.md` | Path-specific rules | When editing specific files |

## For New AI Agent Sessions

### Step 1: Orientation (2 min)
Read in this order:
1. `AGENTS.md` - Quick project overview, validated commands
2. `CURRENT_STATE.md` - What's currently happening

### Step 2: Understand Context (5 min)
If continuing existing work:
- Check `TODO.md` for active tasks
- Check `git status` and `git log --oneline -10`
- Review `.github/copilot-instructions.md` for rules

### Step 3: Start Work
Follow the DO/DON'T patterns in `AGENTS.md`:
- ✅ Use `isBackground: true` for servers
- ✅ Run `npm test` before committing
- ❌ Never use `open_simple_browser`
- ❌ Never block the terminal with `node server.js`

## Session End Checklist

Before ending a session, AI agent should:
- [ ] Update `CURRENT_STATE.md` with progress
- [ ] Update `TODO.md` with completed/new items
- [ ] Commit changes with conventional commit message
- [ ] Note any blockers in CURRENT_STATE.md

## Architecture Overview

```
tsv-ledger/
├── AGENTS.md              # AI agent entry point
├── CURRENT_STATE.md       # Live project status
├── TODO.md                # Task tracking
├── server.js              # Main entry point
├── src/                   # Backend source
│   ├── database.js        # JSON file operations
│   ├── routes/            # API endpoints
│   └── ...
├── public/                # Frontend
│   ├── index.html         # Main UI
│   ├── components/        # Reusable HTML
│   └── js/                # Client scripts
├── tests/                 # All tests
├── data/                  # Data files + metrics
├── docs/                  # Documentation
└── .github/
    ├── copilot-instructions.md
    └── instructions/      # Path-specific rules
```

## Key Decisions (Why We Do Things)

| Decision | Rationale |
|----------|-----------|
| JSON file storage | No database server needed, simple deployment |
| 300-line limit | AI optimization, easier to understand/maintain |
| Bootstrap 5 | Rapid UI development, no build step required |
| Verbose instructions | Better for simpler/faster AI models |
| Express.js | Lightweight, familiar, proven |

## Lessons Learned

### What Works
- Explicit DO/DON'T patterns reduce agent errors
- Validated commands table prevents command failures
- Path-specific instructions provide targeted guidance
- Session state tracking enables seamless handoffs

### What Doesn't Work
- Creating tools without integrating them
- Implicit rules (agents ignore them)
- Files over 300 lines (hard to maintain/understand)
- Assuming agents remember previous sessions

## Evolution History

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | Jan 2026 | Added AGENTS.md, CURRENT_STATE.md, path-specific instructions |
| v1.0 | Sept 2025 | Original KTS with CoreProtocols |

---

*For detailed protocols, see the archived `CoreProtocols/` directory*
