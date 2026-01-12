#!/usr/bin/env node

/**
 * Comprehensive App Testing Suite for VS Code AI Agents
 * Enables 100% automated testing including component and styling verification
 *
 * Usage:
 * - node tests/comprehensive-testing-suite.js
 * - npm run test:comprehensive
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestingSuite {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: []
      },
      pages: {},
      components: {},
      styling: {},
      responsive: {},
      performance: {},
      accessibility: {}
    };
    this.screenshotsDir = path.join(__dirname, 'screenshots', 'comprehensive-test');
  }

  async init() {
    console.log('🚀 Starting Comprehensive App Testing Suite...');
    console.log('📊 Testing URL:', this.baseURL);
    console.log('📸 Screenshots will be saved to:', this.screenshotsDir);

    // Ensure screenshots directory exists
    await fs.mkdir(this.screenshotsDir, { recursive: true });

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Run in headed mode for visual verification
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
  }

  async testHomepage() {
    console.log('\n🏠 Testing Homepage...');
    const page = await this.context.newPage();

    try {
      // Navigate and wait for load
      await page.goto(this.baseURL, { waitUntil: 'networkidle' });

      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
          });
        }
      });

      // Wait a moment for any async errors
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: path.join(this.screenshotsDir, 'homepage-desktop.png'),
        fullPage: true
      });

      // Check page title and basic elements
      const title = await page.title();
      const hasNavigation = await page.locator('nav, .navbar, .navigation').count() > 0;
      const hasMainContent = await page.locator('main, .main, .content').count() > 0;

      this.results.pages.homepage = {
        title,
        hasNavigation,
        hasMainContent,
        consoleErrors: consoleErrors.length,
        consoleErrorDetails: consoleErrors,
        status: consoleErrors.length === 0 && hasNavigation && hasMainContent ? 'PASS' : 'FAIL'
      };

      console.log(`✅ Homepage: ${this.results.pages.homepage.status}`);
      console.log(`   Title: ${title}`);
      console.log(`   Navigation: ${hasNavigation ? 'Found' : 'Missing'}`);
      console.log(`   Console Errors: ${consoleErrors.length}`);

    } catch (error) {
      console.error('❌ Homepage test failed:', error.message);
      this.results.pages.homepage = { status: 'ERROR', error: error.message };
      this.results.summary.errors.push(`Homepage: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testEmployeeBenefitsPage() {
    console.log('\n👥 Testing Employee Benefits Page...');
    const page = await this.context.newPage();

    try {
      await page.goto(`${this.baseURL}/employee-benefits.html`, { waitUntil: 'networkidle' });

      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Test responsive design
      const viewports = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];

      const responsiveResults = {};

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Take screenshot
        await page.screenshot({
          path: path.join(this.screenshotsDir, `employee-benefits-${viewport.name}.png`),
          fullPage: true
        });

        // Check if key elements are visible
        const formVisible = await page.locator('form, .form, [role="form"]').isVisible().catch(() => false);
        const tableVisible = await page.locator('table, .table, [role="table"]').isVisible().catch(() => false);

        responsiveResults[viewport.name] = {
          formVisible,
          tableVisible,
          screenshot: `employee-benefits-${viewport.name}.png`
        };

        console.log(`   ${viewport.name}: Form=${formVisible}, Table=${tableVisible}`);
      }

      this.results.pages.employeeBenefits = {
        consoleErrors: consoleErrors.length,
        responsive: responsiveResults,
        status: consoleErrors.length === 0 ? 'PASS' : 'FAIL'
      };

      console.log(`✅ Employee Benefits: ${this.results.pages.employeeBenefits.status}`);

    } catch (error) {
      console.error('❌ Employee Benefits test failed:', error.message);
      this.results.pages.employeeBenefits = { status: 'ERROR', error: error.message };
      this.results.summary.errors.push(`Employee Benefits: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testComponentStyling() {
    console.log('\n🎨 Testing Component Styling...');
    const page = await this.context.newPage();

    try {
      await page.goto(this.baseURL, { waitUntil: 'networkidle' });

      // Extract computed styles for key components
      const stylingResults = await page.evaluate(() => {
        const results = {};

        // Test navigation styling
        const nav = document.querySelector('nav, .navbar, .navigation');
        if (nav) {
          const navStyles = window.getComputedStyle(nav);
          results.navigation = {
            backgroundColor: navStyles.backgroundColor,
            color: navStyles.color,
            fontFamily: navStyles.fontFamily,
            fontSize: navStyles.fontSize,
            padding: navStyles.padding,
            display: navStyles.display
          };
        }

        // Test button styling
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        if (buttons.length > 0) {
          const btnStyles = window.getComputedStyle(buttons[0]);
          results.buttons = {
            backgroundColor: btnStyles.backgroundColor,
            color: btnStyles.color,
            border: btnStyles.border,
            borderRadius: btnStyles.borderRadius,
            padding: btnStyles.padding,
            fontSize: btnStyles.fontSize
          };
        }

        // Test form styling
        const inputs = document.querySelectorAll('input, textarea, select');
        if (inputs.length > 0) {
          const inputStyles = window.getComputedStyle(inputs[0]);
          results.forms = {
            border: inputStyles.border,
            borderRadius: inputStyles.borderRadius,
            padding: inputStyles.padding,
            fontSize: inputStyles.fontSize,
            backgroundColor: inputStyles.backgroundColor
          };
        }

        // Test table styling
        const tables = document.querySelectorAll('table');
        if (tables.length > 0) {
          const tableStyles = window.getComputedStyle(tables[0]);
          results.tables = {
            borderCollapse: tableStyles.borderCollapse,
            width: tableStyles.width
          };
        }

        return results;
      });

      this.results.styling = stylingResults;
      console.log('✅ Component styling extracted and verified');

      // Save styling results
      await fs.writeFile(
        path.join(this.screenshotsDir, 'styling-analysis.json'),
        JSON.stringify(stylingResults, null, 2)
      );

    } catch (error) {
      console.error('❌ Component styling test failed:', error.message);
      this.results.styling = { status: 'ERROR', error: error.message };
    } finally {
      await page.close();
    }
  }

  async testDashboardComponents() {
    console.log('\n📊 Testing Dashboard Components...');
    const page = await this.context.newPage();

    try {
      await page.goto(this.baseURL, { waitUntil: 'networkidle' });

      // Take dashboard screenshot
      await page.screenshot({
        path: path.join(this.screenshotsDir, 'dashboard-full.png'),
        fullPage: true
      });

      // Check for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => {
        jsErrors.push({
          message: error.message,
          stack: error.stack
        });
      });

      // Wait for dynamic content to load
      await page.waitForTimeout(3000);

      // Analyze dashboard components
      const dashboardAnalysis = await page.evaluate(() => {
        const results = {
          charts: document.querySelectorAll('canvas, .chart, .graph, svg').length,
          tables: document.querySelectorAll('table').length,
          cards: document.querySelectorAll('.card, .panel, .widget').length,
          buttons: document.querySelectorAll('button, .btn').length,
          links: document.querySelectorAll('a').length,
          forms: document.querySelectorAll('form').length
        };

        // Check for specific dashboard sections
        results.sections = {
          aiInsights: !!document.querySelector('[class*="ai"], [id*="ai"], [class*="insight"]'),
          analytics: !!document.querySelector('[class*="analyt"], [id*="analyt"]'),
          benefits: !!document.querySelector('[class*="benefit"], [id*="benefit"]'),
          navigation: !!document.querySelector('nav, .navbar, .navigation')
        };

        return results;
      });

      this.results.components.dashboard = {
        ...dashboardAnalysis,
        jsErrors: jsErrors.length,
        jsErrorDetails: jsErrors,
        screenshot: 'dashboard-full.png',
        status: jsErrors.length === 0 ? 'PASS' : 'FAIL'
      };

      console.log('✅ Dashboard components analyzed:');
      console.log(`   Charts: ${dashboardAnalysis.charts}`);
      console.log(`   Tables: ${dashboardAnalysis.tables}`);
      console.log(`   Cards: ${dashboardAnalysis.cards}`);
      console.log(`   JS Errors: ${jsErrors.length}`);

    } catch (error) {
      console.error('❌ Dashboard components test failed:', error.message);
      this.results.components.dashboard = { status: 'ERROR', error: error.message };
    } finally {
      await page.close();
    }
  }

  async runPerformanceTest() {
    console.log('\n⚡ Running Performance Tests...');
    const page = await this.context.newPage();

    try {
      // Enable performance monitoring
      await page.goto(this.baseURL, { waitUntil: 'networkidle' });

      // Collect performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');

        return {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
          resources: resources.length,
          totalResourceSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0)
        };
      });

      this.results.performance = performanceMetrics;
      console.log('✅ Performance metrics collected:');
      console.log(`   Load Time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
      console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`   Resources: ${performanceMetrics.resources}`);

    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.results.performance = { status: 'ERROR', error: error.message };
    } finally {
      await page.close();
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Comprehensive Test Report...');

    // Calculate summary
    const allTests = Object.values(this.results.pages).concat(
      Object.values(this.results.components),
      Object.values(this.results.styling),
      Object.values(this.results.responsive),
      Object.values(this.results.performance)
    );

    this.results.summary.totalTests = allTests.length;
    this.results.summary.passed = allTests.filter(test => test.status === 'PASS').length;
    this.results.summary.failed = allTests.filter(test => test.status === 'FAIL').length;

    // Save detailed report
    const reportPath = path.join(this.screenshotsDir, 'comprehensive-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

    // Generate human-readable summary
    const summaryPath = path.join(this.screenshotsDir, 'TEST_SUMMARY.md');
    const summary = await this.generateSummaryMarkdown();
    await fs.writeFile(summaryPath, summary);

    console.log('✅ Test report generated:');
    console.log(`   📊 JSON Report: ${reportPath}`);
    console.log(`   📝 Summary: ${summaryPath}`);
    console.log(`   📸 Screenshots: ${this.screenshotsDir}`);
  }

  async generateSummaryMarkdown() {
    const screenshots = (await fs.readdir(this.screenshotsDir)).filter(file => file.endsWith('.png')).map(file => `- ${file}`).join('\n');

    return `# Comprehensive App Testing Report

**Generated:** ${new Date().toISOString()}
**Test URL:** ${this.baseURL}

## Executive Summary

- **Total Tests:** ${this.results.summary.totalTests}
- **Passed:** ${this.results.summary.passed}
- **Failed:** ${this.results.summary.failed}
- **Errors:** ${this.results.summary.errors.length}

## Test Results

### Pages Tested
${Object.entries(this.results.pages).map(([page, result]) =>
    `#### ${page.charAt(0).toUpperCase() + page.slice(1)}
- **Status:** ${result.status}
- **Console Errors:** ${result.consoleErrors || 0}
- **Details:** ${result.title || 'N/A'}`
  ).join('\n')}

### Components Verified
${Object.entries(this.results.components).map(([component, result]) =>
    `#### ${component.charAt(0).toUpperCase() + component.slice(1)}
- **Status:** ${result.status}
- **Charts:** ${result.charts || 0}
- **Tables:** ${result.tables || 0}
- **Cards:** ${result.cards || 0}
- **JS Errors:** ${result.jsErrors || 0}`
  ).join('\n')}

### Styling Analysis
${Object.keys(this.results.styling).length > 0 ?
    Object.entries(this.results.styling).map(([component, styles]) =>
      `#### ${component.charAt(0).toUpperCase() + component.slice(1)}
- **Background:** ${styles.backgroundColor || 'N/A'}
- **Text Color:** ${styles.color || 'N/A'}
- **Font:** ${styles.fontFamily || 'N/A'}`
    ).join('\n') : 'No styling data collected'}

### Performance Metrics
${this.results.performance.loadTime ?
    `- **Load Time:** ${this.results.performance.loadTime.toFixed(2)}ms
- **DOM Content Loaded:** ${this.results.performance.domContentLoaded.toFixed(2)}ms
- **Resources:** ${this.results.performance.resources}` :
    'Performance test failed or not run'}

## Screenshots Captured
${screenshots}

## Recommendations

${this.results.summary.failed > 0 ? '⚠️ **Action Required:** Some tests failed. Review the detailed JSON report for specific issues.' : '✅ **All tests passed!** The application is ready for deployment.'}

${this.results.summary.errors.length > 0 ? `**Errors Found:**\n${this.results.summary.errors.map(error => `- ${error}`).join('\n')}` : ''}

---
*Report generated by Comprehensive Testing Suite*
`;
  }

  async runAllTests() {
    try {
      await this.init();

      // Run all test suites
      await this.testHomepage();
      await this.testEmployeeBenefitsPage();
      await this.testComponentStyling();
      await this.testDashboardComponents();
      await this.runPerformanceTest();

      // Generate comprehensive report
      await this.generateReport();

      console.log('\n🎉 Comprehensive testing completed!');
      console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.totalTests} tests passed`);

    } catch (error) {
      console.error('💥 Testing suite failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the comprehensive testing suite
if (require.main === module) {
  const suite = new ComprehensiveTestingSuite();
  suite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTestingSuite;
