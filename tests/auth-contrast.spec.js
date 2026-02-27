/**
 * Auth Button Contrast Tests - WCAG accessibility checks
 * ADR-019: OAuth Integration
 */
const { test, expect } = require('@playwright/test');
const { BASE_URL, waitForAlpine } = require('./helpers/auth-helpers');

test.describe('Auth Button Contrast', () => {
  test('Sign In text has WCAG AA contrast (4.5:1)', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAlpine(page);

    const contrast = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="auth-button"]');
      const header = document.querySelector('.app-header');
      const btnStyle = window.getComputedStyle(btn);
      const headerStyle = window.getComputedStyle(header);
      const parseColor = (c) => { const m = c.match(/\d+/g); return m ? { r: +m[0], g: +m[1], b: +m[2] } : null; };
      const textColor = parseColor(btnStyle.color);
      const bgColor = parseColor(headerStyle.backgroundColor);
      const luminance = (c) => {
        const [rs, gs, bs] = [c.r/255, c.g/255, c.b/255].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
        return 0.2126*rs + 0.7152*gs + 0.0722*bs;
      };
      const l1 = luminance(textColor), l2 = luminance(bgColor);
      return { ratio: ((Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05)).toFixed(2) };
    });

    expect(parseFloat(contrast.ratio)).toBeGreaterThanOrEqual(4.5);
  });
});
