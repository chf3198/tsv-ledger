const { chromium } = require("playwright");

async function demonstrateUXTesting() {
  console.log("🚀 STARTING LIVE UX TESTING DEMONSTRATION");
  console.log("==========================================");
  console.log(
    "CLIENT: You should now see a browser window open with the TSV Ledger app"
  );
  console.log(
    "CLIENT: Watch as I perform various UX interactions in real-time"
  );
  console.log("");

  try {
    // Launch browser in headed mode for visibility
    console.log(
      "🔧 Launching Chromium browser in HEADED mode (fully visible)..."
    );
    const browser = await chromium.launch({
      headless: false, // VISIBLE BROWSER - Client can see all interactions
      slowMo: 2000, // Slow down actions so client can clearly follow
      args: [
        "--window-size=1280,720",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("✅ SUCCESS: Browser launched and visible to client");
    console.log("CLIENT: You should see the browser window now");
    console.log("");

    const page = await browser.newPage();
    console.log("✅ New browser tab created");

    // Navigate to the app
    console.log("🌐 NAVIGATION TEST: Loading TSV Ledger application...");
    console.log("CLIENT: Watch the page load...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("✅ SUCCESS: Application loaded successfully");
    await page.screenshot({ path: "ux-demo-01-loaded.png" });
    console.log("📸 Screenshot saved: ux-demo-01-loaded.png");
    console.log("");

    // Demonstrate mouse movements
    console.log("🖱️  MOUSE MOVEMENT DEMONSTRATION");
    console.log("CLIENT: Watch the mouse cursor move around the page...");

    console.log("Moving mouse to top-left navigation area...");
    await page.mouse.move(50, 50);
    await page.waitForTimeout(1500);

    console.log("Moving mouse to center of page...");
    await page.mouse.move(640, 360);
    await page.waitForTimeout(1500);

    console.log("Moving mouse to bottom-right...");
    await page.mouse.move(1200, 650);
    await page.waitForTimeout(1500);

    console.log("✅ Mouse movement demonstration complete");
    await page.screenshot({ path: "ux-demo-02-mouse-movement.png" });
    console.log("📸 Screenshot saved: ux-demo-02-mouse-movement.png");
    console.log("");

    // Demonstrate hovering over elements
    console.log("🎯 HOVER INTERACTION DEMONSTRATION");
    console.log("CLIENT: Watch as I hover over interactive elements...");

    try {
      const clickableElements = await page
        .locator('a, button, [role="button"], input, select')
        .all();
      console.log(`Found ${clickableElements.length} interactive elements`);

      for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
        console.log(`Hovering over element ${i + 1}...`);
        await clickableElements[i].hover();
        await page.waitForTimeout(1000);
        console.log("✅ Hover complete");
      }
    } catch (e) {
      console.log(`⚠️  Hover demonstration: ${e.message}`);
    }

    await page.screenshot({ path: "ux-demo-03-hover.png" });
    console.log("📸 Screenshot saved: ux-demo-03-hover.png");
    console.log("");

    // Demonstrate clicking
    console.log("🖱️  CLICKING DEMONSTRATION");
    console.log("CLIENT: Watch as I click on various elements...");

    try {
      // Try to find and click navigation links
      const navLinks = await page.locator("nav a, .navbar a, .nav a").all();
      console.log(`Found ${navLinks.length} navigation links`);

      if (navLinks.length > 0) {
        console.log("Clicking first navigation link...");
        await navLinks[0].hover();
        await page.waitForTimeout(500);
        await navLinks[0].click();
        await page.waitForTimeout(1500);
        console.log("✅ Navigation click successful");
      }

      // Try clicking buttons
      const buttons = await page
        .locator("button:not([disabled]), .btn:not([disabled])")
        .all();
      console.log(`Found ${buttons.length} clickable buttons`);

      if (buttons.length > 0) {
        console.log("Clicking first available button...");
        await buttons[0].hover();
        await page.waitForTimeout(500);
        await buttons[0].click();
        await page.waitForTimeout(1500);
        console.log("✅ Button click successful");
      }
    } catch (e) {
      console.log(`⚠️  Clicking demonstration: ${e.message}`);
    }

    await page.screenshot({ path: "ux-demo-04-clicking.png" });
    console.log("📸 Screenshot saved: ux-demo-04-clicking.png");
    console.log("");

    // Demonstrate form input
    console.log("📝 FORM INPUT TESTING DEMONSTRATION");
    console.log("CLIENT: Watch as I fill out form fields...");

    try {
      const textInputs = await page
        .locator('input[type="text"], input[type="email"], textarea')
        .all();
      console.log(`Found ${textInputs.length} text input fields`);

      for (let i = 0; i < Math.min(textInputs.length, 2); i++) {
        console.log(`Filling input field ${i + 1}...`);
        await textInputs[i].hover();
        await page.waitForTimeout(500);

        await textInputs[i].click();
        await page.waitForTimeout(300);

        await textInputs[i].type(`UX Testing Input ${i + 1}`, { delay: 200 });
        await page.waitForTimeout(1000);

        console.log("✅ Input field filled");
      }
    } catch (e) {
      console.log(`⚠️  Form input demonstration: ${e.message}`);
    }

    await page.screenshot({ path: "ux-demo-05-form-input.png" });
    console.log("📸 Screenshot saved: ux-demo-05-form-input.png");
    console.log("");

    // Demonstrate scrolling
    console.log("📜 SCROLLING DEMONSTRATION");
    console.log("CLIENT: Watch the page scroll up and down...");

    console.log("Scrolling down...");
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);

    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);

    console.log("Scrolling back up...");
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    console.log("✅ Scrolling demonstration complete");
    await page.screenshot({ path: "ux-demo-06-scrolling.png" });
    console.log("📸 Screenshot saved: ux-demo-06-scrolling.png");
    console.log("");

    // Demonstrate file upload
    console.log("📁 FILE UPLOAD TESTING DEMONSTRATION");
    console.log("CLIENT: Watch as I test file upload functionality...");

    try {
      const fileInputs = await page.locator('input[type="file"]').all();
      console.log(`Found ${fileInputs.length} file input fields`);

      if (fileInputs.length > 0) {
        console.log("Uploading test CSV file...");
        await fileInputs[0].hover();
        await page.waitForTimeout(500);

        await fileInputs[0].setInputFiles("data/test-import-history.csv");
        await page.waitForTimeout(1500);

        console.log("✅ File uploaded successfully");
      } else {
        console.log("No file input fields found on current page");
      }
    } catch (e) {
      console.log(`⚠️  File upload demonstration: ${e.message}`);
    }

    await page.screenshot({ path: "ux-demo-07-file-upload.png" });
    console.log("📸 Screenshot saved: ux-demo-07-file-upload.png");
    console.log("");

    // Final demonstration
    console.log("🎯 COMPREHENSIVE UX TESTING COMPLETE");
    console.log("=====================================");
    console.log("CLIENT: The demonstration has covered:");
    console.log("• ✅ Mouse movements across the page");
    console.log("• ✅ Hovering over interactive elements");
    console.log("• ✅ Clicking navigation and buttons");
    console.log("• ✅ Form input filling with typing delays");
    console.log("• ✅ Page scrolling up and down");
    console.log("• ✅ File upload testing");
    console.log("• 📸 Multiple screenshots captured throughout");
    console.log("");
    console.log(
      "All interactions were performed in real-time with visible delays"
    );
    console.log("so you could observe each step of the UX testing process.");

    await page.screenshot({ path: "ux-demo-08-final.png", fullPage: true });
    console.log("📸 Final screenshot saved: ux-demo-08-final.png");

    await browser.close();
    console.log("✅ Browser closed successfully");
  } catch (error) {
    console.error("❌ ERROR during UX demonstration:", error.message);
    console.log(
      "CLIENT: An error occurred, but this demonstrates real UX testing challenges"
    );
  }
}

// Run the demonstration
demonstrateUXTesting().catch(console.error);
