# Knowledge Transfer System (KTS) - Meta Documentation

**Purpose:** Documentation about how the instruction system works (not an entry point)

> **For AI Agents**: Start with [AGENTS.md](../AGENTS.md), not this file.

## Instruction System Architecture

```
.github/
├── copilot-instructions.md      # Canonical rules (Priority 2)
└── instructions/
    ├── src.instructions.md      # Backend (Priority 1 for src/)
    ├── tests.instructions.md    # Testing (Priority 1 for tests/)
    ├── frontend.instructions.md # Frontend (Priority 1 for public/)
    └── amazon.instructions.md   # Amazon (Priority 1 for amazon*)

Root/
├── AGENTS.md                    # Entry point (Priority 3)
└── CURRENT_STATE.md             # Live status (not instructions)
```

**Rule**: Path-specific > Repository-wide > Entry point > General best practices

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

| Version | Date      | Changes                                                       |
| ------- | --------- | ------------------------------------------------------------- |
| v2.0    | Jan 2026  | Added AGENTS.md, CURRENT_STATE.md, path-specific instructions |
| v1.0    | Sept 2025 | Original KTS with CoreProtocols                               |

---

_For detailed protocols, see the archived `CoreProtocols/` directory_
