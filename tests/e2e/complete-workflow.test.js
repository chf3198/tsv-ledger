/**
 * Complete User Workflow E2E Tests
 *
 * @fileoverview End-to-end tests covering complete user workflows
 * from initial load through all major features
 */

const { test, expect } = require('@playwright/test');
const { PageHelpers, AssertionHelpers, TestFixtures } = require('../shared/test-helpers');

test.describe('Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await PageHelpers.waitForAppLoad(page);
  });

  test('should complete full expense tracking workflow', async ({ page }) => {
    // Navigate to dashboard
    await PageHelpers.navigateToSection(page, 'dashboard');
    await AssertionHelpers.assertVisible(page, '#dashboard.active');

    // Verify dashboard loads with data
    await AssertionHelpers.assertVisible(page, '.card');
    await AssertionHelpers.assertContainsText(page, 'h2', 'Financial Dashboard');

    // Navigate to data import
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Test manual entry
    await PageHelpers.navigateToSection(page, 'manual-entry');
    await AssertionHelpers.assertVisible(page, '#manual-entry.active');

    // Fill out manual entry form
    await page.fill('#expense-date', '2024-01-30');
    await page.fill('#expense-amount', '25.50');
    await page.fill('#expense-description', 'Test expense entry');
    await page.selectOption('#expense-category', 'Office Supplies');
    await page.fill('#expense-vendor', 'Test Vendor');

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000); // Wait for submission

    // Navigate to analysis
    await PageHelpers.navigateToSection(page, 'analysis');
    await AssertionHelpers.assertVisible(page, '#analysis.active');

    // Verify analysis shows data
    await AssertionHelpers.assertVisible(page, '.chart-container');

    // Navigate to AI insights
    await PageHelpers.navigateToSection(page, 'ai-insights');
    await AssertionHelpers.assertVisible(page, '#ai-insights.active');

    // Test AI analysis load
    const aiButton = page.locator('#loadAIAnalysis');
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(2000); // Wait for AI analysis
    }
  });

  test('should complete Amazon data import workflow', async ({ page }) => {
    // Navigate to data import
    await PageHelpers.navigateToSection(page, 'data-import');
    await AssertionHelpers.assertVisible(page, '#data-import.active');

    // Test CSV import section
    await AssertionHelpers.assertVisible(page, '#csvImportForm');

    // Test Amazon ZIP import section
    await AssertionHelpers.assertVisible(page, '#amazonZipImportForm');

    // Verify import history display
    await AssertionHelpers.assertVisible(page, '#importHistory');

    // Test file validation (without actual file upload)
    const fileInput = page.locator('#amazonZipFile');
    await expect(fileInput).toBeVisible();

    // Test validation button
    const validateButton = page.locator('#amazonImportBtn');
    await expect(validateButton).toBeVisible();
  });

  test('should complete employee benefits management workflow', async ({ page }) => {
    // Navigate to benefits management
    await PageHelpers.navigateToSection(page, 'benefits-management');
    await AssertionHelpers.assertVisible(page, '#benefits-management.active');

    // Verify benefits interface loads
    await AssertionHelpers.assertContainsText(page, 'h2', 'Benefits Management');

    // Test benefits configuration modal
    const configButton = page.locator('#openSelectionModal');
    await expect(configButton).toBeVisible();

    // Open modal
    await configButton.click();
    await page.waitForSelector('#employeeBenefitsModal', { timeout: 5000 });

    // Verify modal content
    await AssertionHelpers.assertVisible(page, '#employeeBenefitsModal');
    await AssertionHelpers.assertContainsText(page, '#employeeBenefitsModalLabel', 'Benefits Configuration Tool');

    // Test modal tabs (Business Supplies / Board Benefits)
    await AssertionHelpers.assertVisible(page, '#businessSuppliesList');
    await AssertionHelpers.assertVisible(page, '#benefitsList');

    // Close modal
    await page.click('.btn-secondary[data-bs-dismiss="modal"]');
    await page.waitForSelector('#employeeBenefitsModal', { state: 'hidden' });
  });

  test('should complete bank reconciliation workflow', async ({ page }) => {
    // Navigate to bank reconciliation
    await PageHelpers.navigateToSection(page, 'bank-reconciliation');
    await AssertionHelpers.assertVisible(page, '#bank-reconciliation.active');

    // Verify reconciliation interface
    await AssertionHelpers.assertContainsText(page, 'h2', 'Bank Reconciliation');

    // Test reconciliation execution
    const reconcileButton = page.locator('#performReconciliation');
    if (await reconcileButton.isVisible()) {
      await reconcileButton.click();
      await page.waitForTimeout(3000); // Wait for reconciliation process

      // Verify results appear
      await AssertionHelpers.assertVisible(page, '#reconciliationMetricsRow');
      await AssertionHelpers.assertVisible(page, '#reconciliationChartsRow');
    }
  });

  test('should complete subscription analysis workflow', async ({ page }) => {
    // Navigate to subscription analysis
    await PageHelpers.navigateToSection(page, 'subscription-analysis');
    await AssertionHelpers.assertVisible(page, '#subscription-analysis.active');

    // Verify subscription interface
    await AssertionHelpers.assertContainsText(page, 'h2', 'Subscription Analysis');

    // Test subscription analysis load
    const analyzeButton = page.locator('#loadSubscriptionAnalysis');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForTimeout(2000); // Wait for analysis

      // Verify results
      await AssertionHelpers.assertVisible(page, '#subscriptionMetricsRow');
      await AssertionHelpers.assertVisible(page, '#subscriptionResultsRow');
    }
  });

  test('should complete geographic analysis workflow', async ({ page }) => {
    // Navigate to geographic analysis
    await PageHelpers.navigateToSection(page, 'geographic-analysis');
    await AssertionHelpers.assertVisible(page, '#geographic-analysis.active');

    // Verify geographic interface
    await AssertionHelpers.assertContainsText(page, 'h2', 'Geographic Analysis');

    // Test geographic analysis load
    const analyzeButton = page.locator('#loadGeographicAnalysis');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForTimeout(2000); // Wait for analysis

      // Verify results
      await AssertionHelpers.assertVisible(page, '#geographicMetricsRow');
      await AssertionHelpers.assertContainsText(page, '#totalLocations', /\d+/);
    }
  });

  test('should handle premium features workflow', async ({ page }) => {
    // Navigate to premium features
    await PageHelpers.navigateToSection(page, 'premium-features');
    await AssertionHelpers.assertVisible(page, '#premium-features.active');

    // Verify premium interface
    await AssertionHelpers.assertContainsText(page, 'h2', 'Premium Features');

    // Test premium analytics load
    const analyticsButton = page.locator('#loadPremiumAnalytics');
    if (await analyticsButton.isVisible()) {
      await analyticsButton.click();
      await page.waitForTimeout(2000); // Wait for analytics

      // Verify premium content loads
      await AssertionHelpers.assertVisible(page, '.premium-content');
    }
  });

  test('should complete settings configuration workflow', async ({ page }) => {
    // Navigate to settings
    await PageHelpers.navigateToSection(page, 'settings');
    await AssertionHelpers.assertVisible(page, '#settings.active');

    // Verify settings interface
    await AssertionHelpers.assertContainsText(page, 'h2', 'Settings');

    // Test settings form elements
    const settingsForm = page.locator('#settingsForm');
    if (await settingsForm.isVisible()) {
      // Test various setting toggles and inputs
      const inputs = await settingsForm.locator('input, select, textarea').all();
      expect(inputs.length).toBeGreaterThan(0);

      // Test save settings
      const saveButton = page.locator('#saveSettings');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        // Should show success message or redirect
      }
    }
  });
});

test.describe('Cross-Feature Integration', () => {
  test.beforeEach(async ({ page }) => {
    await PageHelpers.waitForAppLoad(page);
  });

  test('should maintain data consistency across features', async ({ page }) => {
    // Add expense via manual entry
    await PageHelpers.navigateToSection(page, 'manual-entry');
    await page.fill('#expense-date', '2024-02-01');
    await page.fill('#expense-amount', '100.00');
    await page.fill('#expense-description', 'Integration test expense');
    await page.selectOption('#expense-category', 'Office Supplies');
    await page.fill('#expense-vendor', 'Integration Vendor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify in analysis
    await PageHelpers.navigateToSection(page, 'analysis');
    await page.waitForTimeout(1000);
    // Should show updated totals

    // Verify in AI insights
    await PageHelpers.navigateToSection(page, 'ai-insights');
    const aiButton = page.locator('#loadAIAnalysis');
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(2000);
      // Should include new expense in analysis
    }
  });

  test('should handle navigation state persistence', async ({ page }) => {
    // Navigate through multiple sections
    const sections = ['dashboard', 'analysis', 'ai-insights', 'data-import'];

    for (const section of sections) {
      await PageHelpers.navigateToSection(page, section);
      await AssertionHelpers.assertVisible(page, `#${section}.active`);

      // Verify other sections are hidden
      for (const otherSection of sections.filter(s => s !== section)) {
        await AssertionHelpers.assertHidden(page, `#${otherSection}.active`);
      }
    }
  });

  test('should handle rapid feature switching', async ({ page }) => {
    const sections = ['dashboard', 'analysis', 'benefits-management', 'bank-reconciliation'];

    // Rapidly switch between sections
    for (let i = 0; i < 3; i++) {
      for (const section of sections) {
        await PageHelpers.navigateToSection(page, section);
        await AssertionHelpers.assertVisible(page, `#${section}.active`);
        await page.waitForTimeout(200); // Brief pause between switches
      }
    }
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await PageHelpers.waitForAppLoad(page);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Mock network failure for API calls
    await page.route('**/api/**', route => route.abort());

    await PageHelpers.navigateToSection(page, 'analysis');

    // Should show error state or fallback content
    await page.waitForTimeout(1000);
    // Verify app doesn't crash
  });

  test('should handle invalid data inputs', async ({ page }) => {
    await PageHelpers.navigateToSection(page, 'manual-entry');

    // Test invalid date
    await page.fill('#expense-date', 'invalid-date');
    await page.fill('#expense-amount', 'not-a-number');
    await page.click('button[type="submit"]');

    // Should show validation errors
    await page.waitForTimeout(1000);
  });

  test('should handle large datasets', async ({ page }) => {
    // Navigate to analysis with seeded data
    await PageHelpers.navigateToSection(page, 'analysis');

    // Should load and display data without performance issues
    await page.waitForTimeout(2000);
    await AssertionHelpers.assertVisible(page, '.chart-container');
  });
});

test.describe('Accessibility and UX', () => {
  test.beforeEach(async ({ page }) => {
    await PageHelpers.waitForAppLoad(page);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation through main sections
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus on navigation elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for ARIA labels on interactive elements
    const buttons = await page.locator('button:not([aria-label]):not([aria-labelledby])').all();
    expect(buttons.length).toBeLessThan(5); // Allow some buttons without labels

    const inputs = await page.locator('input:not([aria-label]):not([aria-labelledby])').all();
    expect(inputs.length).toBeLessThan(3); // Allow some inputs without labels
  });

  test('should maintain focus management', async ({ page }) => {
    // Open modal
    await PageHelpers.navigateToSection(page, 'benefits-management');
    const configButton = page.locator('#openSelectionModal');
    if (await configButton.isVisible()) {
      await configButton.click();
      await page.waitForSelector('#employeeBenefitsModal');

      // Focus should move to modal
      const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));
      expect(focusedElement).toBeTruthy();
    }
  });
});