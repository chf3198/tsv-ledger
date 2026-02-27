# Visual Testing Setup

## Overview

This project includes visual testing infrastructure for AI-assisted UI verification.

## Tools

### 1. Screenshot Capture (`npm run test:visual`)
Captures screenshots of key app states:
```bash
npm run test:visual              # Capture all scenarios
node scripts/visual-test/capture.js list     # List available scenarios
node scripts/visual-test/capture.js <name>   # Capture specific scenario
```

### 2. Visual Analysis (`npm run test:visual:analyze`)
Generates screenshots with analysis metadata for AI review:
```bash
npm run test:visual:analyze
```

### 3. Visual Regression (Playwright)
Uses Playwright's `toHaveScreenshot()` for pixel-perfect comparison:
```bash
npx playwright test tests/visual.spec.js --update-snapshots  # Create baselines
npx playwright test tests/visual.spec.js                      # Compare to baselines
```

### 4. Preview Screenshots
```bash
node scripts/visual-test/preview.js
# Then open http://localhost:9090/preview.html (after starting server)
cd scripts/visual-test/screenshots && python3 -m http.server 9090
```

## Scenarios Covered

| Scenario | Description |
|----------|-------------|
| `dashboard-empty` | Empty state, no data |
| `dashboard-with-data` | Dashboard with expenses loaded |
| `guest-warning-modal` | Warning modal for guest users |
| `guest-banner` | Yellow warning banner |
| `auth-modal` | Sign in options modal |
| `expenses-allocation` | Dual-column allocation view |
| `mobile-view` | Responsive mobile layout |

## Visual Checklist

For each scenario, verify:
- [ ] Elements are properly positioned (not overlapping)
- [ ] Modal backgrounds dim correctly
- [ ] Buttons are visible and accessible
- [ ] Text is readable
- [ ] Colors have sufficient contrast
- [ ] Mobile layouts are responsive

## AI Agent Usage

The agent can capture and analyze screenshots:

1. **Capture**: Run `npm run test:visual:analyze` 
2. **Review**: Screenshots saved to `scripts/visual-test/screenshots/`
3. **Base64**: For AI vision analysis, use `.base64` files
4. **Preview**: Open `preview.html` via local server

## Adding New Scenarios

Edit `scripts/visual-test/capture.js` and add to the `scenarios` object:

```javascript
'my-scenario': async (page) => {
  await page.goto(BASE_URL);
  // Setup steps...
  await page.waitForLoadState('networkidle');
},
```
