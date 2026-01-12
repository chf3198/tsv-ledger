/**
 * Import History UX Puppeteer Test
 *
 * Visual browser automation test for Import History functionality
 * Tests the complete UX workflow with visible browser feedback
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  const baseUrl = 'http://localhost:3000';
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  let serverProcess = null;

  // Server management functions
  async function startServer() {
    console.log('🚀 Starting test server...');
    return new Promise((resolve, reject) => {
      serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, NODE_ENV: 'test', TEST_DB: 'true' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          serverProcess.kill();
          reject(new Error('Server startup timeout'));
        }
      }, 15000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📝 Server output:', output.trim());
        if (output.includes('TSV Ledger server running on http://localhost:3000')) {
          serverReady = true;
          clearTimeout(timeout);
          console.log('✅ Test server started successfully');
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.log('⚠️  Server stderr:', data.toString().trim());
      });

      serverProcess.on('error', (error) => {
        console.error('❌ Server startup error:', error);
        reject(error);
      });
    });
  }

  async function stopServer() {
    if (serverProcess) {
      console.log('🛑 Stopping test server...');
      serverProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Test server stopped');
    }
  }

(async () => {
  console.log('🚀 Starting Import History UX Puppeteer Test');
  console.log('==============================================\n');

  try {
    // Start the server first
    await startServer();

    // Launch browser with visible window
    console.log('📱 Launching visible browser for UX testing...');
    const browser = await puppeteer.launch({
      headless: false, // Show browser for visual verification
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });

  const page = await browser.newPage();

  // Set up console logging
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: 'console', text: msg.text() });
    console.log('🔍 Browser Console:', msg.text());
  });

  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: err.stack || err.message });
    console.error('❌ Browser Error:', err.message);
  });

  try {
    // Test 1: Navigate to app and check initial state
    console.log('\n📋 Test 1: Navigate to app and check initial import history');
    testResults.total++;

    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded successfully');

    // Navigate to data import section using the correct selector
    console.log('Looking for Data Import navigation link...');
    
    // Use the proper navigation method that clicks data-section links
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('[data-section]')).find(a => a.getAttribute('data-section') === 'data-import');
      if (link) {
        link.click();
      }
    });
    
    // Wait for the data-import section to become active
    await page.waitForSelector('#data-import.active', { timeout: 5000 });
    console.log('✅ Navigated to Data Import section');

    // Check initial import history state
    const importHistoryElement = await page.$('#importHistory');
    if (importHistoryElement) {
      const initialText = await page.evaluate(el => el.textContent, importHistoryElement);
      console.log('📝 Initial import history text:', initialText.trim());

      if (initialText.includes('No recent imports found')) {
        console.log('✅ Initial state correct: "No recent imports found"');
        testResults.passed++;
      } else {
        console.log('❌ Initial state incorrect, showing:', initialText);
        testResults.failed++;
        testResults.details.push('Initial state should show "No recent imports found"');
      }
    } else {
      console.log('❌ Import history element not found');
      testResults.failed++;
      testResults.details.push('Import history element missing from page');
    }

    // Test 2: Perform CSV file import and check history updates
    console.log('\n📋 Test 2: Perform CSV file import and verify history updates');
    testResults.total++;

    // Create a test CSV file
    const csvContent = 'date,amount,category,description\n2025-11-12,25.50,Food,Lunch\n2025-11-11,15.75,Transportation,Bus fare';
    const csvFilePath = path.join(__dirname, '../../data/test-import-history.csv');
    fs.writeFileSync(csvFilePath, csvContent);

    // Upload the CSV file using Puppeteer file upload
    const fileInput = await page.$('#csvFile');
    if (fileInput) {
      await fileInput.setInputFiles(csvFilePath);
      console.log('✅ Selected CSV file for upload');

      // Submit the form
      const submitButton = await page.$('#csvImportForm button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Clicked submit button');

        // Wait for processing - check for status updates
        await page.waitForTimeout(5000);

        // Check for any status messages
        const statusDiv = await page.$('#importStatus');
        if (statusDiv) {
          const isVisible = await page.evaluate(el => el.style.display !== 'none', statusDiv);
          if (isVisible) {
            const statusText = await page.evaluate(el => el.textContent, statusDiv);
            console.log('📝 Import status:', statusText);
          }
        }

        // Check for success/error alerts
        const alertElements = await page.$$('.alert');
        for (const alert of alertElements) {
          const alertText = await page.evaluate(el => el.textContent, alert);
          console.log('📝 Alert message:', alertText);
        }

        // Wait a moment for history to update
        await page.waitForTimeout(2000);

        // Check if history updated
        const historyText = await page.$eval('#importHistory', el => el.textContent);
        console.log('📝 Updated import history text:', historyText.trim());

        if (!historyText.includes('Unable to load import history') &&
            !historyText.includes('No recent imports found')) {
          console.log('✅ Import history updated correctly');
          testResults.passed++;
        } else {
          console.log('❌ Import history did not update correctly');
          testResults.failed++;
          testResults.details.push('Import history should show recent import details');
        }
      } else {
        console.log('❌ Submit button not found');
        testResults.failed++;
        testResults.details.push('CSV import submit button not found');
      }

      // Clean up test file
      if (fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }
    } else {
      console.log('❌ File input not found');
      testResults.failed++;
      testResults.details.push('CSV file input not found');
    }

    // Test 3: Test persistence across page refresh
    console.log('\n📋 Test 3: Test persistence across page refresh');
    testResults.total++;

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('✅ Page refreshed');

    // Navigate back to data import
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('[data-section]')).find(a => a.getAttribute('data-section') === 'data-import');
      if (link) {
        link.click();
      }
    });
    await page.waitForSelector('#data-import.active', { timeout: 5000 });

    // Check that history persists
    const refreshedText = await page.evaluate(() => {
      const el = document.querySelector('#importHistory');
      return el ? el.textContent : '';
    });

    console.log('📝 Refreshed import history text:', refreshedText);

    if (refreshedText.includes('No recent imports found') === false &&
        (refreshedText.includes('Amazon') || refreshedText.includes('ZIP') || refreshedText.includes('CSV'))) {
      console.log('✅ Import history persisted across page refresh');
      testResults.passed++;
    } else {
      console.log('❌ Import history did not persist across page refresh');
      testResults.failed++;
      testResults.details.push('Import history should persist across page refreshes');
    }

    // Test 3.5: Test persistence across section navigation (without page reload)
    console.log('\n📋 Test 3.5: Test persistence across section navigation');
    testResults.total++;

    try {
      // Navigate away to dashboard section
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('[data-section]')).find(a => a.getAttribute('data-section') === 'dashboard');
        if (link) {
          link.click();
        }
      });
      await page.waitForSelector('#dashboard.active', { timeout: 5000 });
      console.log('✅ Navigated to dashboard section');

      // Navigate back to data import section
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('[data-section]')).find(a => a.getAttribute('data-section') === 'data-import');
        if (link) {
          link.click();
        }
      });
      await page.waitForSelector('#data-import.active', { timeout: 5000 });
      console.log('✅ Navigated back to data import section');

      // Check that history still shows after section navigation
      const navText = await page.evaluate(() => {
        const el = document.querySelector('#importHistory');
        return el ? el.textContent : '';
      });

      console.log('📝 Import history after section navigation:', navText);

      if (navText.includes('No recent imports found') === false &&
          (navText.includes('CSV') || navText.includes('Amazon') || navText.includes('ZIP'))) {
        console.log('✅ Import history persisted across section navigation');
        testResults.passed++;
      } else {
        console.log('❌ Import history did not persist across section navigation');
        testResults.failed++;
        testResults.details.push('Import history should persist across section navigation without page reload');
      }
    } catch (error) {
      console.log('❌ Section navigation test failed:', error.message);
      testResults.failed++;
      testResults.details.push('Section navigation test failed: ' + error.message);
    }

    // Test 4: Perform second import and verify accumulation
    console.log('\n📋 Test 4: Perform second import and verify accumulation');
    testResults.total++;

    try {
      // Create a second test CSV file
      const csvContent2 = 'date,amount,category,description\n2025-11-13,45.00,Office,New laptop';
      const csvFilePath2 = path.join(__dirname, '../../data/test-import-history-2.csv');
      fs.writeFileSync(csvFilePath2, csvContent2);

      // Upload the second CSV file
      const fileInput2 = await page.$('#csvFile');
      if (fileInput2) {
        await fileInput2.uploadFile(csvFilePath2);
        console.log('✅ Uploaded second CSV file');

      // Submit the form
      const submitButton2 = await page.$('#csvImportForm button[type="submit"]');
      if (submitButton2) {
        await submitButton2.click();
        console.log('✅ Clicked submit button for second import');

        // Wait for processing
        await page.waitForTimeout(3000);

        // Check if second import completed
        const statusDiv2 = await page.$('#importStatus');
        if (statusDiv2) {
          const statusText2 = await page.evaluate(el => el.textContent, statusDiv2);
          console.log('📝 Second import status:', statusText2);
        }

        // Wait a moment for history to update
        await page.waitForTimeout(1000);

        // Check that we now have multiple imports
        const finalText = await page.evaluate(() => {
          const el = document.querySelector('#importHistory');
          return el ? el.textContent : '';
        });

        console.log('📝 Final import history text:', finalText);

        // Should contain elements from both imports
        const hasFirstImport = finalText.includes('Lunch') || finalText.includes('Food');
        const hasSecondImport = finalText.includes('laptop') || finalText.includes('Office');

        if (hasFirstImport && hasSecondImport) {
          console.log('✅ Both imports visible in history');
          testResults.passed++;
        } else {
          console.log('❌ Not all imports visible in history');
          testResults.failed++;
          testResults.details.push('History should show both first and second imports');
        }

        // Clean up second test file
        if (fs.existsSync(csvFilePath2)) {
          fs.unlinkSync(csvFilePath2);
        }
      } else {
        console.log('❌ Submit button for second import not found');
        testResults.failed++;
        testResults.details.push('CSV import submit button not found for second import');
      }

    // Test 5: Verify API endpoint directly
    console.log('\n📋 Test 5: Verify API endpoint returns correct data');
    testResults.total++;

    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/import-history');
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (apiResponse.error) {
      console.log('❌ API call failed:', apiResponse.error);
      testResults.failed++;
      testResults.details.push('API endpoint should be accessible');
    } else if (apiResponse.status === 200 && apiResponse.data.history && apiResponse.data.history.length >= 2) {
      console.log('✅ API returned correct data:', apiResponse.data.total, 'imports');
      testResults.passed++;
    } else {
      console.log('❌ API returned incorrect data:', apiResponse);
      testResults.failed++;
      testResults.details.push('API should return at least 2 import records');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testResults.failed++;
    testResults.details.push(`Test execution error: ${error.message}`);
  }

  // Results summary
  console.log('\n==============================================');
  console.log('🏁 Import History UX Test Results');
  console.log('==============================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);

  if (testResults.details.length > 0) {
    console.log('\n📝 Details:');
    testResults.details.forEach(detail => console.log(`   - ${detail}`));
  }

  console.log('\n🎯 Test completed! Browser will remain open for manual inspection.');
  console.log('💡 You can now manually verify the Import History UX in the browser.');

  // Keep browser open for manual inspection
  console.log('\n⏹️  Press Ctrl+C to close browser and exit');

  // Wait for manual inspection (browser stays open)
  process.on('SIGINT', async () => {
    console.log('\n🧹 Closing browser...');
    await browser.close();
    await stopServer();
    console.log('✅ Browser and server closed. Test finished.');
    process.exit(testResults.failed === 0 ? 0 : 1);
  });

})().catch(async (error) => {
  console.error('💥 Fatal test error:', error);
  await stopServer();
  process.exit(1);
});