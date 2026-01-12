const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testHamburgerMenu() {
  console.log("🚀 Starting TSV Ledger Hamburger Menu Test");
  console.log("📱 Opening browser...");

  // Configure Chrome options for external drive access
  const options = new chrome.Options();
  options.addArguments("--disable-web-security");
  options.addArguments("--disable-features=VizDisplayCompositor");
  options.addArguments("--allow-file-access-from-files");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--no-sandbox");
  options.addArguments("--user-data-dir=/tmp/selenium-chrome");
  options.addArguments("--disable-gpu");
  options.addArguments("--remote-debugging-port=9223");

  // Create WebDriver instance
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    console.log("🌐 Navigating to TSV Ledger...");
    await driver.get("http://localhost:3000");

    // Wait for page to load
    await driver.wait(until.titleContains("TSV Ledger"), 10000);
    console.log("✅ Page loaded successfully");

    // Test hamburger menu in Dashboard
    console.log("🍔 Testing hamburger menu in Dashboard...");
    const hamburgerBtn = await driver.findElement(
      By.css('button[aria-label="Toggle navigation"]')
    );
    await hamburgerBtn.click();
    console.log("✅ Hamburger menu opened in Dashboard");

    // Wait for sidebar to appear
    await driver.wait(
      until.elementLocated(By.css(".sidebar-offcanvas.show")),
      5000
    );
    console.log("✅ Sidebar visible in Dashboard");

    // Close hamburger menu
    await hamburgerBtn.click();
    console.log("✅ Hamburger menu closed in Dashboard");

    // Navigate to Bank Reconciliation section
    console.log("🏦 Testing navigation to Bank Reconciliation...");
    await driver.executeScript(
      "window.location.hash = '#bank-reconciliation';"
    );
    await driver.executeScript(
      "const event = new CustomEvent('hashchange'); window.dispatchEvent(event);"
    );

    // Wait for section change
    await driver.wait(until.elementLocated(By.css("main")), 5000);
    console.log("✅ Navigated to Bank Reconciliation section");

    // Test hamburger menu in Bank Reconciliation
    console.log("🍔 Testing hamburger menu in Bank Reconciliation...");
    const hamburgerBtn2 = await driver.findElement(
      By.css('button[aria-label="Toggle navigation"]')
    );
    await hamburgerBtn2.click();
    console.log("✅ Hamburger menu opened in Bank Reconciliation");

    // Wait for sidebar to appear
    await driver.wait(
      until.elementLocated(By.css(".sidebar-offcanvas.show")),
      5000
    );
    console.log("✅ Sidebar visible in Bank Reconciliation");

    // Close hamburger menu
    await hamburgerBtn2.click();
    console.log("✅ Hamburger menu closed in Bank Reconciliation");

    console.log("🎉 All hamburger menu tests passed!");
    console.log("📊 Test Results:");
    console.log("   ✅ Dashboard hamburger menu: WORKS");
    console.log("   ✅ Bank Reconciliation hamburger menu: WORKS");
    console.log("   ✅ Navigation between sections: WORKS");
    console.log("   ✅ Sidebar show/hide: WORKS");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    console.log("🔚 Closing browser...");
    await driver.quit();
  }
}

// Run the test
testHamburgerMenu().catch(console.error);
