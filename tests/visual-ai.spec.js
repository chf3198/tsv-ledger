// @ts-check
const { test, expect } = require('@playwright/test');
const { analyzeScreenshotWithClaude } = require('./helpers/auth-helpers');

/**
 * AI-Powered Visual Inspection Tests (Claude Vision API)
 * Separate from visual-regression.spec.js to stay within 100-line constraint
 * Requires: export ANTHROPIC_API_KEY=sk-ant-... before running
 */

test.describe('AI Visual Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://tsv-ledger.pages.dev');
  });

  test('accessibility check - button sizes and contrast', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Office Supplies', date: '2026-02-20', amount: 150, businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Analyze this expense tracking UI for accessibility:
1. Are all buttons large enough (minimum 44px × 44px)?
2. Are text and background colors contrasting well (≥4.5:1 ratio)?
3. Are form labels visible and associated with inputs?
4. Any overlapping or hidden elements?
Report issues found. Format: "✅ PASS" or "❌ ISSUE: description"`);

    expect(analysis).not.toContain('API_UNAVAILABLE');
    expect(analysis).not.toContain('API_ERROR');
    console.log('Accessibility Analysis:', analysis);
  });

  test('responsive design check - mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 'test-1', description: 'Team Lunch', date: '2026-02-20', amount: 75, businessPercent: 50 },
        { id: 'test-2', description: 'Office Supplies', date: '2026-02-19', amount: 150, businessPercent: 100 }
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Check mobile (375px) responsiveness:
1. Does text fit without wrapping awkwardly?
2. Are buttons/controls touch-friendly (large enough to tap)?
3. Is layout single-column (no horizontal scroll needed)?
4. Are expense cards readable and properly spaced?
Report findings: "✅ PASS" or "❌ ISSUE: description"`);

    console.log('Mobile Responsiveness Analysis:', analysis);
  });

  test('layout clarity - form field labels and structure', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const analysis = await analyzeScreenshotWithClaude(page, `Review form and UI structure clarity:
1. Are input field purposes clear from visible labels?
2. Is the call-to-action (primary button) obvious?
3. Are different sections visually separated?
4. Is the UI hierarchy logical (heading, form, actions)?
Report: "✅ PASS" or "❌ ISSUE: description"`);

    console.log('UI Clarity Analysis:', analysis);
  });
});
