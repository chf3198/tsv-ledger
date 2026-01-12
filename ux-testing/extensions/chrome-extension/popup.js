// Popup script for UX Testing Controller

document.addEventListener("DOMContentLoaded", function () {
  const startTestingBtn = document.getElementById("startTesting");
  const testHamburgerBtn = document.getElementById("testHamburger");
  const testNavigationBtn = document.getElementById("testNavigation");
  const testFormsBtn = document.getElementById("testForms");
  const testScrollingBtn = document.getElementById("testScrolling");
  const takeScreenshotBtn = document.getElementById("takeScreenshot");
  const statusDiv = document.getElementById("status");

  // Show status message
  function showStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  }

  // Send message to background script
  function sendMessage(action, params = {}) {
    chrome.runtime.sendMessage({ action, ...params }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus("Error: " + chrome.runtime.lastError.message, "error");
      } else {
        showStatus("Command sent successfully", "success");
      }
    });
  }

  // Button event listeners
  startTestingBtn.addEventListener("click", () => {
    showStatus("Starting UX testing sequence...", "info");
    sendMessage("start_ux_testing");
  });

  testHamburgerBtn.addEventListener("click", () => {
    showStatus("Testing hamburger menu...", "info");
    // This will trigger the hamburger test through the background script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => {
              const hamburger = document.querySelector(
                '.navbar-toggler, [data-bs-toggle="offcanvas"], .hamburger, #hamburger'
              );
              if (hamburger) {
                hamburger.click();
                return "Hamburger menu clicked";
              }
              return "Hamburger menu not found";
            },
          },
          (results) => {
            if (results && results[0]) {
              showStatus(
                results[0].result,
                results[0].result.includes("not found") ? "error" : "success"
              );
            }
          }
        );
      }
    });
  });

  testNavigationBtn.addEventListener("click", () => {
    showStatus("Testing navigation links...", "info");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => {
              const links = document.querySelectorAll(
                "nav a, .nav-link, .sidebar a, .offcanvas-body a"
              );
              if (links.length > 0) {
                links[0].click();
                return `Clicked first of ${links.length} navigation links`;
              }
              return "No navigation links found";
            },
          },
          (results) => {
            if (results && results[0]) {
              showStatus(
                results[0].result,
                results[0].result.includes("No") ? "error" : "success"
              );
            }
          }
        );
      }
    });
  });

  testFormsBtn.addEventListener("click", () => {
    showStatus("Testing form inputs...", "info");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => {
              const inputs = document.querySelectorAll(
                'input[type="text"], input[type="email"], textarea'
              );
              if (inputs.length > 0) {
                inputs[0].value = "UX Testing Input";
                inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
                return `Filled first of ${inputs.length} form inputs`;
              }
              return "No form inputs found";
            },
          },
          (results) => {
            if (results && results[0]) {
              showStatus(
                results[0].result,
                results[0].result.includes("No") ? "error" : "success"
              );
            }
          }
        );
      }
    });
  });

  testScrollingBtn.addEventListener("click", () => {
    showStatus("Testing page scrolling...", "info");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => {
              window.scrollTo(0, 300);
              setTimeout(() => {
                window.scrollTo(0, 0);
              }, 2000);
              return "Page scrolled up and down";
            },
          },
          (results) => {
            if (results && results[0]) {
              showStatus(results[0].result, "success");
            }
          }
        );
      }
    });
  });

  takeScreenshotBtn.addEventListener("click", () => {
    showStatus("Taking screenshot...", "info");
    chrome.tabs.captureVisibleTab((screenshotUrl) => {
      // Create download link
      chrome.downloads.download({
        url: screenshotUrl,
        filename: `ux-test-screenshot-${Date.now()}.png`,
      });
      showStatus("Screenshot saved", "success");
    });
  });

  // Check if we're on the correct page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && !tabs[0].url.includes("localhost:3000")) {
      showStatus(
        "Warning: Not on TSV Ledger page. Navigate to http://localhost:3000 first.",
        "error"
      );
    }
  });
});
