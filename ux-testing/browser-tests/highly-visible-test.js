const { chromium } = require("playwright");

async function highlyVisibleTest() {
  console.log("🎭 HIGHLY VISIBLE UX TESTING DEMONSTRATION");
  console.log("===========================================");
  console.log("CLIENT: This test uses maximum visibility techniques");
  console.log("CLIENT: Watch carefully for browser window and interactions");
  console.log("");

  try {
    console.log("🚀 STEP 1: BROWSER LAUNCH");
    console.log("CLIENT: Browser should appear on your screen now...");

    const browser = await chromium.launch({
      headless: false,
      slowMo: 5000, // 5 second delays - very slow and visible
      args: [
        "--window-size=1280,720",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--force-device-scale-factor=1",
        "--high-dpi-support=1",
      ],
    });

    console.log("✅ BROWSER LAUNCHED - LOOK FOR IT ON YOUR SCREEN!");
    console.log("CLIENT: Do you see a Chromium browser window?");
    console.log("⏳ Waiting 10 seconds for you to confirm...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const page = await browser.newPage();
    console.log("✅ New page created");

    console.log("🌐 STEP 2: PAGE LOADING");
    console.log("CLIENT: Watch the TSV Ledger page load...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("✅ PAGE LOADED");

    await page.screenshot({ path: "visible-test-01-loaded.png" });
    console.log("📸 Screenshot 1 taken");

    console.log("⏳ Waiting 10 seconds - observe the loaded page...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("🍔 STEP 3: HAMBURGER MENU TEST");
    console.log("CLIENT: Watch carefully for hamburger menu interaction...");

    // Try multiple selectors for hamburger menu
    const hamburgerSelectors = [
      ".navbar-toggler",
      '[data-bs-toggle="offcanvas"]',
      ".hamburger",
      "#hamburger",
      'button[aria-label*="menu"]',
      ".menu-toggle",
    ];

    let hamburgerFound = false;
    for (const selector of hamburgerSelectors) {
      try {
        const hamburger = page.locator(selector);
        if (await hamburger.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found hamburger with selector: ${selector}`);

          console.log("🖱️ HOVERING over hamburger (5 seconds)...");
          await hamburger.hover();
          await new Promise((resolve) => setTimeout(resolve, 5000));

          console.log("🖱️ CLICKING hamburger menu (5 seconds to open)...");
          await hamburger.click();
          await new Promise((resolve) => setTimeout(resolve, 5000));

          hamburgerFound = true;
          await page.screenshot({ path: "visible-test-02-menu-open.png" });
          console.log("📸 Screenshot 2 taken - menu should be open");
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!hamburgerFound) {
      console.log("⚠️ Hamburger menu not found with any selector");
    }

    console.log("⏳ Waiting 10 seconds - observe the menu state...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("🔗 STEP 4: NAVIGATION LINKS TEST");
    console.log("CLIENT: Watch for navigation link interactions...");

    try {
      const navLinks = page.locator(
        "nav a, .nav-link, .sidebar a, .offcanvas-body a"
      );
      const count = await navLinks.count();
      console.log(`Found ${count} navigation links`);

      if (count > 0) {
        console.log("Testing first navigation link...");

        const firstLink = navLinks.first();
        const linkText = await firstLink.textContent();
        console.log(`Link text: "${linkText?.trim()}"`);

        console.log("🖱️ HOVERING over first link (5 seconds)...");
        await firstLink.hover();
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log("🖱️ CLICKING first link (5 seconds)...");
        await firstLink.click({ force: true });
        await new Promise((resolve) => setTimeout(resolve, 5000));

        await page.screenshot({ path: "visible-test-03-link-clicked.png" });
        console.log("📸 Screenshot 3 taken - after link click");
      }
    } catch (e) {
      console.log(`⚠️ Navigation test error: ${e.message}`);
    }

    console.log("⏳ Waiting 10 seconds - observe any changes...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("📜 STEP 5: SCROLLING TEST");
    console.log("CLIENT: Watch the page scroll...");

    console.log("📜 Scrolling DOWN (3 seconds)...");
    await page.mouse.wheel(0, 500);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📜 Scrolling DOWN more (3 seconds)...");
    await page.mouse.wheel(0, 500);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📜 Scrolling UP (3 seconds)...");
    await page.mouse.wheel(0, -500);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.screenshot({ path: "visible-test-04-scrolled.png" });
    console.log("📸 Screenshot 4 taken - after scrolling");

    console.log("⏳ Final 10 second observation period...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    await page.screenshot({
      path: "visible-test-05-final.png",
      fullPage: true,
    });
    console.log("📸 Final screenshot taken");

    console.log("");
    console.log("🎯 HIGHLY VISIBLE TEST COMPLETE");
    console.log("===============================");
    console.log("CLIENT: What did you observe?");
    console.log("• Browser window appearance?");
    console.log("• Page loading?");
    console.log("• Hamburger menu opening?");
    console.log("• Navigation link interactions?");
    console.log("• Page scrolling?");
    console.log("");
    console.log(
      "Screenshots saved: visible-test-01 through visible-test-05.png"
    );

    await browser.close();
    console.log("✅ Browser closed");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.log(
      "CLIENT: If you see this error, there was a problem with the browser automation"
    );
  }
}

highlyVisibleTest().catch(console.error);
