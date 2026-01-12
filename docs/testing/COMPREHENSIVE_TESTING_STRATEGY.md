# Comprehensive Testing Strategy for TSV Ledger

## Testing Philosophy

**Core Principle**: No bug should reach the user. The AI agent is solely responsible for all testing phases including UAT (User Acceptance Testing) performed via automated browser testing simulating actual user behavior.

## Testing Pyramid

```
                    ┌─────────────────┐
                    │      UAT        │ ← Browser-based manual simulation
                    │  (Acceptance)   │   All workflows, visual inspection
                    ├─────────────────┤
                    │   Visual/UX     │ ← Screenshots, element inspection
                    │    Testing      │   Layout, styling, responsiveness
                    ├─────────────────┤
                    │     E2E         │ ← Playwright automated user flows
                    │   (System)      │   Complete workflow validation
                    ├─────────────────┤
                    │  Integration    │ ← API endpoints, data flow
                    │   Testing       │   Module interactions
                    ├─────────────────┤
                    │     Unit        │ ← Individual functions
                    │   Testing       │   Edge cases, logic
                    └─────────────────┘
```

## Types of Testing Required

### 1. Unit Testing (Automated)
- **Tool**: Jest
- **Scope**: Individual functions and modules
- **Coverage Target**: 85%+ line coverage
- **Location**: `tests/unit/`

### 2. Integration Testing (Automated)
- **Tool**: Jest + Supertest
- **Scope**: API endpoints, module interactions
- **Focus**: Data flow between components
- **Location**: `tests/integration/`

### 3. End-to-End Testing (Automated)
- **Tool**: Playwright
- **Scope**: Complete user workflows
- **Focus**: System behavior from user perspective
- **Location**: `tests/e2e/`

### 4. Visual/UI Testing (Browser-Based)
- **Tool**: Chrome DevTools MCP
- **Scope**: Layout, styling, responsiveness
- **Focus**: Visual correctness, element positioning

### 5. User Acceptance Testing (UAT) - Browser-Based
- **Tool**: Chrome DevTools MCP
- **Scope**: All user workflows
- **Focus**: Real-world usage simulation

### 6. Regression Testing
- **Trigger**: Every code change
- **Scope**: All existing functionality
- **Focus**: Ensuring changes don't break existing features

### 7. Smoke Testing
- **Trigger**: After deployment/restart
- **Scope**: Critical paths only
- **Focus**: Basic functionality verification

### 8. Sanity Testing
- **Trigger**: After bug fixes
- **Scope**: Affected areas
- **Focus**: Verify fix doesn't introduce new issues

## Pre-Release Testing Checklist

### Phase 1: Automated Tests
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No new ESLint errors
- [ ] Code coverage meets thresholds

### Phase 2: Visual Inspection (Browser-Based)
- [ ] Take screenshot of each main section
- [ ] Verify navigation menu renders correctly
- [ ] Check all buttons are clickable
- [ ] Verify forms display properly
- [ ] Check responsive design (different viewport sizes)
- [ ] Verify no console errors

### Phase 3: Functional UAT (Browser-Based)
Each workflow must be tested by actually performing the action in a browser:

#### Dashboard Workflow
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Charts render properly
- [ ] Summary statistics are accurate

#### Data Import Workflow (Bank Data)
- [ ] Navigate to Data Import section
- [ ] Select CSV file
- [ ] Click Import button
- [ ] Verify single history entry appears
- [ ] Verify record count is correct
- [ ] Check no duplicate entries

#### Data Import Workflow (Amazon ZIP)
- [ ] Navigate to Data Import section
- [ ] Select ZIP file
- [ ] Click Import button
- [ ] Verify history entry appears
- [ ] Verify record count > 0 (if data exists)

#### All Other Workflows
- [ ] Bank Reconciliation
- [ ] Subscription Analysis
- [ ] Benefits Management
- [ ] Geographic Analysis
- [ ] Analysis & Reports
- [ ] AI Insights
- [ ] Manual Entry
- [ ] Premium Features
- [ ] Settings

### Phase 4: Console Error Check
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Check Network tab for failed requests
- [ ] Verify no JavaScript errors

## UAT Test Procedures

### Import History Workflow UAT

**Objective**: Verify that importing bank data creates exactly ONE history entry

**Steps**:
1. Open browser to http://localhost:3000
2. Navigate to "Data Import" section
3. Clear existing import history (if any)
4. Select a CSV file for import
5. Click the Import button ONCE
6. Wait for import to complete
7. Count the number of history entries
8. **Expected**: Exactly 1 entry for this import
9. Verify details are correct (record count, date range, etc.)

**Pass Criteria**:
- Single import action = Single history entry
- No duplicates
- Correct metadata

## Testing Commands

```bash
# Run all automated tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run UAT smoke test (new)
npm run test:uat
```

## Browser-Based Testing Protocol

When testing in browser using Chrome DevTools MCP:

1. **Always take a snapshot first** to understand page state
2. **Check for console errors** before and after actions
3. **Verify element visibility** before clicking
4. **Take screenshots** of results for verification
5. **Check network requests** for failed API calls

## Bug Severity Classification

| Severity | Description | Example |
|----------|-------------|---------|
| Critical | System unusable | Server crash |
| High | Major feature broken | Import creates duplicates |
| Medium | Feature partially broken | Wrong data displayed |
| Low | Minor issues | Styling inconsistency |

## Zero-Bug Release Policy

Before any release:
1. ALL automated tests must pass
2. ALL manual UAT workflows must pass
3. NO console errors in browser
4. NO visual regressions
5. ALL new features have corresponding tests

## Continuous Testing

- Run unit tests on every save
- Run integration tests before commit
- Run full E2E suite before merge
- Run UAT before release announcement
