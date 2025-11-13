/**
 * Shared Test Utilities and Helpers
 *
 * @fileoverview Common utilities, fixtures, and helpers for all test types
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

/**
 * Test Data Fixtures
 */
class TestFixtures {
  static get sampleAmazonOrder() {
    return {
      id: 'test-order-001',
      orderId: '123-4567890-1234567',
      orderDate: '2024-01-15',
      purchaseDate: '2024-01-15',
      paymentsDate: '2024-01-16',
      reportingDate: '2024-01-15',
      promiseDate: '2024-01-20',
      daysPastPromise: 0,
      buyerEmail: 'test@example.com',
      buyerName: 'Test Buyer',
      buyerPhoneNumber: '',
      sku: 'TEST-SKU-001',
      productName: 'Test Product',
      quantityPurchased: 1,
      quantityShipped: 1,
      quantityUnshipped: 0,
      quantityToShip: 0,
      shipServiceLevel: 'Standard',
      recipientName: 'Test Recipient',
      shipAddress1: '123 Test St',
      shipAddress2: '',
      shipAddress3: '',
      shipCity: 'Test City',
      shipState: 'TX',
      shipPostalCode: '12345',
      shipCountry: 'US',
      shipPhoneNumber: '',
      deliveryStartDate: '2024-01-16',
      deliveryEndDate: '2024-01-18',
      deliveryTimeZone: 'PST',
      deliveryInstructions: '',
      price: 29.99,
      priceType: 'Principal',
      priceDesignation: 'ItemPrice',
      tax: 2.40,
      taxType: 'Tax',
      taxDesignation: 'Tax',
      shipping: 0.00,
      shippingType: 'Shipping',
      shippingDesignation: 'Shipping',
      giftWrap: 0.00,
      giftWrapType: 'GiftWrap',
      giftWrapDesignation: 'GiftWrap',
      itemPromotionDiscount: 0.00,
      itemPromotionId: '',
      shipPromotionDiscount: 0.00,
      shipPromotionId: '',
      addressPromotionDiscount: 0.00,
      addressPromotionId: '',
      promotionIds: '',
      isBusinessOrder: true,
      purchaseOrderNumber: '',
      priceDesignator: 'ItemPrice',
      isPrime: false,
      taxOrderLevel: 2.40,
      taxItemLevel: 2.40,
      taxRate: 0.08,
      seller: 'Test Seller',
      sellerCredentials: '',
      category: 'Office Supplies'
    };
  }

  static get sampleExpenditure() {
    return {
      id: 'exp-001',
      date: '2024-01-15',
      amount: 29.99,
      description: 'Test expenditure',
      category: 'Office Supplies',
      vendor: 'Amazon',
      account: 'Business Card',
      taxCategory: 'Business',
      notes: 'Test transaction'
    };
  }

  static get sampleEmployeeBenefitsConfig() {
    return {
      itemAllocations: new Map([
        ['item-001', { benefits: 50, business: 50 }],
        ['item-002', { benefits: 100, business: 0 }]
      ]),
      categoryFilters: ['Office Supplies', 'Kitchen Equipment']
    };
  }

  static get mockApiResponses() {
    return {
      expenditures: [this.sampleExpenditure],
      amazonItems: [this.sampleAmazonOrder],
      analysis: {
        totalSpent: 1000.00,
        categories: { 'Office Supplies': 500.00 },
        monthlyTrends: [],
        topVendors: []
      },
      aiAnalysis: {
        insights: ['Test insight'],
        recommendations: ['Test recommendation'],
        anomalies: []
      }
    };
  }
}

/**
 * HTTP Request Helpers
 */
class HttpHelpers {
  static async waitForEndpoint(url, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) return true;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Endpoint ${url} not available within ${timeout}ms`);
  }

  static async postJson(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  static async getJson(url) {
    const response = await fetch(url);
    return response.json();
  }
}

/**
 * File System Helpers
 */
class FileHelpers {
  static async createTempFile(content, extension = 'json') {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = `test-${Date.now()}.${extension}`;
    const filepath = path.join(tempDir, filename);

    if (typeof content === 'object') {
      fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
    } else {
      fs.writeFileSync(filepath, content);
    }

    return filepath;
  }

  static cleanupTempFiles() {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  static readTestData(filename) {
    const filepath = path.join(__dirname, '..', 'data', filename);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Test data file not found: ${filename}`);
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
}

/**
 * Database Test Helpers
 */
class DatabaseHelpers {
  static async setupTestDatabase() {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB = 'true';

    // Use the database module's test functions
    const { resetTestDatabase } = require('../../src/database');
    resetTestDatabase();
  }

  static async restoreDatabase() {
    // Clear test environment
    delete process.env.NODE_ENV;
    delete process.env.TEST_DB;

    // Reset to empty state (test database will be cleaned up)
    const { resetTestDatabase } = require('../../src/database');
    resetTestDatabase();
  }

  static async insertTestData(data) {
    // Ensure we're in test mode
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB = 'true';

    // Use database module to write test data
    const { writeExpenditures } = require('../../src/database');
    writeExpenditures(data);
  }
}

/**
 * Playwright Page Helpers
 */
class PageHelpers {
  static async waitForAppLoad(page) {
    // Wait for the main navigation to be available. On mobile or when the
    // sidebar is offcanvas, the nav may exist but be hidden; attempt to
    // ensure the sidebar is visible using the app's testing helper if present.
      // Ensure navigation is attached (exists) and main content is visible.
      await page.waitForSelector('#main-navigation', { state: 'attached', timeout: 10000 });
      await page.waitForSelector('.main-content', { state: 'visible', timeout: 15000 });

      // If on a wide viewport and the nav is still hidden, attempt to open it
      try {
        const width = (await page.viewportSize()).width || 1024;
        const navVisible = await page.isVisible('#main-navigation').catch(() => false);
        if (width >= 768 && !navVisible) {
          try { await page.evaluate(() => { if (window.__ensureSidebarState) window.__ensureSidebarState(false); }); } catch (e) {}
          const toggler = await page.$('.navbar-toggler');
          if (toggler) { await toggler.click(); await page.waitForTimeout(300); }
        }
      } catch (e) {}
  }

  static async navigateToSection(page, sectionId) {
    // Click the nav link via DOM so it works even if the nav is offcanvas/hidden
    await page.evaluate((sid) => {
      const link = Array.from(document.querySelectorAll('[data-section]')).find(a => a.getAttribute('data-section') === sid);
      if (link) {
        try { link.click(); } catch (e) { link.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      }
    }, sectionId);
    await page.waitForSelector(`#${sectionId}.active`, { timeout: 7000 });
  }

  static async waitForLoadingComplete(page) {
    await page.waitForFunction(() => {
      const loaders = document.querySelectorAll('.loading-overlay, .spinner-border');
      return loaders.length === 0 || Array.from(loaders).every(el => el.style.display === 'none');
    }, { timeout: 10000 });
  }

  static async fillFormField(page, selector, value) {
    await page.fill(selector, value);
    await page.waitForTimeout(100); // Allow for input validation
  }

  static async clickAndWait(page, selector, waitSelector = null) {
    await page.click(selector);
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 5000 });
    }
  }

  static async ensureSidebarVisible(page) {
    // Try app-provided helper first
    try {
      await page.evaluate(() => { if (window.__ensureSidebarState) window.__ensureSidebarState(false); });
      // short pause for layout
      await page.waitForTimeout(150);
      if (await page.isVisible('#main-navigation')) return;
    } catch (e) {}

    // Try the navbar toggler (common bootstrap pattern)
    try {
      const toggler = await page.$('.navbar-toggler');
      if (toggler) {
        await toggler.click();
        await page.waitForTimeout(300);
        if (await page.isVisible('#main-navigation')) return;
      }
    } catch (e) {}

    // Final fallback: click the first navigation link to force the sidebar to appear
    try {
      await page.evaluate(() => {
        const first = document.querySelector('[data-section]');
        if (first) {
          try { first.click(); } catch (e) { first.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
        }
      });
      await page.waitForTimeout(300);
    } catch (e) {}
  }
}

/**
 * Assertion Helpers
 */
class AssertionHelpers {
  static async assertVisible(page, selector, message = '') {
    const isVisible = await page.isVisible(selector);
    expect(isVisible, message || `Element ${selector} should be visible`).toBe(true);
  }

  static async assertHidden(page, selector, message = '') {
    const isHidden = await page.isHidden(selector);
    expect(isHidden, message || `Element ${selector} should be hidden`).toBe(true);
  }

  static async assertTextContent(page, selector, expectedText, message = '') {
    const textContent = await page.textContent(selector);
    expect(textContent.trim(), message).toBe(expectedText);
  }

  static async assertContainsText(page, selector, expectedText, message = '') {
    const textContent = await page.textContent(selector);
    expect(textContent, message).toContain(expectedText);
  }

  static async assertApiResponse(response, expectedStatus = 200) {
    expect(response.status, `API should return status ${expectedStatus}`).toBe(expectedStatus);
    const contentType = response.headers.get('content-type');
    expect(contentType, 'Response should be JSON').toContain('application/json');
  }
}

/**
 * Performance Helpers
 */
class PerformanceHelpers {
  static async measurePageLoad(page, url) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    return loadTime;
  }

  static async measureApiResponse(url, method = 'GET', data = null) {
    const startTime = Date.now();
    const options = { method };

    if (data && method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    await response.json();
    const responseTime = Date.now() - startTime;

    return { responseTime, status: response.status };
  }
}

module.exports = {
  TestFixtures,
  HttpHelpers,
  FileHelpers,
  DatabaseHelpers,
  PageHelpers,
  AssertionHelpers,
  PerformanceHelpers
};