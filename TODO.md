# TSV Ledger - Task Tracking

**Last Updated:** January 7, 2026  
**Current Focus:** Repository optimization and KTS improvement

---

## 🔴 Blocked / Needs Decision

| Task                    | Blocker                   | Owner Decision Needed                     |
| ----------------------- | ------------------------- | ----------------------------------------- |
| tools/analysis/ cleanup | 39 scripts, all oversized | Archive, delete, or refactor?             |
| File size enforcement   | 130+ violations exist     | Enforce strictly or grandfather existing? |

---

## 🟡 In Progress

### Repository Optimization (Current Session)

- [x] Reorganize root directory structure
- [x] Add AGENTS.md for AI agent discovery
- [x] Add path-specific instructions (.github/instructions/)
- [x] Create CURRENT_STATE.md for session continuity
- [x] Update package.json scripts with correct file paths
- [x] Fix all documentation references to moved files
- [x] Validate tests still pass after reorganization
- [ ] Consolidate redundant documentation
- [ ] Update AGENTS.md with final structure

### Navigation System (feat/universal-menu branch)

- [x] Implement sidebar injection via src/menu.js
- [ ] Test navigation across all pages
- [ ] Fix any broken links
- [ ] Merge to main

---

## 🟢 Ready to Start

### High Priority

1. [ ] **CRITICAL: Fix AI Agent Compliance Violations**
   - [ ] Break down `ux-web-controller.js` (525 lines) into modules <300 lines
   - [ ] Modularize `ux-testing/extensions/chrome-extension/background.js` (364 lines)
   - [ ] Run full test suite and achieve 85%+ coverage (currently 4.47%)
   - [ ] Fix all 193 ESLint errors
   - [ ] Implement visible external browser testing (remove Simple Browser usage)
   - [ ] Update KTS with UX testing lessons learned

2. [x] **COMPLETED: Repository Organization Standards**
   - [x] Clean up root directory clutter (60+ → <20 files)
   - [x] Create organized `ux-testing/` directory structure
   - [x] Move 40+ UX testing files to proper locations
   - [x] Establish file placement best practices
   - [x] Add documentation for organizational standards

3. [ ] Fix core src/ files exceeding 300 lines
   - `src/database.js` (400 lines)
   - `src/tsv-categorizer.js` (475 lines)
   - `src/bank-reconciliation-engine.js` (639 lines)
   - `src/geographic-analysis-engine.js` (628 lines)
   - `src/subscription-analysis-engine.js` (505 lines)

4. [ ] Update KnowledgeTransferTest/ to v2.0
   - Reflect current architecture
   - Update version references (2.2.1 → 2.2.3)
   - Include lessons from AI compliance analysis

5. [ ] Improve test coverage
   - Current: ~70%
   - Target: 90%+
   - Focus on untested routes

### Medium Priority

4. [ ] **NEW: Maintain Repository Organization Standards**
   - [ ] Implement pre-commit hooks for file placement validation
   - [ ] Add CI/CD checks for directory structure compliance
   - [ ] Create automated cleanup scripts for misplaced files
   - [ ] Schedule quarterly organization audits
   - [ ] Update contribution guidelines with file placement rules

5. [ ] Complete HTML componentization
   - `public/index.html` (3200 lines) - largest file
   - Use existing component patterns

6. [ ] Fix E2E test reliability
   - Port conflict issues
   - Server startup timing

7. [ ] Documentation completeness
   - API documentation gaps
   - Missing JSDoc comments

### Low Priority

7. [ ] Performance optimization
8. [ ] Accessibility improvements
9. [ ] Advanced analytics features

---

## ✅ Completed (This Week)

| Date  | Task                                            |
| ----- | ----------------------------------------------- |
| Jan 7 | Root directory reorganization (80+ files moved) |
| Jan 7 | Created AGENTS.md with validated commands       |
| Jan 7 | Created path-specific instructions (4 files)    |
| Jan 7 | Created CURRENT_STATE.md                        |
| Jan 6 | AI compliance analysis                          |
| Jan 6 | Created tools/analysis/ scripts (needs review)  |

---

## 📊 Metrics

| Metric               | Current | Target | Status |
| -------------------- | ------- | ------ | ------ |
| Files > 300 lines    | ~130    | 0      | 🔴     |
| Unit test coverage   | 70%     | 90%    | 🟡     |
| Root files count     | 15      | <20    | 🟢     |
| Documentation        | 60%     | 95%    | 🟡     |
| Commits conventional | 80%     | 100%   | 🟡     |

---

## 📝 Notes

### Lessons Learned

- AI agents created many tools but didn't integrate them
- tools/analysis/ has 39 files totaling 25,826 lines - all need refactoring
- Session state tracking is critical for handoffs
- Explicit DO/DON'T patterns work better than implicit rules

### Decisions Made

- Keep verbose instructions for simpler model compatibility
- Root directory should have <20 items
- All files must be <300 lines (hard limit)
- JSON file storage is sufficient (no DB migration planned)

---

_Update this file before ending each session_
