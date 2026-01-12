#!/usr/bin/env node

// Native messaging host for TSV Ledger UX Testing
// This script runs in the Crostini container and communicates with the Chrome extension

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

let extensionProcess = null;

// Handle messages from Chrome extension
function handleMessage(message) {
  console.log("Native host received:", JSON.stringify(message, null, 2));

  switch (message.action || message.test) {
    case "start_ux_testing":
      startUXTesting(message);
      break;
    case "hamburger_menu":
      console.log("Hamburger menu test result:", message.result);
      break;
    case "navigation_links":
      console.log("Navigation links test result:", message.result);
      break;
    case "form_inputs":
      console.log("Form inputs test result:", message.result);
      break;
    case "scrolling":
      console.log("Scrolling test result:", message.result);
      break;
    case "click_element":
    case "type_text":
    case "take_screenshot":
    case "get_page_info":
      console.log("Extension action result:", message);
      break;
    default:
      console.log("Unknown message type:", message);
  }
}

// Send message to Chrome extension
function sendMessage(message) {
  const jsonMessage = JSON.stringify(message);
  const length = Buffer.byteLength(jsonMessage, "utf8");

  // Write message length (4 bytes, little-endian)
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(length, 0);
  process.stdout.write(lengthBuffer);

  // Write message
  process.stdout.write(jsonMessage);
}

// Start UX testing sequence
function startUXTesting(params) {
  console.log("🎯 STARTING UX TESTING SEQUENCE");
  console.log("================================");

  sendMessage({
    action: "start_ux_testing",
    params: {
      testUrl: "http://localhost:3000",
      testSequence: [
        "hamburger_menu",
        "navigation_links",
        "form_inputs",
        "scrolling",
      ],
    },
  });

  // Start monitoring for results
  setTimeout(() => {
    console.log("UX testing sequence initiated - monitoring results...");
  }, 2000);
}

// Read messages from stdin (from Chrome extension)
function readMessage() {
  let buffer = Buffer.alloc(0);

  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // Check if we have a complete message
    if (buffer.length >= 4) {
      const messageLength = buffer.readUInt32LE(0);

      if (buffer.length >= 4 + messageLength) {
        // Extract message
        const messageBuffer = buffer.slice(4, 4 + messageLength);
        const message = JSON.parse(messageBuffer.toString("utf8"));

        // Handle message
        handleMessage(message);

        // Remove processed message from buffer
        buffer = buffer.slice(4 + messageLength);

        // Continue reading
        readMessage();
      }
    }
  });

  process.stdin.on("end", () => {
    console.log("Chrome extension disconnected");
    process.exit(0);
  });
}

// Handle process termination
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  if (extensionProcess) {
    extensionProcess.kill();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  if (extensionProcess) {
    extensionProcess.kill();
  }
  process.exit(0);
});

// Initialize
console.log("TSV Ledger UX Testing Native Host started");
console.log("Waiting for Chrome extension connection...");

// Start reading messages
readMessage();

// Send ready signal
sendMessage({
  status: "ready",
  message: "Native host is ready to receive commands",
});
