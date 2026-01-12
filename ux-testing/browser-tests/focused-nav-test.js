const { chromium } = require("playwright");

async function focusedNavigationTest() {
  console.log("🎯 FOCUSED NAVIGATION MENU UX TESTING");
  console.log("=====================================");
  console.log(
    "CLIENT: Watch the browser window carefully - this test focuses on VISIBLE interactions only"
  );
  console.log("");

  try {
    // Launch browser with maximum visibility settings
    console.log("🔧 Launching browser with maximum visibility...");
    const browser = await chromium.launch({
      headless: false, // MUST be visible
      slowMo: 3000, // 3-second delays for clear observation
      args: [
        "--window-size=1280,720",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
      ],
    });

    console.log("✅ Browser launched - you should see it now!");
    console.log("CLIENT: Confirm you can see the browser window");
    console.log("");

    const page = await browser.newPage();
    console.log("✅ New page created");

    // Navigate to app
    console.log("🌐 Loading TSV Ledger application...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("✅ Page loaded successfully");

    // Take initial screenshot
    await page.screenshot({ path: "nav-test-01-initial.png" });
    console.log("📸 Initial screenshot taken");
    console.log("CLIENT: You should see the dashboard loaded");
    console.log("");

    // Wait for user to confirm they see the page
    console.log("⏳ Waiting 5 seconds for you to observe the initial page...");
    await page.waitForTimeout(5000);

    // STEP 1: Test hamburger menu (this is what you saw working)
    console.log("🍔 STEP 1: HAMBURGER MENU TEST");
    console.log("CLIENT: Watch for the hamburger menu to open...");

    try {
      // Look for hamburger menu button
      const hamburger = page.locator(
        '.navbar-toggler, [data-bs-toggle="offcanvas"], .hamburger, #hamburger'
      );
      console.log("Looking for hamburger menu button...");

      if (await hamburger.isVisible({ timeout: 5000 })) {
        console.log("✅ Found hamburger menu button");
        await hamburger.hover();
        console.log("🖱️ Hovering over hamburger menu...");
        await page.waitForTimeout(2000);

        await hamburger.click();
        console.log("🖱️ Clicking hamburger menu...");
        await page.waitForTimeout(3000);

        await page.screenshot({ path: "nav-test-02-hamburger-open.png" });
        console.log("📸 Screenshot taken with menu open");
        console.log("CLIENT: You should see the navigation menu open now");
        console.log("");
      } else {
        console.log(
          "⚠️ Hamburger menu not found, trying alternative selectors..."
        );
        // Try alternative selectors
        const altHamburger = page.locator(
          'button[aria-label*="menu"], .menu-toggle, .nav-toggle'
        );
        if (await altHamburger.isVisible({ timeout: 2000 })) {
          await altHamburger.click();
          console.log("✅ Alternative hamburger menu clicked");
          await page.waitForTimeout(3000);
        }
      }
    } catch (e) {
      console.log(`⚠️ Hamburger menu test: ${e.message}`);
    }

    // STEP 2: Test navigation links in sidebar
    console.log("🔗 STEP 2: SIDEBAR NAVIGATION LINKS TEST");
    console.log("CLIENT: Watch for navigation link interactions...");

    try {
      // Look for sidebar navigation links
      const navLinks = page.locator(
        ".offcanvas-body a, .sidebar a, nav a, .nav-link"
      );
      const linkCount = await navLinks.count();
      console.log(`Found ${linkCount} navigation links in sidebar`);

      if (linkCount > 0) {
        // Test first few links
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          console.log(`Testing navigation link ${i + 1}...`);

          const link = navLinks.nth(i);
          const linkText = await link.textContent();
          console.log(`Link text: "${linkText?.trim()}"`);

          // Hover first
          await link.hover();
          console.log(`🖱️ Hovering over link ${i + 1}...`);
          await page.waitForTimeout(2000);

          // Click (but don't navigate away)
          await link.click({ force: true });
          console.log(`🖱️ Clicking link ${i + 1}...`);
          await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: "nav-test-03-nav-links-tested.png" });
        console.log("📸 Screenshot taken after navigation testing");
        console.log("CLIENT: You should have seen link hovering and clicking");
        console.log("");
      }
    } catch (e) {
      console.log(`⚠️ Navigation links test: ${e.message}`);
    }

    // STEP 3: Test closing hamburger menu
    console.log("❌ STEP 3: CLOSE MENU TEST");
    console.log("CLIENT: Watch for the menu to close...");

    try {
      const closeButton = page.locator(
        '.btn-close, [data-bs-dismiss="offcanvas"], .close-btn'
      );
      if (await closeButton.isVisible({ timeout: 3000 })) {
        console.log("✅ Found close button");
        await closeButton.hover();
        console.log("🖱️ Hovering over close button...");
        await page.waitForTimeout(2000);

        await closeButton.click();
        console.log("🖱️ Clicking close button...");
        await page.waitForTimeout(3000);

        await page.screenshot({ path: "nav-test-04-menu-closed.png" });
        console.log("📸 Screenshot taken with menu closed");
        console.log("CLIENT: Menu should be closed now");
        console.log("");
      }
    } catch (e) {
      console.log(`⚠️ Close menu test: ${e.message}`);
    }

    // STEP 4: Test main navigation bar (if visible)
    console.log("📋 STEP 4: MAIN NAVIGATION BAR TEST");
    console.log("CLIENT: Testing main navigation bar elements...");

    try {
      const mainNav = page.locator(".navbar-nav a, .main-nav a, header nav a");
      const mainNavCount = await mainNav.count();
      console.log(`Found ${mainNavCount} main navigation items`);

      if (mainNavCount > 0) {
        for (let i = 0; i < Math.min(mainNavCount, 2); i++) {
          console.log(`Testing main nav item ${i + 1}...`);
          const navItem = mainNav.nth(i);
          await navItem.hover();
          console.log(`🖱️ Hovering over main nav item ${i + 1}...`);
          await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: "nav-test-05-main-nav-tested.png" });
        console.log("📸 Screenshot taken after main nav testing");
        console.log("CLIENT: You should have seen main navigation hovering");
        console.log("");
      }
    } catch (e) {
      console.log(`⚠️ Main navigation test: ${e.message}`);
    }

    // Final summary
    console.log("🎯 NAVIGATION MENU TESTING COMPLETE");
    console.log("===================================");
    console.log("What should have been visible:");
    console.log("• Browser window opening");
    console.log("• TSV Ledger dashboard loading");
    console.log("• Hamburger menu opening");
    console.log("• Navigation links being hovered and clicked");
    console.log("• Menu closing");
    console.log("• Main navigation interactions");
    console.log("");
    console.log("Screenshots saved: nav-test-01 through nav-test-05");
    console.log(
      "If you didn't see these interactions, there may be a display issue."
    );

    await page.screenshot({ path: "nav-test-06-final.png", fullPage: true });
    console.log("📸 Final comprehensive screenshot taken");

    await browser.close();
    console.log("✅ Browser closed");
  } catch (error) {
    console.error("❌ ERROR during navigation testing:", error.message);
    console.log("CLIENT: If you see this error, the browser automation failed");
  }
}

// Run the focused test
focusedNavigationTest().catch(console.error);
