/**
 * Data Import UX Tests
 *
 * Tests for data import workflows including CSV, ZIP, and manual entry
 */

const path = require('path');
const fs = require('fs');
const BaseUXTest = require('./base-test-utils');

/**
 * Data import workflow tests
 */
class DataImportTests extends BaseUXTest {
  /**
   * Runs all data import workflow tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.testCsvDataImport();
    await this.testAmazonZipImport();
    await this.testManualExpenseEntry();
  }

  /**
   * Tests CSV data import via UI
   * @returns {Promise<void>}
   */
  async testCsvDataImport() {
    await this.runTest('CSV Data Import', async () => {
      await this.navigateToPage('/');
      await this.navigateToSection('data-import');

      // Look for CSV file input
      const fileInput = await this.page.$('#csvFile');
      if (!fileInput) {
        return 'CSV file input not found';
      }

      const csvPath = path.join(__dirname, '../data/test-expenditures.csv');
      if (!fs.existsSync(csvPath)) {
        return 'Test CSV file not found';
      }

      // Upload the file
      await fileInput.uploadFile(csvPath);
      this.log('📁 Uploaded CSV file for import');

      // Look for import button and click it
      const importBtn = await this.page.$(
        '#csvImportForm button[type="submit"]'
      );
      if (importBtn) {
        await importBtn.click();
        await this.page.waitForTimeout(2000);
      }

      // Check if import was successful (look for success message or updated data)
      const successIndicators = await this.page.$$('.alert-success, .success');
      const importStatusSuccess = await this.page.evaluate(() => {
        const status = document.getElementById('importStatus');
        return status && status.textContent.toLowerCase().includes('success');
      });
      return successIndicators.length > 0 || importStatusSuccess;
    });
  }

  /**
   * Tests Amazon ZIP import via UI
   * @returns {Promise<void>}
   */
  async testAmazonZipImport() {
    await this.runTest('Amazon ZIP Import', async () => {
      await this.navigateToPage('/');
      await this.navigateToSection('data-import');

      // Look for Amazon ZIP import form
      const zipForm = await this.page.$('#amazonZipImportForm');
      if (!zipForm) {
        return 'Amazon ZIP import form not found';
      }

      // For now, just verify the form exists and is accessible
      const zipInput = await this.page.$('#amazonZipFile');
      return !!zipInput;
    });
  }

  /**
   * Tests manual expense entry
   * @returns {Promise<void>}
   */
  async testManualExpenseEntry() {
    await this.runTest('Manual Expense Entry', async () => {
      await this.navigateToPage('/');
      await this.navigateToSection('manual-entry');

      // Look for expense entry form
      const expenseForm = await this.page.$('#expenditureForm');
      if (!expenseForm) {
        return 'Expense entry form not found';
      }

      // Try to fill out a test expense
      const dateField = await this.page.$('#date');
      const amountField = await this.page.$('#amount');
      const descField = await this.page.$('#description');
      const categoryField = await this.page.$('#category');

      if (dateField && amountField && descField && categoryField) {
        await this.fillFormField('#date', '2025-01-20', 'date field');
        await this.fillFormField('#amount', '45.67', 'amount field');
        await this.fillFormField(
          '#description',
          'UX Test Expense',
          'description field'
        );
        await this.page.select('#category', 'tool subscriptions');

        // Look for submit button
        const submitBtn = await this.page.$(
          '#expenditureForm button[type="submit"]'
        );
        if (submitBtn) {
          await submitBtn.click();
          await this.page.waitForTimeout(1000);
          return true;
        }
      }

      return false;
    });
  }
}

module.exports = DataImportTests;
