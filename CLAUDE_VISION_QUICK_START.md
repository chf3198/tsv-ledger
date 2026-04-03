# Claude Vision API Implementation - Quick Start

## ✅ What Was Implemented

### 1. **Dependency Added**
- File: [`package.json`](package.json#L20)
- Dependency: `@anthropic-ai/sdk@^0.24.3`
- Purpose: Official Anthropic SDK for Claude Vision API

### 2. **Helper Function Created**
- File: [`tests/helpers/auth-helpers.js`](tests/helpers/auth-helpers.js#L56)
- Function: `analyzeScreenshotWithClaude(page, prompt)`
- Features:
  - Gracefully handles missing API key
  - Takes page screenshot (base64 encoded)
  - Sends to Claude 3.5 Sonnet Vision model
  - Returns analysis text or error status
  - Documented with JSDoc

### 3. **Three AI Visual Inspection Tests**
- File: [`tests/visual.spec.js`](tests/visual.spec.js#L113-L184)
- Test Suite: "AI Visual Inspection"
- Tests:
  1. **Accessibility Check** - Button sizing, contrast ratios, form labels
  2. **Mobile Responsiveness** - Layout at 375px, touch targets, wrapping
  3. **UI Clarity** - Label visibility, CTA prominence, hierarchy

### 4. **Setup Documentation**
- File: [`CLAUDE_VISION_SETUP.md`](CLAUDE_VISION_SETUP.md)
- Complete guide with API key setup, usage, troubleshooting, cost estimation

---

## 🚀 How to Get Started

### Step 1: Get an API Key (2 min)
```bash
# Visit https://console.anthropic.com
# Create API key → Copy it
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 2: Install Dependencies (1 min)
```bash
cd /path/to/tsv-ledger
npm install  # Installs @anthropic-ai/sdk
```

### Step 3: Run Tests (1-2 min)
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
npm test
```

### Step 4: View Results
Tests output AI analysis directly to console:
```
✓ AI Visual Inspection > accessibility check (1.2s)
  Accessibility Analysis: ✅ PASS
  - All buttons meet 44×44px minimum
  - Text contrast ratios ≥4.5:1 verified
  - Form labels clearly visible
```

---

## 📋 What Each Test Does

| Test | Purpose | Checks |
|------|---------|--------|
| **Accessibility Check** | WCAG 2.1 compliance | Button size, contrast, labels, overlaps |
| **Mobile Responsiveness** | 375px viewport | Text wrapping, touch targets, layout |
| **UI Clarity** | UX usability | Label clarity, CTA visibility, hierarchy |

---

## 🔧 Advanced Usage

### Run Only AI Tests
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx playwright test tests/visual.spec.js -g "AI Visual Inspection"
```

### Run with Test UI
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run test:ui
```

### Skip AI Tests (without API key)
```bash
npm test  # Works fine, just skips Claude Vision tests
```

### Customize Analysis Prompts
Edit `tests/visual.spec.js` line ~140 to change what Claude analyzes:
```javascript
const analysis = await analyzeScreenshotWithClaude(page, `
Your custom analysis prompt here:
1. Check X
2. Check Y
3. Check Z
`);
```

---

## 📊 Integration with Existing Setup

✅ **VS Code Copilot**: No reconfiguration needed
- `.github/copilot-instructions.md` already optimized
- When editing test files, Copilot suggests proper patterns

✅ **Playwright Tests**: Runs alongside existing visual regression tests
- Existing snapshot tests continue to work
- AI tests are separate describe block
- Both can run together: `npm test`

✅ **CI/CD Ready**: Just add to GitHub Actions
```yaml
- name: Run Tests with Claude Vision
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npm test
```

---

## 💰 Cost Estimate

- **Per test run**: ~$0.0001-0.0005
- **Free tier**: Available through Anthropic trial
- **Production cost**: Negligible (~$0.01/month for daily testing)

---

## 🐛 If Tests Fail

| Issue | Solution |
|-------|----------|
| `API_UNAVAILABLE` | Export `ANTHROPIC_API_KEY=sk-ant-...` |
| `API_ERROR` | Check key validity, rate limits, network |
| Permission error on npm install | Clean: `rm -rf node_modules && npm install` |
| Playwright timeout | Increase timeout: `test.setTimeout(60000)` |

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| [package.json](package.json#L20) | SDK dependency |
| [tests/helpers/auth-helpers.js](tests/helpers/auth-helpers.js#L56) | Claude Vision helper function |
| [tests/visual.spec.js](tests/visual.spec.js#L113) | AI inspection tests |
| [CLAUDE_VISION_SETUP.md](CLAUDE_VISION_SETUP.md) | Full setup guide |

---

## ✨ Next Steps

1. **Get API key** from https://console.anthropic.com
2. **Test locally**: `export ANTHROPIC_API_KEY=... && npm test`
3. **Verify output**: Check console for accessibility/responsiveness analysis
4. **Add to CI**: Commit changes, add API key to GitHub Secrets
5. **Iterate**: Customize prompts for your UX needs

---

**Questions?** See [CLAUDE_VISION_SETUP.md](CLAUDE_VISION_SETUP.md) for detailed troubleshooting.
