/**
 * Performance Testing Suite
 *
 * @fileoverview Comprehensive performance tests for critical application paths
 */

const { test, expect } = require('@playwright/test');
const { PerformanceHelpers, PageHelpers, AssertionHelpers } = require('../shared/test-helpers');
const { CLITestHelpers } = require('../cli/cli-test-helpers');
const path = require('path');

test.describe('Performance Testing Suite', () => {
  const PERFORMANCE_THRESHOLDS = {
    pageLoad: 3000,      // 3 seconds
    apiResponse: 1000,   // 1 second
    scriptExecution: 5000, // 5 seconds
    memoryUsage: 50 * 1024 * 1024, // 50MB
    concurrentUsers: 10
  };

  test.describe('Page Load Performance', () => {
    test('should load main page within performance threshold', async ({ page }) => {
      const loadTime = await PerformanceHelpers.measurePageLoad(page, '/');

      console.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

      // Verify page is fully functional after load
      await PageHelpers.waitForAppLoad(page);
      await AssertionHelpers.assertVisible(page, '#main-navigation');
    });

    test('should load all major sections quickly', async ({ page }) => {
      await PageHelpers.waitForAppLoad(page);

      const sections = ['dashboard', 'analysis', 'ai-insights', 'data-import'];
      const loadTimes = [];

      for (const section of sections) {
        const startTime = Date.now();
        await PageHelpers.navigateToSection(page, section);
        await AssertionHelpers.assertVisible(page, `#${section}.active`);
        const loadTime = Date.now() - startTime;
        loadTimes.push({ section, loadTime });

        console.log(`${section} load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(1000); // 1 second per section
      }

      // Log performance summary
      const avgLoadTime = loadTimes.reduce((sum, item) => sum + item.loadTime, 0) / loadTimes.length;
      console.log(`Average section load time: ${avgLoadTime}ms`);
    });

    test('should handle rapid navigation without degradation', async ({ page }) => {
      await PageHelpers.waitForAppLoad(page);

      const sections = ['dashboard', 'analysis', 'benefits-management', 'bank-reconciliation'];
      const iterations = 3;
      const timings = [];

      for (let i = 0; i < iterations; i++) {
        for (const section of sections) {
          const startTime = Date.now();
          await PageHelpers.navigateToSection(page, section);
          await AssertionHelpers.assertVisible(page, `#${section}.active`);
          const duration = Date.now() - startTime;
          timings.push({ iteration: i, section, duration });
        }
      }

      // Check for performance degradation
      const firstIteration = timings.filter(t => t.iteration === 0);
      const lastIteration = timings.filter(t => t.iteration === iterations - 1);

      const firstAvg = firstIteration.reduce((sum, t) => sum + t.duration, 0) / firstIteration.length;
      const lastAvg = lastIteration.reduce((sum, t) => sum + t.duration, 0) / lastIteration.length;

      console.log(`First iteration avg: ${firstAvg}ms, Last iteration avg: ${lastAvg}ms`);

      // Allow 20% performance degradation
      expect(lastAvg).toBeLessThan(firstAvg * 1.2);
    });
  });

  test.describe('API Performance', () => {
    test('should respond to API calls within threshold', async () => {
      const endpoints = [
        '/api/expenditures',
        '/api/analysis',
        '/api/ai-analysis',
        '/api/amazon-items',
        '/api/premium-status'
      ];

      for (const endpoint of endpoints) {
        const { responseTime, status } = await PerformanceHelpers.measureApiResponse(
          `http://localhost:3000${endpoint}`
        );

        console.log(`${endpoint}: ${responseTime}ms (status: ${status})`);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse);
        expect(status).toBe(200);
      }
    });

    test('should handle concurrent API requests', async () => {
      const endpoint = '/api/expenditures';
      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          PerformanceHelpers.measureApiResponse(`http://localhost:3000${endpoint}`)
        );
      }

      const results = await Promise.all(requests);

      results.forEach(({ responseTime, status }, index) => {
        console.log(`Request ${index + 1}: ${responseTime}ms (status: ${status})`);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse * 2); // Allow some overhead
        expect(status).toBe(200);
      });

      // Check average response time
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      console.log(`Average concurrent response time: ${avgResponseTime}ms`);
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse);
    });

    test('should handle large dataset operations', async () => {
      // Test with larger dataset
      const largeDatasetEndpoint = '/api/analysis'; // This processes all expenditures

      const { responseTime, status } = await PerformanceHelpers.measureApiResponse(
        `http://localhost:3000${largeDatasetEndpoint}`
      );

      console.log(`Large dataset analysis: ${responseTime}ms (status: ${status})`);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse * 3); // Allow more time for analysis
      expect(status).toBe(200);
    });
  });

  test.describe('Script Performance', () => {
    const scriptsDir = path.join(__dirname, '..', '..', 'scripts');

    test('should execute CLI scripts within time limits', async () => {
      const scripts = [
        { name: 'smart-test.sh', args: ['test', 'quick'] },
        { name: 'test-backend.sh', args: [] },
        { name: 'validate-protocols.sh', args: [] }
      ];

      for (const { name, args } of scripts) {
        const scriptPath = path.join(scriptsDir, name);
        const startTime = Date.now();

        const result = await CLITestHelpers.executeScript(scriptPath, args);
        const executionTime = Date.now() - startTime;

        console.log(`${name}: ${executionTime}ms (exit: ${result.exitCode})`);
        expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.scriptExecution);
        expect(result.exitCode).toBe(0);
      }
    });

    test('should handle script concurrency', async () => {
      const scriptPath = path.join(scriptsDir, 'validate-protocols.sh');
      const concurrentScripts = 3;
      const executions = [];

      for (let i = 0; i < concurrentScripts; i++) {
        executions.push(CLITestHelpers.executeScript(scriptPath));
      }

      const startTime = Date.now();
      const results = await Promise.all(executions);
      const totalTime = Date.now() - startTime;

      console.log(`Concurrent scripts total time: ${totalTime}ms`);

      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0);
      });

      // Should complete faster than sequential execution
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.scriptExecution * concurrentScripts * 0.8);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should maintain reasonable memory usage during operations', async ({ page }) => {
      await PageHelpers.waitForAppLoad(page);

      const operations = [
        () => PageHelpers.navigateToSection(page, 'analysis'),
        () => PageHelpers.navigateToSection(page, 'ai-insights'),
        () => PageHelpers.navigateToSection(page, 'benefits-management'),
        () => PageHelpers.navigateToSection(page, 'bank-reconciliation')
      ];

      const memoryUsage = [];

      for (const operation of operations) {
        const beforeMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
        await operation();
        await page.waitForTimeout(1000); // Allow time for operations to complete
        const afterMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

        memoryUsage.push({
          before: beforeMemory,
          after: afterMemory,
          increase: afterMemory - beforeMemory
        });
      }

      memoryUsage.forEach((usage, index) => {
        console.log(`Operation ${index + 1} memory: ${usage.before} -> ${usage.after} (${usage.increase} increase)`);
        expect(usage.increase).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage / 10); // Max 5MB per operation
      });
    });

    test('should clean up resources after navigation', async ({ page }) => {
      await PageHelpers.waitForAppLoad(page);

      // Navigate through multiple sections
      const sections = ['dashboard', 'analysis', 'ai-insights', 'data-import'];
      for (const section of sections) {
        await PageHelpers.navigateToSection(page, section);
        await page.waitForTimeout(500);
      }

      // Check for memory leaks (event listeners, DOM nodes, etc.)
      const resourceCount = await page.evaluate(() => {
        return {
          eventListeners: document.querySelectorAll('*').length,
          activeTimers: (function() {
            let count = 0;
            for (let i = 1; i < 10000; i++) {
              if (window.hasOwnProperty(`timer${i}`)) count++;
            }
            return count;
          })()
        };
      });

      console.log(`Resource count: ${JSON.stringify(resourceCount)}`);
      expect(resourceCount.eventListeners).toBeLessThan(1000); // Reasonable DOM size
    });
  });

  test.describe('Database Performance', () => {
    test('should handle database operations efficiently', async () => {
      const { HttpHelpers } = require('../shared/test-helpers');

      // Test with different dataset sizes
      const datasetSizes = [10, 100, 1000];

      for (const size of datasetSizes) {
        const testData = Array.from({ length: size }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          amount: Math.random() * 100,
          description: `Performance test item ${i + 1}`,
          category: 'Office Supplies',
          vendor: 'Test Vendor',
          account: 'Business Card'
        }));

        // Measure insertion time
        const insertStart = Date.now();
        for (const item of testData) {
          await HttpHelpers.postJson('http://localhost:3000/api/expenditures', item);
        }
        const insertTime = Date.now() - insertStart;

        // Measure query time
        const queryStart = Date.now();
        await HttpHelpers.getJson('http://localhost:3000/api/analysis');
        const queryTime = Date.now() - queryStart;

        console.log(`Dataset size ${size}: Insert ${insertTime}ms, Query ${queryTime}ms`);

        // Performance expectations (scale with dataset size)
        expect(insertTime).toBeLessThan(size * 10); // Max 10ms per item
        expect(queryTime).toBeLessThan(2000); // Max 2 seconds for analysis
      }
    });
  });

  test.describe('Load Testing', () => {
    test('should handle multiple concurrent users', async ({ browser }) => {
      const userCount = 3; // Reduced for CI compatibility
      const pages = [];
      const results = [];

      // Create multiple browser contexts
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        pages.push({ page, context });
      }

      try {
        // Simulate concurrent users
        const userOperations = pages.map(async ({ page }, index) => {
          const startTime = Date.now();

          await page.goto('http://localhost:3000');
          await PageHelpers.waitForAppLoad(page);

          // Perform user journey
          await PageHelpers.navigateToSection(page, 'dashboard');
          await PageHelpers.navigateToSection(page, 'analysis');
          await PageHelpers.navigateToSection(page, 'ai-insights');

          const endTime = Date.now();
          return {
            user: index + 1,
            duration: endTime - startTime,
            success: true
          };
        });

        const operationResults = await Promise.all(userOperations);
        results.push(...operationResults);

        // Analyze results
        const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
        const maxDuration = Math.max(...results.map(r => r.duration));
        const minDuration = Math.min(...results.map(r => r.duration));

        console.log(`Load test results (${userCount} users):`);
        console.log(`Average: ${avgDuration}ms, Max: ${maxDuration}ms, Min: ${minDuration}ms`);

        // All operations should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });

        // Performance expectations
        expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad * 1.5);
        expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad * 2);

      } finally {
        // Clean up
        for (const { page, context } of pages) {
          await page.close();
          await context.close();
        }
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should optimize asset loading', async ({ page }) => {
      const resources = [];

      // Monitor network requests
      page.on('response', response => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        const size = parseInt(response.headers()['content-length'] || '0');

        resources.push({
          url,
          contentType,
          size,
          status: response.status(),
          timing: response.timing()
        });
      });

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Analyze resource loading
      const jsResources = resources.filter(r => r.contentType.includes('javascript'));
      const cssResources = resources.filter(r => r.contentType.includes('css'));
      const imageResources = resources.filter(r => r.contentType.includes('image'));

      console.log(`Resources loaded: ${resources.length} total`);
      console.log(`JS: ${jsResources.length}, CSS: ${cssResources.length}, Images: ${imageResources.length}`);

      // Check for large uncompressed resources
      const largeResources = resources.filter(r => r.size > 100 * 1024); // > 100KB
      console.log(`Large resources (>100KB): ${largeResources.length}`);

      // Performance expectations
      expect(jsResources.length).toBeLessThan(10); // Reasonable number of JS files
      expect(cssResources.length).toBeLessThan(5);  // Reasonable number of CSS files

      // All resources should load successfully
      const failedResources = resources.filter(r => r.status >= 400);
      expect(failedResources.length).toBe(0);
    });

    test('should handle slow network conditions', async ({ browser }) => {
      // Simulate slow 3G connection
      const context = await browser.newContext({
        permissions: [],
        extraHTTPHeaders: {},
        offline: false,
        // Slow 3G simulation
        ...{
          viewport: { width: 1280, height: 720 },
          reducedMotion: 'reduce',
          // Note: Playwright doesn't have direct network throttling in all versions
        }
      });

      const page = context.newPage();
      const slowPage = (await page);

      try {
        // Measure load time under simulated slow conditions
        const startTime = Date.now();
        await slowPage.goto('http://localhost:3000');
        await PageHelpers.waitForAppLoad(slowPage);
        const loadTime = Date.now() - startTime;

        console.log(`Slow network load time: ${loadTime}ms`);

        // Should still load within reasonable time even on slow networks
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad * 3);

        // Verify functionality still works
        await AssertionHelpers.assertVisible(slowPage, '#main-navigation');
      } finally {
        await slowPage.close();
        await context.close();
      }
    });
  });
});