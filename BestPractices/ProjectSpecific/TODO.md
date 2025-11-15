# TSV Ledger - Current TODO Items

## High Priority

### 1. Frontend Import History Display
**Status:** Pending  
**Description:** Debug JavaScript errors preventing "Failed to load import history" and ensure UI properly calls /api/import-history endpoint  
**Files:** `public/index.html`, `public/js/app.js`  
**Priority:** High - Backend persistence is complete and tested

### 2. Navigation Testing Issues
**Status:** Pending  
**Description:** Update Puppeteer tests with correct selectors for dynamic menu system  
**Files:** `tests/pw/import-history-ux.test.js`  
**Priority:** Medium

## Medium Priority

### 3. Duplicate Prevention Logic
**Status:** Pending  
**Description:** Add duplicate prevention logic to database.js addExpenditure function  
**Files:** `src/database.js`  
**Priority:** Medium

### 4. UI Integration Completion
**Status:** Pending  
**Description:** Connect working backend persistence with functional frontend display  
**Files:** Frontend files in `public/`  
**Priority:** Medium

## Notes
- All backend persistence and API functionality is working correctly
- Comprehensive testing suite has been implemented
- Documentation has been updated in AGENTS.md and CHANGELOG.md
- Git workflow is clean with proper commits and pushes

## Next Steps
1. Focus on frontend debugging (Priority 1)
2. Implement duplicate prevention (Priority 3)
3. Complete UI integration testing
4. Update navigation tests