// @ts-check
const { test, expect } = require('@playwright/test');
/** ADR-017: Payment Method Purge E2E Tests */

test.describe('Payment Method Purge', () => {
  test.beforeEach(async ({ page }) => {
    const testExpenses = [
      { id: 'amz-1', date: '2026-01-15', description: 'Business Item 1', amount: 100, businessPercent: 100, paymentMethod: 'MasterCard - 5795' },
      { id: 'amz-2', date: '2026-01-16', description: 'Business Item 2', amount: 200, businessPercent: 100, paymentMethod: 'MasterCard - 5795' },
      { id: 'amz-3', date: '2026-01-17', description: 'Personal Item 1', amount: 50, businessPercent: 100, paymentMethod: 'Visa - 3889' },
      { id: 'amz-4', date: '2026-01-18', description: 'Personal Item 2', amount: 75, businessPercent: 100, paymentMethod: 'Visa - 3889' },
      { id: 'amz-5', date: '2026-01-19', description: 'Whole Foods Item', amount: 25, businessPercent: 100, paymentMethod: 'panda01' },
    ];
    await page.goto('/');
    await page.evaluate((exp) => {
      localStorage.setItem('tsv-expenses', JSON.stringify(exp));
      // Acknowledge guest mode to prevent modal blocking tests
      localStorage.setItem('tsv-guest-acknowledged', 'true');
    }, testExpenses);
    await page.reload();
  });

  test('displays payment methods in Settings with counts and totals', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await expect(page.getByTestId('payment-methods-section')).toBeVisible();
    await expect(page.getByTestId('payment-method-row')).toHaveCount(3);
    const mc5795 = page.locator('[data-payment="MasterCard - 5795"]');
    await expect(mc5795.getByTestId('item-count')).toContainText('2');
    await expect(mc5795.getByTestId('total-amount')).toContainText('$300');
    const visa = page.locator('[data-payment="Visa - 3889"]');
    await expect(visa.getByTestId('item-count')).toContainText('2');
    await expect(visa.getByTestId('total-amount')).toContainText('$125');
    const panda = page.locator('[data-payment="panda01"]');
    await expect(panda.getByTestId('item-count')).toContainText('1');
    await expect(panda.getByTestId('total-amount')).toContainText('$25');
  });

  test('shows confirmation dialog when clicking Remove', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await page.locator('[data-payment="Visa - 3889"]').getByTestId('remove-btn').click();
    await expect(page.getByTestId('purge-confirm-dialog')).toBeVisible();
    await expect(page.getByTestId('purge-confirm-dialog')).toContainText('Visa - 3889');
    await expect(page.getByTestId('purge-confirm-dialog')).toContainText('2 expenses');
    await expect(page.getByTestId('purge-confirm-dialog')).toContainText('$125');
  });

  test('canceling confirmation does not remove expenses', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await page.locator('[data-payment="Visa - 3889"]').getByTestId('remove-btn').click();
    await page.getByTestId('purge-cancel-btn').click();
    await expect(page.getByTestId('purge-confirm-dialog')).not.toBeVisible();
    const expenses = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    expect(expenses).toHaveLength(5);
  });

  test('confirming removal purges expenses by payment method', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await page.locator('[data-payment="Visa - 3889"]').getByTestId('remove-btn').click();
    await page.getByTestId('purge-confirm-btn').click();
    await expect(page.getByTestId('purge-confirm-dialog')).not.toBeVisible();
    await expect(page.getByTestId('payment-method-row')).toHaveCount(2);
    await expect(page.locator('[data-payment="Visa - 3889"]')).not.toBeVisible();
    const expenses = await page.evaluate(() => JSON.parse(localStorage.getItem('tsv-expenses') || '[]'));
    expect(expenses).toHaveLength(3);
    expect(expenses.every(e => e.paymentMethod !== 'Visa - 3889')).toBe(true);
  });

  test('panda01 is labeled as Whole Foods in-store', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    await expect(page.locator('[data-payment="panda01"]')).toContainText('Whole Foods');
  });
});
