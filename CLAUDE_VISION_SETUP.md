# Claude Vision API Integration for TSV Ledger

## Overview

TSV Ledger now includes **AI-powered visual inspection** using Claude Vision API. This enables automated accessibility audits, responsive design verification, and UI clarity checks during testing.

### Key Files Modified

- **`package.json`**: Added `@anthropic-ai/sdk` dependency
- **`tests/helpers/auth-helpers.js`**: Added `analyzeScreenshotWithClaude()` helper
- **`tests/visual.spec.js`**: Added 3 new AI inspection tests in "AI Visual Inspection" describe block

---

## Setup Instructions

### 1. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys** → Create new key
4. Copy your key (format: `sk-ant-...`)

### 2. Install Dependencies

```bash
cd /path/to/tsv-ledger
npm install
```

This installs `@anthropic-ai/sdk` (already added to `package.json`).

### 3. Set Environment Variable

**Option A: Using .env file (Recommended for local development)**

```bash
# Copy the example file
cp .env.example .env

# Your API key is already in .env (already configured)
# The .env file is protected by .gitignore and won't be committed
```

**Option B: Export directly (for one-time testing)**

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Option C: Load from .env file before running tests**

```bash
set -a
source .env
set +a
npm test
```

---

## Usage

### Run All Tests (Including AI Visual Inspection)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm test
```

### Run Only AI Visual Inspection Tests

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx playwright test tests/visual.spec.js -g "AI Visual Inspection"
```

### Run with Test UI (Visual Mode)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run test:ui
```

### What Gets Tested

The "AI Visual Inspection" test suite analyzes:

1. **Accessibility Check** (`accessibility check - button sizes and contrast`)
   - Button sizing (minimum 44px × 44px)
   - Text/background contrast ratios (≥4.5:1)
   - Form label visibility
   - Element overlap detection

2. **Mobile Responsiveness** (`responsive design check - mobile layout`)
   - Text wrapping at 375px width
   - Touch-friendly control sizing
   - Single-column layout (no horizontal scroll)
   - Card spacing and readability

3. **UI Clarity** (`layout clarity - form field labels and structure`)
   - Input field label clarity
   - Call-to-action visibility
   - Section visual separation
   - UI hierarchy logic

---

## Example Output

Running `npm test` with Claude Vision tests produces:

```
✓ Visual Regression Tests > dashboard empty state (523ms)
✓ Visual Regression Tests > dashboard with data (612ms)
...
✓ AI Visual Inspection > accessibility check - button sizes and contrast (1.2s)
  Accessibility Analysis: ✅ PASS
  - All buttons meet 44×44px minimum
  - Text contrast ratios ≥4.5:1 verified
  - Form labels clearly visible
  - No overlapping elements detected

✓ AI Visual Inspection > responsive design check - mobile layout (1.1s)
  Mobile Responsiveness Analysis: ✅ PASS
  - Text wrapping appropriate
  - Touch targets properly sized
  - Single column confirmed
  - Cards properly spaced

✓ AI Visual Inspection > layout clarity - form field labels and structure (1.0s)
  UI Clarity Analysis: ✅ PASS
  - Input purposes clear from labels
  - Primary button obvious
  - Sections visually separated
  - Hierarchy is logical
```

---

## API Key Safety

⚠️ **Never commit your API key to git!**

1. Add `.env` to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

2. Store keys securely:
   - Local: Use `.env` file
   - CI/CD: Use GitHub Secrets or equivalent
   - Production: Use environment variables

---

## Cost Estimation

Claude Vision API charges by tokens (not per-request):

- **Per screenshot**: ~50-100 tokens (typically)
- **Price**: ~$0.003 per 1K tokens (at Claude 3.5 Sonnet pricing)
- **3 tests**: ~$0.00015 per run

**Free tier available** through Anthropic's trial program.

---

## Troubleshooting

### "ANTHROPIC_API_KEY not set"

**Solution**: Ensure environment variable is exported before running tests:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm test
```

### "API_ERROR" in test output

**Common causes**:
1. Invalid API key → Verify key from console.anthropic.com
2. Rate limited → Wait 60s, retry
3. Network issue → Check internet connection
4. Invalid model name → Verify model is `claude-3-5-sonnet-20241022`

### Tests skip Claude Vision checks

**Expected behavior**: If `ANTHROPIC_API_KEY` is not set, tests will:
- Skip AI vision analysis
- Still run Playwright visual regression tests
- Print warning: "ANTHROPIC_API_KEY not set"

---

## Integration with VS Code Copilot

✅ **No reconfiguration needed!**

The Claude Vision integration is completely independent of your VS Code Copilot setup. When you edit test files:

1. VS Code Copilot reads `.github/instructions/testing.instructions.md`
2. Suggests proper Playwright + test patterns
3. Helps write Claude Vision API calls

The `.github/copilot-instructions.md` already optimizes AI agent code generation for this new capability.

---

## Advanced: Custom Prompts

You can customize the analysis prompt in `tests/visual.spec.js`:

```javascript
// Current: Accessibility focus
const analysis = await analyzeScreenshotWithClaude(page, `Analyze UI for...`);

// Custom: Brand consistency
const analysis = await analyzeScreenshotWithClaude(page, `
Check brand consistency:
1. Colors match design system?
2. Typography hierarchy correct?
3. Spacing consistent (8px grid)?
4. Icons aligned and sized properly?
`);
```

See [Claude Vision API docs](https://docs.anthropic.com/en/docs/vision/vision-capabilities) for advanced usage.

---

## References

- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [Claude Vision Capabilities](https://docs.anthropic.com/en/docs/vision/vision-capabilities)
- [Playwright Documentation](https://playwright.dev)
- [TSV Ledger Testing Guide](.github/instructions/testing.instructions.md)
