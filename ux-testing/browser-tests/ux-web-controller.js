const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Web-based UX Testing Controller
// This creates a web interface that can control Chrome via DevTools protocol

class UXTestingController {
  constructor() {
    this.chromeWs = null;
    this.server = null;
    this.wss = null;
    this.chromeConnected = false;
  }

  // Start the web server
  async start(port = 3001) {
    console.log("🚀 Starting UX Testing Controller Web Interface");
    console.log("===============================================");

    // Create HTTP server
    this.server = http.createServer(this.handleRequest.bind(this));
    this.server.listen(port, () => {
      console.log(`✅ Web interface available at: http://localhost:${port}`);
      console.log(
        `✅ Open this URL in Chrome to access the UX testing controls`
      );
      console.log("");
    });

    // Create WebSocket server for real-time communication
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on("connection", (ws) => {
      console.log("📡 Web client connected");
      ws.on("message", (message) => this.handleWebMessage(ws, message));
    });

    // Try to connect to Chrome DevTools
    this.connectToChrome();
  }

  // Handle HTTP requests
  handleRequest(req, res) {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(this.getWebInterface());
    } else if (req.url === "/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          chromeConnected: this.chromeConnected,
          serverRunning: true,
        })
      );
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  }

  // Generate web interface HTML
  getWebInterface() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>UX Testing Controller</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
    }
    .status {
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      text-align: center;
      font-weight: bold;
    }
    .status.connected {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status.disconnected {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin: 20px 0;
    }
    button {
      padding: 15px;
      font-size: 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
      background: #007bff;
      color: white;
    }
    button:hover {
      background: #0056b3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .test-result {
      margin: 10px 0;
      padding: 10px;
      border-radius: 4px;
      background: #e9ecef;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .instructions {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 UX Testing Controller</h1>

    <div id="status" class="status disconnected">
      Checking Chrome connection...
    </div>

    <div class="instructions">
      <strong>Instructions:</strong>
      <ol>
        <li>Open Chrome and navigate to <strong>http://localhost:3000</strong> (TSV Ledger)</li>
        <li>Enable Chrome DevTools: Press <code>F12</code> or <code>Ctrl+Shift+I</code></li>
        <li>In DevTools, go to the <strong>Console</strong> tab</li>
        <li>Copy and paste this code to enable remote debugging:
          <pre>chrome://inspect/#devices</pre>
        </li>
        <li>Or run Chrome with: <code>google-chrome --remote-debugging-port=9222</code></li>
      </ol>
    </div>

    <div class="button-grid">
      <button id="connectChrome">🔗 Connect to Chrome</button>
      <button id="startUXTesting">🚀 Start UX Testing</button>
      <button id="testHamburger">🍔 Test Hamburger Menu</button>
      <button id="testNavigation">🔗 Test Navigation</button>
      <button id="testForms">📝 Test Form Inputs</button>
      <button id="testScrolling">📜 Test Scrolling</button>
      <button id="takeScreenshot">📸 Take Screenshot</button>
    </div>

    <div id="results" style="display: none;">
      <h3>Test Results:</h3>
      <div id="testResults" class="test-result"></div>
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://localhost:3001');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const testResultsDiv = document.getElementById('testResults');

    // WebSocket connection
    ws.onopen = () => {
      console.log('Connected to UX Testing Controller');
      checkStatus();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = () => {
      console.log('Disconnected from UX Testing Controller');
      updateStatus(false);
    };

    // Check Chrome connection status
    async function checkStatus() {
      try {
        const response = await fetch('/status');
        const status = await response.json();
        updateStatus(status.chromeConnected);
      } catch (error) {
        console.error('Status check failed:', error);
        updateStatus(false);
      }
    }

    function updateStatus(connected) {
      statusDiv.className = connected ? 'status connected' : 'status disconnected';
      statusDiv.textContent = connected ?
        '✅ Connected to Chrome DevTools' :
        '❌ Not connected to Chrome. Enable remote debugging and refresh.';
    }

    function handleMessage(data) {
      console.log('Received:', data);

      if (data.type === 'test_result') {
        showResult(data);
      } else if (data.type === 'status') {
        updateStatus(data.connected);
      }
    }

    function showResult(data) {
      resultsDiv.style.display = 'block';
      const timestamp = new Date().toLocaleTimeString();
      testResultsDiv.textContent += '[' + timestamp + '] ' + data.test + ': ' + JSON.stringify(data.result, null, 2) + '\n\n';
      testResultsDiv.scrollTop = testResultsDiv.scrollHeight;
    }

    // Button event handlers
    document.getElementById('connectChrome').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'connect_chrome' }));
      showResult({ test: 'connect_chrome', result: 'Attempting to connect...' });
    });

    document.getElementById('startUXTesting').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'start_ux_testing' }));
      showResult({ test: 'start_ux_testing', result: 'Starting UX testing sequence...' });
    });

    document.getElementById('testHamburger').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'test_hamburger' }));
      showResult({ test: 'test_hamburger', result: 'Testing hamburger menu...' });
    });

    document.getElementById('testNavigation').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'test_navigation' }));
      showResult({ test: 'test_navigation', result: 'Testing navigation links...' });
    });

    document.getElementById('testForms').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'test_forms' }));
      showResult({ test: 'test_forms', result: 'Testing form inputs...' });
    });

    document.getElementById('testScrolling').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'test_scrolling' }));
      showResult({ test: 'test_scrolling', result: 'Testing page scrolling...' });
    });

    document.getElementById('takeScreenshot').addEventListener('click', () => {
      ws.send(JSON.stringify({ action: 'take_screenshot' }));
      showResult({ test: 'take_screenshot', result: 'Taking screenshot...' });
    });

    // Auto-check status every 5 seconds
    setInterval(checkStatus, 5000);
  </script>
</body>
</html>`;
  }

  // Try to connect to Chrome DevTools
  async connectToChrome() {
    try {
      console.log("🔍 Looking for Chrome DevTools...");

      // Try to get Chrome targets
      const response = await fetch("http://localhost:9222/json");
      const targets = await response.json();

      if (targets && targets.length > 0) {
        console.log(`✅ Found ${targets.length} Chrome targets`);

        // Connect to first page
        const target = targets.find((t) => t.type === "page");
        if (target) {
          this.chromeWs = new WebSocket(target.webSocketDebuggerUrl);
          this.chromeWs.on("open", () => {
            console.log("✅ Connected to Chrome DevTools");
            this.chromeConnected = true;
            this.broadcastStatus();
          });

          this.chromeWs.on("message", (data) => {
            this.handleChromeMessage(data);
          });

          this.chromeWs.on("close", () => {
            console.log("❌ Chrome DevTools connection closed");
            this.chromeConnected = false;
            this.broadcastStatus();
          });

          this.chromeWs.on("error", (error) => {
            console.error("Chrome DevTools error:", error);
          });
        }
      } else {
        console.log("❌ No Chrome targets found");
        setTimeout(() => this.connectToChrome(), 2000);
      }
    } catch (error) {
      console.log("❌ Chrome connection failed, retrying...", error.message);
      setTimeout(() => this.connectToChrome(), 2000);
    }
  }

  // Handle messages from web interface
  handleWebMessage(ws, message) {
    const data = JSON.parse(message.toString());
    console.log("Web message:", data);

    switch (data.action) {
      case "connect_chrome":
        this.connectToChrome();
        break;
      case "start_ux_testing":
        this.startUXTesting();
        break;
      case "test_hamburger":
        this.testHamburger();
        break;
      case "test_navigation":
        this.testNavigation();
        break;
      case "test_forms":
        this.testForms();
        break;
      case "test_scrolling":
        this.testScrolling();
        break;
      case "take_screenshot":
        this.takeScreenshot();
        break;
    }
  }

  // Handle messages from Chrome DevTools
  handleChromeMessage(data) {
    const message = JSON.parse(data.toString());
    // Handle Chrome responses here
    console.log("Chrome message:", message);
  }

  // Send command to Chrome
  sendChromeCommand(method, params = {}) {
    if (!this.chromeWs || this.chromeWs.readyState !== WebSocket.OPEN) {
      console.log("❌ Chrome not connected");
      return;
    }

    const command = {
      id: Date.now(),
      method,
      params,
    };

    this.chromeWs.send(JSON.stringify(command));
    console.log("📤 Sent to Chrome:", command);
  }

  // Broadcast status to all web clients
  broadcastStatus() {
    const status = {
      type: "status",
      connected: this.chromeConnected,
    };

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(status));
      }
    });
  }

  // UX Testing methods
  startUXTesting() {
    console.log("🎯 Starting UX testing sequence");
    this.broadcastResult("start_ux_testing", { status: "started" });

    // Run test sequence
    setTimeout(() => this.testHamburger(), 1000);
    setTimeout(() => this.testNavigation(), 3000);
    setTimeout(() => this.testForms(), 5000);
    setTimeout(() => this.testScrolling(), 7000);
    setTimeout(() => this.takeScreenshot(), 9000);
  }

  testHamburger() {
    console.log("🍔 Testing hamburger menu");
    this.sendChromeCommand("Runtime.evaluate", {
      expression: `
        const hamburger = document.querySelector('.navbar-toggler, [data-bs-toggle="offcanvas"], .hamburger, #hamburger');
        if (hamburger) {
          hamburger.click();
          'Hamburger menu clicked successfully';
        } else {
          'Hamburger menu not found';
        }
      `,
    });
    this.broadcastResult("test_hamburger", { status: "executed" });
  }

  testNavigation() {
    console.log("🔗 Testing navigation");
    this.sendChromeCommand("Runtime.evaluate", {
      expression: `
        const links = document.querySelectorAll('nav a, .nav-link, .sidebar a, .offcanvas-body a');
        if (links.length > 0) {
          links[0].click();
          'Clicked first navigation link of ' + links.length;
        } else {
          'No navigation links found';
        }
      `,
    });
    this.broadcastResult("test_navigation", { status: "executed" });
  }

  testForms() {
    console.log("📝 Testing forms");
    this.sendChromeCommand("Runtime.evaluate", {
      expression: `
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        if (inputs.length > 0) {
          inputs[0].value = 'UX Testing Input';
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          'Filled first form input of ' + inputs.length;
        } else {
          'No form inputs found';
        }
      `,
    });
    this.broadcastResult("test_forms", { status: "executed" });
  }

  testScrolling() {
    console.log("📜 Testing scrolling");
    this.sendChromeCommand("Runtime.evaluate", {
      expression: `
        window.scrollTo(0, 300);
        setTimeout(() => window.scrollTo(0, 0), 1000);
        'Page scrolled up and down';
      `,
    });
    this.broadcastResult("test_scrolling", { status: "executed" });
  }

  takeScreenshot() {
    console.log("📸 Taking screenshot");
    this.sendChromeCommand("Page.captureScreenshot", {
      format: "png",
    });
    this.broadcastResult("take_screenshot", { status: "executed" });
  }

  // Broadcast test results to web clients
  broadcastResult(test, result) {
    const message = {
      type: "test_result",
      test,
      result,
      timestamp: new Date().toISOString(),
    };

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Stop the server
  stop() {
    if (this.chromeWs) {
      this.chromeWs.close();
    }
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log("✅ UX Testing Controller stopped");
  }
}

// Start the controller
const controller = new UXTestingController();
controller.start(3001);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down UX Testing Controller...");
  controller.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down UX Testing Controller...");
  controller.stop();
  process.exit(0);
});
