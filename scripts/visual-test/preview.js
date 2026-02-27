#!/usr/bin/env node
/**
 * Generate HTML preview of captured screenshots
 * Opens in Simple Browser for visual inspection
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_FILE = path.join(SCREENSHOTS_DIR, 'preview.html');

const pngFiles = fs.readdirSync(SCREENSHOTS_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Visual Test Screenshots</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .screenshot-grid { display: grid; gap: 20px; }
    .screenshot-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screenshot-card h3 { margin: 0 0 12px 0; color: #666; }
    .screenshot-card img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .timestamp { color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🖼️ Visual Test Screenshots</h1>
  <p class="timestamp">Generated: ${new Date().toISOString()}</p>
  <div class="screenshot-grid">
    ${pngFiles.map(file => `
    <div class="screenshot-card">
      <h3>${file.replace('.png', '')}</h3>
      <img src="${file}" alt="${file}">
    </div>
    `).join('')}
  </div>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html);
console.log(`✓ Preview generated: ${OUTPUT_FILE}`);
console.log(`\nOpen with: open ${OUTPUT_FILE}`);
