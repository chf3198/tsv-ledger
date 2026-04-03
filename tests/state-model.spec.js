/**
 * State Model Tests (ADR-029)
 * Validates storageIntent, sessionState, dataAuthority derivation.
 */
const { test, expect } = require('@playwright/test');

function getAlpineState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[x-data]');
    return el?._x_dataStack?.[0];
  });
}

test.describe('Explicit State Model (ADR-029)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('storageIntent replaces storageMode in state', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    const state = await getAlpineState(page);
    expect(state.storageIntent).toBe('local');
    expect(state.storageMode).toBeUndefined();
  });

  test('sessionState starts as unauthenticated when no session token', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    const state = await getAlpineState(page);
    expect(state.sessionState).toBe('unauthenticated');
  });

  test('dataAuthority is local when storageIntent is local', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 't1', date: '2026-01-01', description: 'Test', amount: 10 }
      ]));
    });
    await page.reload();
    const state = await getAlpineState(page);
    expect(state.dataAuthority).toBe('local');
  });

  test('dataAuthority is none when cloud-intent and unauthenticated', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'cloud');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    const state = await getAlpineState(page);
    expect(state.dataAuthority).toBe('none');
  });

  test('dataAuthority is none when storageIntent is null', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    const state = await getAlpineState(page);
    expect(state.dataAuthority).toBe('none');
  });

  test('local mode banner uses dataAuthority not storageMode', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
      localStorage.setItem('tsv-expenses', JSON.stringify([
        { id: 't1', date: '2026-01-01', description: 'Local item', amount: 10 }
      ]));
    });
    await page.reload();
    await expect(page.locator('.guest-warning-banner')).toBeVisible();
    await expect(page.locator('.guest-warning-banner')).toContainText('Local Mode');
  });

  test('migration: existing tsv-storage-mode=local reads as storageIntent=local', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tsv-storage-mode', 'local');
      localStorage.setItem('tsv-onboarding-complete', 'true');
    });
    await page.reload();
    const intent = await page.evaluate(() => {
      const el = document.querySelector('[x-data]');
      return el?._x_dataStack?.[0]?.storageIntent;
    });
    expect(intent).toBe('local');
  });
});
