// Background script for UX Testing Controller Extension

let nativePort = null;

// Connect to native host
function connectToNativeHost() {
  try {
    nativePort = chrome.runtime.connectNative("com.tsvledger.uxtesting");
    console.log("Connected to native host");

    nativePort.onMessage.addListener((message) => {
      console.log("Received from native host:", message);
      handleNativeMessage(message);
    });

    nativePort.onDisconnect.addListener(() => {
      console.log("Disconnected from native host");
      nativePort = null;
      // Auto-reconnect after delay
      setTimeout(connectToNativeHost, 1000);
    });
  } catch (error) {
    console.error("Failed to connect to native host:", error);
    // Retry connection
    setTimeout(connectToNativeHost, 2000);
  }
}

// Handle messages from native host
function handleNativeMessage(message) {
  switch (message.action) {
    case "start_ux_testing":
      startUXTesting(message.params);
      break;
    case "click_element":
      clickElement(message.params);
      break;
    case "type_text":
      typeText(message.params);
      break;
    case "take_screenshot":
      takeScreenshot(message.params);
      break;
    case "get_page_info":
      getPageInfo();
      break;
    default:
      console.log("Unknown action:", message.action);
  }
}

// Start UX testing sequence
async function startUXTesting(params) {
  console.log("Starting UX testing sequence");

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      sendToNative({ status: "error", message: "No active tab found" });
      return;
    }

    // Send initial status
    sendToNative({
      status: "started",
      tabId: tab.id,
      url: tab.url,
    });

    // Perform automated UX testing
    await performUXTests(tab.id);
  } catch (error) {
    sendToNative({ status: "error", message: error.message });
  }
}

// Perform UX testing actions
async function performUXTests(tabId) {
  console.log("Performing UX tests on tab:", tabId);

  // Test 1: Find and click hamburger menu
  await testHamburgerMenu(tabId);

  // Test 2: Test navigation links
  await testNavigationLinks(tabId);

  // Test 3: Test form inputs
  await testFormInputs(tabId);

  // Test 4: Test scrolling
  await testScrolling(tabId);

  sendToNative({
    status: "completed",
    message: "UX testing sequence finished",
  });
}

// Test hamburger menu
async function testHamburgerMenu(tabId) {
  console.log("Testing hamburger menu...");

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        // Find hamburger menu
        const hamburger = document.querySelector(
          '.navbar-toggler, [data-bs-toggle="offcanvas"], .hamburger, #hamburger'
        );
        if (hamburger) {
          hamburger.click();
          return { found: true, clicked: true };
        }
        return { found: false };
      },
    });

    sendToNative({
      test: "hamburger_menu",
      result: results[0].result,
    });
  } catch (error) {
    sendToNative({
      test: "hamburger_menu",
      error: error.message,
    });
  }
}

// Test navigation links
async function testNavigationLinks(tabId) {
  console.log("Testing navigation links...");

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        const links = document.querySelectorAll(
          "nav a, .nav-link, .sidebar a, .offcanvas-body a"
        );
        const linkData = Array.from(links).map((link) => ({
          text: link.textContent?.trim(),
          href: link.href,
        }));

        // Click first link
        if (links.length > 0) {
          links[0].click();
        }

        return {
          count: links.length,
          links: linkData.slice(0, 5), // First 5 links
          clicked: links.length > 0,
        };
      },
    });

    sendToNative({
      test: "navigation_links",
      result: results[0].result,
    });
  } catch (error) {
    sendToNative({
      test: "navigation_links",
      error: error.message,
    });
  }
}

// Test form inputs
async function testFormInputs(tabId) {
  console.log("Testing form inputs...");

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        const inputs = document.querySelectorAll(
          'input[type="text"], input[type="email"], textarea'
        );
        const inputData = Array.from(inputs).map((input) => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
        }));

        // Fill first input
        if (inputs.length > 0) {
          inputs[0].value = "UX Testing Input";
          inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        }

        return {
          count: inputs.length,
          inputs: inputData.slice(0, 3), // First 3 inputs
          filled: inputs.length > 0,
        };
      },
    });

    sendToNative({
      test: "form_inputs",
      result: results[0].result,
    });
  } catch (error) {
    sendToNative({
      test: "form_inputs",
      error: error.message,
    });
  }
}

// Test scrolling
async function testScrolling(tabId) {
  console.log("Testing scrolling...");

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        window.scrollTo(0, 300);
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 1000);
      },
    });

    sendToNative({
      test: "scrolling",
      result: { scrolled: true },
    });
  } catch (error) {
    sendToNative({
      test: "scrolling",
      error: error.message,
    });
  }
}

// Click element by selector
async function clickElement(params) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: params.tabId },
      function: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          return { clicked: true };
        }
        return { clicked: false };
      },
      args: [params.selector],
    });

    sendToNative({
      action: "click_element",
      result: results[0].result,
    });
  } catch (error) {
    sendToNative({
      action: "click_element",
      error: error.message,
    });
  }
}

// Type text into element
async function typeText(params) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: params.tabId },
      function: (selector, text) => {
        const element = document.querySelector(selector);
        if (element) {
          element.value = text;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          return { typed: true };
        }
        return { typed: false };
      },
      args: [params.selector, params.text],
    });

    sendToNative({
      action: "type_text",
      result: results[0].result,
    });
  } catch (error) {
    sendToNative({
      action: "type_text",
      error: error.message,
    });
  }
}

// Take screenshot
async function takeScreenshot(params) {
  try {
    const screenshot = await chrome.tabs.captureVisibleTab();
    sendToNative({
      action: "take_screenshot",
      result: { dataUrl: screenshot },
    });
  } catch (error) {
    sendToNative({
      action: "take_screenshot",
      error: error.message,
    });
  }
}

// Get page information
async function getPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    sendToNative({
      action: "get_page_info",
      result: {
        url: tab.url,
        title: tab.title,
        width: tab.width,
        height: tab.height,
      },
    });
  } catch (error) {
    sendToNative({
      action: "get_page_info",
      error: error.message,
    });
  }
}

// Send message to native host
function sendToNative(message) {
  if (nativePort) {
    nativePort.postMessage(message);
  } else {
    console.error("No connection to native host");
  }
}

// Initialize connection
connectToNativeHost();

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action) {
    handleNativeMessage(message);
  }

  sendResponse({ received: true });
});
