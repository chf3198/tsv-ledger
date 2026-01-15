# AGENTS.md - TSV Ledger Quick Start

> **Entry point only** — All rules live in [.github/copilot-instructions.md](.github/copilot-instructions.md)

## 🚀 Quick Reference

| What           | Where                                                                                          | When               |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------ |
| Project status | [CURRENT_STATE.md](CURRENT_STATE.md)                                                           | Session start      |
| Coding rules   | [.github/copilot-instructions.md](.github/copilot-instructions.md)                             | When coding        |
| Backend rules  | [.github/instructions/src.instructions.md](.github/instructions/src.instructions.md)           | Editing `src/`     |
| Frontend rules | [.github/instructions/frontend.instructions.md](.github/instructions/frontend.instructions.md) | Editing `public/`  |
| Test rules     | [.github/instructions/tests.instructions.md](.github/instructions/tests.instructions.md)       | Writing tests      |
| Amazon rules   | [.github/instructions/amazon.instructions.md](.github/instructions/amazon.instructions.md)     | Amazon integration |

## Project Overview

**TSV Ledger**: Expense tracking for Texas Sunset Venues  
**Stack**: Node.js 18+ | Express | Bootstrap 5 | JSON storage  
**Version**: 2.2.3 | **Port**: 3000

## ⚡ Validated Commands

```bash
npm run dev          # Start server (use isBackground: true)
npm test             # Run unit tests (15s)
npm run test:e2e     # E2E tests - requires server running (60s)
npm run lint         # Code quality check
```

**⚠️ CRITICAL**: Always use `isBackground: true` for `npm run dev` or `node server.js`

## 📁 Key Paths

```
server.js              # Entry point
src/routes/            # API handlers → .github/instructions/src.instructions.md
src/database.js        # JSON CRUD
public/components/     # UI components → .github/instructions/frontend.instructions.md
tests/                 # All tests → .github/instructions/tests.instructions.md
data/expenditures.json # Data (never edit directly)
```

## ✅ Session Checklist

**Start**: Read [CURRENT_STATE.md](CURRENT_STATE.md) → Check `git status`  
**End**: Update [CURRENT_STATE.md](CURRENT_STATE.md) → Commit with conventional format

## 🔄 Session Handoff

**When to handoff** (any of these):

- ✅ Major task completed
- ⚠️ ~20+ complex exchanges
- 🐌 Responses getting slow / summarizing
- 🔀 Switching to unrelated topic
- 🏁 End of work session

**Commands**:

```
/handoff        # Execute full handoff protocol
/session-start  # Initialize new session with context
```

See `.github/prompts/` for prompt files.

## 🔧 Common Fixes

| Problem           | Solution                        |
| ----------------- | ------------------------------- |
| Port 3000 in use  | `pkill -f "node server"`        |
| npm install fails | Use `--no-bin-links` (ChromeOS) |
| E2E tests fail    | Ensure server is running first  |
