# Manual UX Testing Checklist for TSV Ledger

**Generated:** January 7, 2026  
**App URL:** http://localhost:3000  
**Browsers to test:** Chrome, Firefox, Safari, Edge

---

## Pre-Test Setup

- [ ] Server running: `npm run dev`
- [ ] Open app at http://localhost:3000 in external browser (NOT VS Code Simple Browser)
- [ ] Open browser DevTools (F12) → Console tab to monitor errors

---

## 1. PAGE LOAD & CONSOLE ERRORS

### Main Pages
| Page | URL | JS Errors? | Load Time | Notes |
|------|-----|------------|-----------|-------|
| Dashboard | http://localhost:3000 | [ ] None | ___ms | |
| Employee Benefits | /employee-benefits.html | [ ] None | ___ms | |
| Reconciliation | /reconciliation.html | [ ] None | ___ms | |
| Subscription Analysis | /subscription-analysis.html | [ ] None | ___ms | |
| Geographic Analysis | /geographic-analysis.html | [ ] None | ___ms | Known: `insertBefore` error |
| Amazon ZIP Import | /amazon-zip-import.html | [ ] None | ___ms | |
| About | /about.html | [ ] None | ___ms | |

### Known Console Issues (can ignore)
- `Failed to resolve module specifier "lit"` - Shoelace CDN dependency
- `drawer.show is not a function` - Shoelace initialization timing

---

## 2. NAVIGATION

### Sidebar Menu
- [ ] Sidebar visible on page load (desktop)
- [ ] All 11 menu items present:
  - [ ] Dashboard
  - [ ] Bank Reconciliation
  - [ ] Subscription Analysis
  - [ ] Benefits Management
  - [ ] Geographic Analysis
  - [ ] Analysis & Reports
  - [ ] AI Insights
  - [ ] Data Import
  - [ ] Manual Entry
  - [ ] Premium Features
  - [ ] Settings

### Navigation Interactions
- [ ] Click each menu item → section loads
- [ ] Active state highlights current section
- [ ] Sidebar toggle button works
- [ ] Sidebar collapses/expands smoothly
- [ ] Mobile: hamburger menu appears at < 768px
- [ ] Mobile: menu opens as overlay

---

## 3. SECTION CONTENT

### Dashboard Section
- [ ] Summary cards display (Total, Categories, Recent)
- [ ] Charts render (if data exists)
- [ ] Recent transactions list shows
- [ ] Refresh button works

### Bank Reconciliation Section
- [ ] Transaction list displays
- [ ] Import button visible
- [ ] Match/unmatch functionality works
- [ ] Reconciliation status updates

### Subscription Analysis Section
- [ ] Recurring expenses detected
- [ ] Subscription cards display
- [ ] Charts show spending patterns
- [ ] Edit/delete subscription works

### Benefits Management Section
- [ ] Employee list displays
- [ ] Add employee form works
- [ ] Benefit allocation shows
- [ ] Edit/delete employee works

### Geographic Analysis Section
- [ ] Map renders (if implemented)
- [ ] Location breakdown displays
- [ ] Expense by location chart

### Analysis & Reports Section
- [ ] Category breakdown chart
- [ ] Date range filter works
- [ ] Export functionality works

### AI Insights Section
- [ ] AI recommendations display
- [ ] Spending patterns analysis
- [ ] Anomaly detection shows

### Data Import Section
- [ ] CSV file upload input visible
- [ ] Amazon ZIP upload visible
- [ ] Import history displays
- [ ] Progress indicator during import
- [ ] Success/error messages show

### Manual Entry Section
- [ ] Form fields present (date, amount, description, category)
- [ ] Form validation works
- [ ] Submit creates new entry
- [ ] Success confirmation shows

### Premium Features Section
- [ ] Premium features list displays
- [ ] Upgrade CTA visible (if not premium)
- [ ] Premium content accessible (if premium)

### Settings Section
- [ ] Settings options visible
- [ ] Save settings works
- [ ] Theme toggle (if exists)

---

## 4. STYLING & VISUAL CONSISTENCY

### Bootstrap Components
- [ ] Buttons have proper styling (rounded, colored)
- [ ] Cards have shadow and rounded corners
- [ ] Tables are responsive and styled
- [ ] Forms have proper input styling
- [ ] Alerts show correctly (success, error, warning)
- [ ] Modals open/close properly

### Colors & Theme
- [ ] Primary color consistent across app
- [ ] Text readable on all backgrounds
- [ ] No color contrast issues
- [ ] Dark mode works (if implemented)

### Icons
- [ ] FontAwesome icons render (not boxes/squares)
- [ ] Icons appropriately sized
- [ ] Icon colors match theme

### Typography
- [ ] Headings hierarchy clear (h1 → h6)
- [ ] Body text readable (size, line-height)
- [ ] Font loads correctly (not Times New Roman fallback)

---

## 5. RESPONSIVE DESIGN

### Mobile (375px wide)
- [ ] No horizontal scrolling
- [ ] Text readable without zooming
- [ ] Buttons large enough to tap
- [ ] Navigation collapses to hamburger
- [ ] Forms stack vertically
- [ ] Tables scroll horizontally OR reflow

### Tablet (768px wide)
- [ ] Layout adapts appropriately
- [ ] Sidebar may show/hide
- [ ] Charts resize correctly

### Desktop (1280px wide)
- [ ] Full layout displays
- [ ] Sidebar always visible
- [ ] Optimal use of space

### Wide Screen (1920px wide)
- [ ] Content doesn't stretch too wide
- [ ] Max-width container works
- [ ] Charts scale appropriately

---

## 6. FORMS & INPUTS

### Data Import Form
- [ ] File input accepts .csv files
- [ ] File input accepts .zip files
- [ ] Upload button is clickable
- [ ] Progress shown during upload
- [ ] Error messages display on failure
- [ ] Success message on completion

### Manual Entry Form
- [ ] Date picker works
- [ ] Amount accepts numbers only
- [ ] Description field allows text
- [ ] Category dropdown populated
- [ ] Required field validation
- [ ] Submit creates record
- [ ] Form clears after submit

### Employee Benefits Form
- [ ] All fields accessible
- [ ] Validation on required fields
- [ ] Submit creates/updates record

---

## 7. API RESPONSES

Test these in browser DevTools → Network tab:

| Endpoint | Expected | Actual |
|----------|----------|--------|
| GET /health | 200 + JSON | [ ] Pass |
| GET /api/data/menu.json | 200 + array | [ ] Pass |
| GET /api/data/expenditures | 200 + array | [ ] Pass |
| POST /api/import/csv | 200 on success | [ ] Pass |
| GET /api/analytics/analysis | 200 + JSON | [ ] Pass |

---

## 8. ACCESSIBILITY

### Keyboard Navigation
- [ ] Tab order logical (left→right, top→bottom)
- [ ] Focus visible on all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate menus

### Screen Reader Basics
- [ ] Page has single `<h1>`
- [ ] Heading hierarchy makes sense
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] ARIA labels on icon-only buttons

### Visual
- [ ] Sufficient color contrast
- [ ] Text resizable to 200%
- [ ] No seizure-inducing animations

---

## 9. PERFORMANCE

- [ ] Initial page load < 3 seconds
- [ ] Navigation between sections < 1 second
- [ ] API calls complete < 2 seconds
- [ ] No layout shifts after load
- [ ] Charts render without lag

---

## 10. ERROR HANDLING

- [ ] Invalid file upload shows error message
- [ ] Network error shows user-friendly message
- [ ] Empty states display helpful text
- [ ] 404 pages styled appropriately

---

## Test Results Summary

**Date Tested:** _______________  
**Tester:** _______________  
**Browser/Version:** _______________

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Page Load | ___ | ___ | |
| Navigation | ___ | ___ | |
| Section Content | ___ | ___ | |
| Styling | ___ | ___ | |
| Responsive | ___ | ___ | |
| Forms | ___ | ___ | |
| API | ___ | ___ | |
| Accessibility | ___ | ___ | |
| Performance | ___ | ___ | |
| Error Handling | ___ | ___ | |

**Critical Issues Found:**
1. 
2. 
3. 

**Minor Issues Found:**
1. 
2. 
3. 

---

## Automated Test Results Reference

From Playwright E2E tests run on Jan 7, 2026:

### Visual Regression Tests (16 passed, 2 failed)
- ✅ Main page layout
- ✅ Section layouts (dashboard, analysis, ai-insights, benefits)
- ✅ Mobile layout
- ✅ Navigation appearance
- ❌ Form styling (timeout - forms not visible)
- ✅ Table styling
- ✅ Button states
- ❌ Input field states (element detached)
- ✅ Chart rendering
- ✅ Data table rendering
- ✅ Color scheme
- ✅ Typography
- ✅ Viewport responsiveness (4 sizes)
- ✅ Error state styling
- ✅ Loading state styling
- ✅ Transition effects
- ✅ Employee benefits status display

### Known Issues from Automated Tests
1. `insertBefore` error on Geographic Analysis page
2. `loadExpenditures is not defined` error
3. `drawer.show is not a function` - Shoelace initialization
4. Import history length error

---

*Screenshots captured at: `tests/screenshots/`*
