const { chromium } = require("playwright");

async function manualVisibilityTest() {
  console.log("👁️  MANUAL VISIBILITY TEST");
  console.log("===========================");
  console.log(
    "CLIENT: This test will open a browser and wait for you to manually test the navigation"
  );
  console.log(
    "CLIENT: You should be able to see the browser window and interact with it yourself"
  );
  console.log("");

  try {
    console.log("🔧 Launching VISIBLE browser...");
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: [
        "--window-size=1280,720",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("✅ Browser launched - CHECK YOUR SCREEN NOW!");
    console.log("CLIENT: Do you see a browser window with TSV Ledger?");

    const page = await browser.newPage();
    console.log("✅ New page/tab created");

    console.log("🌐 Loading TSV Ledger...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("✅ Page loaded");

    await page.screenshot({ path: "manual-test-01-loaded.png" });
    console.log("📸 Screenshot taken - check manual-test-01-loaded.png");

    console.log("");
    console.log("🎮 MANUAL TESTING PHASE");
    console.log(
      "CLIENT: Now try these actions manually in the browser window:"
    );
    console.log("1. Click the hamburger menu (☰) in the top-left");
    console.log("2. Watch the navigation sidebar open");
    console.log("3. Click on different navigation links");
    console.log("4. Try scrolling the page");
    console.log("5. Look for any form inputs");
    console.log("");
    console.log("⏳ Waiting 30 seconds for you to test manually...");

    // Wait for manual testing
    await page.waitForTimeout(30000);

    console.log("📸 Taking screenshot after manual testing...");
    await page.screenshot({ path: "manual-test-02-after-manual.png" });
    console.log("✅ Screenshot saved");

    console.log("");
    console.log("🤖 AUTOMATED TESTING PHASE");
    console.log("CLIENT: Now watch for automated interactions...");

    // Simple automated test - just try to click hamburger if visible
    try {
      console.log("Looking for hamburger menu...");
      const hamburger = page.locator(
        '.navbar-toggler, [data-bs-toggle="offcanvas"]'
      );

      if (await hamburger.isVisible({ timeout: 5000 })) {
        console.log("✅ Hamburger found - hovering...");
        await hamburger.hover();
        await page.waitForTimeout(2000);

        console.log("🖱️ Clicking hamburger...");
        await hamburger.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: "manual-test-03-hamburger-clicked.png" });
        console.log("📸 Screenshot taken after hamburger click");
        console.log("CLIENT: Did you see the menu open?");
      } else {
        console.log("⚠️ Hamburger not found or not visible");
      }
    } catch (e) {
      console.log(`⚠️ Automated test failed: ${e.message}`);
    }

    console.log("");
    console.log("⏳ Final wait - observe the browser...");
    await page.waitForTimeout(10000);

    await page.screenshot({ path: "manual-test-04-final.png" });
    console.log("📸 Final screenshot taken");

    console.log("");
    console.log("🎯 MANUAL VISIBILITY TEST COMPLETE");
    console.log("===================================");
    console.log("CLIENT: Did you see:");
    console.log("• Browser window appear?");
    console.log("• TSV Ledger load?");
    console.log("• Hamburger menu work when clicked manually?");
    console.log("• Any automated interactions?");
    console.log("");
    console.log("Screenshots saved as manual-test-*.png");

    await browser.close();
    console.log("✅ Browser closed");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

manualVisibilityTest().catch(console.error);
